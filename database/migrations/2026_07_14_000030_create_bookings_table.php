<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();               // MM-2026-8842
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->morphs('bookable');                       // tour / hotel / restaurant / sahb_package

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('guests')->default(1);

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('service_fee', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->enum('status', ['pending', 'confirmed', 'processing', 'completed', 'cancelled'])
                  ->default('pending');
            $table->enum('payment_method', ['card', 'wallet', 'on_arrival'])->default('card');
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded'])->default('unpaid');

            // بيانات المسافر (للـ guest checkout)
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email')->nullable();
            $table->string('customer_national_id')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['status', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
