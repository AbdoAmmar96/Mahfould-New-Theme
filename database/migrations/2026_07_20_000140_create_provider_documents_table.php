<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase D — مستندات توثيق المزوّد (V2-BLUEPRINT §1.1, §15).
 *
 * للشركات: السجل التجاري + البطاقة الضريبية + الترخيص السياحي.
 * للأفراد: بطاقة الهوية + "فيش وتشبيه" (شهادة السجل الجنائي — إلزامية).
 *
 * كل مستند له حالة (pending/approved/rejected) — الأدمن يراجعها.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_documents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('company_id')->constrained()->cascadeOnDelete();

            $t->string('doc_type', 32);       // commercial_register | tax_card | tourism_license | national_id | criminal_record | other
            $t->string('title', 120);          // عنوان بشري (مثلاً "السجل التجاري 2026")
            $t->string('file_path');           // مسار الملف في storage
            $t->string('file_mime', 60)->nullable();
            $t->unsignedInteger('file_size')->nullable();
            $t->date('expires_at')->nullable();

            $t->string('status', 12)->default('pending'); // pending | approved | rejected
            $t->text('notes')->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();

            $t->timestamps();

            $t->index(['company_id', 'status']);
            $t->index('doc_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_documents');
    }
};
