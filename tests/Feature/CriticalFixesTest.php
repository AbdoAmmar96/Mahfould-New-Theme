<?php

namespace Tests\Feature;

use App\Exceptions\SlotUnavailableException;
use App\Models\Car;
use App\Models\Company;
use App\Models\User;
use App\Services\Availability\HoldService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * يقفل الإصلاحات الحرجة عشان متتكسرش تاني.
 */
class CriticalFixesTest extends TestCase
{
    use RefreshDatabase;

    // ── 1) الصفحتان المفقودتان (كانتا بيضربوا 500) ──

    public function test_previously_missing_pages_exist(): void
    {
        foreach ([
            'resources/js/Pages/Buses/Route.jsx',
            'resources/js/Pages/Vendor/Earnings/NoCompany.jsx',
        ] as $page) {
            $this->assertFileExists(base_path($page), "الصفحة {$page} مفقودة — الكونترولر بيعمل لها render");
        }
    }

    // ── 2) migration ->after() على عمود غير موجود (بتفشّل MySQL) ──

    public function test_transport_migration_does_not_reference_missing_column(): void
    {
        $src = file_get_contents(base_path('database/migrations/2026_07_20_000170_create_transport_and_entry_passes.php'));

        $this->assertStringNotContainsString("after('slot')", $src, "bookings مالوش عمود slot — MySQL هيرمي خطأ");
        $this->assertFalse(
            in_array('slot', Schema::getColumnListing('bookings'), true),
            'لو اتضاف عمود slot فعلاً، راجع الـmigration',
        );
    }

    // ── 3) throttle على دخول الأدمن/الشريك ──

    public function test_admin_and_vendor_login_are_rate_limited(): void
    {
        foreach (['admin/login', 'vendor/login'] as $uri) {
            $route = collect(app('router')->getRoutes())->first(
                fn ($r) => $r->uri() === $uri && in_array('POST', $r->methods(), true),
            );

            $this->assertNotNull($route, "مسار POST {$uri} مش موجود");
            $this->assertContains('throttle:login', $route->gatherMiddleware(), "POST {$uri} من غير throttle — brute-force مفتوح");
        }
    }

    // ── 4) الحجز المزدوج للعربيات ──

    public function test_car_is_wired_into_availability_engine(): void
    {
        $car = Car::create(['title' => 'عربية اختبار', 'price' => 500, 'units_total' => 1, 'status' => 'publish']);

        $this->assertSame('car', $car->availabilityType());
        $this->assertSame('DAY', $car->defaultSlot());
        $this->assertSame(1, $car->inventoryCount());
    }

    public function test_car_cannot_be_double_booked(): void
    {
        $car = Car::create(['title' => 'عربية وحيدة', 'price' => 500, 'units_total' => 1, 'status' => 'publish']);
        $holds = app(HoldService::class);
        $days = [now()->addDays(3)->toDateString(), now()->addDays(4)->toDateString()];

        $holds->reserve('car', $car->id, $car->inventoryCount(), $days, 'DAY', 1);

        $this->expectException(SlotUnavailableException::class);
        $holds->reserve('car', $car->id, $car->inventoryCount(), $days, 'DAY', 1);
    }

    public function test_car_fleet_respects_its_size(): void
    {
        $car = Car::create(['title' => 'أسطول 2', 'price' => 500, 'units_total' => 2, 'status' => 'publish']);
        $holds = app(HoldService::class);
        $day = [now()->addDays(5)->toDateString()];

        $ok = 0;
        for ($i = 0; $i < 4; $i++) {
            try { $holds->reserve('car', $car->id, 2, $day, 'DAY', 1); $ok++; } catch (SlotUnavailableException) {}
        }

        $this->assertSame(2, $ok, 'لازم عربيتين بالظبط ينفع يتحجزوا');
    }

    // ── 5) دورة موافقة المزوّدين ──

    public function test_vendor_save_forces_pending_review_and_sets_provider(): void
    {
        $vendor = User::create([
            'name' => 'مزوّد', 'email' => 'v@test.local', 'phone' => '01000000001',
            'role' => 'vendor', 'password' => bcrypt('secret'),
        ]);
        $company = Company::create(['user_id' => $vendor->id, 'name' => 'شركة اختبار']);

        $this->actingAs($vendor);

        $ctrl = new class {
            use \App\Http\Controllers\Vendor\VendorScoped;
            public function run(array $d) { return $this->beforeSave($d, request(), null); }
        };

        $out = $ctrl->run(['title' => 'رحلة', 'price' => 100]);

        $this->assertSame('pending_review', $out['publish_state'], 'خدمة المزوّد لازم تروح للمراجعة مش تتنشر فورًا');
        $this->assertSame($company->id, $out['provider_id'], 'provider_id لازم يتربط بشركة المزوّد');
        $this->assertNotNull($out['submitted_at']);
        $this->assertNull($out['reviewed_at']);
    }

    public function test_admin_save_publishes_directly(): void
    {
        $admin = User::create([
            'name' => 'أدمن', 'email' => 'a@test.local', 'phone' => '01000000002',
            'role' => 'admin', 'password' => bcrypt('secret'),
        ]);
        $this->actingAs($admin);

        $ctrl = new class {
            use \App\Http\Controllers\Vendor\VendorScoped;
            public function run(array $d) { return $this->beforeSave($d, request(), null); }
        };

        $out = $ctrl->run(['title' => 'رحلة أدمن', 'price' => 100]);

        $this->assertArrayNotHasKey('publish_state', $out, 'الأدمن مايتفرضش عليه pending_review');
    }
}
