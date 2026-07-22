<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\EntryPass;
use App\Services\Booking\EntryPassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * V2-BLUEPRINT §15: قارئ QR للمزوّد/الأدمن — تمسحه المنشأة من لوحتها.
 */
class ScannerController extends Controller
{
    /**
     * تذكرة الدخول تخصّ هذا المزوّد؟
     *
     * من غير الفحص ده أي حد يسجّل كمزوّد (والتسجيل بيدخّله فوراً) يقدر يقرا
     * حجوزات كل الأماكن التانية و«يحرق» أكواد دخول عملاء منافسيه.
     */
    private function owns(Request $request, EntryPass $pass): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }
        if ($user->role === 'admin') {
            return true;
        }

        return (int) ($pass->booking?->bookable?->user_id) === (int) $user->id;
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Vendor/Scanner/Index', [
            'recent' => EntryPass::query()
                ->with('booking:id,code,customer_name,start_date,end_date,bookable_type,bookable_id', 'booking.bookable')
                ->whereNotNull('scanned_at')
                ->when($user->role !== 'admin', fn ($q) => $q->whereHas(
                    'booking',
                    fn ($b) => $b->whereHasMorph('bookable', '*', fn ($m) => $m->where('user_id', $user->id)),
                ))
                ->latest('scanned_at')
                ->take(20)
                ->get()
                ->map(fn ($p) => [
                    'code' => $p->code,
                    'status' => $p->status,
                    'scanned_at' => $p->scanned_at?->format('Y-m-d H:i'),
                    'booking_code' => $p->booking?->code,
                    'customer_name' => $p->booking?->customer_name,
                ]),
        ]);
    }

    /** فحص QR: يقبل code أو payload كامل ويتحقّق منه */
    public function verify(Request $request, EntryPassService $entryPasses): JsonResponse
    {
        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:50'],
            'payload' => ['nullable', 'string', 'max:1000'],
        ]);

        $code = $data['code'] ?? null;
        // لو الماسح رجّع payload كامل، نستخرج الكود منه
        if (!$code && !empty($data['payload'])) {
            $parsed = json_decode($data['payload'], true);
            $code = $parsed['code'] ?? null;
        }

        if (!$code) {
            return response()->json(['ok' => false, 'reason' => 'code_missing'], 422);
        }

        $pass = $entryPasses->verify($code);
        if (!$pass) {
            $bad = EntryPass::where('code', $code)->first();
            return response()->json([
                'ok' => false,
                'reason' => $bad ? ($bad->status === 'used' ? 'already_used' : ($bad->status === 'expired' ? 'expired' : 'inactive')) : 'not_found',
                'code' => $code,
            ]);
        }

        $pass->load('booking.bookable', 'booking.roomType');

        // بيانات العميل ما تتعرضش لمزوّد مش صاحب الخدمة
        if (! $this->owns($request, $pass)) {
            return response()->json(['ok' => false, 'reason' => 'not_yours', 'code' => $code], 403);
        }

        return response()->json([
            'ok' => true,
            'pass' => [
                'code' => $pass->code,
                'valid_from' => $pass->valid_from?->format('Y-m-d'),
                'valid_until' => $pass->valid_until?->format('Y-m-d'),
                'booking' => [
                    'code' => $pass->booking->code,
                    'customer_name' => $pass->booking->customer_name,
                    'customer_phone' => $pass->booking->customer_phone,
                    'guests' => $pass->booking->guests,
                    'service' => $pass->booking->bookable?->title,
                    'room_type' => $pass->booking->roomType?->title,
                    'start_date' => optional($pass->booking->start_date)->format('Y-m-d'),
                    'end_date' => optional($pass->booking->end_date)->format('Y-m-d'),
                    'nights' => $pass->booking->nights,
                ],
            ],
        ]);
    }

    /** يعتمد المسح — يوسم الكود كـused */
    public function markUsed(Request $request, string $code, EntryPassService $entryPasses): JsonResponse
    {
        $pass = $entryPasses->verify($code);
        if (!$pass) return response()->json(['ok' => false, 'reason' => 'invalid'], 422);

        $pass->load('booking.bookable');
        if (! $this->owns($request, $pass)) {
            return response()->json(['ok' => false, 'reason' => 'not_yours'], 403);
        }

        $entryPasses->markUsed($pass, $request->user()->id);
        return response()->json(['ok' => true, 'scanned_at' => $pass->fresh()->scanned_at?->format('Y-m-d H:i:s')]);
    }
}
