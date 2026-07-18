<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Review;
use App\Models\Tour;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TourController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Tour::published()->with('location:id,name');

        // فلترة بالوجهة
        if ($slug = $request->query('location')) {
            $query->whereHas('location', fn ($q) => $q->where('slug', $slug));
        }

        // فلترة بالسعر
        if ($max = $request->query('max_price')) {
            $query->where('price', '<=', (float) $max);
        }

        // ترتيب
        match ($request->query('sort')) {
            'price_asc'  => $query->orderBy('price'),
            'rating'     => $query->orderByDesc('review_score'),
            default      => $query->latest(),
        };

        $tours = $query->paginate(9)->withQueryString();

        return Inertia::render('Tours/Index', [
            'tours'   => $tours->through(fn ($t) => [
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
            ]),
            'locations' => Location::withCount('tours')->orderBy('order')->get()
                ->map(fn ($l) => ['name' => $l->name, 'slug' => $l->slug, 'count' => $l->tours_count]),
            'filters' => $request->only(['location', 'max_price', 'sort']),
        ]);
    }

    public function show(Tour $tour): Response
    {
        abort_if($tour->status !== 'publish', 404);

        $tour->load('location', 'amenities');

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
                'itinerary'     => $tour->itinerary ?: [],
                'included'      => $tour->included ?: [],
                'checkout_url'  => route('booking.create', ['type' => 'tour', 'id' => $tour->id]),
            ],
            'reviews'     => Review::forReviewable($tour)->latest()->take(10)->get()
                ->map(fn ($r) => ['name' => $r->user?->name ?? 'زائر', 'rating' => $r->rating, 'title' => $r->title, 'content' => $r->content, 'date' => $r->created_at->format('Y-m-d')]),
            'review_type' => 'tour',
            'review_id'   => $tour->id,
        ]);
    }
}
