<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Admin\CrudController;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Tour;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * حجوزات البائع — عرض فقط. بتشمل خدماته هو بس (via bookable.user_id).
 */
class BookingController extends CrudController
{
    protected string $model = Booking::class;

    protected string $panel = 'vendor';

    protected string $key = 'bookings';

    protected string $label = 'حجوزاتي';

    protected string $singular = 'حجز';

    protected string $icon = '🎫';

    protected bool $canCreate = false;

    protected bool $canEdit = false;

    protected bool $canDelete = false;

    protected bool $hasImage = false;

    protected function searchable(): array
    {
        return ['code', 'customer_name'];
    }

    protected function with(): array
    {
        return ['bookable'];
    }

    protected function scope(Builder $query): Builder
    {
        $user = Auth::user();

        if ($user && $user->role !== 'admin') {
            $query->whereHasMorph(
                'bookable',
                [Tour::class, Hotel::class, Car::class, Restaurant::class],
                fn (Builder $q) => $q->where('user_id', $user->id)
            );
        }

        return $query;
    }

    protected function columns(): array
    {
        return [
            ['key' => 'code', 'label' => 'الكود', 'type' => 'strong'],
            ['key' => 'customer_name', 'label' => 'العميل'],
            ['key' => 'service', 'label' => 'الخدمة'],
            ['key' => 'total', 'label' => 'الإجمالي', 'type' => 'money'],
            ['key' => 'commission_amount', 'label' => 'عمولة المنصة', 'type' => 'money-muted'],
            ['key' => 'vendor_earnings', 'label' => 'صافيك', 'type' => 'money-good'],
            ['key' => 'status', 'label' => 'الحالة', 'type' => 'badge'],
            ['key' => 'created_at', 'label' => 'التاريخ'],
        ];
    }

    protected function filters(): array
    {
        return [
            ['name' => 'status', 'label' => 'الحالة', 'options' => [
                ['pending', 'في الانتظار'],
                ['confirmed', 'مؤكّد'],
                ['processing', 'قيد المعالجة'],
                ['completed', 'مكتمل'],
                ['cancelled', 'ملغي'],
            ]],
        ];
    }

    protected function row(Model $m): array
    {
        return [
            'id' => $m->id,
            'code' => $m->code,
            'customer_name' => $m->customer_name,
            'service' => $m->bookable?->title ?? '—',
            'total' => (float) $m->total,
            'commission_amount' => (float) $m->commission_amount,
            'vendor_earnings' => (float) $m->vendor_earnings,
            'status' => $m->status,
            'created_at' => $m->created_at?->format('Y-m-d'),
        ];
    }

    // مطلوبة تجريدياً لكن غير مستخدمة (عرض فقط)
    protected function formSections(): array
    {
        return [];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [];
    }
}
