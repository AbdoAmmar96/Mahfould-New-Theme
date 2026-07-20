<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * V2-BLUEPRINT §12 — طبقة التخصيص (Personalization).
 *
 * تُرتّب النتائج الافتراضية للعميل بناءً على:
 *  1) موقعه (lat/lng من geolocation لحظي أو من عنوان محفوظ)
 *  2) تاريخ زياراته (حجوزات سابقة) — تقارب المدن/الوجهات
 *  3) تقييماته (مطاعم قيّمها بأعلى من 4)
 *
 * الاستخدام الأوضح: المطاعم — الافتراضي هو "الأقرب لك" (§9).
 *
 * لا نستخدم API خارجي — haversine على lat/lng محلي.
 */
class PersonalizationService
{
    /** يحسب المسافة بين نقطتين بالكيلومتر (haversine) */
    public function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthKm = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) ** 2;
        return $earthKm * 2 * asin(sqrt($a));
    }

    /** يحسم موقع العميل من الـrequest أو عناوينه المحفوظة (أول ماحد لاطر) */
    public function resolveUserLocation(Request $request): ?array
    {
        // 1) lat/lng من الـquery (geolocation لحظي)
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if ($lat && $lng) {
            return ['lat' => (float) $lat, 'lng' => (float) $lng, 'source' => 'live'];
        }

        // 2) العنوان الافتراضي من البروفايل
        $user = $request->user();
        if ($user) {
            $addr = $user->defaultAddress;
            if ($addr && $addr->lat && $addr->lng) {
                return ['lat' => (float) $addr->lat, 'lng' => (float) $addr->lng, 'source' => 'saved'];
            }
        }

        return null;
    }

    /**
     * يرتّب Collection من الموديلات (لها location أو lat/lng) بالأقرب.
     * يضيف عمود distance_km لكل موديل.
     */
    public function sortByProximity(Collection $items, float $lat, float $lng): Collection
    {
        return $items->map(function ($item) use ($lat, $lng) {
            $loc = $item->location;
            $itemLat = (float) ($loc?->lat ?? $item->lat ?? 0);
            $itemLng = (float) ($loc?->lng ?? $item->lng ?? 0);
            $item->distance_km = ($itemLat && $itemLng)
                ? round($this->haversineKm($lat, $lng, $itemLat, $itemLng), 1)
                : null;
            return $item;
        })->sortBy(function ($item) {
            // بعيد جداً (بلا إحداثيات) في الآخر
            return $item->distance_km ?? PHP_INT_MAX;
        })->values();
    }

    /**
     * IDs الأماكن اللي قيّمها المستخدم بـ 4+ (تُستخدم كـboost في المطاعم).
     * key: 'restaurant:5' / 'tour:3'
     */
    public function favoriteEntityIds(User $user, string $type, int $minRating = 4): Collection
    {
        return Review::query()
            ->where('user_id', $user->id)
            ->where('reviewable_type', $this->classFor($type))
            ->where('rating', '>=', $minRating)
            ->pluck('reviewable_id');
    }

    /** IDs الأماكن اللي حجزها العميل قبل كده (زيارات) */
    public function visitedEntityIds(User $user, string $type): Collection
    {
        return Booking::query()
            ->where('user_id', $user->id)
            ->where('bookable_type', $this->classFor($type))
            ->pluck('bookable_id')
            ->unique();
    }

    /** يعطي boost لعنصر لو الشخص قيّمه عالي (score +30) أو زاره قبل (+15) */
    public function applyHistoryBoost(Collection $items, ?User $user, string $type): Collection
    {
        if (!$user) return $items;

        $rated = $this->favoriteEntityIds($user, $type)->flip();
        $visited = $this->visitedEntityIds($user, $type)->flip();

        return $items->map(function ($item) use ($rated, $visited) {
            $boost = 0;
            $reasons = [];
            if ($rated->has($item->getKey())) {
                $boost += 30;
                $reasons[] = 'قيّمته عالي';
            } elseif ($visited->has($item->getKey())) {
                $boost += 15;
                $reasons[] = 'زرته قبل كده';
            }
            $item->personal_boost = $boost;
            $item->personal_reasons = $reasons;
            return $item;
        });
    }

    /**
     * ترتيب افتراضي كامل للمطاعم — الأقرب + التاريخ + التقييم.
     * final_rank = -distance + boost + review_score*10
     */
    public function rankRestaurants(Collection $restaurants, Request $request): Collection
    {
        $location = $this->resolveUserLocation($request);
        $user = $request->user();

        // 1) المسافة (لو معروف موقع العميل)
        if ($location) {
            $restaurants = $this->sortByProximity($restaurants, $location['lat'], $location['lng']);
        }

        // 2) boost بالتاريخ
        $restaurants = $this->applyHistoryBoost($restaurants, $user, 'restaurant');

        // 3) الترتيب النهائي بالنقاط المركّبة
        return $restaurants->map(function ($item) {
            $distanceScore = $item->distance_km !== null
                ? max(0, 100 - $item->distance_km)   // كلما قرب زاد
                : 0;
            $reviewScore = (float) $item->review_score * 10;   // 0..50
            $boost = (int) ($item->personal_boost ?? 0);
            $item->rank_score = round($distanceScore + $reviewScore + $boost, 2);
            return $item;
        })->sortByDesc('rank_score')->values();
    }

    private function classFor(string $type): string
    {
        return match ($type) {
            'restaurant' => \App\Models\Restaurant::class,
            'tour'       => \App\Models\Tour::class,
            'hotel'      => \App\Models\Hotel::class,
            'car'        => \App\Models\Car::class,
            default      => \App\Models\Restaurant::class,
        };
    }
}
