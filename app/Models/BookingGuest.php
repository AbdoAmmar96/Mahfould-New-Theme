<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * فرد واحد داخل حجز.
 *  - الأعمار للجميع (لأغراض التسعير)
 *  - الاسم/الرقم القومي للمستفيد الرئيسي فقط (is_primary=true) — V2-BLUEPRINT §4
 *  - tier_label + applied_price = snapshot لحظة الحجز
 */
class BookingGuest extends Model
{
    protected $fillable = [
        'booking_id', 'age', 'is_primary', 'name', 'national_id',
        'tier_label', 'applied_price',
    ];

    protected $casts = [
        'age' => 'integer',
        'is_primary' => 'boolean',
        'applied_price' => 'decimal:2',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
