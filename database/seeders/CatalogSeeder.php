<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Restaurant;
use App\Models\RestaurantMenuItem;
use App\Models\RestaurantMenuSection;
use App\Models\RestaurantTable;
use App\Models\Tour;
use App\Models\TourItinerary;
use Illuminate\Database\Seeder;

/**
 * محتوى Phase E لكل الرحلات والمطاعم:
 * - فعاليات (add-ons) + مخطط زمني للرحلات
 * - ترابيزات + منيو للمطاعم
 * - venue_type/رسوم للمطاعم
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedTours();
        $this->seedRestaurants();
    }

    private function seedTours(): void
    {
        // فعاليات نموذجية لكل رحلة
        $addOnsByLocation = [
            'sharm' => [
                ['غطس في الشعاب المرجانية', 350, true],
                ['ركوب الجمال في الصحراء', 200, false],
                ['رحلة سفاري بالجيب', 500, true],
                ['عشا نيلي مع عرض شرقي', 250, false],
            ],
            'hurghada' => [
                ['ركوب الكوادِ في الصحراء', 400, true],
                ['رحلة بحرية بجزيرة الجفتون', 550, true],
                ['غطس مع الدولفين', 700, false],
            ],
            'siwa' => [
                ['حمام السباحة في عين كيلوباترا', 100, true],
                ['نزول تلة الجبل (شبكة)', 250, false],
                ['عشا بيتي في بيت سيوي', 180, true],
            ],
            'luxor-aswan' => [
                ['كروز فيلوكا نيلي', 300, true],
                ['زيارة معبد أبو سمبل', 800, false],
                ['ركوب البالون فوق الأقصر', 1500, false],
            ],
            'dahab' => [
                ['غطس في الـBlue Hole', 400, true],
                ['ركوب اليخت مع غداء', 900, false],
            ],
        ];

        foreach (Tour::with('location')->get() as $tour) {
            $slug = $tour->location?->slug;
            $items = $addOnsByLocation[$slug] ?? [
                ['فعالية إضافية', 250, false],
            ];
            foreach ($items as $i => [$title, $price, $isDefault]) {
                Activity::updateOrCreate(
                    ['tour_id' => $tour->id, 'title' => $title],
                    ['price' => $price, 'is_default' => $isDefault, 'is_active' => true, 'order' => $i],
                );
            }

            // مخطط زمني يوم بيوم (يتحوّل من الـJSON القديم إلى الجدول)
            if ($tour->itineraries()->count() === 0 && is_array($tour->itinerary)) {
                foreach ($tour->itinerary as $i => $day) {
                    TourItinerary::create([
                        'tour_id' => $tour->id,
                        'day_number' => $i + 1,
                        'title' => $day['title'] ?? "اليوم " . ($i + 1),
                        'description' => $day['desc'] ?? null,
                        'highlights' => [],
                    ]);
                }
            }
        }
    }

    private function seedRestaurants(): void
    {
        $areas = ['داخلي', 'خارجي', 'حديقة', 'VIP'];

        // بيانات لكل مطعم: [تحديث الحقول, أقسام + عناصر]
        $data = [
            'أبو السيد' => [
                'update' => ['venue_type' => 'restaurant', 'service_fee_pct' => 12, 'tax_pct' => 14, 'slot_minutes' => 90],
                'menu' => [
                    'مقبلات' => [
                        ['حمص بطحينة', 45, ['نباتي'], false],
                        ['بابا غنوج', 50, ['نباتي', 'مشوي'], false],
                        ['فتوش', 55, ['نباتي', 'سلطة'], false],
                    ],
                    'مأكولات مصرية' => [
                        ['ملوخية بالفراخ', 180, ['بيتي', 'مصري'], true],
                        ['محشي ورق عنب', 120, ['مصري'], false],
                        ['فراخ مشوية', 220, ['مشوي'], true],
                        ['كباب ريش', 280, ['مشوي', 'حار'], true],
                    ],
                    'حلويات' => [
                        ['أم علي', 65, ['حلا شرقي'], true],
                        ['كنافة بالمكسرات', 70, ['حلا'], false],
                    ],
                ],
            ],
            'Zooba' => [
                'update' => ['venue_type' => 'restaurant', 'service_fee_pct' => 10, 'tax_pct' => 14, 'slot_minutes' => 60],
                'menu' => [
                    'ستريت فود' => [
                        ['كشري كلاسيك', 55, ['نباتي', 'مصري'], true],
                        ['طعمية Zooba', 45, ['نباتي', 'مصري'], true],
                        ['فول بالطحينة', 40, ['نباتي', 'إفطار'], false],
                    ],
                    'ساندوتشات' => [
                        ['ساندوتش شاورما', 85, ['مشوي'], false],
                        ['ساندوتش حواوشي', 75, ['حار'], false],
                    ],
                ],
            ],
            'Sachi' => [
                'update' => ['venue_type' => 'restaurant', 'service_fee_pct' => 12, 'tax_pct' => 14, 'slot_minutes' => 120, 'service_fee_inclusive' => false, 'tax_inclusive' => false],
                'menu' => [
                    'سوشي' => [
                        ['California Roll', 280, ['نيء'], true],
                        ['Rainbow Roll', 350, ['نيء', 'مميز'], true],
                        ['Sashimi Salmon', 420, ['نيء'], false],
                    ],
                    'مقبلات آسيوية' => [
                        ['Edamame', 90, ['نباتي'], false],
                        ['Miso Soup', 110, ['نباتي'], false],
                    ],
                ],
            ],
            'كافيه جروبي' => [
                'update' => ['venue_type' => 'cafe', 'service_fee_pct' => 8, 'tax_pct' => 14, 'slot_minutes' => 60],
                'menu' => [
                    'قهوة ومشروبات' => [
                        ['قهوة تركي', 30, ['قهوة'], false],
                        ['كابتشينو', 55, ['قهوة'], true],
                        ['هوت شوكولاته', 60, ['شوكولاته'], false],
                    ],
                    'حلويات' => [
                        ['بسبوسة', 45, ['شرقي'], true],
                        ['تشيز كيك', 90, ['غربي'], true],
                        ['بقلاوة', 50, ['شرقي'], false],
                    ],
                ],
            ],
        ];

        foreach (Restaurant::all() as $rest) {
            $info = $data[$rest->title] ?? null;
            if (!$info) continue;

            $rest->update($info['update']);

            // ترابيزات (4 لكل مطعم بأنواع مختلفة)
            if ($rest->tables()->count() === 0) {
                foreach ([
                    ['T1', 'عائلية 6', 6, 'داخلي'],
                    ['T2', 'ثنائي', 2, 'داخلي'],
                    ['T3', 'رباعية', 4, 'خارجي'],
                    ['VIP1', 'صالة VIP', 8, 'VIP'],
                ] as $i => [$code, $label, $cap, $area]) {
                    RestaurantTable::create([
                        'restaurant_id' => $rest->id, 'code' => $code, 'label' => $label,
                        'capacity' => $cap, 'area' => $area, 'is_active' => true, 'order' => $i,
                    ]);
                }
            }

            // المنيو
            if ($rest->menuSections()->count() === 0) {
                foreach ($info['menu'] as $secOrder => [$sectionTitle, $sectionItems]) {
                    // ملحوظة: array_keys بيرجّع الـstring keys, نعمل loop عادي
                }
                $secOrder = 0;
                foreach ($info['menu'] as $sectionTitle => $items) {
                    $section = RestaurantMenuSection::create([
                        'restaurant_id' => $rest->id,
                        'title' => $sectionTitle,
                        'order' => $secOrder++,
                    ]);
                    foreach ($items as $itemOrder => [$title, $price, $tags, $isSignature]) {
                        RestaurantMenuItem::create([
                            'restaurant_id' => $rest->id,
                            'section_id' => $section->id,
                            'title' => $title,
                            'price' => $price,
                            'tags' => $tags,
                            'is_signature' => $isSignature,
                            'is_available' => true,
                            'order' => $itemOrder,
                        ]);
                    }
                }
            }
        }
    }
}
