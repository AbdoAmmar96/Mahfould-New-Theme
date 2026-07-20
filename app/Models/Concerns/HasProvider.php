<?php

namespace App\Models\Concerns;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trait مشترك لكل خدمة قابلة للانتماء لمزوّد + خضوع لسير موافقة (V2-BLUEPRINT §1.1, §3).
 *
 * الاستعمال في الموديل:
 *   use HasProvider;
 *   ثم أضف الحقول لـ$fillable + casts:
 *     'provider_id', 'publish_state', 'submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason'
 *     casts: submitted_at + reviewed_at => datetime
 */
trait HasProvider
{
    // ── Relations ──

    /** المزوّد المالك (NULL = طرف أول محفول مكفول) */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'provider_id');
    }

    // ── Scopes ──

    /** الخدمات التي رأى العميل — publish_state='published' */
    public function scopePublished(Builder $q): Builder
    {
        return $q->where('publish_state', 'published');
    }

    public function scopePendingReview(Builder $q): Builder
    {
        return $q->where('publish_state', 'pending_review');
    }

    public function scopeDrafts(Builder $q): Builder
    {
        return $q->where('publish_state', 'draft');
    }

    /** خدمات طرف أول (مملوكة لمحفول مكفول) */
    public function scopeFirstParty(Builder $q): Builder
    {
        return $q->whereNull('provider_id');
    }

    /** خدمات مزوّد معيّن */
    public function scopeForProvider(Builder $q, int $providerId): Builder
    {
        return $q->where('provider_id', $providerId);
    }

    // ── Helpers ──

    public function isFirstParty(): bool
    {
        return $this->provider_id === null;
    }

    public function isPublished(): bool
    {
        return $this->publish_state === 'published';
    }

    public function isPendingReview(): bool
    {
        return $this->publish_state === 'pending_review';
    }
}
