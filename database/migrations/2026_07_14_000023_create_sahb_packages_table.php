<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sahb_packages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('occasion')->nullable();  // عيد ميلاد / خطوبة / عيد جواز
            $table->string('short_desc')->nullable();
            $table->longText('content')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->boolean('price_from')->default(true); // "من X ج.م"
            $table->string('image')->nullable();
            $table->json('includes')->nullable();     // ["مكان","تزيين","كيك"]
            $table->string('badge')->nullable();      // "الأكثر طلباً" / "VIP"
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['draft', 'publish'])->default('publish');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sahb_packages');
    }
};
