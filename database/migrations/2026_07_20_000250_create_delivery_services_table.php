<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // §11: خدمات توصيل (شركات + أفراد)
        Schema::create('delivery_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('companies')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            // بيانات التسعير — بالكيلومتر
            $table->decimal('base_fare', 8, 2)->default(0);      // مصاريف تشغيل ثابتة
            $table->decimal('price_per_km', 8, 2)->default(0);   // السعر لكل كم
            $table->decimal('min_fare', 8, 2)->default(0);       // الحد الأدنى
            $table->unsignedSmallInteger('service_radius_km')->default(30);
            // نوع المركبة/الأداة
            $table->string('vehicle_type', 30)->default('motorbike');  // motorbike / car / van / truck
            $table->unsignedSmallInteger('max_kg')->nullable();  // للسِلع
            // القناة
            $table->string('city')->nullable();
            $table->decimal('base_lat', 10, 7)->nullable();
            $table->decimal('base_lng', 10, 7)->nullable();
            // نشر
            $table->enum('status', ['draft', 'publish', 'pending'])->default('publish');
            $table->string('publish_state', 20)->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('review_score', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamps();

            $table->index(['status', 'publish_state']);
            $table->index('provider_id');
        });

        // §11: طلبات التوصيل
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('delivery_service_id')->constrained()->cascadeOnDelete();
            // نقاط
            $table->string('pickup_address');
            $table->decimal('pickup_lat', 10, 7);
            $table->decimal('pickup_lng', 10, 7);
            $table->string('dropoff_address');
            $table->decimal('dropoff_lat', 10, 7);
            $table->decimal('dropoff_lng', 10, 7);
            // بيانات
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('distance_km', 8, 2);
            $table->decimal('estimated_fare', 10, 2);
            $table->decimal('final_fare', 10, 2)->nullable();
            $table->enum('status', ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'])->default('pending');
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_orders');
        Schema::dropIfExists('delivery_services');
    }
};
