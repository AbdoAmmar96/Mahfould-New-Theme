<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasProvider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Car extends Model
{
    use HasFactory, Bookable, HasProvider;

    protected $fillable = [
        'user_id', 'provider_id', 'location_id', 'title', 'slug', 'brand', 'content',
        'price', 'sale_price', 'transmission', 'seats', 'with_driver',
        'image', 'gallery', 'is_featured', 'is_guaranteed',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'review_score', 'review_count',
    ];

    protected $casts = [
        'gallery'       => 'array',
        'with_driver'   => 'boolean',
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
        static::creating(fn (Car $c) => $c->slug ??= Str::slug($c->title) . '-' . Str::random(4));
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://loremflickr.com/600/450/car?lock={$this->id}";
    }

    public function getUrlAttribute(): string
    {
        return route('cars.show', $this->slug);
    }
}
