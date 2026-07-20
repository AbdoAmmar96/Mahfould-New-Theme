<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\RoomType;
use App\Services\Availability\AvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * إتاحة الفنادق (JSON) — يغذّي منتقي التواريخ في صفحة الفندق:
 * كل تاريخ → عدد الغرف المتبقّية من نوع الغرفة المطلوب (§7).
 *
 * لو room_type_id غير مُحدّد → أول نوع نشط للفندق (backward compat).
 */
class AvailabilityController extends Controller
{
    public function hotel(Request $request, Hotel $hotel, AvailabilityService $avail): JsonResponse
    {
        abort_if($hotel->status !== 'publish', 404);

        // §7: الإتاحة على مستوى room_type
        $roomTypeId = (int) $request->query('room_type_id', 0);
        $roomType = $roomTypeId
            ? RoomType::where('hotel_id', $hotel->id)->where('is_active', true)->find($roomTypeId)
            : $hotel->activeRoomTypes()->first();

        abort_if($roomType === null, 404, 'لا توجد أنواع غرف متاحة لهذا الفندق.');

        $from = Carbon::parse($request->query('from', now()->toDateString()))->startOfDay();
        if ($from->lt(now()->startOfDay())) {
            $from = now()->startOfDay();
        }
        $days = min(180, max(1, (int) $request->query('days', 120)));

        return response()->json([
            'room_type_id' => $roomType->id,
            'room_type'    => $roomType->title,
            'units_total'  => $roomType->inventoryCount(),
            'slot'         => $roomType->defaultSlot(),
            'from'         => $from->toDateString(),
            'days'         => $days,
            'remaining'    => $avail->window(
                $roomType->availabilityType(), $roomType->id, $roomType->defaultSlot(),
                $roomType->inventoryCount(), $from, $days,
            ),
        ]);
    }
}
