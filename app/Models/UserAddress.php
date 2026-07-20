<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * عنوان متعدّد للعميل — V2-BLUEPRINT §12.
 * البيت / الشغل / الساحل / أي عنوان محفوظ.
 */
class UserAddress extends Model
{
    protected $fillable = [
        'user_id', 'label', 'address', 'city', 'lat', 'lng', 'notes', 'is_default', 'order',
    ];

    protected $casts = [
        'lat' => 'decimal:7',
        'lng' => 'decimal:7',
        'is_default' => 'boolean',
        'order' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted(): void
    {
        // لو حط address كـdefault يشيل باقي الـdefaults
        static::saving(function (UserAddress $addr) {
            if ($addr->is_default && $addr->user_id) {
                static::where('user_id', $addr->user_id)
                    ->where('id', '!=', $addr->id ?? 0)
                    ->update(['is_default' => false]);
            }
        });
    }
}
