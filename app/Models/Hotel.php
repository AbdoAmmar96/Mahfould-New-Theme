<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasAvailability;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Str;

class Hotel extends Model
{
    use HasFactory, Bookable, HasAvailability;

    protected $fillable = [
        'user_id', 'location_id', 'title', 'slug', 'short_desc', 'content',
        'price', 'sale_price', 'star_rating', 'units_total', 'image', 'gallery',
        'is_featured', 'is_guaranteed', 'status', 'review_score', 'review_count',
    ];

    protected $casts = [
        'gallery'       => 'array',
        'is_featured'   => 'boolean',
        'is_guaranteed' => 'boolean',
        'price'         => 'decimal:2',
        'sale_price'    => 'decimal:2',
        'review_score'  => 'decimal:2',
        'units_total'   => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(fn (Hotel $h) => $h->slug ??= Str::slug($h->title) . '-' . Str::random(4));
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'publish');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function amenities(): MorphToMany
    {
        return $this->morphToMany(Amenity::class, 'service', 'amenity_service');
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
