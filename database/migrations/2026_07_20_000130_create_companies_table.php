<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase D — منصة المزوّدين (V2-BLUEPRINT §1.1, §3, §16).
 *
 * كل مزوّد له سجل في companies:
 *   provider_type = 'company' | 'individual' (فرد بيصف عربية أو سائق توصيل)
 *   verification_status = pending | verified | rejected | suspended
 *   is_first_party = TRUE → طرف أول (محفول مكفول-مملوك) — شارة الضمان
 *
 * كل خدمة (tour/hotel/…) لها provider_id nullable:
 *   NULL = طرف أول (الأسطول المملوك / إدارة المنصة)
 *   قيمة = طرف ثالث
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $t) {
            $t->id();
            // مالك الحساب — يدخل لوحة /vendor
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();

            $t->string('provider_type', 12)->default('company');  // company | individual
            $t->string('name', 200);
            $t->string('slug')->unique();
            $t->string('logo')->nullable();
            $t->text('about')->nullable();

            $t->string('phone', 30)->nullable();
            $t->string('email', 120)->nullable();
            // للأفراد: بيانات هوية شخصية
            $t->string('national_id', 20)->nullable();

            // للشركات: بيانات ترخيص/سجل
            $t->string('license_no', 60)->nullable();
            $t->string('license_authority', 120)->nullable();
            $t->date('license_expires_at')->nullable();

            // §1.1: حالة التوثيق/الموافقة (pending عند التسجيل)
            $t->string('verification_status', 16)->default('pending'); // pending | verified | rejected | suspended
            // §3: علم "مكفول" (ضمان محفول مكفول) — مستقل عن التوثيق
            $t->boolean('is_first_party')->default(false);

            // §3: تقييم المزوّد المجمّع (يُحسب من كل عناصره)
            $t->decimal('provider_review_score', 3, 2)->default(0);
            $t->unsignedInteger('provider_review_count')->default(0);

            // نسبة عمولة مخصّصة (تتجاوز default settings.commission_rate لو موجودة)
            $t->decimal('commission_rate_override', 5, 2)->nullable();

            $t->text('admin_notes')->nullable();
            $t->timestamp('approved_at')->nullable();
            $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

            $t->timestamps();

            $t->index('verification_status');
            $t->index('provider_type');
            $t->index('is_first_party');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
