<?php

namespace App\Console\Commands;

use App\Http\Controllers\BookingController;
use App\Http\Controllers\DeliveryController;
use App\Models\Booking;
use App\Models\Company;
use App\Models\DeliveryOrder;
use App\Models\DeliveryService;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Tour;
use App\Services\Availability\HoldService;
use App\Services\Booking\AgePricingService;
use App\Services\Booking\CancellationPolicyService;
use App\Services\Booking\EntryPassService;
use App\Services\Booking\PaymentTimingService;
use App\Services\BookingNotifier;
use App\Services\PersonalizationService;
use App\Services\Payments\PaymentManager;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

/**
 * E2E smoke test — يشغّل مسارات الحجز الأساسية ويتأكد إن كله متصل.
 * الاستخدام: php artisan test:e2e
 * الإنتاج: قبل كل deploy، والـCI ينفّذه.
 */
class SmokeTestE2E extends Command
{
    protected $signature = 'test:e2e {--stop-on-fail : Exit on first failure}';
    protected $description = 'E2E smoke tests for booking flows (hotel/tour/restaurant/delivery/QR)';

    private array $failures = [];
    private array $successes = [];

    public function handle(): int
    {
        $this->info('🚀 محفول مكفول — E2E Smoke Test');
        $this->newLine();

        $this->assert('Database seeded (Restaurant exists)', fn () => Restaurant::exists());
        $this->assert('Database seeded (Hotel exists)', fn () => Hotel::exists());
        $this->assert('Database seeded (Tour exists)', fn () => Tour::exists());

        // 1. حجز فندق
        $this->test('Hotel booking with own_car + QR pass', fn () => $this->testHotelBookingWithQr());

        // 2. حجز رحلة مع add-ons
        $this->test('Tour booking with add-on activities', fn () => $this->testTourWithAddOns());

        // 3. حجز ترابيزة
        $this->test('Restaurant table booking with slot', fn () => $this->testRestaurantTableBooking());

        // 4. طلب توصيل
        $this->test('Delivery order with distance-based fare', fn () => $this->testDeliveryOrder());

        // 5. حدود المخزون
        $this->test('Availability engine prevents overbooking', fn () => $this->testAvailabilityLimits());

        // 6. Rate limiting active
        $this->test('Rate limiter registered for booking route', fn () => $this->testRateLimiterRegistered());

        // Summary
        $this->newLine();
        $this->line(str_repeat('─', 60));
        $total = count($this->successes) + count($this->failures);
        $this->line("Passed: <fg=green>{$this->count($this->successes)}</>  ·  Failed: <fg=red>{$this->count($this->failures)}</>  ·  Total: {$total}");

        if ($this->failures) {
            $this->newLine();
            $this->error('Failures:');
            foreach ($this->failures as $f) $this->line("  ✗ {$f}");
            return self::FAILURE;
        }

        $this->newLine();
        $this->info('✅ كل الاختبارات نجحت — النظام جاهز.');
        return self::SUCCESS;
    }

    private function assert(string $name, callable $test): void
    {
        try {
            $result = $test();
            if ($result) {
                $this->line("  <fg=green>✓</> {$name}");
                $this->successes[] = $name;
            } else {
                $this->line("  <fg=red>✗</> {$name}");
                $this->failures[] = $name;
                if ($this->option('stop-on-fail')) exit(1);
            }
        } catch (\Throwable $e) {
            $this->line("  <fg=red>✗</> {$name} — {$e->getMessage()}");
            $this->failures[] = "{$name}: {$e->getMessage()}";
            if ($this->option('stop-on-fail')) exit(1);
        }
    }

    private function test(string $name, callable $test): void
    {
        $this->newLine();
        $this->line("<fg=cyan>▸</> {$name}");
        try {
            $test();
            $this->successes[] = $name;
        } catch (\Throwable $e) {
            $this->line("    <fg=red>✗ Failed:</> {$e->getMessage()}");
            $this->failures[] = "{$name}: {$e->getMessage()}";
            if ($this->option('stop-on-fail')) exit(1);
        }
    }

    private function testHotelBookingWithQr(): void
    {
        $hotel = Hotel::with('activeRoomTypes')->first();
        $roomType = $hotel->activeRoomTypes->first();

        $before = Booking::count();
        $req = Request::create('/checkout', 'POST', [
            'type' => 'hotel', 'id' => $hotel->id, 'room_type_id' => $roomType?->id,
            'start_date' => now()->addDays(15)->toDateString(),
            'nights' => 2, 'units' => 1, 'guests' => 2,
            'customer_name' => 'E2E Test User', 'customer_phone' => '01000000001',
            'booking_for' => 'self', 'transport_mode' => 'own_car',
            'payment_method' => 'on_arrival',
        ]);
        $req->setLaravelSession(app('session.store'));

        $this->invokeBookingStore($req);

        if (Booking::count() <= $before) {
            $err = app('session.store')->get('error');
            throw new \RuntimeException('Hotel booking failed: ' . ($err ?: 'no booking created'));
        }
        $booking = Booking::latest('id')->first();
        $this->line("    ✓ Booking {$booking->code} created (status={$booking->status})");

        // تحقق من QR pass
        $pass = $booking->entryPasses()->first();
        if (!$pass) throw new \RuntimeException('No QR entry_pass issued despite own_car transport');
        $this->line("    ✓ QR pass issued: {$pass->code}");

        // تحقق من verify
        $verified = app(EntryPassService::class)->verify($pass->code);
        if (!$verified) throw new \RuntimeException('QR verify failed on freshly issued pass');
        $this->line("    ✓ QR verify OK");
    }

    private function testTourWithAddOns(): void
    {
        $tour = Tour::has('activeActivities')->first();
        if (!$tour) {
            $tour = Tour::first();
            if (!$tour->activeActivities()->count()) throw new \RuntimeException('No tour with activities — run CatalogSeeder');
        }
        $addOnIds = $tour->activeActivities()->take(2)->pluck('id')->all();

        $before = Booking::count();
        $req = Request::create('/checkout', 'POST', [
            'type' => 'tour', 'id' => $tour->id,
            'start_date' => now()->addDays(20)->toDateString(),
            'guests' => 2, 'activity_ids' => $addOnIds,
            'customer_name' => 'E2E Tour', 'customer_phone' => '01000000002',
            'booking_for' => 'self', 'payment_method' => 'on_arrival',
        ]);
        $req->setLaravelSession(app('session.store'));

        $this->invokeBookingStore($req);
        if (Booking::count() <= $before) {
            throw new \RuntimeException('Tour booking failed: ' . (app('session.store')->get('error') ?: 'unknown'));
        }
        $booking = Booking::latest('id')->first();
        $addons = $booking->addons_snapshot ?? [];
        if (count($addons) !== count($addOnIds)) {
            throw new \RuntimeException("Add-ons mismatch: expected " . count($addOnIds) . ", got " . count($addons));
        }
        $this->line("    ✓ Booking {$booking->code}: " . count($addons) . " add-ons captured (subtotal={$booking->subtotal})");
    }

    private function testRestaurantTableBooking(): void
    {
        $rest = Restaurant::has('activeTables')->first();
        if (!$rest) throw new \RuntimeException('No restaurant with tables — run CatalogSeeder');
        $table = $rest->activeTables()->where('capacity', '>=', 2)->first();

        // تاريخ + وقت فريدين — يمنع collisions عبر إعادة تشغيل الـtest
        $uniqueDate = now()->addDays(random_int(60, 120))->toDateString();
        $slots = ['12:00', '13:30', '15:00', '17:00', '18:30', '20:00', '21:30'];
        $uniqueSlot = $slots[random_int(0, count($slots) - 1)];

        $before = Booking::count();
        $req = Request::create('/checkout', 'POST', [
            'type' => 'restaurant', 'id' => $rest->id,
            'restaurant_table_id' => $table->id,
            'start_date' => $uniqueDate,
            'start_time' => $uniqueSlot, 'guests' => 2,
            'customer_name' => 'E2E Rest', 'customer_phone' => '01000000003',
            'booking_for' => 'self', 'payment_method' => 'on_arrival',
        ]);
        $req->setLaravelSession(app('session.store'));

        $this->invokeBookingStore($req);
        if (Booking::count() <= $before) {
            throw new \RuntimeException('Restaurant booking failed: ' . (app('session.store')->get('error') ?: 'unknown'));
        }
        $booking = Booking::latest('id')->first();
        if ($booking->restaurant_table_id !== $table->id) {
            throw new \RuntimeException('Table not linked to booking');
        }
        $this->line("    ✓ Booking {$booking->code}: table {$table->code} @ {$booking->start_time}");
    }

    private function testDeliveryOrder(): void
    {
        $svc = DeliveryService::first();
        if (!$svc) {
            // seed خدمة توصيل تجريبية
            $company = Company::first();
            if (!$company) throw new \RuntimeException('No provider — cannot seed delivery service');
            $svc = DeliveryService::create([
                'provider_id' => $company->id, 'title' => 'E2E Test Motorbike',
                'base_fare' => 15, 'price_per_km' => 5, 'min_fare' => 25,
                'service_radius_km' => 30, 'vehicle_type' => 'motorbike',
                'base_lat' => 30.05, 'base_lng' => 31.25,
                'publish_state' => 'published', 'is_active' => true,
            ]);
        }

        $ps = app(PersonalizationService::class);
        $km = $ps->haversineKm(30.05, 31.25, 30.08, 31.28);

        $before = DeliveryOrder::count();
        $order = DeliveryOrder::create([
            'delivery_service_id' => $svc->id, 'user_id' => null,
            'pickup_address' => 'A', 'pickup_lat' => 30.05, 'pickup_lng' => 31.25,
            'dropoff_address' => 'B', 'dropoff_lat' => 30.08, 'dropoff_lng' => 31.28,
            'distance_km' => round($km, 2),
            'estimated_fare' => round($svc->estimateFare($km), 2),
            'status' => 'pending',
        ]);
        if (DeliveryOrder::count() <= $before) throw new \RuntimeException('Delivery order not created');
        $this->line("    ✓ Order {$order->code}: {$order->distance_km} km · {$order->estimated_fare} ج.م");
    }

    private function testAvailabilityLimits(): void
    {
        $hotel = Hotel::with('activeRoomTypes')->first();
        $rt = $hotel->activeRoomTypes->first();
        $units = $rt->units_total;

        // نحاول نحجز units+1 غرفة في نفس اليوم — لازم يفشل الأخير
        $date = now()->addDays(50)->toDateString();
        $holds = app(HoldService::class);
        $tokens = [];
        for ($i = 0; $i < $units; $i++) {
            $res = $holds->reserve($rt->availabilityType(), $rt->id, $units, [$date], 'STAY', 1, 5);
            $tokens[] = $res['hold_token'];
        }

        // الحجز الإضافي لازم يفشل
        try {
            $holds->reserve($rt->availabilityType(), $rt->id, $units, [$date], 'STAY', 1, 5);
            throw new \RuntimeException("BUG: Availability engine allowed overbooking! ({$units}+1 rooms accepted)");
        } catch (\App\Exceptions\SlotUnavailableException $e) {
            $this->line("    ✓ Overbooking prevented after {$units} bookings (SlotUnavailableException raised)");
        }

        // ننضف — release الـholds
        foreach ($tokens as $t) $holds->release($t);
    }

    private function testRateLimiterRegistered(): void
    {
        $limiters = ['booking', 'login', 'register', 'password', 'provider-register', 'api', 'actions', 'support'];
        foreach ($limiters as $name) {
            $limit = \Illuminate\Support\Facades\RateLimiter::limiter($name);
            if (!$limit) throw new \RuntimeException("Rate limiter '{$name}' not registered");
        }
        $this->line("    ✓ All " . count($limiters) . " rate limiters registered");
    }

    private function invokeBookingStore(Request $req): void
    {
        app(BookingController::class)->store(
            $req,
            app(PaymentManager::class),
            app(BookingNotifier::class),
            app(HoldService::class),
            app(AgePricingService::class),
            app(PaymentTimingService::class),
            app(CancellationPolicyService::class),
            app(EntryPassService::class),
        );
    }

    private function count(array $arr): string
    {
        return (string) count($arr);
    }
}
