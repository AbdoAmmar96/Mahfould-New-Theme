<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Support\Bookables;
use App\Services\BookingNotifier;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BookingController extends Controller
{

    public function create(string $type, int $id): Response
    {
        $model = Bookables::resolve($type, $id);
        abort_unless($model !== null, 404);

        $price = (float) ($model->sale_price ?? $model->price ?? 0);

        return Inertia::render('Booking/Checkout', [
            'item' => [
                'type'      => $type,
                'id'        => $model->id,
                'title'     => $model->title,
                'image_url' => $model->image_url,
                'price'     => $price,
                'unit'      => match ($type) { 'hotel' => 'الليلة', 'car' => 'اليوم', default => 'الفرد' },
            ],
        ]);
    }

    public function store(Request $request, PaymentManager $payments, BookingNotifier $notifier): SymfonyResponse
    {
        $data = $request->validate([
            'type'                 => ['required', Rule::in(Bookables::types())],
            'id'                   => ['required', 'integer'],
            'start_date'           => ['nullable', 'date'],
            'guests'               => ['required', 'integer', 'min:1', 'max:50'],
            'customer_name'        => ['required', 'string', 'max:120'],
            'customer_phone'       => ['required', 'string', 'max:20'],
            'customer_email'       => ['nullable', 'email', 'max:120'],
            'customer_national_id' => ['nullable', 'string', 'max:20'],
            'payment_method'       => ['required', Rule::in(['card', 'wallet', 'on_arrival'])],
        ]);

        $model = Bookables::resolve($data['type'], $data['id']);
        abort_unless($model !== null, 404);

        $unit     = (float) ($model->sale_price ?? $model->price ?? 0);
        $guests   = (int) $data['guests'];
        $subtotal = $unit * $guests;
        $fee      = 200;                          // رسوم خدمة ثابتة (تتظبط لاحقاً)
        $discount = $model->is_guaranteed ? 400 : 0; // خصم مكفول
        $total    = max(0, $subtotal + $fee - $discount);

        // عمولة المنصة (نسبة من settings)
        $rate       = (float) \App\Models\Setting::get('commission_rate', 15);
        $commission = round($total * $rate / 100, 2);

        $isCard = $data['payment_method'] !== 'on_arrival';

        $booking = Booking::create([
            'user_id'              => $request->user()?->id,
            'bookable_type'        => Bookables::classFor($data['type']),
            'bookable_id'          => $model->id,
            'start_date'           => $data['start_date'] ?? null,
            'guests'               => $guests,
            'subtotal'             => $subtotal,
            'service_fee'          => $fee,
            'discount'             => $discount,
            'total'                => $total,
            'commission_amount'    => $commission,
            'status'               => $data['payment_method'] === 'on_arrival' ? 'confirmed' : 'pending',
            'payment_method'       => $data['payment_method'],
            'payment_status'       => 'unpaid',
            'payment_gateway'      => $isCard && $payments->hasConfigured() ? $payments->active()->name() : null,
            'customer_name'        => $data['customer_name'],
            'customer_phone'       => $data['customer_phone'],
            'customer_email'       => $data['customer_email'] ?? null,
            'customer_national_id' => $data['customer_national_id'] ?? null,
        ]);

        // الدفع عند الوصول — نأكّد على طول
        if ($data['payment_method'] === 'on_arrival') {
            $notifier->confirmed($booking);
            return redirect()
                ->route('booking.confirmation', $booking->code)
                ->with('success', 'تم تأكيد حجزك — الدفع عند الوصول.');
        }

        // كارت / محفظة → تحويل لبوابة الدفع النشطة (Paymob أو Fawry)
        if ($payments->hasConfigured()) {
            try {
                $checkoutUrl = $payments->active()->checkoutUrl($booking);
                // تحويل خارجي عبر Inertia (زيارة كاملة للصفحة)
                return Inertia::location($checkoutUrl);
            } catch (\Throwable $e) {
                report($e);
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
                'code'           => $booking->code,
                'title'          => $booking->bookable?->title ?? '—',
                'location'       => $booking->bookable?->location?->name ?? '',
                'start_date'     => optional($booking->start_date)->format('Y-m-d'),
                'guests'         => $booking->guests,
                'total'          => (float) $booking->total,
                'status'         => $booking->status,
                'status_label'   => $booking->status_label,
                'payment_method' => $booking->payment_method,
            ],
        ]);
    }

    public function account(Request $request): Response
    {
        $bookings = $request->user()->bookings()
            ->with('bookable')
            ->latest()
            ->get()
            ->map(fn ($b) => [
                'code'         => $b->code,
                'title'        => $b->bookable?->title ?? '—',
                'image_url'    => $b->bookable?->image_url ?? '',
                'start_date'   => optional($b->start_date)->format('Y-m-d'),
                'guests'       => $b->guests,
                'total'        => (float) $b->total,
                'status'       => $b->status,
                'status_label' => $b->status_label,
            ]);

        return Inertia::render('Account/Dashboard', [
            'bookings' => $bookings,
            'stats'    => [
                'total'    => $bookings->count(),
                'upcoming' => $bookings->where('status', 'confirmed')->count(),
                'spent'    => (float) $request->user()->bookings()->where('payment_status', 'paid')->sum('total'),
            ],
        ]);
    }
}
