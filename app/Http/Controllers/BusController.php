<?php

namespace App\Http\Controllers;

use App\Models\BusRoute;
use App\Models\BusStation;
use App\Models\BusTrip;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * الباصات — V2-BLUEPRINT §10.
 *
 * index: صفحة تجميعية تعرض كل الرحلات القادمة (مجمّعة مع الخط + الشركة/اللوجو).
 * route: صفحة خط معيّن (كل رحلاته + المحطات المرتّبة).
 */
class BusController extends Controller
{
    public function index(Request $request): Response
    {
        $trips = BusTrip::query()
            ->with(['route.fromStation', 'route.toStation', 'route.provider'])
            ->upcoming()
            ->when($request->query('from'), fn ($q, $city) =>
                $q->whereHas('route.fromStation', fn ($s) => $s->where('city', $city)))
            ->when($request->query('to'), fn ($q, $city) =>
                $q->whereHas('route.toStation', fn ($s) => $s->where('city', $city)))
            ->when($request->query('date'), fn ($q, $d) =>
                $q->whereDate('departs_at', $d))
            ->paginate(12)->withQueryString();

        return Inertia::render('Buses/Index', [
            'trips' => $trips->through(fn (BusTrip $t) => [
                'id' => $t->id,
                'route_name' => $t->route?->name,
                'from' => $t->route?->fromStation?->name,
                'to' => $t->route?->toStation?->name,
                'departs_at' => $t->departs_at->format('Y-m-d H:i'),
                'arrives_at' => optional($t->arrives_at)->format('Y-m-d H:i'),
                'duration_minutes' => $t->route?->duration_minutes,
                'seats_total' => $t->seats_total,
                'seats_remaining' => $this->remaining($t),
                'price' => $t->price,
                'provider' => $t->route?->provider ? [
                    'name' => $t->route->provider->name,
                    'logo_url' => $t->route->provider->logo_url,
                    'is_first_party' => $t->route->provider->is_first_party,
                    'verified' => $t->route->provider->isVerified(),
                ] : null,
                'checkout_url' => route('booking.create', ['type' => 'bus_trip', 'id' => $t->id]),
            ]),
            'cities' => BusStation::query()->distinct()->pluck('city')->values(),
            'filters' => (object) $request->only(['from', 'to', 'date']),
        ]);
    }

    /** كل خط بمحطاته ورحلاته (اختياري للمرحلة القادمة) */
    public function route(BusRoute $route): Response
    {
        $route->load(['stations', 'trips' => fn ($q) => $q->upcoming(), 'provider']);
        return Inertia::render('Buses/Route', [
            'route' => [
                'id' => $route->id,
                'name' => $route->name,
                'slug' => $route->slug,
                'from' => $route->fromStation?->name,
                'to' => $route->toStation?->name,
                'duration_minutes' => $route->duration_minutes,
                'stations' => $route->stations->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'city' => $s->city,
                    'order' => $s->pivot->order,
                    'zone_number' => $s->pivot->zone_number,
                ]),
                'trips' => $route->trips->map(fn ($t) => [
                    'id' => $t->id,
                    'departs_at' => $t->departs_at->format('Y-m-d H:i'),
                    'seats_total' => $t->seats_total,
                    'seats_remaining' => $this->remaining($t),
                    'price' => $t->price,
                    'checkout_url' => route('booking.create', ['type' => 'bus_trip', 'id' => $t->id]),
                ]),
                'provider' => $route->provider ? [
                    'name' => $route->provider->name,
                    'logo_url' => $route->provider->logo_url,
                    'verified' => $route->provider->isVerified(),
                ] : null,
            ],
        ]);
    }

    private function remaining(BusTrip $trip): int
    {
        $booked = \App\Models\BookingItem::query()->active()
            ->forUnit('bus_trip', $trip->id, 'TRIP')
            ->whereDate('date', $trip->departs_at->toDateString())
            ->count();
        return max(0, $trip->seats_total - $booked);
    }
}
