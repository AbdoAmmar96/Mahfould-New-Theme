<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    public function index(Request $request): Response
    {
        $items = Restaurant::published()->with('location:id,name')
            ->latest()->paginate(9)->withQueryString();

        return Inertia::render('Restaurants/Index', [
            'restaurants' => $items->through(fn ($r) => [
                'id'            => $r->id,
                'title'         => $r->title,
                'slug'          => $r->slug,
                'url'           => $r->url,
                'image_url'     => $r->image_url,
                'location'      => $r->location?->name,
                'address'       => $r->address,
                'cuisines'      => $r->cuisines ?: [],
                'price_range'   => $r->price_range,
                'instant'       => $r->instant_booking,
                'is_guaranteed' => $r->is_guaranteed,
                'is_featured'   => $r->is_featured,
                'review_score'  => (float) $r->review_score,
                'review_count'  => $r->review_count,
            ]),
        ]);
    }

    public function show(Restaurant $restaurant): Response
    {
        abort_if($restaurant->status !== 'publish', 404);

        return Inertia::render('Restaurants/Show', [
            'restaurant' => [
                'id'           => $restaurant->id,
                'title'        => $restaurant->title,
                'content'      => $restaurant->content,
                'image_url'    => $restaurant->image_url,
                'gallery'      => $restaurant->gallery ?: [],
                'address'      => $restaurant->address,
                'cuisines'     => $restaurant->cuisines ?: [],
                'price_range'  => $restaurant->price_range,
                'review_score' => (float) $restaurant->review_score,
                'checkout_url' => route('booking.create', ['type' => 'restaurant', 'id' => $restaurant->id]),
            ],
            'reviews'     => Review::forReviewable($restaurant)->latest()->take(10)->get()
                ->map(fn ($r) => ['name' => $r->user?->name ?? 'زائر', 'rating' => $r->rating, 'title' => $r->title, 'content' => $r->content, 'date' => $r->created_at->format('Y-m-d')]),
            'review_type' => 'restaurant',
            'review_id'   => $restaurant->id,
        ]);
    }
}
