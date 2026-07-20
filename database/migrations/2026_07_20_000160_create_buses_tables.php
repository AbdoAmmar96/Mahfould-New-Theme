<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase C — الباصات (V2-BLUEPRINT §10).
 *
 * bus_routes       = خط سير (قاهرة ↔ الغردقة، الشيخ ↔ سيناء…)
 * bus_stations     = محطة (اسم + مدينة + lat/lng)
 * bus_route_stations = ترتيب المحطات على الخط (pivot) + zone_number لتسعير المناطق (§10)
 * bus_zones        = تعريف مناطق التسعير على مستوى الخط (fare بين zone→zone)
 * bus_trips        = رحلة مجدولة على خط + موعد إقلاع محدّد + سعة مقاعد
 *
 * الحجز يتم على bus_trip (unit_type='bus_trip', unit_index=رقم المقعد).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus_stations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name', 120);
            $t->string('city', 80);
            $t->decimal('lat', 10, 7)->nullable();
            $t->decimal('lng', 10, 7)->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();

            $t->index(['city', 'is_active']);
        });

        Schema::create('bus_routes', function (Blueprint $t) {
            $t->id();
            // §10: خطوط يدخلها الأدمن أو المزوّد
            $t->foreignId('provider_id')->nullable()->constrained('companies')->nullOnDelete();
            $t->string('name', 160);                    // "خط القاهرة - الغردقة"
            $t->string('slug')->unique();
            $t->foreignId('from_station_id')->constrained('bus_stations')->cascadeOnDelete();
            $t->foreignId('to_station_id')->constrained('bus_stations')->cascadeOnDelete();
            $t->unsignedSmallInteger('duration_minutes')->nullable();
            $t->decimal('base_fare', 12, 2)->default(0); // fallback لو مفيش zones
            $t->boolean('is_active')->default(true);
            $t->text('notes')->nullable();
            $t->timestamps();

            $t->index(['from_station_id', 'to_station_id', 'is_active']);
        });

        // ترتيب المحطات على الخط + منطقة التسعير لكل محطة (§10)
        Schema::create('bus_route_stations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('bus_route_id')->constrained()->cascadeOnDelete();
            $t->foreignId('bus_station_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('order');           // 1..N ترتيب على الخط
            $t->unsignedSmallInteger('zone_number')->default(1); // منطقة التسعير
            $t->unsignedSmallInteger('offset_minutes')->default(0); // فارق الوقت من موعد الإقلاع الأصلي
            $t->timestamps();

            $t->unique(['bus_route_id', 'order'], 'uq_route_station_order');
            $t->unique(['bus_route_id', 'bus_station_id'], 'uq_route_station');
        });

        // تسعير المناطق (§10) — كل خط له مصفوفة صغيرة zone→zone بالسعر
        Schema::create('bus_zones', function (Blueprint $t) {
            $t->id();
            $t->foreignId('bus_route_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('from_zone');
            $t->unsignedSmallInteger('to_zone');
            $t->decimal('fare', 12, 2);
            $t->timestamps();

            $t->unique(['bus_route_id', 'from_zone', 'to_zone'], 'uq_zone_pair');
        });

        // رحلة مجدولة على خط بموعد إقلاع محدّد وسعة مقاعد (§10)
        Schema::create('bus_trips', function (Blueprint $t) {
            $t->id();
            $t->foreignId('bus_route_id')->constrained()->cascadeOnDelete();
            $t->timestamp('departs_at');                 // تاريخ+وقت الإقلاع
            $t->timestamp('arrives_at')->nullable();
            $t->unsignedSmallInteger('seats_total')->default(45);
            $t->decimal('price_override', 12, 2)->nullable(); // تجاوز السعر الأساسي (اختياري)
            $t->string('bus_plate', 20)->nullable();      // لوحة الأتوبيس المخصّص
            $t->string('status', 12)->default('scheduled'); // scheduled | departed | completed | cancelled
            $t->timestamps();

            $t->index(['bus_route_id', 'departs_at']);
            $t->index(['status', 'departs_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus_trips');
        Schema::dropIfExists('bus_zones');
        Schema::dropIfExists('bus_route_stations');
        Schema::dropIfExists('bus_routes');
        Schema::dropIfExists('bus_stations');
    }
};
