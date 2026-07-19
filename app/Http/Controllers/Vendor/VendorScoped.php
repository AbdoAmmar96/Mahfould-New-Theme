<?php

namespace App\Http\Controllers\Vendor;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * يقصر أي مورد على السجلات المملوكة للبائع الحالي (user_id).
 * الأدمن يشوف الكل. ويربط السجل الجديد بالبائع تلقائياً.
 */
trait VendorScoped
{
    protected function scope(Builder $query): Builder
    {
        $user = Auth::user();

        if ($user && $user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        return $query->withCount('bookings');
    }

    protected function beforeSave(array $data, Request $request, ?Model $record): array
    {
        $data['user_id'] ??= Auth::id();

        return $data;
    }

    /** أعمدة مبسّطة موحّدة لجداول البائع */
    protected function vendorColumns(string $titleLabel, string $priceLabel = 'السعر'): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => $titleLabel],
            ['key' => 'price', 'label' => $priceLabel, 'type' => 'money'],
            ['key' => 'bookings_count', 'label' => 'الحجوزات'],
            ['key' => 'status', 'label' => 'الحالة', 'type' => 'badge'],
        ];
    }

    protected function filters(): array
    {
        return [];
    }
}
