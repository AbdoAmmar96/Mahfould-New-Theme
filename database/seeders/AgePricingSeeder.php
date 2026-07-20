<?php

namespace Database\Seeders;

use App\Models\AgePricingTier;
use App\Models\Tour;
use App\Models\SahbPackage;
use Illuminate\Database\Seeder;

/**
 * شرائح تسعير عمري افتراضية (§4).
 * رضيع 0% · طفل 50% · بالغ 100%.
 */
class AgePricingSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            ['رضيع', 0, 2, 0.00],
            ['طفل',  3, 11, 0.50],
            ['بالغ', 12, null, 1.00],
        ];

        // نطبقها على كل الرحلات و باكدجات صاحب السعادة
        foreach (Tour::all() as $tour) {
            foreach ($tiers as $order => [$label, $min, $max, $mult]) {
                AgePricingTier::updateOrCreate(
                    ['pricable_type' => Tour::class, 'pricable_id' => $tour->id, 'label' => $label],
                    ['min_age' => $min, 'max_age' => $max, 'multiplier' => $mult, 'order' => $order],
                );
            }
        }

        foreach (SahbPackage::all() as $pkg) {
            foreach ($tiers as $order => [$label, $min, $max, $mult]) {
                AgePricingTier::updateOrCreate(
                    ['pricable_type' => SahbPackage::class, 'pricable_id' => $pkg->id, 'label' => $label],
                    ['min_age' => $min, 'max_age' => $max, 'multiplier' => $mult, 'order' => $order],
                );
            }
        }
    }
}
