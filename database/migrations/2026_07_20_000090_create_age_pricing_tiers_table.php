<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B — شرائح التسعير العمرية (V2-BLUEPRINT §4).
 *
 * كل خدمة (رحلة/فندق/مطعم/عربية/باص/…) ليها شرائح خاصة بها.
 * multiplier نسبة من سعر البالغ (رضيع=0.00 / طفل=0.50 / بالغ=1.00 مثلاً).
 * Fallback عند الغياب: الشرائح الافتراضية من AgePricingService.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('age_pricing_tiers', function (Blueprint $t) {
            $t->id();
            $t->morphs('bookable');                          // tour / hotel / restaurant / car / sahb_package …

            $t->string('label', 40);                         // 'رضيع' | 'طفل' | 'بالغ' | مخصّص
            $t->unsignedTinyInteger('min_age')->default(0);
            $t->unsignedTinyInteger('max_age')->nullable();  // null = ∞
            $t->decimal('multiplier', 5, 2)->default(1.00);  // نسبة من سعر البالغ

            $t->unsignedSmallInteger('order')->default(0);
            $t->timestamps();

            $t->unique(['bookable_type', 'bookable_id', 'label'], 'uq_age_tier_label');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('age_pricing_tiers');
    }
};
