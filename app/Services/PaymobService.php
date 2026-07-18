<?php

namespace App\Services;

use App\Models\Booking;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * تكامل Paymob — Intention API (v1) + Unified Checkout.
 * الخطوات:
 *   1) ننشئ intention من الباك إند بالـ secret key → نستلم client_secret
 *   2) نحوّل العميل لصفحة Unified Checkout بالـ public key + client_secret
 *   3) Paymob يرجّع callback (redirect + webhook) — نتحقق بالـ HMAC
 *
 * الإعدادات في config/services.php (paymob).
 */
class PaymobService implements PaymentGateway
{
    private string $base;
    private string $secretKey;
    private string $publicKey;
    private string $hmacSecret;
    private array $integrationIds;

    public function __construct()
    {
        $this->base           = rtrim(config('services.paymob.base_url', 'https://accept.paymob.com'), '/');
        $this->secretKey      = (string) config('services.paymob.secret_key');
        $this->publicKey      = (string) config('services.paymob.public_key');
        $this->hmacSecret     = (string) config('services.paymob.hmac_secret');
        $this->integrationIds = array_filter(array_map('trim', explode(',', (string) config('services.paymob.integration_ids'))));
    }

    public function name(): string
    {
        return 'paymob';
    }

    public function isConfigured(): bool
    {
        return $this->secretKey !== '' && $this->publicKey !== '' && ! empty($this->integrationIds);
    }

    /**
     * ينشئ intention ويرجّع رابط صفحة الدفع (Unified Checkout).
     */
    public function checkoutUrl(Booking $booking): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Paymob غير مضبوط — راجع مفاتيح .env');
        }

        [$first, $last] = $this->splitName($booking->customer_name);

        $payload = [
            // المبلغ بالقرش (أصغر وحدة) — نضرب × 100
            'amount'          => (int) round($booking->total * 100),
            'currency'        => 'EGP',
            'payment_methods' => array_map('intval', $this->integrationIds),
            'special_reference' => $booking->code, // مرجعنا الداخلي — يرجع في الـ callback
            'items' => [[
                'name'     => mb_substr($booking->bookable?->title ?? 'حجز', 0, 50),
                'amount'   => (int) round($booking->total * 100),
                'quantity' => 1,
            ]],
            'billing_data' => [
                'first_name'   => $first,
                'last_name'    => $last,
                'phone_number' => $booking->customer_phone,
                'email'        => $booking->customer_email ?: 'guest@mahfolmakfol.com',
                'country'      => 'EG',
                'city'         => 'Cairo',
                'street'       => 'NA',
                'building'     => 'NA',
                'floor'        => 'NA',
                'apartment'    => 'NA',
            ],
            'extras' => ['booking_id' => $booking->id],
            'notification_url' => route('payment.webhook'),
            'redirection_url'  => route('payment.callback'),
        ];

        $res = Http::withHeaders([
            'Authorization' => 'Token ' . $this->secretKey,
            'Content-Type'  => 'application/json',
        ])->post($this->base . '/v1/intention/', $payload);

        if (! $res->successful()) {
            throw new RuntimeException('فشل إنشاء طلب الدفع: ' . $res->body());
        }

        $clientSecret = $res->json('client_secret');
        if (! $clientSecret) {
            throw new RuntimeException('Paymob لم يرجّع client_secret');
        }

        return $this->base . '/unifiedcheckout/?publicKey=' . urlencode($this->publicKey)
            . '&clientSecret=' . urlencode($clientSecret);
    }

    /**
     * استرجاع — يحتاج api_key (auth token) + transaction_id (payment_ref).
     */
    public function refund(Booking $booking): bool
    {
        $apiKey = (string) config('services.paymob.api_key');
        if ($apiKey === '' || ! $booking->payment_ref) {
            return false;
        }

        // 1) auth token من الـ api_key
        $auth = Http::acceptJson()->post($this->base . '/api/auth/tokens', ['api_key' => $apiKey]);
        if (! $auth->successful() || ! $auth->json('token')) {
            return false;
        }

        // 2) طلب الاسترجاع
        $res = Http::withToken($auth->json('token'))
            ->post($this->base . '/api/acceptance/void_refund/refund', [
                'transaction_id' => $booking->payment_ref,
                'amount_cents'   => (int) round($booking->total * 100),
            ]);

        return $res->successful();
    }

    /**
     * التحقق من صحّة الـ HMAC القادم من Paymob (redirect أو webhook).
     * الترتيب ثابت حسب توثيق Paymob لكائن الـ transaction.
     */
    public function verifyHmac(array $data, string $receivedHmac): bool
    {
        if ($this->hmacSecret === '' || $receivedHmac === '') {
            return false;
        }

        $keys = [
            'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
            'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
            'is_standalone_payment', 'is_voided', 'order', 'owner', 'pending',
            'source_data_pan', 'source_data_sub_type', 'source_data_type', 'success',
        ];

        $concat = '';
        foreach ($keys as $k) {
            $concat .= $this->flatValue($data, $k);
        }

        $calculated = hash_hmac('sha512', $concat, $this->hmacSecret);

        return hash_equals($calculated, strtolower($receivedHmac));
    }

    /**
     * يقرأ القيمة من الحقول المسطّحة (query) أو المتداخلة (webhook JSON).
     */
    private function flatValue(array $d, string $key): string
    {
        // في الـ redirect querystring الحقول مسطّحة بالأسماء دي
        $map = [
            'order'                 => ['order', 'order.id'],
            'source_data_pan'       => ['source_data.pan', 'source_data_pan'],
            'source_data_sub_type'  => ['source_data.sub_type', 'source_data_sub_type'],
            'source_data_type'      => ['source_data.type', 'source_data_type'],
        ];

        $candidates = $map[$key] ?? [$key];
        foreach ($candidates as $c) {
            if (array_key_exists($c, $d)) {
                return $this->stringify($d[$c]);
            }
            // مسار متداخل بالنقطة (webhook)
            if (str_contains($c, '.')) {
                $val = data_get($d, $c);
                if ($val !== null) {
                    return $this->stringify($val);
                }
            }
        }

        return '';
    }

    private function stringify($v): string
    {
        if (is_bool($v)) {
            return $v ? 'true' : 'false';
        }
        return (string) $v;
    }

    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2);
        return [$parts[0] ?? 'Guest', $parts[1] ?? '-'];
    }
}
