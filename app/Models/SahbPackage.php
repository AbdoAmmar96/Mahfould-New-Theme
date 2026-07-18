<?php

namespace App\Models;

use App\Models\Concerns\Bookable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SahbPackage extends Model
{
    use HasFactory, Bookable;

    protected $table = 'sahb_packages';

    protected $fillable = [
        'title', 'slug', 'occasion', 'short_desc', 'content', 'price',
        'price_from', 'image', 'includes', 'badge', 'is_featured', 'status', 'order',
    ];

    protected $casts = [
        'includes'    => 'array',
        'price_from'  => 'boolean',
        'is_featured' => 'boolean',
        'price'       => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(fn (SahbPackage $p) => $p->slug ??= Str::slug($p->title) . '-' . Str::random(4));
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'publish');
    }

    public function getSalePriceAttribute(): ?float { return null; }

    public function getImageUrlAttribute(): string
    {
        return $this->image
            ? asset('storage/' . $this->image)
            : "https://picsum.photos/seed/sahb{$this->id}/600/450";
    }
}
