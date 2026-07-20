<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B — أفراد الحجز (V2-BLUEPRINT §4).
 *
 * سطر لكل فرد داخل الحجز — العمر لأغراض التسعير للجميع، أما الاسم/الرقم القومي
 * فيُخزَّنان للمستفيد الرئيسي فقط (is_primary=true).
 * tier_label + applied_price = snapshot لحظة الحجز (لا تتأثر بتعديل الشرائح لاحقاً).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_guests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('booking_id')->constrained()->cascadeOnDelete();

            $t->unsignedTinyInteger('age');
            $t->boolean('is_primary')->default(false);
            $t->string('name', 120)->nullable();          // للرئيسي فقط
            $t->string('national_id', 20)->nullable();    // للرئيسي فقط

            // snapshot لحظة الحجز
            $t->string('tier_label', 40)->nullable();
            $t->decimal('applied_price', 12, 2)->nullable();

            $t->timestamps();

            $t->index('booking_id');
            $t->index(['booking_id', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_guests');
    }
};
