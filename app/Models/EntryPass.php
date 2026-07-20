<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تصريح دخول (QR pass) — V2-BLUEPRINT §6.
 *
 * يُصدر عند حجز رحلة/فندق مع transport_mode='own_car' — تمسحه المنشأة عند الدخول.
 * الكود فريد، والـpayload يحتوي على معلومات كافية للتحقق (booking_code + hash).
 */
class EntryPass extends Model
{
    protected $fillable = [
        'booking_id', 'code', 'qr_payload', 'valid_from', 'valid_until',
        'scanned_at', 'scanned_by', 'status',
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'scanned_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function scanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }

    /** رابط QR image (يستخدم خدمة عامة — يمكن استبدالها لاحقاً بمولّد داخلي) */
    public function getQrImageUrlAttribute(): string
    {
        $payload = urlencode($this->code);
        return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={$payload}";
    }

    public function isActive(): bool
    {
        return $this->status === 'active'
            && (! $this->valid_until || $this->valid_until->isFuture());
    }
}
