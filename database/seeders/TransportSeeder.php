<?php

namespace Database\Seeders;

use App\Models\BusRoute;
use App\Models\BusStation;
use App\Models\BusTrip;
use App\Models\DeliveryService;
use App\Models\Location;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * بندا 10 و 11 — بيانات الباصات وخدمات التوصيل.
 *
 * الخطوط متماشية مع وجهات الرحلات الفعلية (شرم، الغردقة، الأقصر، دهب، السخنة، الإسكندرية)
 * عشان العميل يلاقي مواصلات لنفس الأماكن اللي بنبيع فيها رحلات.
 */
class TransportSeeder extends Seeder
{
    public function run(): void
    {
        $loc = Location::pluck('id', 'slug');

        // ── كيان الطرف الأول (محفول مكفول نفسها) ──
        // delivery_services.provider_id مش nullable، فلازم كيان مالك للخدمات الأصلية.
        $firstParty = \App\Models\Company::firstOrCreate(
            ['name' => 'محفول مكفول'],
            [
                'user_id' => \App\Models\User::where('role', 'admin')->value('id'),
                'provider_type' => 'company',
                'service_types' => ['tour', 'hotel', 'restaurant', 'car', 'bus', 'delivery', 'sahb'],
                'phone' => '01000000000',
                'email' => 'ops@mahfolmakfol.com',
                'about' => 'الخدمات المقدَّمة مباشرةً من محفول مكفول — مكفولة بالكامل.',
                'verification_status' => 'approved',
                'is_first_party' => true,
                'approved_at' => now(),
            ],
        );


        // ── المحطات ──
        $stationData = [
            // [الاسم, المدينة, slug الوجهة, lat, lng]
            ['موقف ألماظة', 'القاهرة', 'cairo', 30.1234, 31.3456],
            ['موقف التجمع الخامس', 'القاهرة', 'cairo', 30.0100, 31.4300],
            ['محطة شرم الشيخ', 'شرم الشيخ', 'sharm', 27.9158, 34.3300],
            ['محطة الغردقة', 'الغردقة', 'hurghada', 27.2579, 33.8116],
            ['محطة الأقصر', 'الأقصر', 'luxor-aswan', 25.6872, 32.6396],
            ['محطة دهب', 'دهب', 'dahab', 28.5091, 34.5136],
            ['محطة العين السخنة', 'العين السخنة', 'sokhna', 29.6000, 32.3167],
            ['محطة الإسكندرية (المنشية)', 'الإسكندرية', 'alex', 31.1975, 29.8925],
        ];

        $st = [];
        foreach ($stationData as [$name, $city, $slug, $lat, $lng]) {
            $st[$name] = BusStation::create([
                'location_id' => $loc[$slug] ?? null,
                'name' => $name, 'city' => $city,
                'lat' => $lat, 'lng' => $lng, 'is_active' => true,
            ]);
        }

        // ── الخطوط + المحطات الوسيطة (مناطق تسعير) ──
        $routes = [
            // [الاسم, من, إلى, دقائق, أجرة أساسية, [محطات وسيطة بالترتيب]]
            ['القاهرة ← شرم الشيخ', 'موقف ألماظة', 'محطة شرم الشيخ', 420, 450,
                ['موقف التجمع الخامس', 'محطة العين السخنة']],
            ['القاهرة ← الغردقة', 'موقف ألماظة', 'محطة الغردقة', 360, 400,
                ['محطة العين السخنة']],
            ['القاهرة ← الأقصر', 'موقف ألماظة', 'محطة الأقصر', 600, 520, []],
            ['شرم الشيخ ← دهب', 'محطة شرم الشيخ', 'محطة دهب', 90, 120, []],
            ['القاهرة ← الإسكندرية', 'موقف ألماظة', 'محطة الإسكندرية (المنشية)', 180, 180, []],
        ];

        $now = now();
        foreach ($routes as [$name, $from, $to, $mins, $fare, $vias]) {
            $route = BusRoute::create([
                'provider_id' => $firstParty->id,  // طرف أول (محفول مكفول)
                'name' => $name,
                'from_station_id' => $st[$from]->id,
                'to_station_id' => $st[$to]->id,
                'duration_minutes' => $mins,
                'base_fare' => $fare,
                'is_active' => true,
                'notes' => 'أتوبيس مكيّف — مقاعد مرقّمة وتأكيد فوري.',
            ]);

            // ترتيب المحطات: البداية ثم الوسيطة ثم النهاية (zone_number = منطقة التسعير)
            $chain = array_merge([$from], $vias, [$to]);
            $rows = [];
            foreach ($chain as $i => $sName) {
                $rows[] = [
                    'bus_route_id' => $route->id,
                    'bus_station_id' => $st[$sName]->id,
                    'order' => $i,
                    'zone_number' => $i,                       // كل محطة = منطقة (تسعير زي المترو)
                    'offset_minutes' => (int) round($mins * $i / max(1, count($chain) - 1)),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
            DB::table('bus_route_stations')->insert($rows);

            // ── رحلات الأسبوع الجاي: ميعادين ثابتين يوميًا ──
            for ($d = 1; $d <= 7; $d++) {
                foreach ([['08:00', 45], ['22:30', 45]] as [$time, $seats]) {
                    [$h, $m] = explode(':', $time);
                    $departs = now()->addDays($d)->setTime((int) $h, (int) $m);
                    BusTrip::create([
                        'bus_route_id' => $route->id,
                        'departs_at' => $departs,
                        'arrives_at' => $departs->copy()->addMinutes($mins),
                        'seats_total' => $seats,
                        'price_override' => null,
                        'bus_plate' => 'ق ط ر '.random_int(1000, 9999),
                        'status' => 'scheduled',
                    ]);
                }
            }
        }

        // ── خدمات التوصيل (تسعير بالكيلو) ──
        $delivery = [
            // [الاسم, المدينة, نوع المركبة, أساسي, للكيلو, أدنى, نطاق كم, أقصى وزن]
            ['توصيل سريع — موتوسيكل', 'القاهرة', 'motorcycle', 25, 4.5, 30, 20, 15],
            ['توصيل عادي — سيارة', 'القاهرة', 'car', 45, 6.0, 55, 35, 80],
            ['نقل بضائع — نصف نقل', 'القاهرة', 'van', 120, 9.0, 150, 60, 800],
            ['توصيل الغردقة — موتوسيكل', 'الغردقة', 'motorcycle', 30, 5.0, 35, 15, 15],
            ['توصيل شرم الشيخ — سيارة', 'شرم الشيخ', 'car', 50, 6.5, 60, 25, 80],
        ];

        foreach ($delivery as [$title, $city, $vehicle, $base, $perKm, $min, $radius, $maxKg]) {
            DeliveryService::create([
                'provider_id' => $firstParty->id,
                'title' => $title,
                'description' => 'خدمة توصيل مكفولة — تتبع الطلب وسعر واضح محسوب بالكيلومتر قبل التأكيد.',
                'base_fare' => $base,
                'price_per_km' => $perKm,
                'min_fare' => $min,
                'service_radius_km' => $radius,
                'vehicle_type' => $vehicle,
                'max_kg' => $maxKg,
                'city' => $city,
                'status' => 'publish',
                'publish_state' => 'published',
                'is_active' => true,
            ]);
        }
    }
}
