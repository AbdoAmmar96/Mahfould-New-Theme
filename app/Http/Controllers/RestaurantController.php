<?php

namespace App\Http\Controllers;

use App\Models\BookingItem;
use App\Models\Review;
use App\Models\Restaurant;
use App\Services\PersonalizationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    public function index(Request $request, PersonalizationService $personalization): Response
    {
        // §12: بحث بالاسم
        $q = trim((string) $request->query('q', ''));
        // §9: فلترة بنوع المكان
        $venue = $request->query('venue');   // restaurant | cafe
        // §12: نمط الترتيب
        $sort = $request->query('sort', 'nearest'); // nearest | rating | price

        $query = Restaurant::published()->with('location:id,name,lat,lng');
        if ($q !== '') {
            $query->where(fn ($x) => $x->where('title', 'like', "%{$q}%")->orWhere('address', 'like', "%{$q}%"));
        }
        if ($venue) {
            $query->where('venue_type', $venue);
        }

        $collection = $query->get();

        // ترتيب افتراضي = الأقرب لك (Personalization §12)
        if ($sort === 'rating') {
            $sorted = $collection->sortByDesc('review_score')->values();
        } elseif ($sort === 'price') {
            $sorted = $collection->sortBy(fn ($r) => strlen($r->price_range))->values();
        } else {
            // nearest (default) — يستخدم موقع العميل + تاريخه + تقييماته
            $sorted = $personalization->rankRestaurants($collection, $request);
        }

        // Pagination يدوي
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 9;
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $sorted->forPage($page, $perPage)->values(),
            $sorted->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        $userLocation = $personalization->resolveUserLocation($request);

        return Inertia::render('Restaurants/Index', [
            'restaurants' => $paginated->through(fn ($r) => [
                'id'            => $r->id,
                'title'         => $r->title,
                'slug'          => $r->slug,
                'url'           => $r->url,
                'image_url'     => $r->image_url,
                'location'      => $r->location?->name,
                'address'       => $r->address,
                'cuisines'      => $r->cuisines ?: [],
                'price_range'   => $r->price_range,
                'venue_type'    => $r->venue_type,
                'instant'       => $r->instant_booking,
                'is_guaranteed' => $r->is_guaranteed,
                'is_featured'   => $r->is_featured,
                'review_score'  => (float) $r->review_score,
                'review_count'  => $r->review_count,
                'distance_km'   => $r->distance_km ?? null,
                'personal_reasons' => $r->personal_reasons ?? [],
            ]),
            'filters' => (object) ['q' => $q, 'venue' => $venue, 'sort' => $sort],
            'user_location' => $userLocation,
        ]);
    }

    public function show(Restaurant $restaurant, Request $request): Response
    {
        abort_if($restaurant->status !== 'publish', 404);

        // تحميل الترابيزات + أقسام المنيو + عناصر المنيو
        $restaurant->load([
            'activeTables',
            'menuSections' => fn ($q) => $q->orderBy('order'),
            'menuSections.items' => fn ($q) => $q->where('is_available', true)->orderBy('order'),
        ]);

        // إتاحة الترابيزات لتاريخ معين (اختياري من الـquery)
        $date = $request->query('date', now()->toDateString());

        // slots الافتراضية: من 12:00 لـ23:00 بفاصل الـslot_minutes
        $slots = $restaurant->bookingSlots();

        // المحجوز **لكل فترة** مش لليوم كله.
        // قبل كده كان الاستعلام بيفلتر بالتاريخ بس، فحجز واحد الساعة 12:00
        // كان بيقفل الترابيزة على طول اليوم (8 فترات) — خسارة مبيعات مباشرة.
        $bookedBySlot = BookingItem::query()
            ->active()
            ->where('unit_type', 'restaurant_table')
            ->where('date', $date)
            ->whereIn('slot', $slots)
            ->get(['unit_id', 'slot'])
            ->groupBy('slot')
            ->map(fn ($rows) => $rows->pluck('unit_id')->unique()->values());

        // للتوافق مع الواجهة الحالية: الترابيزة «محجوزة» لو كل فتراتها مليانة
        $bookedIds = collect($slots)
            ->map(fn ($s) => $bookedBySlot->get($s, collect()))
            ->reduce(fn ($carry, $ids) => $carry === null ? $ids : $carry->intersect($ids), null)
            ?? collect();

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
                'venue_type'   => $restaurant->venue_type,
                'review_score' => (float) $restaurant->review_score,
                'review_count' => $restaurant->review_count,
                // شمول الرسوم/الضريبة — يظهر صراحة (§9)
                'fees_note' => [
                    'service_fee_inclusive' => $restaurant->service_fee_inclusive,
                    'tax_inclusive' => $restaurant->tax_inclusive,
                    'service_fee_pct' => (float) $restaurant->service_fee_pct,
                    'tax_pct' => (float) $restaurant->tax_pct,
                ],
                'slot_minutes' => (int) $restaurant->slot_minutes,
                'slots' => $slots,
                'tables' => $restaurant->activeTables->map(fn ($t) => [
                    'id' => $t->id,
                    'code' => $t->code,
                    'label' => $t->label,
                    'capacity' => (int) $t->capacity,
                    'area' => $t->area,
                    'booked' => $bookedIds->contains($t->id),
                ])->values(),
                'menu' => $restaurant->menuSections->map(fn ($s) => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'items' => $s->items->map(fn ($i) => [
                        'id' => $i->id,
                        'title' => $i->title,
                        'description' => $i->description,
                        'price' => (float) $i->price,
                        'image_url' => $i->image_url,
                        'tags' => $i->tags ?: [],
                        'is_signature' => $i->is_signature,
                    ])->values(),
                ])->values(),
                'checkout_url' => route('booking.create', ['type' => 'restaurant', 'id' => $restaurant->id]),
            ],
            'query_date' => $date,
            'reviews'     => Review::forReviewable($restaurant)->latest()->take(10)->get()
                ->map(fn ($r) => ['name' => $r->user?->name ?? 'زائر', 'rating' => $r->rating, 'title' => $r->title, 'content' => $r->content, 'date' => $r->created_at->format('Y-m-d')]),
            'review_type' => 'restaurant',
            'review_id'   => $restaurant->id,
        ]);
    }
}
