<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'hold_token', 'user_id', 'bookable_type', 'bookable_id',
        'start_date', 'end_date', 'guests', 'units', 'nights',
        'subtotal', 'service_fee', 'discount', 'total', 'commission_amount',
        'status', 'payment_method', 'payment_status', 'payment_gateway', 'payment_ref',
        'customer_name', 'customer_phone', 'customer_email',
        'customer_national_id', 'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'guests' => 'integer',
        'units' => 'integer',
        'nights' => 'integer',
        'subtotal' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'commission_amount' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (Booking $b) {
            if ($b->code) {
                return;
            }
            do {
                $code = 'MM-'.date('Y').'-'.str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (static::where('code', $code)->exists());
            $b->code = $code;
        });
    }

    public function bookable(): MorphTo
    {
        return $this->morphTo();
    }

    /** وحدات المخزون المرتبطة بهذا الحجز (محرك الإتاحة) */
    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'confirmed' => 'مؤكّد',
            'pending' => 'في انتظار الدفع',
            'processing' => 'قيد المعالجة',
            'completed' => 'مكتمل',
            'cancelled' => 'ملغي',
            default => $this->status,
        };
    }

    /** صافي البائع = الإجمالي − العمولة */
    public function getVendorEarningsAttribute(): float
    {
        return max(0, (float) $this->total - (float) $this->commission_amount);
    }
}
