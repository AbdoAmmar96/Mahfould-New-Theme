<?php

namespace App\Services\Booking;

/**
 * مصفوفة توقيت الدفع — V2-BLUEPRINT §5.
 *
 * الأصل حسب نوع الخدمة، مع قاعدة أمان: الحجز لطرف آخر → prepaid كامل إلزامي.
 *
 * القيم الممكنة:
 *   on_arrival = يُدفع عند الوصول (الفنادق أساسًا، الرحلة كذلك)
 *   on_use     = يُدفع عند الاستخدام (باص/عربية/مطعم/توصيل)
 *   prepaid    = دفع كامل مسبق (صاحب السعادة، أو أي حجز لطرف آخر)
 */
class PaymentTimingService
{
    public const ON_ARRIVAL = 'on_arrival';
    public const ON_USE     = 'on_use';
    public const PREPAID    = 'prepaid';

    /**
     * يحسم توقيت الدفع النهائي للحجز.
     *
     * @param  string  $type  نوع الخدمة (tour/hotel/restaurant/car/sahb/bus)
     * @param  string  $bookingFor  self | other
     * @param  bool    $clientPrepaidChoice  العميل اختار يدفع مسبقاً (اختياري في الحالات المسموحة)
     */
    public function resolve(string $type, string $bookingFor, bool $clientPrepaidChoice = false): string
    {
        // §5: أي حجز لطرف آخر → prepaid إلزامي (يتجاوز كل ما سبق)
        if ($bookingFor === 'other') {
            return self::PREPAID;
        }

        // §5: صاحب السعادة → مقدّم عند الحجز
        if ($type === 'sahb') {
            return self::PREPAID;
        }

        // العميل قرر يدفع مسبقاً في مسار مسموح فيه → prepaid
        if ($clientPrepaidChoice) {
            return self::PREPAID;
        }

        // الأصل حسب نوع الخدمة
        return match ($type) {
            'hotel', 'tour'                        => self::ON_ARRIVAL,
            'bus', 'car', 'restaurant', 'delivery' => self::ON_USE,
            default                                 => self::ON_USE,
        };
    }

    /** هل الدفع المسبق إلزامي (بلا خيار عند الوصول/الاستخدام)؟ */
    public function requiresPrepay(string $type, string $bookingFor): bool
    {
        return $bookingFor === 'other' || $type === 'sahb';
    }

    /** يترجم القيمة إلى عبارة عربية للعرض في الواجهة */
    public function label(string $timing): string
    {
        return match ($timing) {
            self::ON_ARRIVAL => 'الدفع عند الوصول',
            self::ON_USE     => 'الدفع عند الاستخدام',
            self::PREPAID    => 'الدفع الكامل مسبقاً',
            default          => $timing,
        };
    }

    /**
     * هل payment_method اللي اختاره العميل متوافق مع payment_timing المحسوم؟
     * prepaid → لازم card/wallet
     * on_arrival/on_use → مسموح card/wallet لو حابب يدفع مسبقاً، أو on_arrival
     */
    public function isMethodCompatible(string $timing, string $method): bool
    {
        if ($timing === self::PREPAID) {
            return in_array($method, ['card', 'wallet'], true);
        }
        return in_array($method, ['card', 'wallet', 'on_arrival'], true);
    }
}
