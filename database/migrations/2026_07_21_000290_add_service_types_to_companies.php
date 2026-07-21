<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * بند 19 — نوع الخدمة المقدَّمة إلزامي عند تسجيل المزوّد.
 *
 * مزوّد واحد ممكن يقدّم أكتر من نوع (فندق + رحلات مثلاً)، فالتخزين مصفوفة.
 * القيم المسموحة: tour · hotel · restaurant · car · bus · delivery · sahb
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $t) {
            $t->json('service_types')->nullable()->after('provider_type');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $t) {
            $t->dropColumn('service_types');
        });
    }
};
