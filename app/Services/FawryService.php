<?php

namespace App\Services;

use App\Models\Booking;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * تكامل Fawry — Express Checkout (Hosted Checkout).
 * الخطوات:
 *   1) نبني Charge Request بتوقيع SHA-256
 *   2) نبعته لـ Fawry → يرجّع رابط صفحة الدفع (redirect URL)
 *   3) بعد الدفع Fawry يرجّع العميل لـ returnUrl + يبعت Server Callback (v2) موقّع
 *
 * الإعدادات في config/services.php (fawry).
 * توقيع الـ charge: SHA256(merchantCode + merchantRefNum + customerProfileId
 *                  + returnUrl + [itemId + qty + price(2dp)]... + secureKey)
 */
class FawryService implements PaymentGateway
{
    private string $base;
    private string $merchantCode;
    private string $securityKey;

    public function __construct()
    {
        $this->base         = rtrim(config('services.fawry.base_url', 'https://atfawry.fawrystaging.com'), '/');
        $this->merchantCode = (string) config('services.fawry.merchant_code');
        $this->securityKey  = (string) config('services.fawry.security_key');
    }

    public function name(): string
    {
        return 'fawry';
    }

    public function isConfigured(): bool
    {
        return $this->merchantCode !== '' && $this->securityKey !== '';
    }

    public function checkoutUrl(Booking $booking): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Fawry غير مضبوط — راجع مفاتيح .env');
        }

        $refNum    = $booking->code;
        $amount    = number_format((float) $booking->total, 2, '.', '');
        $profileId = (string) ($booking->user_id ?? '');
        $returnUrl = route('payment.fawry.callback');
        $itemId    = 'MK-' . $booking->id;
        $qty       = '1';

        // التوقيع — نفس ترتيب Fawry بالظبط
        $signature = hash('sha256',
            $this->merchantCode . $refNum . $profileId . $returnUrl . $itemId . $qty . $amount . $this->securityKey
        );

        $payload = [
            'merchantCode'   => $this->merchantCode,
            'merchantRefNum' => $refNum,
            'customerName'   => $booking->customer_name,
            'customerMobile' => $booking->customer_phone,
            'customerEmail'  => $booking->customer_email ?: 'guest@mahfolmakfol.com',
            'customerProfileId' => $profileId ?: null,
            'paymentMethod'  => 'PAYATFAWRY', // العميل يختار الطريقة في صفحة Fawry
            'amount'         => $amount,
            'currencyCode'   => 'EGP',
            'language'       => 'ar-eg',
            'chargeItems'    => [[
                'itemId'      => $itemId,
                'description' => mb_substr($booking->bookable?->title ?? 'حجز', 0, 50),
                'price'       => $amount,
                'quantity'    => (int) $qty,
            ]],
            'returnUrl'      => $returnUrl,
            'authCaptureModePayment' => false,
            'signature'      => $signature,
        ];

        $res = Http::asJson()->post($this->base . '/ECommerceWeb/api/payments/charge', array_filter($payload, fn ($v) => $v !== null));

        if (! $res->successful()) {
            throw new RuntimeException('فشل إنشاء طلب Fawry: ' . $res->body());
        }

        // Fawry يرجّع رابط التحويل (نص) أو JSON فيه الرابط
        $body = trim($res->body(), " \"\n\r\t");
        if (str_starts_with($body, 'http')) {
            return $body;
        }

        $url = $res->json('redirectUrl') ?? $res->json('nextAction.redirectUrl');
        if ($url) {
            return $url;
        }

        throw new RuntimeException('Fawry لم يرجّع رابط الدفع: ' . $res->body());
    }

    /**
     * استرجاع Fawry — يحتاج referenceNumber (payment_ref = fawryRefNumber).
     * signature = SHA256(merchantCode + referenceNumber + refundAmount(2dp) + reason + secureKey)
     */
    public function refund(Booking $booking): bool
    {
        if (! $booking->payment_ref) {
            return false;
        }

        $refNumber = $booking->payment_ref;
        $amount    = number_format((float) $booking->total, 2, '.', '');
        $reason    = 'استرجاع حجز ' . $booking->code;

        $signature = hash('sha256', $this->merchantCode . $refNumber . $amount . $reason . $this->securityKey);

        $res = Http::asJson()->post($this->base . '/ECommerceWeb/Fawry/payments/refund', [
            'merchantCode'    => $this->merchantCode,
            'referenceNumber' => $refNumber,
            'refundAmount'    => $amount,
            'reason'          => $reason,
            'signature'       => $signature,
        ]);

        return $res->successful() && ($res->json('statusCode') == 200 || $res->json('type') === 'RefundResponse');
    }

    /**
     * التحقق من توقيع الـ Server Callback (v2).
     * signature = SHA256(fawryRefNumber + merchantRefNum + paymentAmount(2dp)
     *              + orderAmount(2dp) + orderStatus + paymentMethod
     *              + paymentRefrenceNumber(or "") + secureKey)
     */
    public function verifyCallback(array $d): bool
    {
        $concat = ($d['fawryRefNumber'] ?? '')
            . ($d['merchantRefNumber'] ?? $d['merchantRefNum'] ?? '')
            . $this->money($d['paymentAmount'] ?? '')
            . $this->money($d['orderAmount'] ?? '')
            . ($d['orderStatus'] ?? '')
            . ($d['paymentMethod'] ?? '')
            . ($d['paymentReferenceNumber'] ?? $d['paymentRefrenceNumber'] ?? '')
            . $this->securityKey;

        $calc = hash('sha256', $concat);

        return hash_equals($calc, strtolower((string) ($d['messageSignature'] ?? '')));
    }

    private function money($v): string
    {
        return $v === '' || $v === null ? '' : number_format((float) $v, 2, '.', '');
    }
}
