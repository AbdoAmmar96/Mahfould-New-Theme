<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * محرك الإتاحة — الدفتر اللي بيخلّي الحجز المزدوج مستحيل.
 *
 * كل صف = وحدة فيزيائية واحدة (unit_index) في تاريخ/فترة واحدة.
 * فندق 5 غرف، حجز 3 ليالٍ لغرفة واحدة  →  3 صفوف (unit_index ثابت، 3 تواريخ، slot='STAY').
 * المحجوز = COUNT(الصفوف النشطة) — مش عدّاد مخزّن بيقع في drift.
 *
 * الحارس الأخير: عمود مولّد active_flag (1 وقت النشاط، NULL بعد التحرير) داخل unique index.
 * الـNULL بيتكرّر في الـunique index على MySQL و SQLite → الصفوف المحرّرة ما بتتصادمش،
 * والنشطة مستحيل تتكرّر لنفس (الوحدة، التاريخ، الفترة، الرقم).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();

            $t->string('unit_type', 40);        // 'hotel' | 'car' | 'restaurant'
            $t->unsignedBigInteger('unit_id');  // معرّف الفندق/العربية/المطعم
            $t->unsignedInteger('unit_index');  // أي وحدة فيزيائية (0 .. inventory-1)
            $t->date('date');                   // الليلة / اليوم
            $t->string('slot', 8)->default('STAY'); // 'STAY' فنادق · 'DAY' عربيات · 'HH:MM' مطاعم
            $t->enum('state', ['held', 'booked'])->default('held');

            $t->string('hold_token', 40)->nullable(); // يجمع صفوف حجز واحد
            $t->timestamp('expires_at')->nullable();  // للحجز المؤقّت (قبل الدفع)
            $t->timestamp('released_at')->nullable();  // وقت التحرير (NULL = نشط)

            // عمود مولّد: 1 لو نشط، NULL لو محرّر — عشان الـunique index يسمح بتعدّد المحرّر
            $t->unsignedTinyInteger('active_flag')
              ->storedAs('case when released_at is null then 1 else null end')
              ->nullable();

            $t->timestamps();

            $t->unique(['unit_type', 'unit_id', 'date', 'slot', 'unit_index', 'active_flag'], 'uq_booking_items_active');
            $t->index(['hold_token']);
            $t->index(['expires_at']);
        });

        // عدد الوحدات (الغرف) المتاحة للحجز في كل فندق
        Schema::table('hotels', function (Blueprint $t) {
            $t->unsignedInteger('units_total')->default(5)->after('star_rating');
        });

        // ربط الحجز بالوحدات + تفاصيل الإقامة
        Schema::table('bookings', function (Blueprint $t) {
            $t->string('hold_token', 40)->nullable()->after('code');
            $t->unsignedSmallInteger('units')->default(1)->after('guests'); // عدد الغرف/الوحدات
            $t->unsignedSmallInteger('nights')->nullable()->after('units'); // ليالي (للفنادق)
            $t->index('hold_token');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $t) {
            $t->dropIndex(['hold_token']);
            $t->dropColumn(['hold_token', 'units', 'nights']);
        });
        Schema::table('hotels', function (Blueprint $t) {
            $t->dropColumn('units_total');
        });
        Schema::dropIfExists('booking_items');
    }
};
