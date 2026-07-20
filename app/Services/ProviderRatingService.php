<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Review;
use App\Support\Bookables;
use Illuminate\Support\Facades\DB;

/**
 * V2-BLUEPRINT §13 — تجميع تقييمات المزوّد.
 *
 * تقييم المزوّد المُجمّع = متوسط كل التقييمات المعتمدة على كل عناصره
 * (رحلات + فنادق + مطاعم + عربيات + باقات).
 */
class ProviderRatingService
{
    /**
     * أنواع الخدمات التي يقدمها المزوّد (بتقييمات تُجمَّع لبروفايله).
     * ملاحظة: bus_trip يتم تجميع تقييماته على مستوى الخط، مش على الرحلة الفردية.
     */
    private const SERVICE_TYPES = ['tour', 'hotel', 'restaurant', 'car', 'sahb'];

    /** يعيد حساب `provider_review_score` + `provider_review_count` لمزوّد */
    public function refresh(Company $provider): void
    {
        $totalRating = 0;
        $totalCount = 0;

        foreach (self::SERVICE_TYPES as $type) {
            $class = Bookables::classFor($type);
            if (!$class) continue;

            $serviceIds = $class::where('provider_id', $provider->id)->pluck('id');
            if ($serviceIds->isEmpty()) continue;

            $stats = Review::query()
                ->where('reviewable_type', $class)
                ->whereIn('reviewable_id', $serviceIds)
                ->where('approved', true)
                ->selectRaw('COUNT(*) as cnt, AVG(rating) as avg')
                ->first();

            $count = (int) $stats->cnt;
            if ($count > 0) {
                $totalRating += (float) $stats->avg * $count;
                $totalCount += $count;
            }
        }

        $provider->forceFill([
            'provider_review_score' => $totalCount > 0 ? round($totalRating / $totalCount, 2) : 0,
            'provider_review_count' => $totalCount,
        ])->saveQuietly();
    }

    /** يعيد ملخص تقييمات المزوّد لعرضها في بروفايله */
    public function breakdown(Company $provider): array
    {
        $rows = [];
        foreach (self::SERVICE_TYPES as $type) {
            $class = Bookables::classFor($type);
            if (!$class) continue;

            $stats = DB::table('reviews')
                ->join((new $class)->getTable() . ' as s', function ($join) use ($class) {
                    $join->on('reviews.reviewable_id', '=', 's.id')
                         ->where('reviews.reviewable_type', '=', $class);
                })
                ->where('s.provider_id', $provider->id)
                ->where('reviews.approved', true)
                ->selectRaw('COUNT(*) as cnt, AVG(reviews.rating) as avg')
                ->first();

            if ($stats && $stats->cnt > 0) {
                $rows[$type] = [
                    'type' => $type,
                    'label' => $this->labelFor($type),
                    'count' => (int) $stats->cnt,
                    'avg' => round((float) $stats->avg, 2),
                ];
            }
        }
        return $rows;
    }

    private function labelFor(string $type): string
    {
        return match ($type) {
            'tour' => 'رحلات',
            'hotel' => 'فنادق',
            'restaurant' => 'مطاعم',
            'car' => 'عربيات',
            'sahb' => 'باقات مخصّصة',
            default => $type,
        };
    }
}
