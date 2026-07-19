<?php

namespace App\Models\Concerns;

use App\Models\BookingItem;
use App\Support\Bookables;

/**
 * يضيف الإتاحة لأي موديل قابل للحجز بمخزون (فنادق الآن، وعربيات/مطاعم لاحقاً).
 * الموديل بيحدّد: عدد الوحدات (inventoryCount) والفترة الافتراضية (defaultSlot).
 */
trait HasAvailability
{
    /** نوع الوحدة القصير (hotel/car/restaurant) — من خريطة Bookables */
    public function availabilityType(): string
    {
        return Bookables::typeFor($this) ?? strtolower(class_basename($this));
    }

    /** إجمالي الوحدات الفيزيائية (غرف/عربيات/سعة فترة) */
    public function inventoryCount(): int
    {
        return (int) ($this->units_total ?? 1);
    }

    /** الفترة الافتراضية لهذا النوع */
    public function defaultSlot(): string
    {
        return 'STAY';
    }

    /** صفوف المخزون النشطة لهذه الوحدة */
    public function activeItems()
    {
        return BookingItem::query()->active()
            ->where('unit_type', $this->availabilityType())
            ->where('unit_id', $this->getKey());
    }
}
