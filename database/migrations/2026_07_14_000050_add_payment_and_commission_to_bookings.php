<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_gateway')->nullable()->after('payment_status'); // paymob | fawry
            $table->string('payment_ref')->nullable()->after('payment_gateway');     // مرجع البوابة (للـ refund)
            $table->decimal('commission_amount', 12, 2)->default(0)->after('total'); // عمولة المنصة
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['payment_gateway', 'payment_ref', 'commission_amount']);
        });
    }
};
