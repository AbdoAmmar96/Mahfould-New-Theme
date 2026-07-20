<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase C — النقل داخل حجوزات الرحلة/الفندق + تصاريح الدخول (V2-BLUEPRINT §6, §16).
 *
 * transport_mode على bookings:
 *   own_car     = العميل جاي بعربيته → يُصدر QR entry_pass
 *   bus         = ركب باص من المنصة (linked bus_trip_id)
 *   rented_car  = استأجر عربية من المنصة (linked car_booking_id)
 *   null        = مش محتاج (رحلات لطرف آخر بلا وصول شخصي، مطاعم، …)
 *
 * entry_passes:
 *   QR للعميل يدخل بيه المنشأة — تمسحه المنشأة من لوحتها (§18, §15).
 *   يُصدر عند حجز رحلة/فندق مع transport_mode=own_car.
 *   يُخزَّن أيضًا في بروفايل العميل (V2 §6).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $t) {
            $t->string('transport_mode', 16)->nullable()->after('slot');   // own_car | bus | rented_car | null
            $t->foreignId('bus_trip_id')->nullable()->after('transport_mode')
                ->constrained('bus_trips')->nullOnDelete();
            // بيانات إضافية للنقل (مثلاً رقم اللوحة، محطة الركوب/النزول لو باص)
            $t->json('transport_details')->nullable()->after('bus_trip_id');
            $t->index('transport_mode');
        });

        Schema::create('entry_passes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $t->string('code', 40)->unique();       // كود QR فريد
            $t->text('qr_payload');                  // JSON payload يُرمَّز بالـQR
            $t->timestamp('valid_from')->nullable();
            $t->timestamp('valid_until')->nullable();
            $t->timestamp('scanned_at')->nullable(); // وقت المسح من المنشأة
            $t->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('status', 12)->default('active'); // active | used | expired | revoked
            $t->timestamps();

            $t->index(['booking_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_passes');

        Schema::table('bookings', function (Blueprint $t) {
            $t->dropIndex(['transport_mode']);
            $t->dropForeign(['bus_trip_id']);
            $t->dropColumn(['transport_mode', 'bus_trip_id', 'transport_details']);
        });
    }
};
