<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // vendor
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('short_desc')->nullable();
            $table->longText('content')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('sale_price', 12, 2)->nullable();
            $table->unsignedSmallInteger('duration_days')->default(1);
            $table->unsignedSmallInteger('max_people')->default(10);
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            $table->json('itinerary')->nullable();   // [{title, desc}]
            $table->json('included')->nullable();     // ["طيران","إقامة"...]
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_guaranteed')->default(true); // "مكفول"
            $table->enum('status', ['draft', 'publish', 'pending'])->default('publish');
            $table->decimal('review_score', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->unsignedInteger('bookings_count')->default(0);
            $table->timestamps();

            $table->index(['status', 'is_featured']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tours');
    }
};
