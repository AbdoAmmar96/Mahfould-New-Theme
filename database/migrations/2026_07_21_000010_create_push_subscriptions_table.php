<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();

            // endpoint هو المعرّف الفريد للجهاز عند خدمة الدفع (FCM/Mozilla…)
            $t->text('endpoint');
            $t->string('endpoint_hash', 64)->unique(); // فهرس فريد — text مينفعش يتفهرس في MySQL
            $t->string('p256dh');
            $t->string('auth');
            $t->string('user_agent', 255)->nullable();
            $t->timestamp('last_used_at')->nullable();
            $t->timestamps();

            $t->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
