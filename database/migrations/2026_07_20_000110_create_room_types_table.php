<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B / Milestone 2 — أنواع الغرف للفنادق (V2-BLUEPRINT §7).
 *
 * الفندق كيان أب، وله عدّة room_types (فردية/مزدوجة/سويت/شاليه…).
 * كل نوع بيحمل: كميته الفعلية · سعره لليلة · طاقته · سياسة الإلغاء · شامل الإفطار…
 *
 * الشاليه = نوع غرفة بكمية 1 (§7).
 * كل غرفة (unit_index) في unit_type='room_type' = وحدة فيزيائية واحدة (§14).
 *
 * Backfill: لكل فندق موجود ننشئ نوع غرفة افتراضي واحد بنقل السعر والكمية من الفندق.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $t) {
            $t->id();
            $t->foreignId('hotel_id')->constrained()->cascadeOnDelete();
            $t->string('title', 120);                              // فردية / مزدوجة / سويت / شاليه
            $t->text('description')->nullable();
            $t->unsignedTinyInteger('capacity_per_night')->default(2);
            $t->unsignedInteger('units_total')->default(1);        // العدد الحقيقي من هذا النوع
            $t->decimal('price_per_night', 12, 2);
            $t->decimal('sale_price_per_night', 12, 2)->nullable();
            $t->boolean('includes_breakfast')->default(false);
            $t->boolean('is_active')->default(true);
            // سياسة إلغاء مخصّصة (null → تستخدم السياسة الافتراضية من CancellationPolicyService)
            $t->json('cancellation_policy_json')->nullable();
            $t->unsignedSmallInteger('order')->default(0);
            $t->string('image')->nullable();
            $t->timestamps();

            $t->index(['hotel_id', 'is_active']);
        });

        // ── Backfill: أنشئ نوع غرفة افتراضي لكل فندق موجود ──
        // ينقل السعر والكمية من الأعمدة المسطّحة إلى صف room_type واحد.
        // البيانات القديمة تبقى على hotels (للتراجع)، لكن الحجوزات الجديدة تمرّ عبر room_types.
        $now = now();
        $hotels = DB::table('hotels')->get(['id', 'price', 'sale_price', 'units_total']);
        $rows = $hotels->map(fn ($h) => [
            'hotel_id'             => $h->id,
            'title'                => 'غرفة قياسية',
            'description'          => 'الغرفة الافتراضية للفندق — نُقلت آلياً من البيانات السابقة.',
            'capacity_per_night'   => 2,
            'units_total'          => (int) ($h->units_total ?? 5),
            'price_per_night'      => (float) $h->price,
            'sale_price_per_night' => $h->sale_price ? (float) $h->sale_price : null,
            'includes_breakfast'   => true,
            'is_active'            => true,
            'cancellation_policy_json' => null,
            'order'                => 0,
            'created_at'           => $now,
            'updated_at'           => $now,
        ])->all();

        if (! empty($rows)) {
            DB::table('room_types')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('room_types');
    }
};
