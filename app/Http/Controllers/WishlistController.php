<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Support\Bookables;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    /** إضافة/إزالة من المفضلة (toggle) */
    public function toggle(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(Bookables::types())],
            'id'   => ['required', 'integer'],
        ]);

        $model = Bookables::resolve($data['type'], $data['id']);
        abort_unless($model !== null, 404);

        $existing = Wishlist::where('user_id', $request->user()->id)
            ->where('wishable_type', $model::class)
            ->where('wishable_id', $model->getKey())
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            Wishlist::create([
                'user_id'       => $request->user()->id,
                'wishable_type' => $model::class,
                'wishable_id'   => $model->getKey(),
            ]);
        }

        return back(); // الحالة الجديدة بترجع تلقائياً في shared props
    }

    /** صفحة المفضلة */
    public function index(Request $request): Response
    {
        $items = $request->user()->wishlists()->with('wishable')->latest()->get()
            ->filter(fn ($w) => $w->wishable !== null)
            ->map(function ($w) {
                $m = $w->wishable;
                return [
                    'type'      => Bookables::typeFor($m),
                    'id'        => $m->getKey(),
                    'title'     => $m->title,
                    'url'       => $m->url ?? '#',
                    'image_url' => $m->image_url,
                    'location'  => $m->location?->name ?? '',
                    'price'     => (float) ($m->sale_price ?? $m->price ?? 0),
                ];
            })->values();

        return Inertia::render('Account/Wishlist', ['items' => $items]);
    }
}
