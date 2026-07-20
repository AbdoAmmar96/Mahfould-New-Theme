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
        $query = Car::published()->with('location:id,name');

        // بحث نصّي
        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('brand', 'like', "%{$q}%")
                    ->orWhereHas('location', fn ($l) => $l->where('name', 'like', "%{$q}%"));
            });
        }

        if ($slug = $request->query('location')) $query->whereHas('location', fn ($qq) => $qq->where('slug', $slug));
        if ($t = $request->query('transmission')) $query->where('transmission', $t);
        if ($b = $request->query('brand')) $query->where('brand', $b);
        if ($request->query('with_driver') !== null && $request->query('with_driver') !== '') {
            $query->where('with_driver', $request->boolean('with_driver'));
        }
        if ($seats = $request->query('min_seats')) $query->where('seats', '>=', (int) $seats);
        if ($max = $request->query('max_price')) $query->where('price', '<=', (float) $max);

        match ($request->query('sort')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating' => $query->orderByDesc('review_score'),
            default => $query->latest(),
        };

        $cars = $query->paginate(9)->withQueryString();

        // كل الماركات المتاحة (للفلتر)
        $brands = Car::published()->distinct()->pluck('brand')->filter()->values();

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
            'brands' => $brands,
            'filters' => (object) $request->only(['q', 'location', 'transmission', 'brand', 'with_driver', 'min_seats', 'max_price', 'sort']),
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
