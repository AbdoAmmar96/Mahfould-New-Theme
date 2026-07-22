<?php

namespace App\Services;

use App\Mail\BookingConfirmedMail;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * ينسّق إشعارات تأكيد الحجز — إيميل + واتساب.
 * كله ملفوف في try/catch عشان أي فشل في الإشعار ميأثرش على الحجز نفسه.
 */
class BookingNotifier
{
    public function __construct(
        private WhatsAppService $whatsapp,
        private WebPushService $webpush,
    ) {}

    public function confirmed(Booking $booking): void
    {
        $booking->loadMissing('bookable');

        // إيميل
        if ($booking->customer_email) {
            try {
                Mail::to($booking->customer_email)->send(new BookingConfirmedMail($booking));
            } catch (\Throwable $e) {
                report($e);
                Log::warning('فشل إرسال إيميل التأكيد', ['booking' => $booking->code]);
            }
        }

        // واتساب
        $this->whatsapp->sendBookingConfirmation($booking);

        // إشعار المتصفح (بيتجاهل نفسه لو مفاتيح VAPID مش مضبوطة)
        $this->webpush->bookingConfirmed($booking);
    }
}
