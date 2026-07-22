<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Services\Booking\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * بند 17 + أساس بند 1 — التسعير مصدره السيرفر وحده.
 * الأرقام هنا مكتوبة بالإيد عن قصد: لو حد غيّر المعادلة الاختبار يقع.
 */
class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private function pricing(): PricingService
    {
        Setting::set('service_fee', '200');
        Setting::set('makfol_discount', '400');
        Setting::set('group_discount_min_guests', '5');
        Setting::set('group_discount_pct', '10');
        Setting::set('commission_rate', '15');

        return app(PricingService::class);
    }

    public function test_no_group_discount_at_four_guests(): void
    {
        // 4 أفراد = «مش أكتر من 4» → مفيش خصم مجموعات
        $q = $this->pricing()->quote(base: 4000, guests: 4, isGuaranteed: false);

        $this->assertSame(0.0, $q['discounts']['group']['amount']);
        $this->assertSame(4200.0, $q['total'], '4000 + 200 رسوم');
    }

    public function test_group_discount_kicks_in_at_five_guests(): void
    {
        $q = $this->pricing()->quote(base: 4000, guests: 5, isGuaranteed: false);

        $this->assertSame(400.0, $q['discounts']['group']['amount'], '10% من 4000');
        $this->assertSame(3800.0, $q['total'], '4000 − 400 + 200');
    }

    /** قرار العميل: الخصومات «يتجمعوا كلهم» */
    public function test_all_discounts_stack(): void
    {
        $q = $this->pricing()->quote(base: 4000, guests: 6, isGuaranteed: true, couponPct: 5);

        $group  = 400.0;                       // 10% × 4000
        $coupon = round((4000 - 400) * 0.05, 2); // 5% على الباقي = 180
        $makfol = 400.0;

        $this->assertSame($group, $q['discounts']['group']['amount']);
        $this->assertSame($coupon, $q['discounts']['coupon']['amount']);
        $this->assertSame($makfol, $q['discounts']['makfol']['amount']);
        $this->assertSame($group + $coupon + $makfol, $q['discount_total']);
        $this->assertSame(4000 - ($group + $coupon + $makfol) + 200, $q['total']);
    }

    public function test_total_never_goes_negative(): void
    {
        $q = $this->pricing()->quote(base: 100, guests: 10, isGuaranteed: true);

        $this->assertGreaterThanOrEqual(0, $q['total']);
    }

    /** الأدمن يغيّر الإعدادات → التسعير يتغيّر من غير أي تعديل كود */
    public function test_settings_drive_the_rule(): void
    {
        $p = $this->pricing();
        Setting::set('group_discount_min_guests', '3');
        Setting::set('group_discount_pct', '7.5');

        $q = $p->quote(base: 1499, guests: 3, isGuaranteed: false);

        $this->assertSame(112.43, $q['discounts']['group']['amount'], '7.5% من 1499 بتقريب قرشين');
    }

    /** الحجز الحقيقي عبر HTTP لازم يسجّل نفس الرقم اللي المعادلة بتقوله */
    public function test_group_discount_lands_in_the_stored_booking(): void
    {
        $this->pricing();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $this->mock(\App\Services\BookingNotifier::class, fn ($m) => $m->shouldReceive('confirmed')->zeroOrMoreTimes());

        $user = \App\Models\User::create([
            'name' => 'عميل', 'email' => 'g@example.com', 'phone' => '01000000000',
            'password' => bcrypt('secret-pass'), 'role' => 'customer', 'is_active' => true,
        ]);
        $tour = \App\Models\Tour::create([
            'title' => 'رحلة', 'price' => 1000, 'status' => 'publish',
            'publish_state' => 'published', 'is_guaranteed' => false,
        ]);

        $this->actingAs($user)->post('/checkout', [
            'type' => 'tour', 'id' => $tour->id,
            'guests' => 5, 'customer_name' => 'عميل', 'customer_phone' => '01000000000',
            'booking_for' => 'self', 'payment_method' => 'on_arrival',
        ])->assertRedirect();

        $b = \App\Models\Booking::firstOrFail();
        // 5 × 1000 = 5000 · خصم 10% = 500 · + رسوم 200
        $this->assertSame('4700.00', (string) $b->total);
        $this->assertSame(500.0, (float) $b->items_snapshot['discounts_breakdown']['group']['amount']);
    }
}
