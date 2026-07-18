<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('address')->nullable();
            $table->longText('content')->nullable();
            $table->json('cuisines')->nullable();               // ["مصري","شرقي"]
            $table->enum('price_range', ['$', '$$', '$$$', '$$$$'])->default('$$');
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_guaranteed')->default(true);
            $table->boolean('instant_booking')->default(true);
            $table->enum('status', ['draft', 'publish', 'pending'])->default('publish');
            $table->decimal('review_score', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
