<?php

namespace App\Http\Controllers;

use App\Models\DeliveryOrder;
use App\Models\DeliveryService;
use App\Services\PersonalizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryController extends Controller
{
    /** قائمة خدمات التوصيل — الأقرب أولاً لو موقع معروف */
    public function index(Request $request, PersonalizationService $personalization): Response
    {
        $services = DeliveryService::published()
            ->with('provider:id,name,slug,logo,provider_review_score')
            ->get();

        // ترتيب بالمسافة لو موقع العميل معروف
        $userLoc = $personalization->resolveUserLocation($request);
        if ($userLoc) {
            $services = $services->map(function ($s) use ($personalization, $userLoc) {
                if ($s->base_lat && $s->base_lng) {
                    $s->distance_km = round($personalization->haversineKm(
                        $userLoc['lat'], $userLoc['lng'],
                        (float) $s->base_lat, (float) $s->base_lng,
                    ), 1);
                }
                return $s;
            })->sortBy(fn ($s) => $s->distance_km ?? PHP_INT_MAX)->values();
        }

        return Inertia::render('Delivery/Index', [
            'services' => $services->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'slug' => $s->slug,
                'image_url' => $s->image_url,
                'description' => $s->description,
                'vehicle_type' => $s->vehicle_type,
                'max_kg' => $s->max_kg,
                'city' => $s->city,
                'base_fare' => (float) $s->base_fare,
                'price_per_km' => (float) $s->price_per_km,
                'min_fare' => (float) $s->min_fare,
                'service_radius_km' => (int) $s->service_radius_km,
                'review_score' => (float) $s->review_score,
                'review_count' => (int) $s->review_count,
                'distance_km' => $s->distance_km ?? null,
                'provider' => $s->provider ? [
                    'name' => $s->provider->name,
                    'slug' => $s->provider->slug,
                    'logo_url' => $s->provider->logo ? asset('storage/' . $s->provider->logo) : null,
                    'review_score' => (float) $s->provider->provider_review_score,
                ] : null,
            ])->values(),
            'user_location' => $userLoc,
        ]);
    }

    /** تقدير الأجرة قبل الحجز — endpoint خفيف */
    public function estimate(Request $request, PersonalizationService $personalization)
    {
        $data = $request->validate([
            'delivery_service_id' => ['required', 'integer', 'exists:delivery_services,id'],
            'pickup_lat' => ['required', 'numeric'],
            'pickup_lng' => ['required', 'numeric'],
            'dropoff_lat' => ['required', 'numeric'],
            'dropoff_lng' => ['required', 'numeric'],
        ]);

        $service = DeliveryService::findOrFail($data['delivery_service_id']);
        $km = $personalization->haversineKm(
            (float) $data['pickup_lat'], (float) $data['pickup_lng'],
            (float) $data['dropoff_lat'], (float) $data['dropoff_lng'],
        );
        $fare = $service->estimateFare($km);

        // في نطاق الخدمة؟
        $withinRadius = $km <= $service->service_radius_km;

        return response()->json([
            'distance_km' => round($km, 2),
            'estimated_fare' => round($fare, 2),
            'within_radius' => $withinRadius,
            'service_radius_km' => (int) $service->service_radius_km,
            'breakdown' => [
                'base_fare' => (float) $service->base_fare,
                'price_per_km' => (float) $service->price_per_km,
                'km' => round($km, 2),
                'min_fare' => (float) $service->min_fare,
            ],
        ]);
    }

    /** إنشاء طلب توصيل */
    public function store(Request $request, PersonalizationService $personalization): RedirectResponse
    {
        $data = $request->validate([
            'delivery_service_id' => ['required', 'integer', 'exists:delivery_services,id'],
            'pickup_address' => ['required', 'string', 'max:255'],
            'pickup_lat' => ['required', 'numeric'],
            'pickup_lng' => ['required', 'numeric'],
            'dropoff_address' => ['required', 'string', 'max:255'],
            'dropoff_lat' => ['required', 'numeric'],
            'dropoff_lng' => ['required', 'numeric'],
            'recipient_name' => ['nullable', 'string', 'max:120'],
            'recipient_phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $service = DeliveryService::findOrFail($data['delivery_service_id']);
        $km = $personalization->haversineKm(
            (float) $data['pickup_lat'], (float) $data['pickup_lng'],
            (float) $data['dropoff_lat'], (float) $data['dropoff_lng'],
        );
        abort_if($km > $service->service_radius_km, 422, 'المسافة خارج نطاق خدمة المزوّد.');

        $order = DeliveryOrder::create([
            ...$data,
            'user_id' => $request->user()?->id,
            'distance_km' => round($km, 2),
            'estimated_fare' => round($service->estimateFare($km), 2),
            'status' => 'pending',
        ]);

        return redirect()->route('delivery.confirm', $order->code)
            ->with('success', "تم إنشاء طلب التوصيل {$order->code} — الأجرة تقديرية تُدفع للسائق عند الاستخدام.");
    }

    public function confirm(string $code): Response
    {
        $order = DeliveryOrder::where('code', $code)->with('service.provider')->firstOrFail();

        return Inertia::render('Delivery/Confirmation', [
            'order' => [
                'code' => $order->code,
                'status_label' => $order->status_label,
                'pickup_address' => $order->pickup_address,
                'dropoff_address' => $order->dropoff_address,
                'distance_km' => (float) $order->distance_km,
                'estimated_fare' => (float) $order->estimated_fare,
                'recipient_name' => $order->recipient_name,
                'recipient_phone' => $order->recipient_phone,
                'notes' => $order->notes,
                'service' => [
                    'title' => $order->service->title,
                    'vehicle_type' => $order->service->vehicle_type,
                    'provider' => $order->service->provider?->name,
                ],
            ],
        ]);
    }
}
