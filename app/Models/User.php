<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'phone', 'role', 'avatar', 'password', 'is_active',
    ];

    // ── الأدوار (V2 §1) ──
    public const ROLE_CUSTOMER = 'customer';
    public const ROLE_ADMIN    = 'admin';
    public const ROLE_VENDOR   = 'vendor';    // مالك شركة/فرد مزوّد
    public const ROLE_SUPPORT  = 'support';

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** شركة المزوّد المرتبطة بالحساب (Phase D) */
    public function company(): HasOne
    {
        return $this->hasOne(Company::class);
    }

    public function isAdmin(): bool   { return $this->role === self::ROLE_ADMIN; }
    public function isVendor(): bool  { return $this->role === self::ROLE_VENDOR; }
    public function isSupport(): bool { return $this->role === self::ROLE_SUPPORT; }

    public function getInitialsAttribute(): string
    {
        $parts = preg_split('/\s+/', trim($this->name));
        return mb_substr($parts[0] ?? '', 0, 1) . ' ' . mb_substr($parts[1] ?? '', 0, 1);
    }
}
