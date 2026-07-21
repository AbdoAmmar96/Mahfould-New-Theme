<?php

namespace Tests\Feature;

use App\Exceptions\SlotUnavailableException;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\User;
use App\Services\Availability\AvailabilityService;
use App\Services\Availability\HoldService;
use App\Services\BookingNotifier;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityEngineTest extends TestCase
{
    use RefreshDatabase;

    /** فندق + نوع غرفة نشط (§7: الإتاحة والتسعير على مستوى room_type) */
    private function hotel(int $units = 2): Hotel
    {
        $hotel = Hotel::create([
            'title' => 'فندق اختبار', 'price' => 1000, 'units_total' => $units, 'status' => 'publish',
        ]);

        RoomType::create([
            'hotel_id' => $hotel->id, 'title' => 'غرفة قياسية',
            'capacity_per_night' => 2, 'units_total' => $units,
            'price_per_night' => 1000, 'is_active' => true, 'order' => 0,
        ]);

        return $hotel;
    }

    /** §19: الحجز يتطلّب تسجيل دخول */
    private function customer(): User
    {
        return User::create([
            'name' => 'عميل', 'email' => 'c'.uniqid().'@test.local',
            'phone' => '01000000000', 'role' => 'customer', 'password' => bcrypt('secret'),
        ]);
    }

    private function nights(int $count = 2, int $offset = 5): array
    {
        $out = [];
        for ($i = 0; $i < $count; $i++) {
            $out[] = now()->addDays($offset + $i)->toDateString();
        }

        return $out;
    }

    /** الحارس الفيزيائي: صفّان نشطان لنفس (وحدة، تاريخ، فترة، رقم) مستحيل */
    public function test_unique_index_blocks_duplicate_active_row(): void
    {
        $base = ['unit_type' => 'hotel', 'unit_id' => 1, 'unit_index' => 0, 'date' => '2026-09-01', 'slot' => 'STAY', 'state' => 'held', 'created_at' => now(), 'updated_at' => now()];
        BookingItem::insert($base);

        $this->expectException(UniqueConstraintViolationException::class);
        BookingItem::insert($base);
    }

    public function test_released_row_frees_the_slot_for_reinsert(): void
    {
        $base = ['unit_type' => 'hotel', 'unit_id' => 1, 'unit_index' => 0, 'date' => '2026-09-01', 'slot' => 'STAY', 'state' => 'held', 'created_at' => now(), 'updated_at' => now()];
        BookingItem::insert($base);
        BookingItem::query()->update(['released_at' => now()]);

        BookingItem::insert($base); // لا يرمي
        $this->assertSame(1, BookingItem::whereNull('released_at')->count());
    }

    /** استحالة تجاوز المخزون: فندق بغرفتين لا يقبل حجزًا ثالثًا لنفس الليالي */
    public function test_overbooking_is_impossible(): void
    {
        $hotel = $this->hotel(2);
        $holds = app(HoldService::class);
        $dates = $this->nights(2);

        $holds->reserve('hotel', $hotel->id, 2, $dates, 'STAY', 2);

        $this->expectException(SlotUnavailableException::class);
        $holds->reserve('hotel', $hotel->id, 2, $dates, 'STAY', 1);
    }

    /** التخصيص المتتابع يطابق المخزون بالضبط: 3 غرف → 3 حجوزات فقط */
    public function test_sequential_reservations_match_inventory(): void
    {
        $hotel = $this->hotel(3);
        $holds = app(HoldService::class);
        $night = $this->nights(1);

        $ok = 0;
        $fail = 0;
        for ($i = 0; $i < 6; $i++) {
            try {
                $holds->reserve('hotel', $hotel->id, 3, $night, 'STAY', 1);
                $ok++;
            } catch (SlotUnavailableException) {
                $fail++;
            }
        }

        $this->assertSame(3, $ok, 'لازم 3 حجوزات تنجح بالظبط');
        $this->assertSame(3, $fail, 'الباقي لازم يفشل');
        $this->assertSame(3, BookingItem::active()->where('unit_id', $hotel->id)->count());
    }

    public function test_release_frees_inventory(): void
    {
        $hotel = $this->hotel(1);
        $holds = app(HoldService::class);
        $avail = app(AvailabilityService::class);
        $dates = $this->nights(2);

        $res = $holds->reserve('hotel', $hotel->id, 1, $dates, 'STAY', 1);
        $this->assertSame(0, $avail->remainingForRange('hotel', $hotel->id, 'STAY', 1, $dates));

        $holds->release($res['hold_token']);
        $this->assertSame(1, $avail->remainingForRange('hotel', $hotel->id, 'STAY', 1, $dates));
    }

    public function test_convert_marks_items_booked_and_links_booking(): void
    {
        $hotel = $this->hotel(2);
        $holds = app(HoldService::class);
        $dates = $this->nights(2);

        $res = $holds->reserve('hotel', $hotel->id, 2, $dates, 'STAY', 1);
        $booking = Booking::create([
            'bookable_type' => Hotel::class, 'bookable_id' => $hotel->id, 'guests' => 2,
            'customer_name' => 'عميل', 'customer_phone' => '01000000000', 'hold_token' => $res['hold_token'],
        ]);
        $converted = $holds->convert($res['hold_token'], $booking->id);

        $this->assertSame(2, $converted); // ليلتان
        $this->assertSame(2, BookingItem::where('booking_id', $booking->id)->where('state', 'booked')->whereNull('expires_at')->count());
    }

    public function test_release_expired_frees_only_expired_holds(): void
    {
        $hotel = $this->hotel(2);
        $holds = app(HoldService::class);

        // حجز منتهي + حجز حيّ
        $expired = $holds->reserve('hotel', $hotel->id, 2, $this->nights(1, 5), 'STAY', 1);
        BookingItem::where('hold_token', $expired['hold_token'])->update(['expires_at' => now()->subMinute()]);
        $holds->reserve('hotel', $hotel->id, 2, $this->nights(1, 9), 'STAY', 1);

        $freed = $holds->releaseExpired();
        $this->assertSame(1, $freed);
        $this->assertNotNull(BookingItem::where('hold_token', $expired['hold_token'])->first()->released_at);
    }

    /** التكامل عبر HTTP: حجز فندق "دفع عند الوصول" يثبّت المخزون فورًا */
    public function test_on_arrival_hotel_booking_books_inventory_over_http(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs($this->customer());
        $this->mock(BookingNotifier::class, fn ($m) => $m->shouldReceive('confirmed'));

        $hotel = $this->hotel(2);
        $start = now()->addDays(10)->toDateString();

        $res = $this->post('/checkout', [
            'type' => 'hotel', 'id' => $hotel->id, 'start_date' => $start,
            'nights' => 3, 'units' => 1, 'guests' => 2,
            'customer_name' => 'عميل', 'customer_phone' => '01000000000',
            'booking_for' => 'self',
            'payment_method' => 'on_arrival',
        ]);

        $res->assertRedirect();
        $booking = Booking::first();
        $this->assertNotNull($booking);
        $this->assertSame('confirmed', $booking->status);
        $this->assertSame(3 * 1 * (float) $hotel->price, (float) $booking->subtotal); // ليلة×ليالي×غرف
        $this->assertSame(3, $booking->items()->where('state', 'booked')->count());
    }

    /** التكامل عبر HTTP: الحجز فوق السعة يُرفض ولا يُنشئ حجزًا */
    public function test_http_booking_rejected_when_sold_out(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs($this->customer());
        $this->mock(BookingNotifier::class, fn ($m) => $m->shouldReceive('confirmed')->zeroOrMoreTimes());

        $hotel = $this->hotel(1);
        $start = now()->addDays(10)->toDateString();
        $payload = [
            'type' => 'hotel', 'id' => $hotel->id, 'start_date' => $start,
            'nights' => 2, 'units' => 1, 'guests' => 2,
            'customer_name' => 'عميل', 'customer_phone' => '01000000000',
            'booking_for' => 'self',
            'payment_method' => 'on_arrival',
        ];

        $this->post('/checkout', $payload)->assertRedirect();       // الأولى تنجح
        $this->assertSame(1, Booking::count());

        $this->post('/checkout', $payload)->assertSessionHas('error'); // الثانية تُرفض
        $this->assertSame(1, Booking::count(), 'لا يُنشأ حجز ثانٍ عند نفاد السعة');
    }
}
