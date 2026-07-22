<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\Tour;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * يقفل الثغرات الأمنية اللي اتصلحت بعد أول نشر على mahfool.com.
 * كل اختبار هنا كان بيفشل قبل الإصلاح.
 */
class SecurityFixesTest extends TestCase
{
    use RefreshDatabase;

    private function customer(string $email = 'c@example.com'): User
    {
        return User::create([
            'name' => 'عميل', 'email' => $email, 'phone' => '01000000000',
            'password' => bcrypt('secret-pass'), 'role' => 'customer', 'is_active' => true,
        ]);
    }

    private function bookingFor(User $u): Booking
    {
        $hotel = Hotel::create(['title' => 'فندق', 'price' => 1000, 'units_total' => 2, 'status' => 'publish']);

        return Booking::create([
            'user_id' => $u->id, 'bookable_type' => Hotel::class, 'bookable_id' => $hotel->id,
            'customer_name' => 'عميل', 'customer_phone' => '01000000000',
            'guests' => 2, 'total' => 1200, 'status' => 'pending', 'payment_status' => 'unpaid',
        ]);
    }

    /** كولباك Fawry كان بيخلّي أي حجز «مدفوع» بـGET مزوّر */
    public function test_fawry_redirect_callback_cannot_mark_a_booking_paid(): void
    {
        $booking = $this->bookingFor($this->customer());

        $this->get('/payment/fawry/callback?merchantRefNumber='.$booking->code.'&orderStatus=PAID')
            ->assertRedirect();

        $this->assertSame('unpaid', $booking->fresh()->payment_status,
            'الكولباك المزوّر لازم ما يغيّرش حالة الدفع');
    }

    /** كولباك Paymob كمان — merchant_order_id مش ضمن الحقول الموقّعة */
    public function test_paymob_redirect_callback_cannot_mark_a_booking_paid(): void
    {
        $booking = $this->bookingFor($this->customer());

        $this->get('/payment/callback?merchant_order_id='.$booking->code.'&success=true&hmac=x')
            ->assertRedirect();

        $this->assertSame('unpaid', $booking->fresh()->payment_status);
    }

    /** صفحة التأكيد كانت مفتوحة للكل — والكود قابل للتخمين */
    public function test_confirmation_page_requires_login(): void
    {
        $booking = $this->bookingFor($this->customer());
        $this->get('/booking/'.$booking->code)->assertRedirect('/login');
    }

    /** ومقفولة على صاحبها */
    public function test_confirmation_page_blocks_other_customers(): void
    {
        $booking = $this->bookingFor($this->customer('owner@example.com'));

        $this->actingAs($this->customer('intruder@example.com'))
            ->get('/booking/'.$booking->code)
            ->assertForbidden();
    }

    /** كود الحجز مش قابل للتعداد */
    public function test_booking_code_is_not_enumerable(): void
    {
        $code = $this->bookingFor($this->customer())->code;

        $this->assertMatchesRegularExpression('/^MM-\d{4}-[A-Z2-9]{8}$/', $code,
            'الكود لازم يكون 8 خانات حروف+أرقام مش 6 أرقام');
    }

    /** خدمة تحت المراجعة مش قابلة للحجز بالـID */
    public function test_unpublished_service_cannot_be_booked(): void
    {
        $tour = Tour::create([
            'title' => 'رحلة تحت المراجعة', 'price' => 1000,
            'status' => 'publish', 'publish_state' => 'pending_review',
        ]);

        $this->actingAs($this->customer())
            ->get('/checkout/tour/'.$tour->id)
            ->assertNotFound();
    }
}
