<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B — توسعة جدول bookings حسب V2-BLUEPRINT §4 §5 §7 §16.
 *
 * قرارات نمذجة:
 *   • حالات جديدة (checked_in / no_show / pending_review) بدل توسعة enum status:
 *     نستخدم timestamps + boolean → متوافق مع SQLite/MySQL بدون dbal ولا CHECK migration.
 *     status الأصلي (pending/confirmed/…) يفضل كما هو، والحالات الأدق تُقرأ من هذه الأعمدة.
 *   • payment_timing/booking_for/security_deposit_status كـ string(20) وليس enum — نفس السبب.
 *   • snapshots كـ JSON — قواعدنا (السعر وسياسة الإلغاء وقت الحجز) لا تتأثر بتعديل المنشأة لاحقاً.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $t) {
            // ── §4 §5: الحجز لنفسه/لطرف آخر + بيانات المستفيد الرئيسي ──
            $t->string('booking_for', 8)->default('self')->after('customer_national_id');   // self | other
            $t->string('beneficiary_name', 120)->nullable()->after('booking_for');
            $t->string('beneficiary_national_id', 20)->nullable()->after('beneficiary_name');
            $t->unsignedTinyInteger('beneficiary_age')->nullable()->after('beneficiary_national_id');

            // ── §5: مصفوفة توقيت الدفع ──
            $t->string('payment_timing', 12)->default('on_arrival')->after('payment_status'); // on_arrival | on_use | prepaid
            $t->decimal('amount_paid', 12, 2)->default(0)->after('payment_timing');

            // ── §7 §16: رسوم وتأمين ──
            $t->decimal('cleaning_fee', 12, 2)->default(0)->after('service_fee');
            $t->decimal('security_deposit', 12, 2)->default(0)->after('cleaning_fee');
            $t->string('security_deposit_status', 16)->default('not_required')->after('security_deposit'); // not_required | held | refunded | forfeited

            // ── §14 §16: snapshots (لا تتأثر بتعديل المنشأة) ──
            $t->json('items_snapshot')->nullable()->after('total');
            $t->json('cancellation_policy_snapshot')->nullable()->after('items_snapshot');
            $t->timestamp('cancellation_deadline')->nullable()->after('cancellation_policy_snapshot');
            $t->timestamp('cancelled_at')->nullable()->after('cancellation_deadline');

            // ── §16: حالات دقيقة (بدل توسعة enum status) ──
            $t->timestamp('checked_in_at')->nullable()->after('cancelled_at');
            $t->timestamp('no_show_at')->nullable()->after('checked_in_at');
            $t->boolean('needs_review')->default(false)->after('no_show_at');
            $t->timestamp('forfeited_at')->nullable()->after('needs_review'); // no-show → مصادرة كامل المدفوع

            $t->index(['booking_for']);
            $t->index(['payment_timing']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $t) {
            $t->dropIndex(['booking_for']);
            $t->dropIndex(['payment_timing']);
            $t->dropColumn([
                'booking_for', 'beneficiary_name', 'beneficiary_national_id', 'beneficiary_age',
                'payment_timing', 'amount_paid',
                'cleaning_fee', 'security_deposit', 'security_deposit_status',
                'items_snapshot', 'cancellation_policy_snapshot', 'cancellation_deadline', 'cancelled_at',
                'checked_in_at', 'no_show_at', 'needs_review', 'forfeited_at',
            ]);
        });
    }
};
