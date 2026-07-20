<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use App\Models\Concerns\HasProvider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SahbPackage extends Model
{
    use HasFactory, Bookable, HasProvider;

    protected $table = 'sahb_packages';

    protected $fillable = [
        'title', 'slug', 'occasion', 'short_desc', 'content', 'price',
        'price_from', 'image', 'includes', 'badge', 'is_featured',
        'user_id', 'provider_id',
        'status', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason',
        'order',
    ];

    protected $casts = [
        'includes'    => 'array',
        'price_from'  => 'boolean',
        'is_featured' => 'boolean',
        'price'       => 'decimal:2',
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (SahbPackage $p) => $p->slug ??= Str::slug($p->title) . '-' . Str::random(4));
    }

    public function getSalePriceAttribute(): ?float { return null; }

    public function getImageUrlAttribute(): string
    {
        if ($this->image && str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/sahb{$this->id}/600/450";
    }
}
