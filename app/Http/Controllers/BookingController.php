<?php

namespace App\Http\Controllers;

use App\Exceptions\SlotUnavailableException;
use App\Models\Booking;
use App\Models\BookingGuest;
use App\Models\Concerns\HasAvailability;
use App\Models\Setting;
use App\Services\Availability\HoldService;
use App\Services\Booking\AgePricingService;
use App\Services\Booking\CancellationPolicyService;
use App\Services\Booking\PaymentTimingService;
use App\Services\BookingNotifier;
use App\Services\Payments\PaymentManager;
use App\Support\Bookables;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BookingController extends Controller
{
    public function create(Request $request, string $type, int $id, AgePricingService $agePricing, PaymentTimingService $paymentTiming): Response
    {
        $model = Bookables::resolve($type, $id);
        abort_unless($model !== null, 404);

        $price = (float) ($model->sale_price ?? $model->price ?? 0);
        $isGuaranteed = (bool) ($model->is_guaranteed ?? false);
        $pooled = $this->isPooled($model);

        return Inertia::render('Booking/Checkout', [
            'item' => [
                'type' => $type,
                'id' => $model->id,
                'title' => $model->title,
                'image_url' => $model->image_url,
                'price' => $price,
                'pooled' => $pooled,
                'units_total' => $pooled ? $model->inventoryCount() : null,
                'unit' => match ($type) {
                    'hotel' => 'الليلة', 'car' => 'اليوم', default => 'الفرد'
                },
            ],
            'prefill' => [
                'start_date' => $request->query('start_date'),
                'guests' => (int) $request->query('guests', 2),
                'nights' => max(1, (int) $request->query('nights', 1)),
                'units' => max(1, (int) $request->query('units', 1)),
                'slot' => $request->query('slot'),
            ],
            'pricing' => [
                'fee' => (float) Setting::get('service_fee', 200),
                'discount' => $isGuaranteed ? (float) Setting::get('makfol_discount', 400) : 0,
                'is_guaranteed' => $isGuaranteed,
                // Phase B: شرائح تسعير عمرية + توقيت الدفع
                'age_tiers' => $agePricing->tiersFor($model)->values(),
                'payment' => [
                    'default_timing_self' => $paymentTiming->resolve($type, 'self'),
                    'timing_other' => $paymentTiming->resolve($type, 'other'),
                    'requires_prepay_other' => $paymentTiming->requiresPrepay($type, 'other'),
                    'requires_prepay_self' => $paymentTiming->requiresPrepay($type, 'self'),
                ],
            ],
        ]);
    }

    public function store(
        Request $request,
        PaymentManager $payments,
        BookingNotifier $notifier,
        HoldService $holds,
        AgePricingService $agePricing,
        PaymentTimingService $paymentTiming,
        CancellationPolicyService $cancellation,
    ): SymfonyResponse {
        $data = $request->validate([
            'type' => ['required', Rule::in(Bookables::types())],
            'id' => ['required', 'integer'],
            'start_date' => ['nullable', 'date'],
            'guests' => ['required', 'integer', 'min:1', 'max:50'],
            'nights' => ['nullable', 'integer', 'min:1', 'max:60'],
            'units' => ['nullable', 'integer', 'min:1', 'max:20'],
            'slot' => ['nullable', 'string', 'max:8'],
            'guests_ages' => ['nullable', 'array', 'max:50'],
            'guests_ages.*' => ['integer', 'min:0', 'max:120'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_national_id' => ['nullable', 'string', 'max:20'],
            // Phase B: لنفسه أو لطرف آخر
            'booking_for' => ['required', Rule::in(['self', 'other'])],
            'beneficiary_name' => ['required_if:booking_for,other', 'nullable', 'string', 'max:120'],
            'beneficiary_national_id' => ['required_if:booking_for,other', 'nullable', 'string', 'max:20'],
            'beneficiary_age' => ['required_if:booking_for,other', 'nullable', 'integer', 'min:0', 'max:120'],
            'payment_method' => ['required', Rule::in(['card', 'wallet', 'on_arrival'])],
        ]);

        $model = Bookables::resolve($data['type'], $data['id']);
        abort_unless($model !== null, 404);

        $unit = (float) ($model->sale_price ?? $model->price ?? 0);
        $guests = (int) $data['guests'];
        $ages = $this->normalizeAges($data['guests_ages'] ?? [], $guests);
        $bookingFor = $data['booking_for'];
        $pooled = $this->isPooled($model);

        // §5: احسم توقيت الدفع
        $timing = $paymentTiming->resolve(
            $data['type'],
            $bookingFor,
            clientPrepaidChoice: in_array($data['payment_method'], ['card', 'wallet'], true),
        );

        // §5: طريقة الدفع لازم تتوافق مع التوقيت — لطرف آخر مثلاً on_arrival ممنوعة
        if (! $paymentTiming->isMethodCompatible($timing, $data['payment_method'])) {
            return back()->withInput()->with('error', 'الحجز لطرف آخر يستلزم الدفع الكامل المسبق (كارت أو محفظة).');
        }

        // §4: احسب سعر الأفراد حسب الشرائح العمرية (إذا تم إدخال أعمار)
        $agePricingRows = [];
        $ageSubtotal = 0.0;
        if (count($ages) > 0) {
            $result = $agePricing->computeGuests($model, $unit, $ages);
            $agePricingRows = $result['guests'];
            $ageSubtotal = (float) $result['subtotal'];
        }

        // القيم الافتراضية (أنواع بلا مخزون)
        $units = 1;
        $nights = null;
        $endDate = null;
        $holdToken = null;

        if ($pooled) {
            // فندق: تاريخ + ليالي + غرف + حجز فعلي للمخزون
            $startDate = $data['start_date'] ?? null;
            if (! $startDate) {
                return back()->with('error', 'اختَر تاريخ الوصول أولاً.');
            }
            if (Carbon::parse($startDate)->startOfDay()->lt(now()->startOfDay())) {
                return back()->with('error', 'لا يمكن الحجز في تاريخ ماضٍ.');
            }

            $nights = max(1, (int) ($data['nights'] ?? 1));
            $units  = max(1, (int) ($data['units'] ?? 1));
            $endDate = Carbon::parse($startDate)->addDays($nights)->toDateString();
            // للفنادق: التسعير بالليلة×الغرف (الشرائح العمرية لا تُطبَّق مباشرة)
            $subtotal = $unit * $nights * $units;

            $dates = [];
            for ($i = 0; $i < $nights; $i++) {
                $dates[] = Carbon::parse($startDate)->addDays($i)->toDateString();
            }

            try {
                $res = $holds->reserve(
                    $model->availabilityType(), $model->id, $model->inventoryCount(),
                    $dates, $model->defaultSlot(), $units, HoldService::HOLD_TTL_MINUTES,
                );
                $holdToken = $res['hold_token'];
            } catch (SlotUnavailableException $e) {
                return back()->with('error', $e->getMessage());
            }
        } else {
            // خدمات بلا مخزون (رحلات/مطاعم/عربيات/…): استخدم الشرائح العمرية لو مُدخلة، وإلا guests × unit
            $subtotal = $ageSubtotal > 0 ? $ageSubtotal : ($unit * $guests);
        }

        $fee = (float) Setting::get('service_fee', 200);
        $discount = $model->is_guaranteed ? (float) Setting::get('makfol_discount', 400) : 0;
        $total = max(0, $subtotal + $fee - $discount);
        $rate = (float) Setting::get('commission_rate', 15);
        $commission = round($total * $rate / 100, 2);

        // §7: snapshots (سعر + سياسة إلغاء)
        $itemsSnapshot = [
            'unit_price' => $unit,
            'guests' => $guests,
            'nights' => $nights,
            'units' => $units,
            'subtotal' => $subtotal,
            'service_fee' => $fee,
            'discount' => $discount,
            'total' => $total,
            'is_guaranteed' => (bool) ($model->is_guaranteed ?? false),
            'age_pricing_applied' => $agePricingRows,
        ];
        $policySnapshot = $cancellation->snapshot($model);
        $serviceDate = $data['start_date'] ? Carbon::parse($data['start_date']) : null;
        $deadline = $cancellation->freeCancellationDeadline($serviceDate);

        $isPrepay = in_array($timing, [PaymentTimingService::PREPAID], true)
            || in_array($data['payment_method'], ['card', 'wallet'], true);

        $booking = DB::transaction(function () use (
            $request, $data, $holdToken, $model, $endDate, $guests, $units, $nights,
            $subtotal, $fee, $discount, $total, $commission, $timing, $isPrepay,
            $itemsSnapshot, $policySnapshot, $deadline, $bookingFor, $agePricingRows, $ages
        ) {
            $booking = Booking::create([
                'user_id' => $request->user()?->id,
                'hold_token' => $holdToken,
                'bookable_type' => Bookables::classFor($data['type']),
                'bookable_id' => $model->id,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $endDate,
                'guests' => $guests,
                'units' => $units,
                'nights' => $nights,
                'subtotal' => $subtotal,
                'service_fee' => $fee,
                'discount' => $discount,
                'total' => $total,
                'commission_amount' => $commission,
                'status' => $data['payment_method'] === 'on_arrival' ? 'confirmed' : 'pending',
                'payment_method' => $data['payment_method'],
                'payment_status' => 'unpaid',
                'payment_timing' => $timing,
                'payment_gateway' => null, // يُملأ لاحقاً لو تم توليد checkout URL
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_national_id' => $data['customer_national_id'] ?? null,
                'booking_for' => $bookingFor,
                'beneficiary_name' => $bookingFor === 'other' ? $data['beneficiary_name'] : null,
                'beneficiary_national_id' => $bookingFor === 'other' ? $data['beneficiary_national_id'] : null,
                'beneficiary_age' => $bookingFor === 'other' ? $data['beneficiary_age'] : null,
                'items_snapshot' => $itemsSnapshot,
                'cancellation_policy_snapshot' => $policySnapshot,
                'cancellation_deadline' => $deadline,
                'notes' => ! empty($data['slot']) ? "الوقت المطلوب: {$data['slot']}" : null,
            ]);

            // أفراد الحجز — سطر لكل فرد بعمره وشريحته
            foreach ($ages as $i => $age) {
                $row = $agePricingRows[$i] ?? ['tier_label' => null, 'applied_price' => null];
                BookingGuest::create([
                    'booking_id' => $booking->id,
                    'age' => $age,
                    'is_primary' => $i === 0,
                    // الاسم/الرقم القومي للرئيسي فقط (V2 §4)
                    'name' => $i === 0
                        ? ($bookingFor === 'other' ? ($data['beneficiary_name'] ?? null) : $data['customer_name'])
                        : null,
                    'national_id' => $i === 0
                        ? ($bookingFor === 'other' ? ($data['beneficiary_national_id'] ?? null) : ($data['customer_national_id'] ?? null))
                        : null,
                    'tier_label' => $row['tier_label'] ?? null,
                    'applied_price' => $row['applied_price'] ?? null,
                ]);
            }

            return $booking;
        });

        // ── دفع عند الوصول/الاستخدام: نثبّت المخزون ونؤكّد على طول ──
        if ($data['payment_method'] === 'on_arrival') {
            if ($holdToken) {
                $holds->convert($holdToken, $booking->id);
            }
            $notifier->confirmed($booking);

            $msg = match ($timing) {
                PaymentTimingService::ON_ARRIVAL => 'تم تأكيد حجزك — الدفع عند الوصول.',
                PaymentTimingService::ON_USE     => 'تم تأكيد حجزك — الدفع عند الاستخدام.',
                default                          => 'تم تأكيد حجزك.',
            };
            return redirect()
                ->route('booking.confirmation', $booking->code)
                ->with('success', $msg);
        }

        // ── دفع مسبق (كارت/محفظة): تحويل لبوابة الدفع ──
        if ($payments->hasConfigured()) {
            try {
                $booking->forceFill(['payment_gateway' => $payments->active()->name()])->save();
                $checkoutUrl = $payments->active()->checkoutUrl($booking);
                return Inertia::location($checkoutUrl);
            } catch (\Throwable $e) {
                report($e);
                return redirect()
                    ->route('booking.confirmation', $booking->code)
                    ->with('error', 'تعذّر فتح صفحة الدفع دلوقتي — حجزك محفوظ كـ "في انتظار الدفع".');
            }
        }

        return redirect()
            ->route('booking.confirmation', $booking->code)
            ->with('error', 'بوابة الدفع لم تُضبط بعد — الحجز محفوظ كـ "في انتظار الدفع".');
    }

    public function confirmation(Booking $booking): Response
    {
        $booking->load('bookable', 'guestsList');

        return Inertia::render('Booking/Confirmation', [
            'booking' => [
                'code' => $booking->code,
                'type' => Bookables::typeFor($booking->bookable_type),
                'title' => $booking->bookable?->title ?? '—',
                'location' => $booking->bookable?->location?->name ?? '',
                'start_date' => optional($booking->start_date)->format('Y-m-d'),
                'end_date' => optional($booking->end_date)->format('Y-m-d'),
                'guests' => $booking->guests,
                'units' => $booking->units,
                'nights' => $booking->nights,
                'total' => (float) $booking->total,
                'status' => $booking->status,
                'status_label' => $booking->status_label,
                'payment_method' => $booking->payment_method,
                'payment_timing' => $booking->payment_timing,
                'booking_for' => $booking->booking_for,
                'beneficiary_name' => $booking->beneficiary_name,
                'guests_ages' => $booking->guestsList->pluck('age')->all(),
            ],
        ]);
    }

    /** موديل قابل للحجز بمخزون (فندق الآن) — يستخدم trait HasAvailability */
    private function isPooled(Model $model): bool
    {
        return in_array(HasAvailability::class, class_uses_recursive($model), true);
    }

    /** يضبط قائمة الأعمار مع عدد الأفراد (لو الأعمار ناقصة نكمّل ببالغ افتراضي = 30) */
    private function normalizeAges(array $rawAges, int $guests): array
    {
        $ages = array_values(array_map(fn ($a) => max(0, min(120, (int) $a)), $rawAges));
        if (count($ages) === 0) {
            return []; // بدون شرائح — التسعير بـ guests × unit
        }
        // padding بأعمار البالغين لو ناقص
        while (count($ages) < $guests) {
            $ages[] = 30;
        }
        return array_slice($ages, 0, $guests);
    }

    public function account(Request $request): Response
    {
        $bookings = $request->user()->bookings()
            ->with('bookable')
            ->latest()
            ->get()
            ->map(fn ($b) => [
                'code' => $b->code,
                'title' => $b->bookable?->title ?? '—',
                'image_url' => $b->bookable?->image_url ?? '',
                'start_date' => optional($b->start_date)->format('Y-m-d'),
                'guests' => $b->guests,
                'total' => (float) $b->total,
                'status' => $b->status,
                'status_label' => $b->status_label,
                'payment_timing' => $b->payment_timing,
                'booking_for' => $b->booking_for,
            ]);

        return Inertia::render('Account/Dashboard', [
            'bookings' => $bookings,
            'stats' => [
                'total' => $bookings->count(),
                'upcoming' => $bookings->where('status', 'confirmed')->count(),
                'spent' => (float) $request->user()->bookings()->where('payment_status', 'paid')->sum('total'),
            ],
        ]);
    }
}
