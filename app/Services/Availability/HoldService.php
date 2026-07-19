<?php

namespace App\Services\Availability;

use App\Exceptions\SlotUnavailableException;
use App\Models\Booking;
use App\Models\BookingItem;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * كل الكتابة على المخزون هنا — 3 طبقات حماية:
 *   1) Cache::lock  → يسلسل التخصيص لنفس الوحدة (يمنع السباق أصلاً).
 *   2) transaction  → قراءة المشغول + INSERT ذرّيًا.
 *   3) unique index → الحارس الأخير (لو الطبقتان فشلتا لأي سبب).
 *
 * driver القفل لازم يكون ذرّي: database محليًا / redis إنتاجًا — مش file.
 */
class HoldService
{
    /** نافذة الحجز المؤقّت أثناء الدفع بالبطاقة (دقائق) */
    public const HOLD_TTL_MINUTES = 30;

    /**
     * يحجز `quantity` وحدة عبر كل `dates` مؤقتاً.
     *
     * @param  string[]  $dates  تواريخ بصيغة Y-m-d
     * @param  int|null  $ttlMinutes  null = بلا انتهاء (يُستخدم قبل convert المباشر)
     * @return array{hold_token:string, unit_indexes:int[]}
     *
     * @throws SlotUnavailableException
     */
    public function reserve(string $type, int $id, int $inventory, array $dates, string $slot, int $quantity = 1, ?int $ttlMinutes = self::HOLD_TTL_MINUTES): array
    {
        $dates = array_values(array_unique($dates));

        if ($quantity < 1 || empty($dates) || $inventory < 1) {
            throw new SlotUnavailableException();
        }

        $lock = Cache::lock("avail:{$type}:{$id}", 10);

        return $lock->block(8, function () use ($type, $id, $inventory, $dates, $slot, $quantity, $ttlMinutes) {
            return DB::transaction(function () use ($type, $id, $inventory, $dates, $slot, $quantity, $ttlMinutes) {
                // (unit_index → مجموعة التواريخ المشغولة)
                $busy = [];
                BookingItem::query()->active()
                    ->forUnit($type, $id, $slot)
                    ->whereIn('date', $dates)
                    ->get(['unit_index', 'date'])
                    ->each(function (BookingItem $r) use (&$busy) {
                        $busy[$r->unit_index][$r->date->toDateString()] = true;
                    });

                // أول `quantity` وحدة حرّة عبر كل التواريخ المطلوبة
                $free = [];
                for ($k = 0; $k < $inventory && count($free) < $quantity; $k++) {
                    foreach ($dates as $d) {
                        if (isset($busy[$k][$d])) {
                            continue 2; // الوحدة k مشغولة في d → جرّب الوحدة اللي بعدها
                        }
                    }
                    $free[] = $k;
                }

                if (count($free) < $quantity) {
                    throw new SlotUnavailableException();
                }

                $token = (string) Str::uuid();
                $expires = $ttlMinutes ? now()->addMinutes($ttlMinutes) : null;
                $now = now();

                $rows = [];
                foreach ($free as $k) {
                    foreach ($dates as $d) {
                        $rows[] = [
                            'unit_type' => $type, 'unit_id' => $id, 'unit_index' => $k,
                            'date' => $d, 'slot' => $slot, 'state' => 'held',
                            'hold_token' => $token, 'expires_at' => $expires,
                            'created_at' => $now, 'updated_at' => $now,
                        ];
                    }
                }

                try {
                    BookingItem::insert($rows);
                } catch (UniqueConstraintViolationException) {
                    // الحارس الأخير اشتغل → سباق نادر → غير متاح
                    throw new SlotUnavailableException();
                }

                return ['hold_token' => $token, 'unit_indexes' => $free];
            });
        });
    }

    /** يثبّت الوحدات المحجوزة مؤقتاً كـ"محجوزة" ويربطها بالحجز. يرجع عدد الصفوف المُثبّتة. */
    public function convert(string $holdToken, int $bookingId): int
    {
        return BookingItem::where('hold_token', $holdToken)->whereNull('released_at')
            ->update(['state' => 'booked', 'booking_id' => $bookingId, 'expires_at' => null]);
    }

    /** يحرّر وحدات حجز (فشل دفع / إلغاء). يرجع عدد الصفوف المُحرّرة. */
    public function release(string $holdToken): int
    {
        return BookingItem::where('hold_token', $holdToken)->whereNull('released_at')
            ->update(['released_at' => now()]);
    }

    /** يحرّر كل الحجوزات المؤقّتة المنتهية. يرجع عددها. */
    public function releaseExpired(): int
    {
        return BookingItem::whereNull('released_at')
            ->where('state', 'held')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['released_at' => now()]);
    }

    /**
     * يثبّت وحدات حجز مدفوع. لو الحجز المؤقّت انتهى وضاع (دفع متأخّر)،
     * يحاول إعادة الحجز لنفس التواريخ. يرجع false لو الإتاحة اختفت (يتصعّد يدويًا).
     */
    public function confirmBooking(Booking $booking): bool
    {
        if (! $booking->hold_token) {
            return true; // نوع بلا مخزون (رحلات مثلاً)
        }

        if ($this->convert($booking->hold_token, $booking->id) > 0) {
            return true;
        }

        // الحجز المؤقّت اتحرّر قبل وصول الدفع — حاول احجز نفس المدى من جديد
        $model = $booking->bookable;
        if (! $model || ! in_array(\App\Models\Concerns\HasAvailability::class, class_uses_recursive($model), true)) {
            return true;
        }

        $dates = $this->datesFor($booking);
        if (empty($dates)) {
            return true;
        }

        try {
            $res = $this->reserve(
                $model->availabilityType(), $model->getKey(), $model->inventoryCount(),
                $dates, $model->defaultSlot(), max(1, (int) $booking->units), self::HOLD_TTL_MINUTES,
            );
            $this->convert($res['hold_token'], $booking->id);
            $booking->forceFill(['hold_token' => $res['hold_token']])->saveQuietly();

            return true;
        } catch (SlotUnavailableException) {
            return false;
        }
    }

    /** يعيد بناء تواريخ الإقامة من بيانات الحجز */
    public function datesFor(Booking $booking): array
    {
        if (! $booking->start_date) {
            return [];
        }
        $nights = max(1, (int) ($booking->nights ?: 1));
        $dates = [];
        for ($i = 0; $i < $nights; $i++) {
            $dates[] = $booking->start_date->copy()->addDays($i)->toDateString();
        }

        return $dates;
    }
}
