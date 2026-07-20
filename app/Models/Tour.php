<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasProvider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Str;

class Tour extends Model
{
    use HasFactory, Bookable, HasProvider;

    protected $fillable = [
        'user_id', 'provider_id', 'location_id', 'title', 'slug', 'short_desc', 'content',
        'price', 'sale_price', 'duration_days', 'max_people', 'image', 'gallery',
        'itinerary', 'included', 'is_featured', 'is_guaranteed',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'review_score', 'review_count', 'bookings_count',
    ];

    protected $casts = [
        'gallery'       => 'array',
        'itinerary'     => 'array',
        'included'      => 'array',
        'is_featured'   => 'boolean',
        'is_guaranteed' => 'boolean',
        'price'         => 'decimal:2',
        'sale_price'    => 'decimal:2',
        'review_score'  => 'decimal:2',
        'submitted_at'  => 'datetime',
        'reviewed_at'   => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (Tour $t) => $t->slug ??= Str::slug($t->title) . '-' . Str::random(4));
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function amenities(): MorphToMany
    {
        return $this->morphToMany(Amenity::class, 'service', 'amenity_service');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->orderBy('order');
    }

    public function activeActivities(): HasMany
    {
        return $this->activities()->where('is_active', true);
    }

    public function itineraries(): HasMany
    {
        return $this->hasMany(TourItinerary::class)->orderBy('day_number');
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://loremflickr.com/600/450/egypt,travel?lock={$this->id}";
    }

    public function getUrlAttribute(): string
    {
        return route('tours.show', $this->slug);
    }
}
