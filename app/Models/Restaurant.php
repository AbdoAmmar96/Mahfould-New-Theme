<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasProvider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Restaurant extends Model
{
    use HasFactory, Bookable, HasProvider;

    protected $fillable = [
        'user_id', 'provider_id', 'location_id', 'title', 'slug', 'address', 'content',
        'cuisines', 'price_range', 'image', 'gallery', 'is_featured',
        'is_guaranteed', 'instant_booking',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'review_score', 'review_count',
    ];

    protected $casts = [
        'cuisines'        => 'array',
        'gallery'         => 'array',
        'is_featured'     => 'boolean',
        'is_guaranteed'   => 'boolean',
        'instant_booking' => 'boolean',
        'review_score'    => 'decimal:2',
        'submitted_at'    => 'datetime',
        'reviewed_at'     => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (Restaurant $r) => $r->slug ??= Str::slug($r->title) . '-' . Str::random(4));
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    // للمطاعم السعر غير أساسي — نرجّع 0 حتى يعمل الـ trait
    public function getPriceAttribute(): float { return 0; }
    public function getSalePriceAttribute(): ?float { return null; }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://loremflickr.com/600/450/restaurant,food?lock={$this->id}";
    }

    public function getUrlAttribute(): string
    {
        return route('restaurants.show', $this->slug);
    }
}
