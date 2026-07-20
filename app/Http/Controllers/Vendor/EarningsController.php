<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Support\Bookables;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * V2-BLUEPRINT §15: أرباح المزوّد + التسويات.
 * صافي المزوّد = الإجمالي − عمولة محفول مكفول.
 */
class EarningsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $company = $user->company;

        if (!$company) {
            return Inertia::render('Vendor/Earnings/NoCompany');
        }

        // كل حجوزات المزوّد عبر كل خدماته
        $bookingIds = collect();
        $serviceIds = collect();
        foreach (Bookables::MAP as $type => $class) {
            if (!in_array('provider_id', (new $class)->getFillable())) continue;
            $ids = $class::where('provider_id', $company->id)->pluck('id');
            foreach ($ids as $id) $serviceIds->push(['type' => $type, 'id' => $id, 'class' => $class]);
        }

        $bookings = Booking::query()
            ->where(function ($q) use ($serviceIds) {
                foreach ($serviceIds->groupBy('class') as $class => $rows) {
                    $q->orWhere(function ($qq) use ($class, $rows) {
                        $qq->where('bookable_type', $class)
                            ->whereIn('bookable_id', $rows->pluck('id'));
                    });
                }
            })
            ->latest()
            ->take(50)
            ->get();

        // إجماليات
        $totalGross = $bookings->sum('total');
        $totalCommission = $bookings->sum('commission_amount');
        $totalNet = $totalGross - $totalCommission;
        $paid = $bookings->where('payment_status', 'paid')->sum('total');
        $unpaid = $bookings->whereIn('payment_status', ['unpaid', 'partially_paid'])->sum('total');

        // إجمالي شهري (آخر 6 شهور)
        $monthly = $bookings
            ->groupBy(fn ($b) => $b->created_at->format('Y-m'))
            ->map(fn ($group) => [
                'month' => $group->first()->created_at->format('Y-m'),
                'gross' => (float) $group->sum('total'),
                'commission' => (float) $group->sum('commission_amount'),
                'net' => (float) $group->sum('total') - (float) $group->sum('commission_amount'),
                'count' => $group->count(),
            ])->values();

        return Inertia::render('Vendor/Earnings/Index', [
            'company' => [
                'name' => $company->name,
                'verification_status' => $company->verification_status,
                'commission_rate' => (float) ($company->commission_rate_override ?? 15),
                'bank_holder' => $company->bank_holder ?? null,
                'bank_iban' => $company->bank_iban ?? null,
                'tax_id' => $company->tax_id ?? null,
            ],
            'summary' => [
                'gross' => round($totalGross, 2),
                'commission' => round($totalCommission, 2),
                'net' => round($totalNet, 2),
                'paid' => round($paid, 2),
                'unpaid' => round($unpaid, 2),
                'count' => $bookings->count(),
            ],
            'monthly' => $monthly,
            'recent' => $bookings->take(20)->map(fn ($b) => [
                'code' => $b->code,
                'service' => $b->bookable?->title ?? '—',
                'customer' => $b->customer_name,
                'date' => optional($b->start_date)->format('Y-m-d'),
                'total' => (float) $b->total,
                'commission' => (float) $b->commission_amount,
                'net' => (float) $b->total - (float) $b->commission_amount,
                'status' => $b->status,
                'status_label' => $b->status_label,
                'payment_status' => $b->payment_status,
            ]),
        ]);
    }

    /** يحدّث بيانات البنك/الضريبة للمزوّد */
    public function updateBanking(Request $request)
    {
        $data = $request->validate([
            'bank_holder' => ['required', 'string', 'max:120'],
            'bank_iban' => ['required', 'string', 'max:40'],
            'tax_id' => ['nullable', 'string', 'max:40'],
        ]);

        $company = $request->user()->company;
        abort_unless($company, 404);
        $company->update($data);

        return back()->with('success', 'اتحدّثت بيانات التسوية.');
    }
}
