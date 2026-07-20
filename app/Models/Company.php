<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Company — كيان المزوّد (شركة أو فرد) — V2-BLUEPRINT §3, §16.
 *
 * الفرق بين علم الضمان والتوثيق:
 *   is_verified (verification_status='verified')  = المستندات صحيحة والحساب موافق عليه
 *   is_first_party = TRUE                          = مملوك لمحفول مكفول (شارة "مكفول")
 *
 * تقييم المزوّد المجمّع (§3): provider_review_score/_count يُحسبان من كل عناصره.
 */
class Company extends Model
{
    protected $fillable = [
        'user_id', 'provider_type', 'name', 'slug', 'logo', 'about',
        'phone', 'email', 'national_id',
        'license_no', 'license_authority', 'license_expires_at',
        'verification_status', 'is_first_party',
        'provider_review_score', 'provider_review_count',
        'commission_rate_override', 'admin_notes',
        'approved_at', 'approved_by',
    ];

    protected $casts = [
        'is_first_party' => 'boolean',
        'license_expires_at' => 'date',
        'provider_review_score' => 'decimal:2',
        'commission_rate_override' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Company $c) {
            $c->slug ??= Str::slug($c->name) . '-' . Str::random(4);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProviderDocument::class);
    }

    // ── الخدمات المرتبطة بالمزوّد ──
    public function tours(): HasMany       { return $this->hasMany(Tour::class, 'provider_id'); }
    public function hotels(): HasMany      { return $this->hasMany(Hotel::class, 'provider_id'); }
    public function restaurants(): HasMany { return $this->hasMany(Restaurant::class, 'provider_id'); }
    public function cars(): HasMany        { return $this->hasMany(Car::class, 'provider_id'); }

    // ── Scopes ──
    public function scopeVerified(Builder $q): Builder
    {
        return $q->where('verification_status', 'verified');
    }

    public function scopePending(Builder $q): Builder
    {
        return $q->where('verification_status', 'pending');
    }

    // ── Helpers ──
    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isIndividual(): bool
    {
        return $this->provider_type === 'individual';
    }

    /** هل يحتاج فيش وتشبيه (الأفراد فقط) */
    public function requiresCriminalRecord(): bool
    {
        return $this->isIndividual();
    }

    public function getLogoUrlAttribute(): string
    {
        if ($this->logo && str_starts_with($this->logo, 'http')) {
            return $this->logo;
        }
        return $this->logo
            ? asset('storage/' . $this->logo)
            : "https://ui-avatars.com/api/?name=" . urlencode($this->name) . "&background=363677&color=fff";
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->verification_status) {
            'pending'   => 'قيد المراجعة',
            'verified'  => 'موثّق',
            'rejected'  => 'مرفوض',
            'suspended' => 'موقوف',
            default     => $this->verification_status,
        };
    }
}
