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
        'code', 'hold_token', 'user_id', 'bookable_type', 'bookable_id', 'room_type_id',
        'start_date', 'end_date', 'guests', 'units', 'nights',
        'subtotal', 'service_fee', 'cleaning_fee', 'security_deposit', 'security_deposit_status',
        'discount', 'total', 'amount_paid', 'commission_amount',
        'status', 'payment_method', 'payment_status', 'payment_timing',
        'payment_gateway', 'payment_ref',
        'customer_name', 'customer_phone', 'customer_email', 'customer_national_id',
        'booking_for', 'beneficiary_name', 'beneficiary_national_id', 'beneficiary_age',
        'items_snapshot', 'cancellation_policy_snapshot', 'cancellation_deadline',
        'cancelled_at', 'checked_in_at', 'no_show_at', 'forfeited_at', 'needs_review',
        'transport_mode', 'bus_trip_id', 'transport_details',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'guests' => 'integer',
        'units' => 'integer',
        'nights' => 'integer',
        'beneficiary_age' => 'integer',
        'subtotal' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'cleaning_fee' => 'decimal:2',
        'security_deposit' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'items_snapshot' => 'array',
        'cancellation_policy_snapshot' => 'array',
        'transport_details' => 'array',
        'cancellation_deadline' => 'datetime',
        'cancelled_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'no_show_at' => 'datetime',
        'forfeited_at' => 'datetime',
        'needs_review' => 'boolean',
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

    /** نوع الغرفة المحجوز (للفنادق فقط) — nullable */
    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    /** رحلة الباص المرتبطة (لو transport_mode='bus') */
    public function busTrip(): BelongsTo
    {
        return $this->belongsTo(BusTrip::class, 'bus_trip_id');
    }

    /** تصاريح الدخول (QR passes) — تصدر لو transport_mode='own_car' */
    public function entryPasses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EntryPass::class);
    }

    /** وحدات المخزون المرتبطة بهذا الحجز (محرك الإتاحة) */
    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingItem::class);
    }

    /** أفراد الحجز (عمر لكل فرد + بيانات المستفيد الرئيسي) */
    public function guestsList(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingGuest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** المتبقّي عليه دفعه (0 لو مدفوع بالكامل أو الدفع عند الوصول/الاستخدام) */
    public function getOutstandingAttribute(): float
    {
        return max(0, (float) $this->total - (float) $this->amount_paid);
    }

    /** لو المستفيد شخص آخر (BLUEPRINT §5) */
    public function getIsForOtherAttribute(): bool
    {
        return $this->booking_for === 'other';
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
