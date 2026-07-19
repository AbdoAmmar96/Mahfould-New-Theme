<?php

namespace App\Http\Controllers;

use App\Exceptions\SlotUnavailableException;
use App\Models\Booking;
use App\Models\Concerns\HasAvailability;
use App\Models\Setting;
use App\Services\Availability\HoldService;
use App\Services\BookingNotifier;
use App\Services\Payments\PaymentManager;
use App\Support\Bookables;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BookingController extends Controller
{
    public function create(Request $request, string $type, int $id): Response
    {
        $model = Bookables::resolve($type, $id);
        abort_unless($model !== null, 404);

        $price = (float) ($model->sale_price ?? $model->price ?? 0);
        $isGuaranteed = (bool) ($model->is_guaranteed ?? false);
        $pooled = $this->isPooled($model); // فندق بمخزون (تسعير ليلة×غرف)؟

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
            // بيانات جاية من صفحة الخدمة (التاريخ/العدد/الوقت) — تُملأ مسبقاً
            'prefill' => [
                'start_date' => $request->query('start_date'),
                'guests' => (int) $request->query('guests', 2),
                'nights' => max(1, (int) $request->query('nights', 1)),
                'units' => max(1, (int) $request->query('units', 1)),
                'slot' => $request->query('slot'),
            ],
            // نفس أرقام السيرفر عشان الإجمالي يطابق تماماً
            'pricing' => [
                'fee' => (float) Setting::get('service_fee', 200),
                'discount' => $isGuaranteed ? (float) Setting::get('makfol_discount', 400) : 0,
                'is_guaranteed' => $isGuaranteed,
            ],
        ]);
    }

    public function store(Request $request, PaymentManager $payments, BookingNotifier $notifier, HoldService $holds): SymfonyResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(Bookables::types())],
            'id' => ['required', 'integer'],
            'start_date' => ['nullable', 'date'],
            'guests' => ['required', 'integer', 'min:1', 'max:50'],
            'nights' => ['nullable', 'integer', 'min:1', 'max:60'],
            'units' => ['nullable', 'integer', 'min:1', 'max:20'],
            'slot' => ['nullable', 'string', 'max:8'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_national_id' => ['nullable', 'string', 'max:20'],
            'payment_method' => ['required', Rule::in(['card', 'wallet', 'on_arrival'])],
        ]);

        $model = Bookables::resolve($data['type'], $data['id']);
        abort_unless($model !== null, 404);

        $unit = (float) ($model->sale_price ?? $model->price ?? 0);
        $guests = (int) $data['guests'];
        $pooled = $this->isPooled($model);

        // القيم الافتراضية (للأنواع بلا مخزون)
        $units = 1;
        $nights = null;
        $endDate = null;
        $holdToken = null;

        if ($pooled) {
            // ── فندق: تاريخ وصول + ليالي + غرف، وحجز فعلي للمخزون ──
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
            $subtotal = $unit * $guests;
        }

        $fee = (float) Setting::get('service_fee', 200);                                  // رسوم خدمة (من الإعدادات)
        $discount = $model->is_guaranteed ? (float) Setting::get('makfol_discount', 400) : 0;  // خصم مكفول
        $total = max(0, $subtotal + $fee - $discount);

        // عمولة المنصة (نسبة من settings)
        $rate = (float) Setting::get('commission_rate', 15);
        $commission = round($total * $rate / 100, 2);

        $isCard = $data['payment_method'] !== 'on_arrival';

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
            'payment_gateway' => $isCard && $payments->hasConfigured() ? $payments->active()->name() : null,
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
            'customer_email' => $data['customer_email'] ?? null,
            'customer_national_id' => $data['customer_national_id'] ?? null,
            'notes' => ! empty($data['slot']) ? "الوقت المطلوب: {$data['slot']}" : null,
        ]);

        // الدفع عند الوصول — نثبّت المخزون ونأكّد على طول
        if ($data['payment_method'] === 'on_arrival') {
            if ($holdToken) {
                $holds->convert($holdToken, $booking->id);
            }
            $notifier->confirmed($booking);

            return redirect()
                ->route('booking.confirmation', $booking->code)
                ->with('success', 'تم تأكيد حجزك — الدفع عند الوصول.');
        }

        // كارت / محفظة → الوحدات محجوزة مؤقتاً؛ التثبيت عند نجاح الدفع
        if ($payments->hasConfigured()) {
            try {
                $checkoutUrl = $payments->active()->checkoutUrl($booking);

                // تحويل خارجي عبر Inertia (زيارة كاملة للصفحة)
                return Inertia::location($checkoutUrl);
            } catch (\Throwable $e) {
                report($e);

                // الحجز المؤقّت يفضل قائم 30 دقيقة — الكرون بيحرّره لو الدفع ما تمّش
                return redirect()
                    ->route('booking.confirmation', $booking->code)
                    ->with('error', 'تعذّر فتح صفحة الدفع دلوقتي — حجزك محفوظ كـ "في انتظار الدفع".');
            }
        }

        // مفيش بوابة مضبوطة (بيئة تطوير) — نسيب الحجز pending
        return redirect()
            ->route('booking.confirmation', $booking->code)
            ->with('error', 'بوابة الدفع لم تُضبط بعد — الحجز محفوظ كـ "في انتظار الدفع".');
    }

    public function confirmation(Booking $booking): Response
    {
        $booking->load('bookable');

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
            ],
        ]);
    }

    /** موديل قابل للحجز بمخزون (فندق الآن) — يستخدم trait HasAvailability */
    private function isPooled(Model $model): bool
    {
        return in_array(HasAvailability::class, class_uses_recursive($model), true);
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
