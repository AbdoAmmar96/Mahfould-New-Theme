<?php

namespace App\Models\Concerns;

use App\Models\Booking;
use App\Models\Review;
use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Bookable
{
    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function wishlists(): MorphMany
    {
        return $this->morphMany(Wishlist::class, 'wishable');
    }

    public function getDisplayPriceAttribute(): float
    {
        return (float) ($this->sale_price ?: $this->price);
    }

    public function getHasSaleAttribute(): bool
    {
        return $this->sale_price && $this->sale_price < $this->price;
    }

    /** يعيد حساب متوسط التقييم وعددها من التقييمات المعتمدة */
    public function refreshReviewScore(): void
    {
        $approved = $this->reviews()->where('approved', true);
        $this->forceFill([
            'review_score' => round((float) $approved->avg('rating'), 2),
            'review_count' => (int) $approved->count(),
        ])->saveQuietly();
    }
}
