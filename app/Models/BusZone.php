<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تسعير المناطق على خط باص — V2-BLUEPRINT §10.
 * كل صف = أجرة بين زوج مناطق (from_zone, to_zone) — التسعير متماثل من الاتجاهين.
 */
class BusZone extends Model
{
    protected $fillable = ['bus_route_id', 'from_zone', 'to_zone', 'fare'];

    protected $casts = ['fare' => 'decimal:2'];

    public function route(): BelongsTo
    {
        return $this->belongsTo(BusRoute::class, 'bus_route_id');
    }
}
