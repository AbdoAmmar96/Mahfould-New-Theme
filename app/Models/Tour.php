<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Str;

class Tour extends Model
{
    use HasFactory, Bookable;

    protected $fillable = [
        'user_id', 'location_id', 'title', 'slug', 'short_desc', 'content',
        'price', 'sale_price', 'duration_days', 'max_people', 'image', 'gallery',
        'itinerary', 'included', 'is_featured', 'is_guaranteed', 'status',
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
    ];

    protected static function booted(): void
    {
        static::creating(fn (Tour $t) => $t->slug ??= Str::slug($t->title) . '-' . Str::random(4));
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'publish');
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

    public function getImageUrlAttribute(): string
    {
        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/tour{$this->id}/600/450";
    }

    public function getUrlAttribute(): string
    {
        return route('tours.show', $this->slug);
    }
}
