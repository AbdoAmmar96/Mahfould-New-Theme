<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DeliveryService extends Model
{
    protected $fillable = [
        'provider_id', 'title', 'slug', 'description', 'image',
        'base_fare', 'price_per_km', 'min_fare', 'service_radius_km',
        'vehicle_type', 'max_kg',
        'city', 'base_lat', 'base_lng',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'is_active', 'review_score', 'review_count',
    ];

    protected $casts = [
        'base_fare' => 'decimal:2',
        'price_per_km' => 'decimal:2',
        'min_fare' => 'decimal:2',
        'service_radius_km' => 'integer',
        'max_kg' => 'integer',
        'base_lat' => 'decimal:7',
        'base_lng' => 'decimal:7',
        'is_active' => 'boolean',
        'review_score' => 'decimal:2',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (DeliveryService $d) => $d->slug ??= Str::slug($d->title) . '-' . Str::random(4));
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'provider_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(DeliveryOrder::class);
    }

    public function scopePublished($q)
    {
        return $q->where('publish_state', 'published')->where('is_active', true);
    }

    /** يحسب أجرة توصيل حسب مسافة معطاة */
    public function estimateFare(float $km): float
    {
        $fare = (float) $this->base_fare + ((float) $this->price_per_km * $km);
        return max($fare, (float) $this->min_fare);
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) return $this->image;
        return $this->image ? asset('storage/' . $this->image) : "https://loremflickr.com/400/300/delivery,motorbike?lock={$this->id}";
    }
}
