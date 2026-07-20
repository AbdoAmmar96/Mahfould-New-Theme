<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

/**
 * إحداثيات المدن الحقيقية (§21) — للـhaversine والتخصيص.
 */
class LocationsSeeder extends Seeder
{
    public function run(): void
    {
        $cities = [
            ['شرم الشيخ',        'sharm',        27.9158, 34.3300, true],
            ['الغردقة',          'hurghada',     27.2579, 33.8116, true],
            ['سيوة',             'siwa',         29.2032, 25.5192, true],
            ['الأقصر وأسوان',    'luxor-aswan',  25.6872, 32.6396, true],
            ['دهب',              'dahab',        28.5091, 34.5136, false],
            ['القاهرة',          'cairo',        30.0444, 31.2357, false],
            ['العين السخنة',     'sokhna',       29.6031, 32.3183, false],
            ['الإسكندرية',       'alex',         31.2001, 29.9187, false],
            ['مرسى مطروح',       'matrouh',      31.3543, 27.2373, false],
            ['رأس سدر',          'ras-sedr',     29.5808, 32.7183, false],
            ['طابا',             'taba',         29.4906, 34.8944, false],
            ['أسوان (وحدها)',    'aswan',        24.0889, 32.8998, false],
        ];

        foreach ($cities as $i => [$name, $slug, $lat, $lng, $feat]) {
            Location::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'lat' => $lat, 'lng' => $lng, 'is_featured' => $feat, 'order' => $i],
            );
        }
    }
}
