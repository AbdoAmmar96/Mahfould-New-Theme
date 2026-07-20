<?php

namespace App\Support;

use App\Models\BusTrip;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\SahbPackage;
use App\Models\Tour;
use Illuminate\Database\Eloquent\Model;

/**
 * مرجع موحّد لأنواع الخدمات القابلة للحجز/التقييم/الحفظ.
 * type قصير (tour) ↔ موديل (App\Models\Tour).
 */
class Bookables
{
    public const MAP = [
        'tour'       => Tour::class,
        'hotel'      => Hotel::class,
        'restaurant' => Restaurant::class,
        'car'        => Car::class,
        'sahb'       => SahbPackage::class,
        'bus_trip'   => BusTrip::class,
    ];

    public static function types(): array
    {
        return array_keys(self::MAP);
    }

    public static function classFor(string $type): ?string
    {
        return self::MAP[$type] ?? null;
    }

    /** من موديل → type القصير */
    public static function typeFor(Model|string $model): ?string
    {
        $class = is_string($model) ? $model : $model::class;
        return array_search($class, self::MAP, true) ?: null;
    }

    /** يجيب الموديل من type + id */
    public static function resolve(string $type, int|string $id): ?Model
    {
        $class = self::classFor($type);
        return $class ? $class::find($id) : null;
    }

    /** مفتاح موحّد للمفضلة/المقارنة: "tour:5" */
    public static function key(Model $model): string
    {
        return self::typeFor($model) . ':' . $model->getKey();
    }
}
