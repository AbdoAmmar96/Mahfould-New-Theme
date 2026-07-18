<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'reviewable_type', 'reviewable_id',
        'rating', 'title', 'content', 'approved',
    ];

    protected $casts = ['approved' => 'boolean'];

    public function reviewable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** تقييمات خدمة معيّنة (approved فقط) */
    public function scopeForReviewable(Builder $q, Model $model): Builder
    {
        return $q->where('reviewable_type', $model::class)
            ->where('reviewable_id', $model->getKey())
            ->where('approved', true)
            ->with('user:id,name');
    }
}
