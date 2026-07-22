<?php

namespace App\Services\Booking;

use App\Models\Setting;

/**
 * مصدر الحقيقة الوحيد لتسعير أي حجز.
 *
 * ليه موجودة:
 *   التسعير كان متكرّر في 5 أماكن — store() والـcheckout و3 صفحات تفاصيل —
 *   وكل واحد بيحسب بطريقته. النتيجة كانت أرقام مختلفة على كل شاشة
 *   (صفحة الرحلة تقول 3800، الدفع يقول 2800، والسيرفر يسجّل 3400).
 *
 * القاعدة:
 *   السيرفر **يحسب**، والواجهة **تعرض بس**. الواجهة بتستقبل التفصيل جاهز
 *   من هنا وما بتحسبش أي رقم بنفسها.
 *
 * تراكم الخصومات (قرار العميل: «يتجمعوا كلهم»):
 *   الأساس   = سعر الوحدة × الكمية (أو شرائح الأعمار) + الفعاليات
 *   − خصم المجموعات   نسبة على الأساس   (بند 17)
 *   − كوبون التعليق   نسبة على الباقي   (بند 1)
 *   − خصم مكفول       مبلغ ثابت
 *   + رسوم الخدمة
 */
class PricingService
{
    /**
     * @param  float  $base            سعر الخدمة قبل أي خصم (شامل الفعاليات)
     * @param  int    $guests          عدد الأفراد — بيحدّد استحقاق خصم المجموعات
     * @param  bool   $isGuaranteed    خدمة مكفولة؟ (خصم مكفول الثابت)
     * @param  float  $couponPct       نسبة كوبون التعليق (0 لو مفيش)
     */
    public function quote(float $base, int $guests, bool $isGuaranteed, float $couponPct = 0.0): array
    {
        $base = round(max(0, $base), 2);

        $fee = (float) Setting::get('service_fee', 200);

        // ── بند 17: خصم المجموعات ──
        // «أكتر من 4 أفراد» → الحد الأدنى 5. على الحجز كله مش لكل فرد.
        $groupMin = (int) Setting::get('group_discount_min_guests', 5);
        $groupPct = (float) Setting::get('group_discount_pct', 10);
        $groupDiscount = $guests >= $groupMin ? round($base * $groupPct / 100, 2) : 0.0;

        // ── بند 1: كوبون التعليق ── يتحسب على الباقي بعد خصم المجموعات
        $couponDiscount = $couponPct > 0
            ? round(max(0, $base - $groupDiscount) * $couponPct / 100, 2)
            : 0.0;

        // ── خصم مكفول ── مبلغ ثابت على الخدمات المضمونة
        $makfolDiscount = $isGuaranteed ? (float) Setting::get('makfol_discount', 400) : 0.0;

        $discountTotal = round($groupDiscount + $couponDiscount + $makfolDiscount, 2);
        $total = round(max(0, $base - $discountTotal + $fee), 2);

        // ملاحظة اقتصادية: العمولة بتتحسب على الإجمالي النهائي زي ما كانت.
        // يعني المنصة بتاخد عمولة على رسومها هي، والمزوّد بيتحمّل خصومات المنصة.
        // لو ده مش المقصود، غيّر الأساس هنا لـ($base - $discountTotal).
        $rate = (float) Setting::get('commission_rate', 15);
        $commission = round($total * $rate / 100, 2);

        return [
            'base' => $base,
            'service_fee' => $fee,
            'discounts' => [
                'group' => [
                    'amount' => $groupDiscount,
                    'pct' => $groupPct,
                    'min_guests' => $groupMin,
                    'applied' => $groupDiscount > 0,
                    'label' => "خصم المجموعات ({$groupPct}%)",
                ],
                'coupon' => [
                    'amount' => $couponDiscount,
                    'pct' => $couponPct,
                    'applied' => $couponDiscount > 0,
                    'label' => 'كوبون تقييمك ('.rtrim(rtrim(number_format($couponPct, 1, '.', ''), '0'), '.').'%)',
                ],
                'makfol' => [
                    'amount' => $makfolDiscount,
                    'applied' => $makfolDiscount > 0,
                    'label' => 'خصم مكفول',
                ],
            ],
            'discount_total' => $discountTotal,
            'total' => $total,
            'commission' => $commission,
        ];
    }

    /** هل عدد الأفراد ده يستحق خصم المجموعات؟ (للعرض التحفيزي قبل الحجز) */
    public function groupDiscountThreshold(): int
    {
        return (int) Setting::get('group_discount_min_guests', 5);
    }

    public function groupDiscountPct(): float
    {
        return (float) Setting::get('group_discount_pct', 10);
    }
}
