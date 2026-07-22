<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase D — إضافة provider_id + publish_state لكل الخدمات (V2-BLUEPRINT §16).
 *
 * provider_id nullable:
 *   NULL  = طرف أول (الأسطول المملوك / إدارة محفول مكفول) — is_first_party على الشركة إن وُجدت
 *   value = طرف ثالث (شركة أو فرد)
 *
 * publish_state (منفصل عن status الحالي):
 *   draft → pending_review → published | rejected
 *   الأدمن هو اللي يحوّل من pending_review إلى published (V2 §1.1).
 *
 * status الأصلي (publish/draft/pending) بيفضل قايم للتوافق مع الكود القديم،
 * والاستعلامات العامة (Published scope) هتتحدّث تعتمد على publish_state.
 */
return new class extends Migration
{
    private array $tables = ['tours', 'hotels', 'restaurants', 'cars', 'sahb_packages'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            // ملاحظة: مفيش after() هنا عن قصد.
            // after() تجميلية بحتة (ترتيب الأعمدة)، لكنها بتفشل على MySQL/MariaDB
            // لو العمود المرجعي مش موجود — و sahb_packages مثلاً مفيهوش user_id.
            // SQLite بيتجاهل after() تماماً، فالعطل ده مابيظهرش محلياً وبيضرب في الإنتاج بس.
            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->foreignId('provider_id')->nullable()
                    ->constrained('companies')->nullOnDelete();
                $t->string('publish_state', 20)->default('published'); // نصير المنشور القديم published افتراضياً
                $t->timestamp('submitted_at')->nullable();   // وقت الإرسال للمراجعة
                $t->timestamp('reviewed_at')->nullable();
                $t->foreignId('reviewed_by')->nullable()
                    ->constrained('users')->nullOnDelete();
                $t->text('rejection_reason')->nullable();

                $t->index(['provider_id', 'publish_state']);
                $t->index('publish_state');
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) {
                $t->dropIndex(['provider_id', 'publish_state']);
                $t->dropIndex(['publish_state']);
                $t->dropForeign(['provider_id']);
                $t->dropForeign(['reviewed_by']);
                $t->dropColumn([
                    'provider_id', 'publish_state', 'submitted_at',
                    'reviewed_at', 'reviewed_by', 'rejection_reason',
                ]);
            });
        }
    }
};
