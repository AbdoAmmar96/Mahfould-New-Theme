<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasProvider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Restaurant extends Model
{
    use HasFactory, Bookable, HasProvider;

    protected $fillable = [
        'user_id', 'provider_id', 'location_id', 'title', 'slug', 'address', 'content',
        'cuisines', 'price_range', 'venue_type', 'service_fee_inclusive', 'tax_inclusive',
        'service_fee_pct', 'tax_pct', 'slot_minutes',
        'image', 'gallery', 'is_featured',
        'is_guaranteed', 'instant_booking',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'review_score', 'review_count',
    ];

    protected $casts = [
        'cuisines'              => 'array',
        'gallery'               => 'array',
        'is_featured'           => 'boolean',
        'is_guaranteed'         => 'boolean',
        'instant_booking'       => 'boolean',
        'service_fee_inclusive' => 'boolean',
        'tax_inclusive'         => 'boolean',
        'service_fee_pct'       => 'decimal:2',
        'tax_pct'               => 'decimal:2',
        'slot_minutes'          => 'integer',
        'review_score'          => 'decimal:2',
        'submitted_at'          => 'datetime',
        'reviewed_at'           => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (Restaurant $r) => $r->slug ??= Str::slug($r->title) . '-' . Str::random(4));
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class)->orderBy('order');
    }

    public function activeTables(): HasMany
    {
        return $this->tables()->where('is_active', true);
    }

    public function menuSections(): HasMany
    {
        return $this->hasMany(RestaurantMenuSection::class)->orderBy('order');
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(RestaurantMenuItem::class)->orderBy('order');
    }

    // للمطاعم السعر غير أساسي — نرجّع 0 حتى يعمل الـ trait
    public function getPriceAttribute(): float { return 0; }
    public function getSalePriceAttribute(): ?float { return null; }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/rest{$this->id}/600/450";
    }

    public function getUrlAttribute(): string
    {
        return route('restaurants.show', $this->slug);
    }

    /**
     * فترات الحجز المعتمدة (12:00 → 23:00 بفاصل slot_minutes).
     *
     * مصدر حقيقة واحد: العرض والتحقق لازم يستعملوا نفس القايمة.
     * من غير كده الـvalidator كان بيقبل أي "H:i" — يعني 19:15 بيتحسب فترة
     * مختلفة عن 19:00 وياخد نفس الترابيزة، و"9:00" و"09:00" بقوا فترتين.
     */
    public function bookingSlots(): array
    {
        $minutes = max(15, (int) ($this->slot_minutes ?? 90));
        $slots = [];
        $t = \Illuminate\Support\Carbon::parse('12:00');
        $end = \Illuminate\Support\Carbon::parse('23:00');
        while ($t->lte($end)) {
            $slots[] = $t->format('H:i');
            $t->addMinutes($minutes);
        }

        return $slots;
    }

}
