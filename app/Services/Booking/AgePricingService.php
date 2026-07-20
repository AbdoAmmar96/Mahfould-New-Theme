<?php

namespace App\Services\Booking;

use App\Models\AgePricingTier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * خدمة التسعير حسب شرائح العمر — V2-BLUEPRINT §4.
 *
 * لكل خدمة (رحلة/فندق/…) شرائح خاصة بها في age_pricing_tiers.
 * لو مفيش شرائح مسجّلة → Fallback على الشرائح الافتراضية (رضيع/طفل/بالغ).
 * multiplier = نسبة من سعر البالغ.
 */
class AgePricingService
{
    /** الشرائح الافتراضية لو مفيش تخصيص للخدمة */
    public const DEFAULT_TIERS = [
        ['label' => 'رضيع', 'min_age' => 0,  'max_age' => 2,    'multiplier' => 0.00, 'order' => 1],
        ['label' => 'طفل',  'min_age' => 3,  'max_age' => 11,   'multiplier' => 0.50, 'order' => 2],
        ['label' => 'بالغ', 'min_age' => 12, 'max_age' => null, 'multiplier' => 1.00, 'order' => 3],
    ];

    /**
     * يجيب الشرائح المُعرَّفة للخدمة، أو الافتراضية لو غير مُعرَّفة.
     *
     * @return Collection<int, array{label:string,min_age:int,max_age:?int,multiplier:float,order:int}>
     */
    public function tiersFor(Model $bookable): Collection
    {
        $tiers = AgePricingTier::query()
            ->where('bookable_type', $bookable::class)
            ->where('bookable_id', $bookable->getKey())
            ->orderBy('order')
            ->get();

        if ($tiers->isEmpty()) {
            return collect(self::DEFAULT_TIERS);
        }

        return $tiers->map(fn (AgePricingTier $t) => [
            'label' => $t->label,
            'min_age' => $t->min_age,
            'max_age' => $t->max_age,
            'multiplier' => (float) $t->multiplier,
            'order' => $t->order,
        ]);
    }

    /**
     * يحسب سطر لكل فرد: [label, multiplier, applied_price].
     *
     * @param  array<int>  $ages  أعمار الأفراد
     * @return array{guests: array<int, array{age:int,tier_label:string,multiplier:float,applied_price:float}>, subtotal: float}
     */
    public function computeGuests(Model $bookable, float $adultUnitPrice, array $ages): array
    {
        $tiers = $this->tiersFor($bookable);
        $rows = [];
        $subtotal = 0.0;

        foreach ($ages as $age) {
            $age = max(0, (int) $age);
            $tier = $this->pickTier($tiers, $age);
            $price = round($adultUnitPrice * $tier['multiplier'], 2);
            $rows[] = [
                'age' => $age,
                'tier_label' => $tier['label'],
                'multiplier' => $tier['multiplier'],
                'applied_price' => $price,
            ];
            $subtotal += $price;
        }

        return ['guests' => $rows, 'subtotal' => round($subtotal, 2)];
    }

    /** يختار الشريحة المناسبة لعمر معيّن؛ لو مافيش match مباشر → آخر شريحة (البالغ افتراضياً) */
    private function pickTier(Collection $tiers, int $age): array
    {
        foreach ($tiers as $t) {
            $inMin = $age >= (int) $t['min_age'];
            $inMax = $t['max_age'] === null || $age <= (int) $t['max_age'];
            if ($inMin && $inMax) {
                return $t;
            }
        }
        return $tiers->last() ?? ['label' => 'بالغ', 'min_age' => 0, 'max_age' => null, 'multiplier' => 1.00, 'order' => 999];
    }
}
