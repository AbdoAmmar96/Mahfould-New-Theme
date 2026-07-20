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
            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->foreignId('provider_id')->nullable()->after('user_id')
                    ->constrained('companies')->nullOnDelete();
                $t->string('publish_state', 20)->default('published')->after('status'); // نصير المنشور القديم published افتراضياً
                $t->timestamp('submitted_at')->nullable()->after('publish_state');   // وقت الإرسال للمراجعة
                $t->timestamp('reviewed_at')->nullable()->after('submitted_at');
                $t->foreignId('reviewed_by')->nullable()->after('reviewed_at')
                    ->constrained('users')->nullOnDelete();
                $t->text('rejection_reason')->nullable()->after('reviewed_by');

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
