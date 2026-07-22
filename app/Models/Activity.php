<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * فعالية اختيارية على رحلة — V2-BLUEPRINT §8.
 * add-on بسعر إضافي يقدر العميل يختاره أو يشيله.
 */
class Activity extends Model
{
    protected $fillable = [
        'tour_id', 'title', 'short_desc', 'description', 'price',
        'image', 'icon', 'is_default', 'is_active', 'order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }
        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/act{$this->id}/300/200";
    }
}
