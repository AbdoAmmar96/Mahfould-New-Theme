<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // أقسام المنيو (مقبلات/مشويات/مشروبات...)
        Schema::create('restaurant_menu_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'order']);
        });

        Schema::create('restaurant_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('restaurant_menu_sections')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->string('image')->nullable();
            $table->json('tags')->nullable();          // ["حار","نباتي","خالي جلوتين"]
            $table->boolean('is_available')->default(true);
            $table->boolean('is_signature')->default(false);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'is_available']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_menu_items');
        Schema::dropIfExists('restaurant_menu_sections');
    }
};
