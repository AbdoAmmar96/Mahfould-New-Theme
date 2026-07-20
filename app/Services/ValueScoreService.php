<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * V2-BLUEPRINT §12 — "أفضل قيمة مقابل السعر" داخل النوع الواحد فقط.
 *
 * درجة القيمة = (وزن التقييم + وزن الضمان + وزن الفعاليات) ÷ السعر النسبي.
 * التطبيع بالنسبة لأقل سعر داخل نفس النوع (لا مقارنة عبر الأنواع).
 *
 * الأوزان قابلة للضبط من إعدادات الأدمن (Setting).
 */
class ValueScoreService
{
    /** يحسب درجة القيمة لعناصر Collection من نفس النوع */
    public function scoreCollection(Collection $items): Collection
    {
        if ($items->isEmpty()) {
            return $items;
        }

        $minPrice = max(1, (float) $items->min(fn ($it) => $this->priceOf($it)));

        $wReview     = (float) Setting::get('value_weight_review', 40);
        $wGuarantee  = (float) Setting::get('value_weight_guarantee', 25);
        $wActivities = (float) Setting::get('value_weight_activities', 15);
        $wPrice      = (float) Setting::get('value_weight_price', 20);

        return $items->map(function ($item) use ($minPrice, $wReview, $wGuarantee, $wActivities, $wPrice) {
            $price = max(1, (float) $this->priceOf($item));
            $reviewNorm     = (float) ($item->review_score ?? 0) / 5;         // 0..1
            $guaranteeNorm  = ($item->is_guaranteed ?? false) ? 1 : 0;
            $activitiesNorm = $this->activitiesFactor($item);                  // 0..1
            $priceNorm      = $minPrice / $price;                              // ≤1؛ الأرخص = 1

            $score = ($reviewNorm * $wReview)
                + ($guaranteeNorm * $wGuarantee)
                + ($activitiesNorm * $wActivities)
                + ($priceNorm * $wPrice);

            $item->value_score = round($score, 2);
            return $item;
        });
    }

    /** يرتّب Query builder حسب "أفضل قيمة" — يتطلب تحميل الـcollection ثم إعادتها */
    public function bestValueSort(Builder $query): Collection
    {
        return $this->scoreCollection($query->get())->sortByDesc('value_score')->values();
    }

    /** يميّز أفضل قيمة (top 20% من النوع) بشارة */
    public function markBestValueBadge(Collection $items): Collection
    {
        if ($items->isEmpty()) return $items;
        $sorted = $items->sortByDesc('value_score')->values();
        $threshold = max(1, (int) ceil($sorted->count() * 0.2));
        return $items->map(function ($item) use ($sorted, $threshold) {
            $rank = $sorted->search(fn ($it) => $it->getKey() === $item->getKey());
            $item->is_best_value = $rank !== false && $rank < $threshold;
            return $item;
        });
    }

    private function priceOf($item): float
    {
        return (float) ($item->sale_price ?? $item->price ?? 0);
    }

    /** عدد الفعاليات (add-ons) لأي نوع بيدعمها — 0..1 */
    private function activitiesFactor($item): float
    {
        // Tour: activities relation
        if (method_exists($item, 'activities') || property_exists($item, 'activities_count')) {
            $count = $item->activities_count ?? ($item->activities?->count() ?? 0);
            // نطبّع بلوغاريتم لأن أكتر من 5 فعاليات مبتفرقش خالص
            return min(1, $count / 5);
        }
        return 0.0;
    }
}
