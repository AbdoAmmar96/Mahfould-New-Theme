<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\Hotel;
use App\Models\Location;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\SahbPackage;
use App\Models\Setting;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── مستخدمين ──
        User::create([
            'name' => 'أدمن محفول مكفول', 'email' => 'admin@mahfolmakfol.com',
            'phone' => '01000000000', 'role' => 'admin',
            'password' => Hash::make('password'),
        ]);
        $customer = User::create([
            'name' => 'أحمد سمير', 'email' => 'amr@example.com',
            'phone' => '01012345678', 'role' => 'customer',
            'password' => Hash::make('password'),
        ]);
        $vendor = User::create([
            'name' => 'شركة النخبة للسياحة', 'email' => 'vendor@mahfolmakfol.com',
            'phone' => '01099999999', 'role' => 'vendor',
            'password' => Hash::make('password'),
        ]);

        // ── الإعدادات ──
        Setting::set('site_title', 'محفول مكفول');
        Setting::set('site_desc', 'منصة سياحة مصرية — رحلتك محفولة مكفولة');
        Setting::set('currency_symbol', 'ج.م');
        Setting::set('contact_phone', '01000000000');
        Setting::set('commission_rate', '15'); // عمولة المنصة %
        Setting::set('service_fee', '200');    // رسوم الخدمة الثابتة
        Setting::set('makfol_discount', '400'); // خصم مكفول للخدمات المضمونة

        // ── الوجهات ──
        $dests = [
            ['شرم الشيخ', 'sharm', true], ['الغردقة', 'hurghada', true],
            ['سيوة', 'siwa', true], ['الأقصر وأسوان', 'luxor-aswan', true],
            ['دهب', 'dahab', false], ['القاهرة', 'cairo', false],
            ['العين السخنة', 'sokhna', false],
        ];
        $loc = [];
        foreach ($dests as $i => [$name, $slug, $feat]) {
            $loc[$slug] = Location::create([
                'name' => $name, 'slug' => $slug, 'is_featured' => $feat, 'order' => $i,
            ]);
        }

        // ── الرحلات ──
        $tours = [
            ['رحلة شرم الشيخ الكاملة', 'sharm', 4200, 5000, 4, '4.9', 218, true, true,
             'شرم الشيخ · 4 أيام · شامل الطيران'],
            ['سفاري الغردقة الفاخر', 'hurghada', 6800, null, 3, '4.8', 156, true, false,
             'الغردقة · 3 أيام · منتجع 5 نجوم'],
            ['واحة سيوة — رحلة الصحراء', 'siwa', 3950, null, 5, '4.7', 89, true, true,
             'سيوة · 5 أيام · جيب سفاري'],
            ['الأقصر وأسوان — رحلة النيل', 'luxor-aswan', 5600, null, 4, '4.9', 204, false, true,
             'الصعيد · 4 أيام · كروز نيلي'],
            ['دهب — غوص وطبيعة', 'dahab', 2900, 3400, 3, '4.6', 67, false, true,
             'دهب · 3 أيام · غوص حر'],
        ];
        foreach ($tours as $ti => [$title, $lslug, $price, $sale, $days, $score, $rc, $feat, $guar, $sd]) {
            Tour::create([
                'user_id' => $ti < 2 ? $vendor->id : null, // أول رحلتين ملك البائع
                'location_id' => $loc[$lslug]->id,
                'title' => $title, 'short_desc' => $sd,
                'content' => 'برنامج متكامل بأسعار ثابتة وضمان استرداد — كل التفاصيل متظبطة من الألف للياء.',
                'price' => $price, 'sale_price' => $sale, 'duration_days' => $days,
                'max_people' => 20, 'is_featured' => $feat, 'is_guaranteed' => $guar,
                'review_score' => $score, 'review_count' => $rc,
                'included' => ['طيران داخلي ذهاب وعودة', 'إقامة 5 نجوم', 'رحلة غطس', 'سفاري صحراوي', 'انتقالات المطار', 'مرشد سياحي'],
                'itinerary' => [
                    ['title' => 'اليوم الأول — الوصول والاستقرار', 'desc' => 'استقبال بالمطار، انتقال للمنتجع، ووقت حر على البحر.'],
                    ['title' => 'اليوم الثاني — غطس', 'desc' => 'رحلة بحرية كاملة لأجمل الشعاب المرجانية مع غداء على المركب.'],
                    ['title' => 'اليوم الثالث — سفاري صحراوي', 'desc' => 'كوادِ في الصحراء، زيارة قرية بدوية، وعشاء تحت النجوم.'],
                    ['title' => 'اليوم الأخير — التسوق والمغادرة', 'desc' => 'وقت حر بالسوق القديم، ثم الانتقال للمطار.'],
                ],
            ]);
        }

        // ── الفنادق ── (units_total = عدد الغرف المتاحة للحجز)
        $hotels = [
            ['ريكسوس بريميوم — شرم الشيخ', 'sharm', 2800, null, 5, '4.9', 512, true, 6],
            ['ستيلا دي ماري — الغردقة', 'hurghada', 2400, 3200, 5, '4.7', 348, false, 4],
            ['فورسيزونز — القاهرة', 'cairo', 4600, null, 5, '5.0', 204, true, 3],
        ];
        $hotelModels = [];
        foreach ($hotels as [$title, $lslug, $price, $sale, $star, $score, $rc, $feat, $units]) {
            $hotelModels[] = Hotel::create([
                'location_id' => $loc[$lslug]->id, 'title' => $title,
                'short_desc' => 'إقامة فاخرة بأفضل الأسعار المكفولة',
                'content' => 'منتجع 5 نجوم بخدمة كاملة على البحر مباشرة.',
                'price' => $price, 'sale_price' => $sale, 'star_rating' => $star,
                'units_total' => $units,
                'is_featured' => $feat, 'review_score' => $score, 'review_count' => $rc,
            ]);
        }

        // ── إشغال تجريبي: أول فندق (6 غرف) محجوز منه 4 غرف لـ5 ليالٍ قريبة ──
        // (يخلّي منتقي التواريخ يوري "متبقّي 2 غرف" فعليًا)
        $demoHotel = $hotelModels[0];
        $items = [];
        for ($room = 0; $room < 4; $room++) {
            for ($n = 3; $n < 8; $n++) { // بعد 3 أيام من اليوم، لمدة 5 ليالٍ
                $items[] = [
                    'unit_type' => 'hotel', 'unit_id' => $demoHotel->id, 'unit_index' => $room,
                    'date' => now()->addDays($n)->toDateString(), 'slot' => 'STAY',
                    'state' => 'booked', 'created_at' => now(), 'updated_at' => now(),
                ];
            }
        }
        \App\Models\BookingItem::insert($items);

        // ── المطاعم ──
        $rests = [
            ['أبو السيد', 'cairo', 'الزمالك، القاهرة', ['مصري', 'شرقي'], '$$', '4.8', 1200],
            ['Zooba', 'cairo', 'مدينة نصر، القاهرة', ['ستريت فود', 'مصري عصري'], '$', '4.6', 890],
            ['Sachi', 'cairo', 'التجمع الخامس', ['آسيوي', 'سوشي'], '$$$', '4.9', 654],
            ['كافيه جروبي', 'cairo', 'وسط البلد، القاهرة', ['كافيه', 'حلويات'], '$$', '4.5', 2100],
        ];
        foreach ($rests as [$title, $lslug, $addr, $cuisines, $range, $score, $rc]) {
            Restaurant::create([
                'location_id' => $loc[$lslug]->id, 'title' => $title, 'address' => $addr,
                'cuisines' => $cuisines, 'price_range' => $range,
                'review_score' => $score, 'review_count' => $rc,
                'content' => 'من أشهر الأماكن — احجز ترابيزتك في ثوانٍ.',
            ]);
        }

        // ── باكدجات صاحب السعادة ──
        $packages = [
            ['عيد ميلاد محفول', 'عيد ميلاد', 2500, 'سيناريو كامل: مكان، تزيين بالبالونات، كيك مخصص، وتصوير احترافي.', 'الأكثر طلباً', ['مكان', 'تزيين', 'كيك', 'تصوير']],
            ['خطوبة أو عيد جواز', 'عيد جواز', 3500, 'عشاء رومانسي، تنسيق مكان بالورد، مفاجأة، وإقامة ليلة في فندق مميز.', 'VIP', ['عشاء', 'ورد', 'مفاجأة', 'إقامة']],
            ['مفاجأة مخصصة', 'مخصص', 0, 'قوللنا المناسبة والميزانية، واحنا نبنيلك سيناريو كامل على مقاسك.', 'مكفول', ['حسب الطلب']],
        ];
        foreach ($packages as $i => [$title, $occ, $price, $sd, $badge, $inc]) {
            SahbPackage::create([
                'title' => $title, 'occasion' => $occ, 'price' => $price,
                'price_from' => $price > 0, 'short_desc' => $sd, 'badge' => $badge,
                'includes' => $inc, 'is_featured' => $i === 0, 'order' => $i,
            ]);
        }

        // ── السيارات ──
        $cars = [
            ['هيونداي إلنترا 2023', 'هيونداي', 'cairo', 1200, null, 'automatic', 5, false, true, '4.7', 64],
            ['تويوتا كورولا 2022', 'تويوتا', 'cairo', 1100, 1300, 'automatic', 5, false, true, '4.6', 52],
            ['مرسيدس E200 + سائق', 'مرسيدس', 'cairo', 3500, null, 'automatic', 4, true, false, '4.9', 38],
            ['كيا سبورتاج 2023', 'كيا', 'sharm', 1600, null, 'automatic', 5, false, true, '4.8', 41],
            ['هيونداي H1 (فان عائلي)', 'هيونداي', 'hurghada', 2200, null, 'manual', 8, true, true, '4.7', 29],
        ];
        foreach ($cars as [$title, $brand, $lslug, $price, $sale, $trans, $seats, $driver, $guar, $score, $rc]) {
            Car::create([
                'location_id' => $loc[$lslug]->id, 'title' => $title, 'brand' => $brand,
                'content' => 'سيارة نضيفة ومكفولة — تسليم في مكانك، وتأمين شامل.',
                'price' => $price, 'sale_price' => $sale, 'transmission' => $trans,
                'seats' => $seats, 'with_driver' => $driver, 'is_guaranteed' => $guar,
                'is_featured' => false, 'review_score' => $score, 'review_count' => $rc,
            ]);
        }

        // ── معلّقون بأسماء متنوّعة ──
        $reviewerData = [
            ['منى عبد الرحمن', 'mona@example.com'],
            ['كريم حسّان', 'karim@example.com'],
            ['سارة الشناوي', 'sara@example.com'],
            ['أحمد فتحي', 'ahmedf@example.com'],
            ['نورهان مصطفى', 'nourhan@example.com'],
            ['محمود عز', 'mahmoud@example.com'],
        ];
        $reviewers = [];
        foreach ($reviewerData as $rIdx => [$rName, $rEmail]) {
            $reviewers[] = User::create([
                'name' => $rName, 'email' => $rEmail,
                'phone' => '0101000'.str_pad((string) $rIdx, 4, '0', STR_PAD_LEFT),
                'role' => 'customer', 'password' => Hash::make('password'),
            ]);
        }

        // ── تقييمات تجريبية على أول رحلتين (بأسماء مختلفة) ──
        $sampleReviews = [
            [5, 'رحلة تحفة', 'كل حاجة كانت متظبطة من الأول للآخر، والسعر زي ما اتفقنا بالظبط. هكرر أكيد.'],
            [4, 'حلوة جداً', 'التنظيم ممتاز والمرشد محترم. النجمة الناقصة بس عشان الأتوبيس اتأخر شوية.'],
            [5, 'مكفولة فعلاً', 'أول مرة أحجز أونلاين وأطمن كده. الدعم رد عليّ على طول.'],
            [5, 'تجربة ممتازة', 'المكان نضيف والموقع قريب من كل حاجة. أنصح بيها بشدة.'],
            [4, 'قيمة كويسة', 'السعر مناسب جداً مقابل الخدمة اللي اخدناها. هجرّب تاني قريب.'],
            [5, 'دعم رائع', 'فريق محفول مكفول تابع معايا خطوة بخطوة لحد ما رجعت. تحفة.'],
        ];
        $rev = 0;
        foreach (Tour::query()->take(2)->get() as $tour) {
            foreach ($sampleReviews as [$rating, $rtitle, $rcontent]) {
                Review::create([
                    'user_id'         => $reviewers[$rev % count($reviewers)]->id,
                    'reviewable_type' => Tour::class,
                    'reviewable_id'   => $tour->id,
                    'rating'          => $rating,
                    'title'           => $rtitle,
                    'content'         => $rcontent,
                    'approved'        => true,
                ]);
                $rev++;
            }
            $tour->refreshReviewScore();
        }

        // ── صفحات المحتوى الثابت ──
        $this->call(PagesSeeder::class);

        // ── Phase E: كتالوج (منيو + ترابيزات + فعاليات) + شرائح عمرية + إحداثيات ──
        $this->call([
            LocationsSeeder::class,   // يحدّث lat/lng للمدن
            AgePricingSeeder::class,  // شرائح رضيع/طفل/بالغ
            CatalogSeeder::class,     // ترابيزات + منيو + فعاليات
        ]);
    }
}
