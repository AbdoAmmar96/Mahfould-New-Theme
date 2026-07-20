<?php

namespace App\Models;

use App\Models\Concerns\HasAvailability;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * نوع غرفة داخل فندق — V2-BLUEPRINT §7.
 *
 * كل نوع بيحمل السعر لليلة + الكمية + طاقة الأشخاص + شامل الإفطار وسياسة الإلغاء.
 * الشاليه = نوع غرفة بكمية 1.
 *
 * RoomType هو الوحدة الحقيقية للإتاحة (unit_type='room_type') — كل غرفة فيزيائية
 * = unit_index واحد في booking_items. يستخدم HasAvailability بمفتاح مخصّص.
 */
class RoomType extends Model
{
    use HasAvailability;

    protected $fillable = [
        'hotel_id', 'title', 'description', 'capacity_per_night', 'units_total',
        'price_per_night', 'sale_price_per_night', 'includes_breakfast',
        'is_active', 'cancellation_policy_json', 'order', 'image',
    ];

    protected $casts = [
        'capacity_per_night' => 'integer',
        'units_total' => 'integer',
        'price_per_night' => 'decimal:2',
        'sale_price_per_night' => 'decimal:2',
        'includes_breakfast' => 'boolean',
        'is_active' => 'boolean',
        'cancellation_policy_json' => 'array',
        'order' => 'integer',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    // ── HasAvailability overrides ──

    public function availabilityType(): string
    {
        return 'room_type';
    }

    public function inventoryCount(): int
    {
        return max(1, (int) $this->units_total);
    }

    public function defaultSlot(): string
    {
        return 'STAY';
    }

    /** السعر الفعلي المستخدم في الحجز (sale_price لو متوفّر) */
    public function getEffectivePriceAttribute(): float
    {
        return (float) ($this->sale_price_per_night ?? $this->price_per_night);
    }

    /** رابط صورة النوع (مع fallback على صورة الفندق) */
    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }
        if ($this->image) {
            return asset('storage/' . $this->image);
        }
        // fallback على صورة الفندق
        return $this->hotel?->image_url ?? "https://loremflickr.com/600/450/hotel-room?lock={$this->id}";
    }
}
