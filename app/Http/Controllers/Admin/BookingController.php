<?php

namespace App\Http\Controllers\Admin;

use App\Models\Booking;
use App\Services\Availability\HoldService;
use App\Services\Payments\PaymentManager;
use App\Support\Bookables;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingController extends CrudController
{
    protected string $model = Booking::class;

    protected string $key = 'bookings';

    protected string $label = 'الحجوزات';

    protected string $singular = 'حجز';

    protected string $icon = '🎫';

    protected bool $canCreate = false;

    protected bool $hasImage = false;

    protected const STATUS = [
        ['pending', 'في الانتظار'],
        ['confirmed', 'مؤكّد'],
        ['processing', 'قيد المعالجة'],
        ['completed', 'مكتمل'],
        ['cancelled', 'ملغي'],
    ];

    protected const PAYMENT = [
        ['unpaid', 'غير مدفوع'],
        ['paid', 'مدفوع'],
        ['refunded', 'مسترجع'],
    ];

    protected function searchable(): array
    {
        return ['code', 'customer_name', 'customer_phone'];
    }

    protected function with(): array
    {
        return ['bookable'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'code', 'label' => 'الكود', 'type' => 'strong'],
            ['key' => 'customer_name', 'label' => 'العميل'],
            ['key' => 'customer_phone', 'label' => 'الموبايل'],
            ['key' => 'service', 'label' => 'الخدمة', 'type' => 'badge'],
            ['key' => 'total', 'label' => 'الإجمالي', 'type' => 'money'],
            ['key' => 'status', 'label' => 'الحالة', 'type' => 'badge'],
            ['key' => 'payment_status', 'label' => 'الدفع', 'type' => 'badge'],
            ['key' => 'created_at', 'label' => 'التاريخ'],
        ];
    }

    protected function filters(): array
    {
        return [
            ['name' => 'status', 'label' => 'الحالة', 'options' => self::STATUS],
            ['name' => 'payment_status', 'label' => 'حالة الدفع', 'options' => self::PAYMENT],
        ];
    }

    protected function formSections(): array
    {
        return [
            ['title' => 'بيانات الحجز', 'fields' => [
                ['name' => 'code', 'label' => 'كود الحجز', 'type' => 'text', 'disabled' => true],
                ['name' => 'total', 'label' => 'الإجمالي', 'type' => 'text', 'disabled' => true, 'prefix' => 'ج.م'],
                ['name' => 'customer_name', 'label' => 'اسم العميل', 'type' => 'text', 'required' => true],
                ['name' => 'customer_phone', 'label' => 'موبايل العميل', 'type' => 'text', 'required' => true],
                ['name' => 'customer_email', 'label' => 'إيميل العميل', 'type' => 'text'],
                ['name' => 'start_date', 'label' => 'تاريخ البداية', 'type' => 'date'],
                ['name' => 'guests', 'label' => 'عدد الأفراد', 'type' => 'number'],
            ]],
            ['title' => 'الحالة والدفع', 'fields' => [
                ['name' => 'status', 'label' => 'حالة الحجز', 'type' => 'select', 'required' => true, 'options' => self::STATUS],
                ['name' => 'payment_status', 'label' => 'حالة الدفع', 'type' => 'select', 'required' => true, 'options' => self::PAYMENT],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:160'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:160'],
            'start_date' => ['nullable', 'date'],
            'guests' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', Rule::in(array_column(self::STATUS, 0))],
            'payment_status' => ['required', Rule::in(array_column(self::PAYMENT, 0))],
        ];
    }

    protected function row(Model $m): array
    {
        return [
            'id' => $m->id,
            'code' => $m->code,
            'customer_name' => $m->customer_name,
            'customer_phone' => $m->customer_phone,
            'service' => self::serviceLabel($m->bookable_type),
            'total' => (float) $m->total,
            'status' => $m->status,
            'payment_status' => $m->payment_status,
            'created_at' => $m->created_at?->format('Y-m-d'),
            'can_refund' => $m->payment_status === 'paid' && $m->payment_gateway,
        ];
    }

    protected function recordData(Model $m): array
    {
        return [
            'id' => $m->id,
            'code' => $m->code,
            'total' => (float) $m->total,
            'customer_name' => $m->customer_name,
            'customer_phone' => $m->customer_phone,
            'customer_email' => $m->customer_email,
            'start_date' => $m->start_date?->format('Y-m-d'),
            'guests' => $m->guests,
            'status' => $m->status,
            'payment_status' => $m->payment_status,
        ];
    }

    /** استرجاع الحجز عبر البوابة اللي اتدفع بيها */
    public function refund(int $id, PaymentManager $payments, HoldService $holds): RedirectResponse
    {
        $booking = $this->scope(Booking::query())->findOrFail($id);

        if ($booking->payment_status !== 'paid' || ! $booking->payment_gateway) {
            return back()->with('error', 'الحجز ده مش قابل للاسترجاع.');
        }

        if ($payments->refund($booking)) {
            $booking->update([
                'payment_status' => 'refunded',
                'status'         => 'cancelled',
                'cancelled_at'   => now(),
            ]);

            // ⚠️ لازم نرجّع الوحدات للمخزون.
            // من غير السطر ده صفوف booking_items تفضل state=booked و expires_at=null
            // فلا scopeActive بيسيبها ولا الكرون بيلمسها — يعني ليالي الغرفة
            // دي تبقى غير قابلة للبيع **للأبد** بعد كل استرداد.
            if ($booking->hold_token) {
                $holds->release($booking->hold_token);
            }

            return back()->with('success', "تم استرجاع الحجز {$booking->code} بنجاح.");
        }

        return back()->with('error', 'فشل الاسترجاع — راجع إعدادات بوابة الدفع.');
    }

    private static function serviceLabel(?string $type): string
    {
        return match (Bookables::typeFor((string) $type)) {
            'tour' => 'رحلة',
            'hotel' => 'فندق',
            'restaurant' => 'مطعم',
            'car' => 'سيارة',
            'sahb' => 'صاحب السعادة',
            default => '—',
        };
    }
}
