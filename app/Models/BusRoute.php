<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * خط سير باصات — V2-BLUEPRINT §10.
 * كل خط له محطات مرتّبة + مناطق تسعير + رحلات مجدولة بمواعيد ثابتة.
 */
class BusRoute extends Model
{
    protected $fillable = [
        'provider_id', 'name', 'slug', 'from_station_id', 'to_station_id',
        'duration_minutes', 'base_fare', 'is_active', 'notes',
    ];

    protected $casts = [
        'base_fare' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (BusRoute $r) {
            $r->slug ??= Str::slug($r->name) . '-' . Str::random(4);
        });
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'provider_id');
    }

    public function fromStation(): BelongsTo
    {
        return $this->belongsTo(BusStation::class, 'from_station_id');
    }

    public function toStation(): BelongsTo
    {
        return $this->belongsTo(BusStation::class, 'to_station_id');
    }

    /** المحطات على الخط بترتيبها */
    public function stations(): BelongsToMany
    {
        return $this->belongsToMany(BusStation::class, 'bus_route_stations')
            ->withPivot(['order', 'zone_number', 'offset_minutes'])
            ->withTimestamps()
            ->orderBy('bus_route_stations.order');
    }

    public function zones(): HasMany
    {
        return $this->hasMany(BusZone::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(BusTrip::class)->orderBy('departs_at');
    }

    /** أجرة السفر بين منطقتين — من bus_zones أو fallback على base_fare */
    public function fareFor(int $fromZone, int $toZone): float
    {
        // fromZone/toZone بأي ترتيب — التسعير متماثل
        $z = $this->zones()
            ->where(function ($q) use ($fromZone, $toZone) {
                $q->where(fn ($qq) => $qq->where('from_zone', $fromZone)->where('to_zone', $toZone))
                  ->orWhere(fn ($qq) => $qq->where('from_zone', $toZone)->where('to_zone', $fromZone));
            })
            ->first();

        return (float) ($z?->fare ?? $this->base_fare);
    }
}
