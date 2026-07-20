<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مخطط زمني يوم بيوم للرحلة — V2-BLUEPRINT §8.
 */
class TourItinerary extends Model
{
    protected $fillable = [
        'tour_id', 'day_number', 'title', 'description', 'highlights', 'image',
    ];

    protected $casts = [
        'day_number' => 'integer',
        'highlights' => 'array',
    ];

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }
}
