<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * صف واحد = وحدة فيزيائية (unit_index) في تاريخ/فترة واحدة.
 * الإتاحة مشتقّة: الوحدة متاحة لو مفيش صف نشط (released_at IS NULL).
 */
class BookingItem extends Model
{
    protected $fillable = [
        'booking_id', 'unit_type', 'unit_id', 'unit_index',
        'date', 'slot', 'state', 'hold_token', 'expires_at', 'released_at',
    ];

    protected $casts = [
        'date'        => 'date',
        'expires_at'  => 'datetime',
        'released_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * الصفوف النشطة فقط (اللي بتشغل مخزون فعلاً).
     *
     * الانتهاء بيتفحص هنا **وقت القراءة** — مش بس في الكرون.
     * قبل كده كان الفحص على released_at بس، يعني أي حجز مؤقّت متسابش
     * يفضل شاغل الغرفة للأبد لحد ما الكرون يشتغل. كده الكرون بقى
     * تنظيف مش شرط صحة: لو وقف، الإتاحة تفضل صح.
     */
    public function scopeActive(Builder $q): Builder
    {
        return $q->whereNull('released_at')
            ->where(fn (Builder $w) => $w->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    public function scopeForUnit(Builder $q, string $type, int $id, string $slot): Builder
    {
        return $q->where('unit_type', $type)->where('unit_id', $id)->where('slot', $slot);
    }
}
