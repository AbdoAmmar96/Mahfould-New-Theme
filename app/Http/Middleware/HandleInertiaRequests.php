<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Support\Bookables;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'       => $request->user()->id,
                    'name'     => $request->user()->name,
                    'initials' => $request->user()->initials,
                    'role'     => $request->user()->role,
                ] : null,
            ],
            // مفاتيح المفضلة ("tour:5") عشان القلوب تظهر معبّية
            'wishlist' => fn () => $request->user()
                ? $request->user()->wishlists()->get()
                    ->map(fn ($w) => (Bookables::typeFor($w->wishable_type) ?? '') . ':' . $w->wishable_id)
                    ->filter()->values()
                : [],
            'site' => [
                'name'            => Setting::get('site_title', 'محفول مكفول'),
                'currency_symbol' => Setting::get('currency_symbol', 'ج.م'),
                'phone'           => Setting::get('contact_phone', ''),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
