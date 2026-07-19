<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Services\Availability\AvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * إتاحة الفنادق (JSON) — يغذّي منتقي التواريخ في صفحة الفندق:
 * كل تاريخ → عدد الغرف المتبقّية، عشان الواجهة تعطّل الممتلئ.
 */
class AvailabilityController extends Controller
{
    public function hotel(Request $request, Hotel $hotel, AvailabilityService $avail): JsonResponse
    {
        abort_if($hotel->status !== 'publish', 404);

        $from = Carbon::parse($request->query('from', now()->toDateString()))->startOfDay();
        if ($from->lt(now()->startOfDay())) {
            $from = now()->startOfDay();
        }
        $days = min(180, max(1, (int) $request->query('days', 120)));

        return response()->json([
            'units_total' => $hotel->inventoryCount(),
            'slot'        => $hotel->defaultSlot(),
            'from'        => $from->toDateString(),
            'days'        => $days,
            'remaining'   => $avail->window(
                $hotel->availabilityType(), $hotel->id, $hotel->defaultSlot(),
                $hotel->inventoryCount(), $from, $days,
            ),
        ]);
    }
}
