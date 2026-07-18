<?php

namespace App\Http\Controllers;

use App\Models\SahbPackage;
use Inertia\Inertia;
use Inertia\Response;

class SahbController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Sahb/Index', [
            'packages' => SahbPackage::published()->orderBy('order')->get()
                ->map(fn ($p) => [
                    'id'           => $p->id,
                    'title'        => $p->title,
                    'occasion'     => $p->occasion,
                    'short_desc'   => $p->short_desc,
                    'image_url'    => $p->image_url,
                    'price'        => (float) $p->price,
                    'price_from'   => $p->price_from,
                    'badge'        => $p->badge,
                    'checkout_url' => route('booking.create', ['type' => 'sahb', 'id' => $p->id]),
                ]),
        ]);
    }
}
