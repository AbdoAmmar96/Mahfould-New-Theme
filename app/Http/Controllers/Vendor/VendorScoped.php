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

    /**
     * نقطة الاختناق الوحيدة لكل إنشاء/تعديل خدمة من المزوّد.
     *
     * إصلاحان حرجان (V2-BLUEPRINT §1.1, §16):
     *  1) دورة المراجعة كانت مقطوعة — publish_state افتراضيه 'published' ومحدش
     *     بيحطّه 'pending_review'، يعني أي خدمة مزوّد كانت **بتتنشر فورًا للعملاء
     *     من غير مراجعة**. دلوقتي أي حفظ من مزوّد بيرجّعها لقائمة المراجعة.
     *  2) provider_id مكانش بيتكتب أبدًا — فالأرباح صفر دايمًا والبروفايل العام فاضي
     *     وشارة "طرف أول" كانت بتظهر غلط على خدمات الطرف التالت.
     */
    protected function beforeSave(array $data, Request $request, ?Model $record): array
    {
        $user = Auth::user();
        $data['user_id'] ??= $user?->id;

        // الأدمن بينشر مباشرة؛ المزوّد لأ
        if ($user && $user->role !== 'admin') {
            if ($company = $user->company) {
                $data['provider_id'] = $company->id;
            }

            $data['publish_state']    = 'pending_review';
            $data['submitted_at']     = now();
            $data['reviewed_at']      = null;
            $data['reviewed_by']      = null;
            $data['rejection_reason'] = null;
        }

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
