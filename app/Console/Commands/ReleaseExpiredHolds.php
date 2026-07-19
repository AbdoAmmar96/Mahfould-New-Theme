<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Services\Availability\HoldService;
use Illuminate\Console\Command;

/**
 * ⚠️ مهمة حمّالة — لو وقفت المخزون بيتقفل للأبد على حجوزات لم تُدفع.
 * بتشتغل كل دقيقة: تحرّر الحجوزات المؤقّتة المنتهية وتلغي حجوزاتها المعلّقة.
 */
class ReleaseExpiredHolds extends Command
{
    protected $signature = 'holds:release-expired';

    protected $description = 'تحرير الحجوزات المؤقّتة المنتهية وإلغاء حجوزاتها المعلّقة';

    public function handle(HoldService $holds): int
    {
        $released = $holds->releaseExpired();

        // ألغِ الحجوزات المعلّقة اللي وحداتها اتحرّرت كلها
        $cancelled = 0;
        Booking::where('status', 'pending')
            ->whereNotNull('hold_token')
            ->where('created_at', '<', now()->subMinutes(HoldService::HOLD_TTL_MINUTES))
            ->chunkById(100, function ($bookings) use (&$cancelled) {
                foreach ($bookings as $b) {
                    $active = BookingItem::where('hold_token', $b->hold_token)->whereNull('released_at')->exists();
                    if (! $active) {
                        $b->update(['status' => 'cancelled']);
                        $cancelled++;
                    }
                }
            });

        $this->info("حُرّر: {$released} وحدة · أُلغي: {$cancelled} حجز معلّق");

        return self::SUCCESS;
    }
}
