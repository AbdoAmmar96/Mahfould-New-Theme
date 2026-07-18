<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('short_desc')->nullable();
            $table->longText('content')->nullable();
            $table->decimal('price', 12, 2)->default(0);       // per night
            $table->decimal('sale_price', 12, 2)->nullable();
            $table->unsignedTinyInteger('star_rating')->default(3);
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_guaranteed')->default(true);
            $table->enum('status', ['draft', 'publish', 'pending'])->default('publish');
            $table->decimal('review_score', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};
