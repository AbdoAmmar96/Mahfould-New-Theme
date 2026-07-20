<?php

namespace App\Services\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * سياسة الإلغاء وأخذ snapshot عند الحجز — V2-BLUEPRINT §7.
 *
 * القاعدة: عند الحجز نأخذ snapshot لقواعد الاسترداد الحالية.
 * لو المنشأة عدّلت سياستها بعد كده، الحجوزات القديمة تفضل بقواعدها.
 *
 * MVP: سياسة افتراضية موحّدة. لاحقاً كل خدمة تقدر تحدّد سياستها الخاصة.
 */
class CancellationPolicyService
{
    /** السياسة الافتراضية: 100% قبل 48س · 50% قبل 24س · 0% بعدها */
    public const DEFAULT_RULES = [
        ['hours_before' => 48, 'refund_percent' => 100],
        ['hours_before' => 24, 'refund_percent' => 50],
        ['hours_before' => 0,  'refund_percent' => 0],
    ];

    /**
     * snapshot لسياسة الإلغاء وقت الحجز.
     * تُحفظ كـJSON على bookings.cancellation_policy_snapshot.
     */
    public function snapshot(Model $bookable): array
    {
        // مستقبلاً: قراءة من عمود على الخدمة أو جدول سياسات
        return [
            'rules' => self::DEFAULT_RULES,
            'note' => 'استرداد كامل قبل ٤٨ ساعة من موعد الخدمة، ٥٠٪ قبل ٢٤ ساعة، لا استرداد بعد ذلك.',
            'source' => 'default',
        ];
    }

    /** يحسب "آخر ميعاد للإلغاء المجاني" — عادةً 48 ساعة قبل الخدمة */
    public function freeCancellationDeadline(?Carbon $serviceDate): ?Carbon
    {
        if (! $serviceDate) {
            return null;
        }
        return $serviceDate->copy()->subHours(48);
    }

    /**
     * يحسب نسبة الاسترداد المستحقّة الآن حسب snapshot المخزَّن.
     *
     * @param  array  $snapshot  = ['rules' => [...]]
     */
    public function refundPercentAt(array $snapshot, Carbon $serviceDate, Carbon $now): int
    {
        $rules = $snapshot['rules'] ?? self::DEFAULT_RULES;
        $hoursLeft = max(0, $now->diffInHours($serviceDate, false));

        foreach ($rules as $rule) {
            if ($hoursLeft >= (int) $rule['hours_before']) {
                return (int) $rule['refund_percent'];
            }
        }
        return 0;
    }
}
