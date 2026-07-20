<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مستند توثيق للمزوّد — V2-BLUEPRINT §1.1.
 *
 * الأنواع المعتمدة:
 *   commercial_register  = السجل التجاري
 *   tax_card             = البطاقة الضريبية
 *   tourism_license      = الترخيص السياحي
 *   national_id          = بطاقة الرقم القومي (الأفراد)
 *   criminal_record      = فيش وتشبيه (إلزامي للأفراد قبل الموافقة)
 *   other                = مستند إضافي
 */
class ProviderDocument extends Model
{
    public const TYPE_LABELS = [
        'commercial_register' => 'السجل التجاري',
        'tax_card'            => 'البطاقة الضريبية',
        'tourism_license'     => 'الترخيص السياحي',
        'national_id'         => 'بطاقة الرقم القومي',
        'criminal_record'     => 'فيش وتشبيه',
        'other'               => 'مستند آخر',
    ];

    protected $fillable = [
        'company_id', 'doc_type', 'title', 'file_path', 'file_mime', 'file_size',
        'expires_at', 'status', 'notes', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'expires_at' => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->doc_type] ?? $this->doc_type;
    }

    public function getFileUrlAttribute(): string
    {
        if ($this->file_path && str_starts_with($this->file_path, 'http')) {
            return $this->file_path;
        }
        return $this->file_path ? asset('storage/' . $this->file_path) : '';
    }
}
