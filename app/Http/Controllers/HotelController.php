<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\Location;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HotelController extends Controller
{
    public function index(Request $request): Response
    {
        $hotels = Hotel::published()->with('location:id,name')
            ->when($request->query('location'), fn ($q, $s) =>
                $q->whereHas('location', fn ($qq) => $qq->where('slug', $s)))
            ->latest()->paginate(9)->withQueryString();

        return Inertia::render('Hotels/Index', [
            'hotels' => $hotels->through(fn ($h) => [
                'id'            => $h->id,
                'title'         => $h->title,
                'slug'          => $h->slug,
                'url'           => $h->url,
                'image_url'     => $h->image_url,
                'location'      => $h->location?->name,
                'short_desc'    => $h->short_desc,
                'star_rating'   => $h->star_rating,
                'price'         => (float) $h->price,
                'sale_price'    => $h->sale_price ? (float) $h->sale_price : null,
                'is_guaranteed' => $h->is_guaranteed,
                'is_featured'   => $h->is_featured,
                'review_score'  => (float) $h->review_score,
                'review_count'  => $h->review_count,
            ]),
            'locations' => Location::withCount('hotels')->orderBy('order')->get()
                ->map(fn ($l) => ['name' => $l->name, 'slug' => $l->slug, 'count' => $l->hotels_count]),
            'filters' => (object) $request->only(['location']),
        ]);
    }

    public function show(Hotel $hotel): Response
    {
        abort_if($hotel->status !== 'publish', 404);
        $hotel->load('location', 'amenities', 'activeRoomTypes');

        return Inertia::render('Hotels/Show', [
            'hotel' => [
                'id'           => $hotel->id,
                'slug'         => $hotel->slug,
                'title'        => $hotel->title,
                'content'      => $hotel->content,
                'image_url'    => $hotel->image_url,
                'gallery'      => $hotel->gallery ?: [],
                'location'     => $hotel->location?->name,
                'star_rating'  => $hotel->star_rating,
                // السعر المسطّح للفندق (يُبقى للعرض الافتراضي كـ"يبدأ من")
                'price'        => (float) $hotel->price,
                'sale_price'   => $hotel->sale_price ? (float) $hotel->sale_price : null,
                'review_score' => (float) $hotel->review_score,
                'review_count' => $hotel->review_count,
                'availability_url' => route('availability.hotel', $hotel->slug),
            ],
            // §7: أنواع الغرف — كل نوع بمخزونه وسعره
            'room_types' => $hotel->activeRoomTypes->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'description' => $r->description,
                'capacity' => $r->capacity_per_night,
                'units_total' => $r->units_total,
                'price' => (float) $r->price_per_night,
                'sale_price' => $r->sale_price_per_night ? (float) $r->sale_price_per_night : null,
                'effective_price' => $r->effective_price,
                'includes_breakfast' => $r->includes_breakfast,
                'image_url' => $r->image_url,
                // رابط الحجز للنوع المحدد
                'checkout_url' => route('booking.create', ['type' => 'hotel', 'id' => $hotel->id]) . '?room_type_id=' . $r->id,
            ])->values(),
            'reviews'     => Review::forReviewable($hotel)->latest()->take(10)->get()
                ->map(fn ($r) => ['name' => $r->user?->name ?? 'زائر', 'rating' => $r->rating, 'title' => $r->title, 'content' => $r->content, 'date' => $r->created_at->format('Y-m-d')]),
            'review_type' => 'hotel',
            'review_id'   => $hotel->id,
        ]);
    }
}
