<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            // مطعم/كافيه/بار
            $table->string('venue_type', 20)->default('restaurant')->after('price_range');
            // شمول الرسوم/الضريبة في السعر المعلن
            $table->boolean('service_fee_inclusive')->default(false)->after('venue_type');
            $table->boolean('tax_inclusive')->default(false)->after('service_fee_inclusive');
            $table->decimal('service_fee_pct', 5, 2)->default(0)->after('tax_inclusive'); // مثال 12.00
            $table->decimal('tax_pct', 5, 2)->default(0)->after('service_fee_pct');       // مثال 14.00
            // مدة الـslot الافتراضية بالدقايق
            $table->unsignedSmallInteger('slot_minutes')->default(90)->after('tax_pct');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['venue_type', 'service_fee_inclusive', 'tax_inclusive', 'service_fee_pct', 'tax_pct', 'slot_minutes']);
        });
    }
};
