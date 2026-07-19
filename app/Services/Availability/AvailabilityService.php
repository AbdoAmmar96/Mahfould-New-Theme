<?php

namespace App\Services\Availability;

use App\Models\BookingItem;
use Illuminate\Support\Carbon;

/**
 * قراءة الإتاحة فقط — بتغذّي منتقيات التواريخ في الواجهة.
 * الإتاحة مشتقّة: متبقّي = إجمالي الوحدات − عدد الصفوف النشطة في التاريخ.
 */
class AvailabilityService
{
    /**
     * خريطة تاريخ → عدد الوحدات المتبقّية، لنافذة `days` يوم من `from`.
     * @return array<string,int>  ['2026-08-01' => 3, ...]
     */
    public function window(string $type, int $id, string $slot, int $inventory, Carbon $from, int $days): array
    {
        $to = $from->copy()->addDays($days);

        $used = BookingItem::query()->active()
            ->forUnit($type, $id, $slot)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('date, count(*) as c')
            ->groupBy('date')
            ->pluck('c', 'date');

        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $out[$d] = max(0, $inventory - (int) ($used[$d] ?? 0));
        }

        return $out;
    }

    /** أقل عدد وحدات متبقّية عبر مدى تواريخ = أقصى كمية ممكن حجزها للمدى كله */
    public function remainingForRange(string $type, $id, string $slot, int $inventory, array $dates): int
    {
        if (empty($dates)) {
            return 0;
        }

        $used = BookingItem::query()->active()
            ->forUnit($type, (int) $id, $slot)
            ->whereIn('date', $dates)
            ->selectRaw('date, count(*) as c')
            ->groupBy('date')
            ->pluck('c', 'date');

        $min = $inventory;
        foreach ($dates as $d) {
            $min = min($min, $inventory - (int) ($used[$d] ?? 0));
        }

        return max(0, $min);
    }
}
