<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantMenuItem extends Model
{
    protected $fillable = [
        'restaurant_id', 'section_id', 'title', 'description', 'price',
        'image', 'tags', 'is_available', 'is_signature', 'order',
    ];

    protected $casts = [
        'tags' => 'array',
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_signature' => 'boolean',
        'order' => 'integer',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(RestaurantMenuSection::class, 'section_id');
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }
        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/menu{$this->id}/300/200";
    }
}
