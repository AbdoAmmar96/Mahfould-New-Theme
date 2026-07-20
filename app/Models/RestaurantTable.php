<?php

namespace App\Models;

use App\Models\Concerns\HasAvailability;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ترابيزة داخل مطعم — V2-BLUEPRINT §9.
 *
 * كل ترابيزة وحدة إتاحة مستقلة (unit_type='restaurant_table').
 * الحجز يعطي slot زمني (HH:MM) على تاريخ محدّد لترابيزة محدّدة.
 */
class RestaurantTable extends Model
{
    use HasAvailability;

    protected $fillable = [
        'restaurant_id', 'code', 'label', 'capacity', 'area', 'is_active', 'order',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    // ── HasAvailability overrides ──

    public function availabilityType(): string
    {
        return 'restaurant_table';
    }

    /** ترابيزة واحدة = وحدة واحدة (المخزون على مستوى الترابيزة) */
    public function inventoryCount(): int
    {
        return 1;
    }

    /** الـslot الزمني بيحدد وقت الحجز (HH:MM) — يمرَّر لـHoldService */
    public function defaultSlot(): string
    {
        return 'STAY';
    }
}
