<?php

namespace App\Services\Payments;

use App\Services\FawryService;
use App\Services\PaymobService;
use RuntimeException;

/**
 * يختار البوابة النشطة حسب config('services.payments.gateway').
 * لو المختارة مش مضبوطة، يجرّب أي بوابة تانية مضبوطة.
 */
class PaymentManager
{
    /** @var array<string,PaymentGateway> */
    private array $gateways;

    public function __construct(PaymobService $paymob, FawryService $fawry)
    {
        $this->gateways = [
            'paymob' => $paymob,
            'fawry'  => $fawry,
        ];
    }

    public function active(): PaymentGateway
    {
        $preferred = (string) config('services.payments.gateway', 'paymob');

        if (isset($this->gateways[$preferred]) && $this->gateways[$preferred]->isConfigured()) {
            return $this->gateways[$preferred];
        }

        // fallback لأي بوابة مضبوطة
        foreach ($this->gateways as $g) {
            if ($g->isConfigured()) {
                return $g;
            }
        }

        throw new RuntimeException('مفيش بوابة دفع مضبوطة');
    }

    public function hasConfigured(): bool
    {
        foreach ($this->gateways as $g) {
            if ($g->isConfigured()) {
                return true;
            }
        }
        return false;
    }

    /** استرجاع حجز عبر البوابة اللي اتدفع بيها */
    public function refund(\App\Models\Booking $booking): bool
    {
        $gateway = $this->gateways[$booking->payment_gateway] ?? null;
        if (! $gateway || ! $gateway->isConfigured()) {
            return false;
        }
        return $gateway->refund($booking);
    }
}
