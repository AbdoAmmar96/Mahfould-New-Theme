<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * شريحة تسعير عمرية لخدمة (رحلة/فندق/…).
 *
 * multiplier = نسبة من سعر البالغ (0.00 رضيع مجاناً · 0.50 طفل · 1.00 بالغ).
 * min_age..max_age يحدّدان مدى العمر (max_age=null → ∞).
 */
class AgePricingTier extends Model
{
    protected $fillable = ['bookable_type', 'bookable_id', 'label', 'min_age', 'max_age', 'multiplier', 'order'];

    protected $casts = [
        'min_age' => 'integer',
        'max_age' => 'integer',
        'multiplier' => 'decimal:2',
        'order' => 'integer',
    ];

    public function bookable(): MorphTo
    {
        return $this->morphTo();
    }

    /** هل هذه الشريحة تنطبق على العمر المحدّد؟ */
    public function matches(int $age): bool
    {
        if ($age < $this->min_age) {
            return false;
        }
        return $this->max_age === null || $age <= $this->max_age;
    }
}
