<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'slug', 'excerpt', 'body', 'is_published', 'order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(fn (Page $p) => $p->slug ??= Str::slug($p->title) ?: Str::random(8));
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
