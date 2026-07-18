<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\Location;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CarController extends Controller
{
    public function index(Request $request): Response
    {
        $cars = Car::published()->with('location:id,name')
            ->when($request->query('location'), fn ($q, $s) =>
                $q->whereHas('location', fn ($qq) => $qq->where('slug', $s)))
            ->when($request->query('transmission'), fn ($q, $t) => $q->where('transmission', $t))
            ->latest()->paginate(9)->withQueryString();

        return Inertia::render('Cars/Index', [
            'cars' => $cars->through(fn ($c) => [
                'id'            => $c->id,
                'title'         => $c->title,
                'slug'          => $c->slug,
                'url'           => $c->url,
                'image_url'     => $c->image_url,
                'location'      => $c->location?->name,
                'brand'         => $c->brand,
                'transmission'  => $c->transmission,
                'seats'         => $c->seats,
                'with_driver'   => $c->with_driver,
                'price'         => (float) $c->price,
                'sale_price'    => $c->sale_price ? (float) $c->sale_price : null,
                'is_guaranteed' => $c->is_guaranteed,
                'is_featured'   => $c->is_featured,
                'review_score'  => (float) $c->review_score,
                'review_count'  => $c->review_count,
            ]),
            'locations' => Location::orderBy('order')->get()
                ->map(fn ($l) => ['name' => $l->name, 'slug' => $l->slug]),
            'filters' => $request->only(['location', 'transmission']),
        ]);
    }

    public function show(Car $car): Response
    {
        abort_if($car->status !== 'publish', 404);
        $car->load('location');

        return Inertia::render('Cars/Show', [
            'car' => [
                'id'            => $car->id,
                'title'         => $car->title,
                'content'       => $car->content,
                'image_url'     => $car->image_url,
                'gallery'       => $car->gallery ?: [],
                'location'      => $car->location?->name,
                'brand'         => $car->brand,
                'transmission'  => $car->transmission,
                'seats'         => $car->seats,
                'with_driver'   => $car->with_driver,
                'price'         => (float) $car->price,
                'sale_price'    => $car->sale_price ? (float) $car->sale_price : null,
                'is_guaranteed' => $car->is_guaranteed,
                'review_score'  => (float) $car->review_score,
                'review_count'  => $car->review_count,
                'checkout_url'  => route('booking.create', ['type' => 'car', 'id' => $car->id]),
            ],
            'reviews'       => Review::forReviewable($car)->latest()->take(10)->get()
                ->map(fn ($r) => ['name' => $r->user?->name ?? 'زائر', 'rating' => $r->rating, 'title' => $r->title, 'content' => $r->content, 'date' => $r->created_at->format('Y-m-d')]),
            'review_type'   => 'car',
            'review_id'     => $car->id,
        ]);
    }
}
