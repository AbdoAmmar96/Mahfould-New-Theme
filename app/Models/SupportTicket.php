<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $fillable = [
        'code', 'user_id', 'assigned_to', 'booking_id',
        'subject', 'category', 'description',
        'status', 'priority', 'closed_at',
    ];

    protected $casts = [
        'closed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SupportTicket $t) {
            if ($t->code) return;
            do {
                $code = 'SP-' . date('Y') . '-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (static::where('code', $code)->exists());
            $t->code = $code;
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class, 'ticket_id')->orderBy('created_at');
    }

    public function scopeOpen($q)
    {
        return $q->whereIn('status', ['open', 'in_progress', 'waiting_customer']);
    }

    public function scopeUnassigned($q)
    {
        return $q->whereNull('assigned_to');
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'open' => 'مفتوحة',
            'in_progress' => 'قيد المعالجة',
            'waiting_customer' => 'بانتظار العميل',
            'resolved' => 'محلولة',
            'closed' => 'مغلقة',
            default => $this->status,
        };
    }

    public function getPriorityLabelAttribute(): string
    {
        return match ($this->priority) {
            'low' => 'منخفضة',
            'normal' => 'عادية',
            'high' => 'عالية',
            'urgent' => 'عاجلة',
            default => $this->priority,
        };
    }

    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'booking' => 'مشكلة حجز',
            'payment' => 'مشكلة دفع',
            'refund' => 'طلب استرداد',
            'complaint' => 'شكوى',
            'general' => 'استفسار عام',
            default => $this->category,
        };
    }
}
