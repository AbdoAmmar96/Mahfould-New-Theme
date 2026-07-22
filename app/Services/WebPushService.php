<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * إشعارات Web Push (VAPID).
 * لو المفاتيح مش مضبوطة في .env الخدمة بتفضل صامتة تماماً —
 * زي WhatsAppService بالظبط، عشان الحجز ميتأثرش أبداً.
 */
class WebPushService
{
    public function enabled(): bool
    {
        return (bool) (config('services.webpush.public_key') && config('services.webpush.private_key'));
    }

    /** إشعار تأكيد حجز */
    public function bookingConfirmed(Booking $booking): void
    {
        if (! $booking->user_id) {
            return;
        }

        $this->sendToUser($booking->user_id, [
            'title' => 'تم تأكيد حجزك ✅',
            'body' => "{$booking->title} — كود {$booking->code}",
            'url' => '/account',
            'tag' => "booking-{$booking->code}",
        ]);
    }

    /** إرسال لكل أجهزة مستخدم */
    public function sendToUser(int $userId, array $payload): void
    {
        if (! $this->enabled()) {
            return;
        }

        $subs = PushSubscription::where('user_id', $userId)->get();
        if ($subs->isEmpty()) {
            return;
        }

        try {
            $webPush = new WebPush(['VAPID' => [
                'subject' => config('services.webpush.subject'),
                'publicKey' => config('services.webpush.public_key'),
                'privateKey' => config('services.webpush.private_key'),
            ]]);

            foreach ($subs as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'keys' => ['p256dh' => $sub->p256dh, 'auth' => $sub->auth],
                    ]),
                    json_encode($payload, JSON_UNESCAPED_UNICODE),
                );
            }

            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    continue;
                }

                // 404/410 = الاشتراك مات (المستخدم شال التطبيق أو مسح البيانات) → نظّفه
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint_hash', PushSubscription::hashFor($report->getEndpoint()))->delete();
                    continue;
                }

                Log::warning('فشل إرسال Web Push', [
                    'endpoint' => substr($report->getEndpoint(), 0, 60),
                    'reason' => $report->getReason(),
                ]);
            }
        } catch (\Throwable $e) {
            report($e);
            Log::warning('WebPush: استثناء أثناء الإرسال', ['user' => $userId]);
        }
    }
}
