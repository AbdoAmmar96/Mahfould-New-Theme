<?php

namespace App\Http\Controllers;

use App\Models\Location;
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

            'featured' => Tour::published()
                ->with('location:id,name')
                ->where('is_featured', true)
                ->latest()
                ->take(4)
                ->get()
                ->map(fn ($t) => $this->tourCard($t)),

            'packages' => SahbPackage::published()
                ->orderBy('order')
                ->take(3)
                ->get()
                ->map(fn ($p) => [
                    'title'     => $p->title,
                    'short_desc'=> $p->short_desc,
                    'price'     => (float) $p->price,
                    'badge'     => $p->badge,
                ]),
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
}
