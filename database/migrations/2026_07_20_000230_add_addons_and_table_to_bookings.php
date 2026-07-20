<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // ترابيزة المطعم (اختياري — لو الحجز لمطعم)
            $table->foreignId('restaurant_table_id')->nullable()->after('room_type_id')->constrained('restaurant_tables')->nullOnDelete();
            // slot زمني (HH:MM)
            $table->string('start_time', 8)->nullable()->after('start_date');
            // add-ons اللي اتضافت (activities للرحلات + منيو مسبق للمطاعم) — snapshot
            $table->json('addons_snapshot')->nullable()->after('items_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['restaurant_table_id']);
            $table->dropColumn(['restaurant_table_id', 'start_time', 'addons_snapshot']);
        });
    }
};
