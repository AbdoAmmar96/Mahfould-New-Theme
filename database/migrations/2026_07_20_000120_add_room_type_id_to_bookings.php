<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B / Milestone 2 — ربط الحجز بنوع الغرفة.
 *
 * nullable لأنّ الحجوزات لغير الفنادق (رحلات/مطاعم/…) لا تحمل نوع غرفة.
 * Backfill: الحجوزات القديمة على فنادق → أول room_type (الافتراضي) للفندق.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $t) {
            $t->foreignId('room_type_id')->nullable()->after('bookable_id')
                ->constrained()->nullOnDelete();
            $t->index('room_type_id');
        });

        // Backfill: كل حجز على Hotel → default room_type للفندق
        $hotelBookings = DB::table('bookings')
            ->where('bookable_type', \App\Models\Hotel::class)
            ->whereNull('room_type_id')
            ->get(['id', 'bookable_id']);

        foreach ($hotelBookings as $b) {
            $rt = DB::table('room_types')->where('hotel_id', $b->bookable_id)->first(['id']);
            if ($rt) {
                DB::table('bookings')->where('id', $b->id)->update(['room_type_id' => $rt->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $t) {
            $t->dropIndex(['room_type_id']);
            $t->dropForeign(['room_type_id']);
            $t->dropColumn('room_type_id');
        });
    }
};
