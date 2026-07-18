<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amenities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->enum('service_type', ['tour', 'hotel', 'restaurant', 'car', 'all'])->default('all');
            $table->timestamps();
        });

        // pivot polymorphic: amenity <-> service
        Schema::create('amenity_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('amenity_id')->constrained()->cascadeOnDelete();
            $table->morphs('service'); // service_type + service_id
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amenity_service');
        Schema::dropIfExists('amenities');
    }
};
