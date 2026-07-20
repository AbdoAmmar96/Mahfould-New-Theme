<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryOrder extends Model
{
    protected $fillable = [
        'code', 'user_id', 'delivery_service_id',
        'pickup_address', 'pickup_lat', 'pickup_lng',
        'dropoff_address', 'dropoff_lat', 'dropoff_lng',
        'recipient_name', 'recipient_phone', 'notes',
        'distance_km', 'estimated_fare', 'final_fare',
        'status', 'picked_up_at', 'delivered_at',
    ];

    protected $casts = [
        'pickup_lat' => 'decimal:7',
        'pickup_lng' => 'decimal:7',
        'dropoff_lat' => 'decimal:7',
        'dropoff_lng' => 'decimal:7',
        'distance_km' => 'decimal:2',
        'estimated_fare' => 'decimal:2',
        'final_fare' => 'decimal:2',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (DeliveryOrder $o) {
            if ($o->code) return;
            do {
                $code = 'DL-' . date('Y') . '-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (static::where('code', $code)->exists());
            $o->code = $code;
        });
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(DeliveryService::class, 'delivery_service_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'قيد المراجعة',
            'confirmed' => 'مؤكّد',
            'in_transit' => 'في الطريق',
            'delivered' => 'تم التسليم',
            'cancelled' => 'ملغي',
            default => $this->status,
        };
    }
}
