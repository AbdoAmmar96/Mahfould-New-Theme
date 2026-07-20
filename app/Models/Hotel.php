<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasAvailability;
use App\Models\Concerns\HasProvider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Str;

class Hotel extends Model
{
    use HasFactory, Bookable, HasAvailability, HasProvider;

    protected $fillable = [
        'user_id', 'provider_id', 'location_id', 'title', 'slug', 'short_desc', 'content',
        'price', 'sale_price', 'star_rating', 'units_total', 'image', 'gallery',
        'is_featured', 'is_guaranteed',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'review_score', 'review_count',
    ];

    protected $casts = [
        'gallery'       => 'array',
        'is_featured'   => 'boolean',
        'is_guaranteed' => 'boolean',
        'price'         => 'decimal:2',
        'sale_price'    => 'decimal:2',
        'review_score'  => 'decimal:2',
        'units_total'   => 'integer',
        'submitted_at'  => 'datetime',
        'reviewed_at'   => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (Hotel $h) => $h->slug ??= Str::slug($h->title) . '-' . Str::random(4));
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function amenities(): MorphToMany
    {
        return $this->morphToMany(Amenity::class, 'service', 'amenity_service');
    }

    /** أنواع الغرف داخل الفندق (§7) — يشمل غير النشط للأدمن */
    public function roomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class)->orderBy('order');
    }

    /** الأنواع النشطة المعروضة للعميل (للحجز فقط) */
    public function activeRoomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class)->where('is_active', true)->orderBy('order');
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://loremflickr.com/600/450/hotel,resort?lock={$this->id}";
    }

    public function getUrlAttribute(): string
    {
        return route('hotels.show', $this->slug);
    }
}
