<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // فعاليات اختيارية على الرحلة (add-ons بسعر إضافي)
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('short_desc')->nullable();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->string('image')->nullable();
            $table->string('icon', 40)->nullable();  // اسم Lucide مثلاً
            $table->boolean('is_default')->default(false); // تُضاف تلقائياً وتتشال
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->index(['tour_id', 'is_active']);
        });

        // مخطط زمني يوم بيوم للرحلة (بديل/تكميلي للـJSON القديم)
        Schema::create('tour_itineraries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');       // اليوم 1,2,3...
            $table->string('title');                          // "الوصول واستكشاف الغردقة"
            $table->text('description')->nullable();
            $table->json('highlights')->nullable();           // ["زيارة الأهرام","غداء نيلي"]
            $table->string('image')->nullable();
            $table->timestamps();

            $table->unique(['tour_id', 'day_number']);
            $table->index('tour_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_itineraries');
        Schema::dropIfExists('activities');
    }
};
