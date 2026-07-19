<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Location;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\SahbPackage;
use App\Models\Tour;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Home', [
            'locations' => Location::query()
                ->where('is_featured', true)
                ->withCount('tours')
                ->orderBy('order')
                ->take(4)
                ->get()
                ->map(fn ($l) => [
                    'name'        => $l->name,
                    'slug'        => $l->slug,
                    'image_url'   => $l->image_url,
                    'tours_count' => $l->tours_count,
                    'url'         => $l->url,
                ]),

            // رحلات مختارة
            'featured' => Tour::published()
                ->with('location:id,name')
                ->orderByDesc('is_featured')
                ->latest()
                ->take(4)
                ->get()
                ->map(fn ($t) => $this->tourCard($t)),

            // فنادق مختارة
            'hotels' => Hotel::published()
                ->with('location:id,name')
                ->orderByDesc('is_featured')
                ->latest()
                ->take(4)
                ->get()
                ->map(fn ($h) => $this->hotelCard($h)),

            // مطاعم يوصّى بيها
            'restaurants' => Restaurant::published()
                ->with('location:id,name')
                ->orderByDesc('is_featured')
                ->latest()
                ->take(3)
                ->get()
                ->map(fn ($r) => $this->restaurantCard($r)),

            // عربيات جاهزة
            'cars' => Car::published()
                ->with('location:id,name')
                ->orderByDesc('is_featured')
                ->latest()
                ->take(4)
                ->get()
                ->map(fn ($c) => $this->carCard($c)),

            // باكدجات صاحب السعادة
            'packages' => SahbPackage::published()
                ->orderBy('order')
                ->take(3)
                ->get()
                ->map(fn ($p) => [
                    'title'      => $p->title,
                    'short_desc' => $p->short_desc,
                    'price'      => (float) $p->price,
                    'badge'      => $p->badge,
                ]),

            // آراء العملاء (تقييمات معتمدة عالية)
            'testimonials' => Review::query()
                ->where('approved', true)
                ->where('rating', '>=', 4)
                ->with(['user:id,name', 'reviewable'])
                ->latest()
                ->take(6)
                ->get()
                ->map(fn ($r) => [
                    'name'    => $r->user?->name ?? 'عميل محفول مكفول',
                    'rating'  => (int) $r->rating,
                    'title'   => $r->title,
                    'content' => $r->content,
                    'service' => $r->reviewable?->title,
                ]),

            // أرقام المنصة
            'stats' => [
                'services'     => Tour::count() + Hotel::count() + Restaurant::count() + Car::count(),
                'destinations' => Location::count(),
                'bookings'     => Booking::where('payment_status', 'paid')->count(),
            ],
        ]);
    }

    private function tourCard(Tour $t): array
    {
        return [
            'id'            => $t->id,
            'title'         => $t->title,
            'slug'          => $t->slug,
            'url'           => $t->url,
            'image_url'     => $t->image_url,
            'location'      => $t->location?->name,
            'duration_days' => $t->duration_days,
            'price'         => (float) $t->price,
            'sale_price'    => $t->sale_price ? (float) $t->sale_price : null,
            'is_guaranteed' => $t->is_guaranteed,
            'is_featured'   => $t->is_featured,
            'review_score'  => (float) $t->review_score,
        ];
    }

    private function hotelCard(Hotel $h): array
    {
        $stars = str_repeat('⭐', (int) $h->star_rating);

        return [
            'id'            => $h->id,
            'title'         => $h->title,
            'url'           => $h->url,
            'image_url'     => $h->image_url,
            'location'      => $h->location?->name,
            'meta'          => trim($stars.' · '.($h->location?->name ?? ''), ' ·'),
            'price'         => (float) $h->price,
            'sale_price'    => $h->sale_price ? (float) $h->sale_price : null,
            'is_guaranteed' => $h->is_guaranteed,
            'is_featured'   => $h->is_featured,
            'review_score'  => (float) $h->review_score,
        ];
    }

    private function restaurantCard(Restaurant $r): array
    {
        return [
            'id'            => $r->id,
            'title'         => $r->title,
            'url'           => $r->url,
            'image_url'     => $r->image_url,
            'location'      => $r->location?->name,
            'address'       => $r->address,
            'cuisines'      => $r->cuisines ?: [],
            'price_range'   => $r->price_range,
            'instant'       => $r->instant_booking,
            'is_guaranteed' => $r->is_guaranteed,
            'review_score'  => (float) $r->review_score,
            'review_count'  => $r->review_count,
        ];
    }

    private function carCard(Car $c): array
    {
        $trans = $c->transmission === 'manual' ? 'مانيوال' : 'أوتوماتيك';

        return [
            'id'            => $c->id,
            'title'         => $c->title,
            'url'           => $c->url,
            'image_url'     => $c->image_url,
            'location'      => $c->location?->name,
            'meta'          => $trans.' · '.$c->seats.' ركاب'.($c->with_driver ? ' · بسائق' : ''),
            'price'         => (float) $c->price,
            'sale_price'    => $c->sale_price ? (float) $c->sale_price : null,
            'is_guaranteed' => $c->is_guaranteed,
            'is_featured'   => $c->is_featured,
            'review_score'  => (float) $c->review_score,
        ];
    }
}
