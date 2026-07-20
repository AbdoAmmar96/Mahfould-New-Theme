<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Company;
use App\Models\Hotel;
use App\Models\ProviderDocument;
use App\Models\Restaurant;
use App\Models\SahbPackage;
use App\Models\Tour;
use App\Support\Bookables;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * لوحة الموافقات — V2-BLUEPRINT §1.1, §15.
 *
 * صلاحية الأدمن فقط (لا الدعم — دعم بدون صلاحيات موافقات مالية أو موافقة مزوّدين §1).
 *
 * تغطّي:
 *   1) قوائم انتظار المزوّدين (pending → verified/rejected)
 *   2) قوائم انتظار الخدمات (pending_review → published/rejected)
 *   3) مراجعة المستندات (approve/reject لكل مستند)
 */
class ApprovalController extends Controller
{
    /** الصفحة الرئيسية: كل قوائم الانتظار في مكان واحد */
    public function index(): Response
    {
        return Inertia::render('Admin/Approvals/Index', [
            'stats' => [
                'pending_providers' => Company::pending()->count(),
                'pending_services' => $this->pendingServicesCount(),
                'pending_documents' => ProviderDocument::where('status', 'pending')->count(),
            ],
            'pending_providers' => Company::pending()
                ->with('user:id,name,email', 'documents:id,company_id,doc_type,status')
                ->latest()->take(20)->get()
                ->map(fn (Company $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'provider_type' => $c->provider_type,
                    'phone' => $c->phone,
                    'email' => $c->email,
                    'owner' => $c->user?->name,
                    'created_at' => $c->created_at->format('Y-m-d'),
                    'docs_count' => $c->documents->count(),
                    'docs_pending' => $c->documents->where('status', 'pending')->count(),
                    'needs_criminal_record' => $c->requiresCriminalRecord()
                        && ! $c->documents->contains(fn ($d) => $d->doc_type === 'criminal_record' && $d->status === 'approved'),
                ]),
            'pending_services' => $this->pendingServicesList(),
        ]);
    }

    // ── Provider actions ──

    public function approveProvider(Request $request, Company $company): RedirectResponse
    {
        // §1.1: قبل الموافقة على فرد، لازم فيش وتشبيه معتمد
        if ($company->requiresCriminalRecord()) {
            $ok = $company->documents()
                ->where('doc_type', 'criminal_record')
                ->where('status', 'approved')->exists();
            if (! $ok) {
                return back()->with('error', 'لا يمكن الموافقة على مزوّد فرد قبل اعتماد "فيش وتشبيه".');
            }
        }
        $company->update([
            'verification_status' => 'verified',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);
        return back()->with('success', "تمّت الموافقة على {$company->name}.");
    }

    public function rejectProvider(Request $request, Company $company): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $company->update([
            'verification_status' => 'rejected',
            'admin_notes' => $data['reason'],
            'approved_at' => null,
            'approved_by' => $request->user()->id,
        ]);
        return back()->with('success', "تم رفض {$company->name}.");
    }

    // ── Service actions (draft → pending_review → published/rejected) ──

    public function approveService(Request $request, string $type, int $id): RedirectResponse
    {
        $model = $this->resolveService($type, $id);
        abort_if($model === null, 404);
        $model->update([
            'publish_state' => 'published',
            'status' => 'publish', // للتوافق مع الاستعلامات القديمة
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);
        return back()->with('success', "تمّ نشر: {$model->title}");
    }

    public function rejectService(Request $request, string $type, int $id): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $model = $this->resolveService($type, $id);
        abort_if($model === null, 404);
        $model->update([
            'publish_state' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $data['reason'],
        ]);
        return back()->with('success', "تمّ رفض: {$model->title}");
    }

    // ── Document actions ──

    public function approveDocument(Request $request, ProviderDocument $doc): RedirectResponse
    {
        $doc->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'notes' => null,
        ]);
        return back()->with('success', "تم اعتماد المستند: {$doc->title}");
    }

    public function rejectDocument(Request $request, ProviderDocument $doc): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $doc->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'notes' => $data['reason'],
        ]);
        return back()->with('success', "تم رفض المستند: {$doc->title}");
    }

    // ── Helpers ──

    private function resolveService(string $type, int $id): ?\Illuminate\Database\Eloquent\Model
    {
        $class = Bookables::classFor($type);
        return $class ? $class::find($id) : null;
    }

    private function pendingServicesCount(): int
    {
        return Tour::pendingReview()->count()
            + Hotel::pendingReview()->count()
            + Restaurant::pendingReview()->count()
            + Car::pendingReview()->count()
            + SahbPackage::pendingReview()->count();
    }

    private function pendingServicesList(): array
    {
        $rows = collect();
        foreach ([
            ['tour', Tour::class, 'رحلة'],
            ['hotel', Hotel::class, 'فندق'],
            ['restaurant', Restaurant::class, 'مطعم'],
            ['car', Car::class, 'عربية'],
            ['sahb', SahbPackage::class, 'باكدج'],
        ] as [$type, $class, $label]) {
            $items = $class::pendingReview()->with('provider:id,name')->latest()->take(10)->get();
            foreach ($items as $m) {
                $rows->push([
                    'type' => $type,
                    'type_label' => $label,
                    'id' => $m->id,
                    'title' => $m->title,
                    'provider' => $m->provider?->name ?? 'طرف أول',
                    'submitted_at' => optional($m->submitted_at)->format('Y-m-d H:i'),
                ]);
            }
        }
        return $rows->all();
    }
}
