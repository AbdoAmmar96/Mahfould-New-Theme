<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Review;
use App\Services\ProviderRatingService;
use App\Support\Bookables;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * بروفايل عام للمزوّد — V2 §3.
 * يعرض لوجو المزوّد، تقييمه المجمّع، كل عملياته، وكل التقييمات على كل خدماته.
 */
class ProviderProfileController extends Controller
{
    public function show(string $slug, ProviderRatingService $ratings): Response
    {
        $provider = Company::where('slug', $slug)
            ->where('verification_status', 'verified')
            ->firstOrFail();

        // تحديث التقييم المجمّع (خفيف — read + save quiet)
        $ratings->refresh($provider);

        // جمع كل خدمات المزوّد (published فقط)
        $services = collect();
        foreach (Bookables::types() as $type) {
            $class = Bookables::classFor($type);
            if (!$class || !method_exists($class, 'scopePublished')) continue;
            $rows = $class::where('provider_id', $provider->id)
                ->published()
                ->latest()
                ->take(20)
                ->get();
            foreach ($rows as $s) {
                $services->push([
                    'type' => $type,
                    'id' => $s->id,
                    'title' => $s->title,
                    'image_url' => $s->image_url ?? null,
                    'url' => method_exists($s, 'getUrlAttribute') ? $s->url : null,
                    'price' => (float) ($s->sale_price ?? $s->price ?? 0),
                    'review_score' => (float) ($s->review_score ?? 0),
                    'review_count' => (int) ($s->review_count ?? 0),
                    'is_guaranteed' => (bool) ($s->is_guaranteed ?? false),
                ]);
            }
        }

        // آخر تقييمات على كل خدمات المزوّد (mixed types)
        $recentReviews = collect();
        foreach (Bookables::types() as $type) {
            $class = Bookables::classFor($type);
            if (!$class) continue;
            $ids = $class::where('provider_id', $provider->id)->pluck('id');
            if ($ids->isEmpty()) continue;
            Review::where('reviewable_type', $class)
                ->whereIn('reviewable_id', $ids)
                ->where('approved', true)
                ->with('user:id,name')
                ->latest()
                ->take(15)
                ->get()
                ->each(fn ($r) => $recentReviews->push([
                    'name' => $r->user?->name ?? 'زائر',
                    'rating' => $r->rating,
                    'title' => $r->title,
                    'content' => $r->content,
                    'date' => $r->created_at->format('Y-m-d'),
                    'service_type' => $type,
                ]));
        }

        return Inertia::render('Providers/Show', [
            'provider' => [
                'id' => $provider->id,
                'name' => $provider->name,
                'slug' => $provider->slug,
                'logo_url' => $provider->logo ? asset('storage/' . $provider->logo) : null,
                'provider_type' => $provider->provider_type,
                'is_first_party' => $provider->is_first_party,
                'verification_status' => $provider->verification_status,
                'review_score' => (float) $provider->provider_review_score,
                'review_count' => (int) $provider->provider_review_count,
                'about' => $provider->about ?? null,
                'approved_at' => $provider->approved_at?->format('Y-m-d'),
            ],
            'stats' => [
                'services_total' => $services->count(),
                'services_by_type' => $services->groupBy('type')->map->count(),
                'breakdown' => $ratings->breakdown($provider),
            ],
            'services' => $services->values(),
            'reviews' => $recentReviews->sortByDesc('date')->take(20)->values(),
        ]);
    }
}
