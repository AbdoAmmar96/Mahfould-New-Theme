<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id', 'name', 'slug', 'description', 'image',
        'lat', 'lng', 'is_featured', 'order',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'lat' => 'decimal:7',
        'lng' => 'decimal:7',
    ];

    protected static function booted(): void
    {
        static::creating(function (Location $loc) {
            $loc->slug ??= Str::slug($loc->name) ?: Str::random(8);
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(Hotel::class);
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/loc{$this->id}/500/660";
    }

    public function getUrlAttribute(): string
    {
        return route('tours.index', ['location' => $this->slug]);
    }
}
