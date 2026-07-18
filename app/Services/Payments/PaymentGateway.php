<?php

namespace App\Services\Payments;

use App\Models\Booking;

/**
 * واجهة موحّدة لأي بوابة دفع (Paymob / Fawry / ...).
 */
interface PaymentGateway
{
    /** اسم البوابة (paymob / fawry) */
    public function name(): string;

    /** هل البوابة مضبوطة بالمفاتيح؟ */
    public function isConfigured(): bool;

    /** ينشئ عملية دفع ويرجّع رابط صفحة الدفع لتحويل العميل */
    public function checkoutUrl(Booking $booking): string;

    /** استرجاع مبلغ الحجز — يرجّع true لو نجح */
    public function refund(Booking $booking): bool;
}
