<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * إصلاح: العربيات كانت مكشوفة للحجز المزدوج.
 *
 * قبل كده كان فرع العربيات في BookingController::store يحسب السعر
 * من غير أي reserve — يعني عربية واحدة ممكن تتحجز لعدد لا نهائي من العملاء
 * في نفس اليوم. بإضافة units_total بتدخل العربية في محرك الإتاحة
 * (booking_items بـ unit_type='car' و slot='DAY') زي الفنادق بالظبط.
 *
 * units_total = عدد النسخ الفعلية من الإعلان ده (أسطول). الافتراضي 1 = عربية واحدة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $t) {
            $t->unsignedInteger('units_total')->default(1)->after('seats');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $t) {
            $t->dropColumn('units_total');
        });
    }
};
