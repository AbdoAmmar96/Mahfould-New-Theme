<?php

namespace App\Filament\Vendor\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * يقصر أي Resource على السجلات المملوكة للبائع الحالي (user_id).
 * الأدمن يشوف الكل.
 */
trait ScopedToVendor
{
    public static function getEloquentQuery(): Builder
    {
        $q = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user && $user->role !== 'admin') {
            $q->where('user_id', $user->id);
        }

        return $q;
    }

    /** يربط السجل الجديد بالبائع الحالي تلقائياً */
    public static function ownerData(array $data): array
    {
        $data['user_id'] ??= Auth::id();
        return $data;
    }
}
