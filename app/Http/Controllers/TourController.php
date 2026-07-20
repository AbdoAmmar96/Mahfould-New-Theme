<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Review;
use App\Models\Tour;
use App\Services\ValueScoreService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TourController extends Controller
{
    public function index(Request $request, ValueScoreService $value): Response
    {
        $query = Tour::published()->with('location:id,name')->withCount('activities');

        // فلترة بالوجهة
        if ($slug = $request->query('location')) {
            $query->whereHas('location', fn ($q) => $q->where('slug', $slug));
        }

        // فلترة بالسعر
        if ($max = $request->query('max_price')) {
            $query->where('price', '<=', (float) $max);
        }

        // ترتيب — value = أفضل قيمة (§12)
        $sort = $request->query('sort');
        if ($sort === 'value') {
            // في وضع القيمة نجيب كل النتائج ونرتّبها ثم نصفّحها يدوياً
            $all = $value->markBestValueBadge($value->scoreCollection($query->get()));
            $sorted = $all->sortByDesc('value_score')->values();
            $tours = new \Illuminate\Pagination\LengthAwarePaginator(
                $sorted->forPage($request->query('page', 1), 9)->values(),
                $sorted->count(),
                9,
                $request->query('page', 1),
                ['path' => $request->url(), 'query' => $request->query()],
            );
        } else {
            match ($sort) {
                'price_asc'  => $query->orderBy('price'),
                'rating'     => $query->orderByDesc('review_score'),
                default      => $query->latest(),
            };
            $paged = $query->paginate(9)->withQueryString();
            // احسب value_score حتى في غير وضع value لعرض الشارة على أفضل قيمة داخل الصفحة
            $scored = $value->markBestValueBadge($value->scoreCollection(collect($paged->items())));
            $paged->setCollection($scored);
            $tours = $paged;
        }

        $mapItem = fn ($t) => [
            'id'            => $t->id,
            'title'         => $t->title,
            'slug'          => $t->slug,
            'url'           => $t->url,
            'image_url'     => $t->image_url,
            'location'      => $t->location?->name,
            'short_desc'    => $t->short_desc,
            'duration_days' => $t->duration_days,
            'price'         => (float) $t->price,
            'sale_price'    => $t->sale_price ? (float) $t->sale_price : null,
            'is_guaranteed' => $t->is_guaranteed,
            'is_featured'   => $t->is_featured,
            'review_score'  => (float) $t->review_score,
            'review_count'  => $t->review_count,
            'value_score'   => isset($t->value_score) ? (float) $t->value_score : null,
            'is_best_value' => (bool) ($t->is_best_value ?? false),
        ];

        return Inertia::render('Tours/Index', [
            'tours'   => $sort === 'value'
                ? tap($tours, fn ($p) => $p->setCollection($p->getCollection()->map($mapItem)))
                : $tours->through($mapItem),
            'locations' => Location::withCount('tours')->orderBy('order')->get()
                ->map(fn ($l) => ['name' => $l->name, 'slug' => $l->slug, 'count' => $l->tours_count]),
            'filters' => (object) $request->only(['location', 'max_price', 'sort']),
        ]);
    }

    public function show(Tour $tour): Response
    {
        abort_if($tour->status !== 'publish', 404);

        $tour->load([
            'location',
            'amenities',
            'activeActivities',
            'itineraries' => fn ($q) => $q->orderBy('day_number'),
        ]);

        return Inertia::render('Tours/Show', [
            'tour' => [
                'id'            => $tour->id,
                'title'         => $tour->title,
                'slug'          => $tour->slug,
                'content'       => $tour->content,
                'short_desc'    => $tour->short_desc,
                'image_url'     => $tour->image_url,
                'gallery'       => $tour->gallery ?: [],
                'location'      => $tour->location?->name,
                'duration_days' => $tour->duration_days,
                'max_people'    => $tour->max_people,
                'price'         => (float) $tour->price,
                'sale_price'    => $tour->sale_price ? (float) $tour->sale_price : null,
                'is_guaranteed' => $tour->is_guaranteed,
                'review_score'  => (float) $tour->review_score,
                'review_count'  => $tour->review_count,
                // JSON itinerary القديم (fallback لو الجدول الجديد فاضي)
                'itinerary'     => $tour->itinerary ?: [],
                'included'      => $tour->included ?: [],
                // مخطط زمني يوم بيوم (جديد)
                'itineraries'   => $tour->itineraries->map(fn ($d) => [
                    'day' => $d->day_number,
                    'title' => $d->title,
                    'description' => $d->description,
                    'highlights' => $d->highlights ?: [],
                    'image' => $d->image,
                ])->values(),
                // فعاليات اختيارية add-ons
                'activities'    => $tour->activeActivities->map(fn ($a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'short_desc' => $a->short_desc,
                    'description' => $a->description,
                    'price' => (float) $a->price,
                    'image_url' => $a->image_url,
                    'icon' => $a->icon,
                    'is_default' => $a->is_default,
                ])->values(),
                'checkout_url'  => route('booking.create', ['type' => 'tour', 'id' => $tour->id]),
            ],
            'reviews'     => Review::forReviewable($tour)->latest()->take(10)->get()
                ->map(fn ($r) => ['name' => $r->user?->name ?? 'زائر', 'rating' => $r->rating, 'title' => $r->title, 'content' => $r->content, 'date' => $r->created_at->format('Y-m-d')]),
            'review_type' => 'tour',
            'review_id'   => $tour->id,
        ]);
    }
}
