<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // §15: تذاكر الدعم الفني
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();      // SP-2026-000001
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete(); // موظف دعم
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject', 200);
            $table->string('category', 40);            // booking / payment / refund / general / complaint
            $table->text('description');
            $table->enum('status', ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
            $table->index('user_id');
        });

        // ردود على التذاكر (محادثة)
        Schema::create('support_ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();  // كاتب الرسالة (عميل أو دعم)
            $table->text('body');
            $table->boolean('is_internal')->default(false); // ملاحظة داخلية للدعم (مش تظهر للعميل)
            $table->timestamps();

            $table->index('ticket_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
    }
};
