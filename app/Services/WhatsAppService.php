<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * إرسال رسائل واتساب — 3 أوضاع (WHATSAPP_DRIVER):
 *   • webhook    → POST بيانات الحجز لنظامك الخاص (مناسب لأتمتة واتساب اللي عندك)
 *   • cloud_api  → WhatsApp Cloud API الرسمي (Meta) — يحتاج template معتمد
 *   • log        → يسجّل بس (الافتراضي، للتطوير)
 */
class WhatsAppService
{
    private string $driver;

    public function __construct()
    {
        $this->driver = (string) config('services.whatsapp.driver', 'log');
    }

    public function sendBookingConfirmation(Booking $booking): void
    {
        $phone   = $this->normalize($booking->customer_phone);
        $message = $this->buildMessage($booking);

        try {
            match ($this->driver) {
                'webhook'   => $this->viaWebhook($booking, $phone, $message),
                'cloud_api' => $this->viaCloudApi($booking, $phone),
                default     => Log::info('[WhatsApp:log] ' . $phone . ' → ' . $message),
            };
        } catch (\Throwable $e) {
            report($e); // لا نكسر مسار الحجز أبداً
        }
    }

    /** يبعت الحجز لنظامك — تستقبله وتبعت بأدوات الأتمتة بتاعتك */
    private function viaWebhook(Booking $booking, string $phone, string $message): void
    {
        $url = (string) config('services.whatsapp.webhook_url');
        if ($url === '') {
            return;
        }
        Http::withHeaders(array_filter([
            'Authorization' => config('services.whatsapp.webhook_token')
                ? 'Bearer ' . config('services.whatsapp.webhook_token') : null,
        ]))->post($url, [
            'event'    => 'booking.confirmed',
            'phone'    => $phone,
            'message'  => $message,
            'booking'  => [
                'code'   => $booking->code,
                'title'  => $booking->bookable?->title,
                'total'  => (float) $booking->total,
                'guests' => $booking->guests,
                'date'   => optional($booking->start_date)->format('Y-m-d'),
                'name'   => $booking->customer_name,
            ],
        ]);
    }

    /** WhatsApp Cloud API — template message */
    private function viaCloudApi(Booking $booking, string $phone): void
    {
        $token   = (string) config('services.whatsapp.token');
        $phoneId = (string) config('services.whatsapp.phone_number_id');
        $tpl     = (string) config('services.whatsapp.template', 'booking_confirmation');
        $lang    = (string) config('services.whatsapp.template_lang', 'ar');
        if ($token === '' || $phoneId === '') {
            return;
        }

        Http::withToken($token)->post("https://graph.facebook.com/v21.0/{$phoneId}/messages", [
            'messaging_product' => 'whatsapp',
            'to'                => $phone,
            'type'              => 'template',
            'template'          => [
                'name'     => $tpl,
                'language' => ['code' => $lang],
                'components' => [[
                    'type'       => 'body',
                    'parameters' => [
                        ['type' => 'text', 'text' => $booking->customer_name],
                        ['type' => 'text', 'text' => $booking->code],
                        ['type' => 'text', 'text' => $booking->bookable?->title ?? '—'],
                        ['type' => 'text', 'text' => number_format((float) $booking->total) . ' ج.م'],
                    ],
                ]],
            ],
        ]);
    }

    private function buildMessage(Booking $booking): string
    {
        $title = $booking->bookable?->title ?? 'حجزك';
        $date  = optional($booking->start_date)->format('Y-m-d');
        $total = number_format((float) $booking->total);

        return "✅ تم تأكيد حجزك في محفول مكفول!\n\n"
            . "🎫 رقم الحجز: {$booking->code}\n"
            . "📦 {$title}\n"
            . ($date ? "📅 {$date}\n" : '')
            . "👥 {$booking->guests} فرد\n"
            . "💰 الإجمالي: {$total} ج.م\n\n"
            . "رحلتك محفولة مكفولة 🇪🇬";
    }

    /** تطبيع رقم مصري لصيغة E.164 (20xxxxxxxxxx) */
    private function normalize(string $phone): string
    {
        $p = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($p, '0')) {
            $p = '20' . substr($p, 1);
        } elseif (! str_starts_with($p, '20')) {
            $p = '20' . $p;
        }
        return $p;
    }
}
