<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\EntryPass;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * إصدار تصاريح دخول (QR) للحجوزات — V2-BLUEPRINT §6.
 *
 * يُستدعى عند تأكيد حجز رحلة/فندق مع transport_mode='own_car':
 * ينشئ EntryPass بكود فريد و payload موقّع، صالح من قبل تاريخ الوصول بيوم
 * حتى بعد تاريخ المغادرة بيوم (لدخول متكرر إن كانت الإقامة عدة ليالٍ).
 */
class EntryPassService
{
    public function issueForBooking(Booking $booking): ?EntryPass
    {
        // نصدر فقط للحجوزات التي فيها transport_mode='own_car'
        if ($booking->transport_mode !== 'own_car') {
            return null;
        }

        // نمنع الإصدار المزدوج لنفس الحجز
        $existing = EntryPass::where('booking_id', $booking->id)->where('status', 'active')->first();
        if ($existing) {
            return $existing;
        }

        $code = strtoupper('EP-' . Str::random(4) . '-' . Str::upper(Str::random(4)) . '-' . Str::upper(Str::random(4)));

        // نافذة الصلاحية: قبل الوصول بيوم → بعد المغادرة بيوم
        $validFrom  = $booking->start_date ? Carbon::parse($booking->start_date)->subDay()->startOfDay() : now();
        $validUntil = $booking->end_date
            ? Carbon::parse($booking->end_date)->addDay()->endOfDay()
            : ($booking->start_date ? Carbon::parse($booking->start_date)->addDay()->endOfDay() : now()->addWeek());

        $payload = [
            'code' => $code,
            'booking_code' => $booking->code,
            'issued_at' => now()->toIso8601String(),
            // توقيع بسيط (SHA-256 على كود+booking) — يحقّق فيه الماسح من الأدمن
            'sig' => hash_hmac('sha256', $code . '|' . $booking->code, config('app.key')),
        ];

        return EntryPass::create([
            'booking_id' => $booking->id,
            'code' => $code,
            'qr_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'valid_from' => $validFrom,
            'valid_until' => $validUntil,
            'status' => 'active',
        ]);
    }

    /** يتحقق من كود QR ماسحه المنشأة → يرجع EntryPass أو null */
    public function verify(string $code): ?EntryPass
    {
        $pass = EntryPass::where('code', $code)->first();
        if (! $pass || ! $pass->isActive()) {
            return null;
        }
        // تحقق من التوقيع
        $payload = json_decode($pass->qr_payload, true);
        if (! is_array($payload)) return null;

        $expectedSig = hash_hmac('sha256', $pass->code . '|' . $pass->booking->code, config('app.key'));
        return hash_equals((string) ($payload['sig'] ?? ''), $expectedSig) ? $pass : null;
    }

    /** يوسم الكود كـ"مُستَخدَم" */
    public function markUsed(EntryPass $pass, int $scannedByUserId): void
    {
        $pass->update([
            'scanned_at' => now(),
            'scanned_by' => $scannedByUserId,
            'status' => 'used',
        ]);
    }
}
