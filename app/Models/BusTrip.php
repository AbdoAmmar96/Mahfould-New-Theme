<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasAvailability;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * رحلة باص مجدولة — V2-BLUEPRINT §10.
 *
 * كل رحلة على خط، بموعد إقلاع محدّد وسعة مقاعد.
 * الحجز على رحلة معيّنة (unit_type='bus_trip', unit_index=رقم المقعد 0..seats_total-1).
 * كل صف booking_items على تاريخ الرحلة (slot='TRIP').
 */
class BusTrip extends Model
{
    use Bookable, HasAvailability;

    protected $fillable = [
        'bus_route_id', 'departs_at', 'arrives_at', 'seats_total',
        'price_override', 'bus_plate', 'status',
    ];

    protected $casts = [
        'departs_at' => 'datetime',
        'arrives_at' => 'datetime',
        'seats_total' => 'integer',
        'price_override' => 'decimal:2',
    ];

    public function route(): BelongsTo
    {
        return $this->belongsTo(BusRoute::class, 'bus_route_id');
    }

    // ── HasAvailability ──
    public function availabilityType(): string { return 'bus_trip'; }
    public function inventoryCount(): int      { return (int) $this->seats_total; }
    public function defaultSlot(): string      { return 'TRIP'; }

    // ── Bookable overrides ──
    public function getTitleAttribute(): string
    {
        $route = $this->route;
        return $route
            ? "{$route->name} — {$this->departs_at->format('Y-m-d H:i')}"
            : "رحلة باص #{$this->id}";
    }

    public function getPriceAttribute(): float
    {
        return (float) ($this->price_override ?? $this->route?->base_fare ?? 0);
    }

    public function getSalePriceAttribute(): ?float { return null; }

    public function getImageUrlAttribute(): string
    {
        return "https://loremflickr.com/600/450/bus,egypt?lock={$this->id}";
    }

    public function scopeUpcoming(Builder $q): Builder
    {
        return $q->where('departs_at', '>=', now())
            ->where('status', 'scheduled')
            ->orderBy('departs_at');
    }
}
