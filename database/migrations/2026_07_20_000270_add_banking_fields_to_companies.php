<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('tax_id', 40)->nullable()->after('national_id');       // البطاقة الضريبية
            $table->string('bank_holder', 120)->nullable()->after('license_authority');
            $table->string('bank_iban', 40)->nullable()->after('bank_holder');
            $table->string('bank_name', 80)->nullable()->after('bank_iban');
            $table->decimal('total_paid_out', 12, 2)->default(0)->after('provider_review_count');
            $table->decimal('total_pending_settlement', 12, 2)->default(0)->after('total_paid_out');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['tax_id', 'bank_holder', 'bank_iban', 'bank_name', 'total_paid_out', 'total_pending_settlement']);
        });
    }
};
