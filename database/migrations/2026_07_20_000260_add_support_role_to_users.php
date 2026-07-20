<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite: نحول enum إلى varchar لأنه ما يدعمش تعديل enum مباشرة
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('customer')->change();
        });
    }

    public function down(): void
    {
        // نعيدها enum بدون support
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['customer', 'vendor', 'admin'])->default('customer')->change();
        });
    }
};
