import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Button } from '@/Components/ui/button';
import { Input, Select, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Label } from '@/Components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { Separator } from '@/Components/ui/separator';
import { ymd } from '@/lib/useAvailability';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    Check, Lock, CreditCard, Wallet, Banknote,
    User, UserPlus, Users, AlertTriangle, ShieldCheck, ChevronDown, Info,
    Car, Bus, Truck,
} from 'lucide-react';

const PAY = [
    { key: 'card', label: 'بطاقة ائتمان', Icon: CreditCard },
    { key: 'wallet', label: 'محفظة إلكترونية', Icon: Wallet },
    { key: 'on_arrival', label: 'دفع عند الوصول/الاستخدام', Icon: Banknote },
];

const TIMING_LABEL = {
    on_arrival: 'الدفع عند الوصول',
    on_use: 'الدفع عند الاستخدام',
    prepaid: 'الدفع الكامل مسبقاً',
};

// اختيار شريحة العمر حسب الأعمار المُدخلة (يطابق منطق AgePricingService::pickTier)
function tierFor(age, tiers) {
    for (const t of tiers) {
        const inMin = age >= (Number(t.min_age) || 0);
        const inMax = t.max_age === null || t.max_age === undefined || age <= Number(t.max_age);
        if (inMin && inMax) return t;
    }
    return tiers[tiers.length - 1] || { label: 'بالغ', multiplier: 1 };
}

export default function Checkout({ item, prefill = {}, pricing = {} }) {
    const pooled = !!item.pooled;
    const ageTiers = pricing.age_tiers || [];
    const payment = pricing.payment || { default_timing_self: 'on_arrival', timing_other: 'prepaid' };

    const { data, setData, post, processing, errors } = useForm({
        type: item.type, id: item.id,
        room_type_id: prefill.room_type_id || item.room_type?.id || null,
        restaurant_table_id: prefill.restaurant_table_id || null,
        start_date: prefill.start_date || '',
        start_time: prefill.start_time || '',
        guests: Number(prefill.guests) || 2,
        nights: Number(prefill.nights) || 2,
        units: Number(prefill.units) || 1,
        slot: prefill.slot || '',
        guests_ages: [],
        // Phase E — فعاليات مختارة (add-ons للرحلات)
        activity_ids: prefill.activity_ids || [],
        customer_name: '', customer_phone: '', customer_email: '', customer_national_id: '',
        // Phase B — الحجز لمين
        booking_for: 'self',
        beneficiary_name: '', beneficiary_national_id: '', beneficiary_age: '',
        // Phase C — طريقة الوصول (فنادق/رحلات فقط)
        transport_mode: '',
        bus_trip_id: null,
        payment_method: pooled ? 'on_arrival' : 'card',
    });

    const showTransport = item.type === 'hotel' || item.type === 'tour';

    // احسم توقيت الدفع الحالي — لو للطرف آخر أو صاحب السعادة → prepaid إلزامي
    const timing = data.booking_for === 'other'
        ? 'prepaid'
        : (data.payment_method === 'card' || data.payment_method === 'wallet' ? 'prepaid' : payment.default_timing_self);
    const prepayRequired = data.booking_for === 'other' || item.type === 'sahb';

    // لو تحوّل لطرف آخر ومعاه on_arrival → غيّر تلقائياً لـcard
    useEffect(() => {
        if (prepayRequired && data.payment_method === 'on_arrival') {
            setData('payment_method', 'card');
        }
    }, [prepayRequired, data.payment_method, setData]);

    const today = ymd(new Date());
    const fee = pricing.fee ?? 200;
    const discount = pricing.discount ?? 0;

    // احسب subtotal بناءً على شرائح العمر لو الأعمار مُدخلة (غير الفنادق)
    const ageSubtotal = useMemo(() => {
        if (pooled || data.guests_ages.length === 0) return 0;
        return data.guests_ages.reduce((sum, age) => {
            const t = tierFor(Number(age) || 0, ageTiers);
            return sum + Math.round(item.price * (Number(t.multiplier) || 1));
        }, 0);
    }, [pooled, data.guests_ages, ageTiers, item.price]);

    const subtotal = useMemo(() => {
        if (pooled) return item.price * data.nights * data.units;
        return ageSubtotal > 0 ? ageSubtotal : item.price * data.guests;
    }, [pooled, item.price, data.nights, data.units, data.guests, ageSubtotal]);

    const total = Math.max(0, subtotal + fee - discount);

    const submit = (e) => { e.preventDefault(); post('/checkout'); };

    return (
        <SiteLayout>
            <Head title="إتمام الحجز" />
            <section className="py-[34px]">
                <div className="mx-auto w-full max-w-[1080px] px-5">
                    <h1 className="mb-[22px] font-head text-[28px] font-bold text-navy md:text-3xl">إتمام الحجز</h1>

                    {/* الخطوات */}
                    <div className="mb-[30px] flex items-center">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-muted sm:text-sm">
                            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-transparent bg-gradient-to-br from-coral to-coral-deep text-white">
                                <Check className="h-4 w-4" />
                            </span>
                            <span className="hidden sm:inline">اختيار الخدمة</span>
                        </div>
                        <div className="mx-3.5 h-0.5 min-w-[30px] flex-1 bg-coral" />
                        <div className="flex items-center gap-2.5 text-xs font-bold text-navy sm:text-sm">
                            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-transparent bg-gradient-to-br from-coral to-coral-deep text-sm text-white">2</span>
                            <span className="hidden sm:inline">البيانات والمراجعة</span>
                        </div>
                        <div className="mx-3.5 h-0.5 min-w-[30px] flex-1 bg-black/[.06]" />
                        <div className="flex items-center gap-2.5 text-xs font-bold text-muted sm:text-sm">
                            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-black/[.06] bg-beige text-sm text-muted">3</span>
                            <span className="hidden sm:inline">الدفع الآمن</span>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
                            <div>
                                {/* ── §4: الحجز لمين ── */}
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-4 font-head text-[19px] text-navy">الحجز لمين؟</h3>
                                    <RadioGroup
                                        value={data.booking_for}
                                        onValueChange={(v) => setData('booking_for', v)}
                                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                    >
                                        {[
                                            { key: 'self', label: 'ليّا شخصياً', Icon: User, hint: 'أنا المسافر/المستفيد' },
                                            { key: 'other', label: 'لشخص تاني', Icon: UserPlus, hint: 'حجز لصديق/عائلة (دفع مسبق كامل)' },
                                        ].map((opt) => {
                                            const sel = data.booking_for === opt.key;
                                            return (
                                                <label
                                                    key={opt.key}
                                                    className={cn(
                                                        'flex cursor-pointer items-start gap-3 rounded-input border-[1.5px] p-4 transition-colors hover:border-coral',
                                                        sel ? 'border-coral bg-coral/[.06]' : 'border-black/[.08]',
                                                    )}
                                                >
                                                    <RadioGroupItem value={opt.key} id={`bf-${opt.key}`} className="mt-1" />
                                                    <div className="flex flex-1 flex-col gap-1">
                                                        <span className="flex items-center gap-2 font-head font-bold text-navy">
                                                            <opt.Icon className="h-4 w-4 text-coral-deep" />
                                                            {opt.label}
                                                        </span>
                                                        <span className="text-[13px] text-muted">{opt.hint}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </RadioGroup>

                                    {/* بيانات المستفيد الرئيسي — تظهر عند "لطرف آخر" */}
                                    {data.booking_for === 'other' && (
                                        <div className="mt-4 rounded-input border border-coral/30 bg-coral/[.04] p-4 duration-200 animate-in fade-in slide-in-from-top-1">
                                            <div className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-navy">
                                                <ShieldCheck className="h-4 w-4 text-coral-deep" />
                                                بيانات المستفيد الرئيسي (المسافر)
                                            </div>
                                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                                                <Field label="اسم المستفيد">
                                                    <Input
                                                        className={cn(errors.beneficiary_name && 'border-danger ring-2 ring-danger/20')}
                                                        value={data.beneficiary_name}
                                                        onChange={(e) => setData('beneficiary_name', e.target.value)}
                                                        placeholder="الاسم رباعياً"
                                                    />
                                                </Field>
                                                <Field label="الرقم القومي">
                                                    <Input
                                                        className={cn(errors.beneficiary_national_id && 'border-danger ring-2 ring-danger/20')}
                                                        value={data.beneficiary_national_id}
                                                        onChange={(e) => setData('beneficiary_national_id', e.target.value)}
                                                        placeholder="14 رقم"
                                                    />
                                                </Field>
                                                <Field label="السن">
                                                    <Input
                                                        type="number" min={0} max={120}
                                                        className={cn(errors.beneficiary_age && 'border-danger ring-2 ring-danger/20')}
                                                        value={data.beneficiary_age}
                                                        onChange={(e) => setData('beneficiary_age', e.target.value)}
                                                        placeholder="سن المستفيد"
                                                    />
                                                </Field>
                                            </div>
                                            <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-muted">
                                                <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-coral-deep" />
                                                <span>الحجز لطرف آخر يتطلب <b>الدفع الكامل المسبق</b> — قاعدة أمان لمنع الحجوزات الوهمية.</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ── §4: بيانات المسافر الأساسي (المشترك) ── */}
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-3.5 font-head text-[19px] text-navy">
                                        {data.booking_for === 'other' ? 'بيانات الحاجز (اللي بيدفع)' : 'بيانات المسافر الأساسي'}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                        <Field label="الاسم بالكامل">
                                            <Input className={cn(errors.customer_name && 'border-danger ring-2 ring-danger/20')} value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} placeholder="عمرو شلبي" />
                                        </Field>
                                        <Field label="رقم الموبايل">
                                            <Input className={cn(errors.customer_phone && 'border-danger ring-2 ring-danger/20')} value={data.customer_phone} onChange={(e) => setData('customer_phone', e.target.value)} placeholder="010xxxxxxxx" />
                                        </Field>
                                        <Field label="البريد الإلكتروني">
                                            <Input type="email" value={data.customer_email} onChange={(e) => setData('customer_email', e.target.value)} placeholder="you@email.com" />
                                        </Field>
                                        {data.booking_for === 'self' && (
                                            <Field label={<>الرقم القومي <small className="text-muted">(اختياري)</small></>}>
                                                <Input value={data.customer_national_id} onChange={(e) => setData('customer_national_id', e.target.value)} placeholder="14 رقم" />
                                            </Field>
                                        )}
                                        <Field label={pooled ? 'تاريخ الوصول' : item.type === 'car' ? 'تاريخ الاستلام' : 'التاريخ'}>
                                            <Input type="date" min={pooled ? today : undefined} value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                                        </Field>
                                        {pooled ? (
                                            <>
                                                <Field label="عدد الليالي">
                                                    <Select value={data.nights} onChange={(e) => setData('nights', +e.target.value)}>
                                                        {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => <option key={n} value={n}>{n} ليالي</option>)}
                                                    </Select>
                                                </Field>
                                                <Field label="عدد الغرف">
                                                    <Select value={data.units} onChange={(e) => setData('units', +e.target.value)}>
                                                        {Array.from({ length: item.units_total || 1 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} غرفة</option>)}
                                                    </Select>
                                                </Field>
                                                <Field label="عدد الضيوف">
                                                    <PartySizeField
                                                        value={data.guests}
                                                        onChange={(n) => setData('guests', n || 1)}
                                                        singular="ضيف" plural="ضيوف"
                                                        options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n} ضيوف` }))}
                                                    />
                                                </Field>
                                            </>
                                        ) : (
                                            <Field label={item.type === 'car' ? 'عدد الأيام' : 'عدد الأفراد'}>
                                                <PartySizeField
                                                    value={data.guests}
                                                    onChange={(n) => {
                                                        setData('guests', n || 1);
                                                        // لو نقصنا العدد، اقص الأعمار
                                                        if (data.guests_ages.length > (n || 1)) {
                                                            setData('guests_ages', data.guests_ages.slice(0, n || 1));
                                                        }
                                                    }}
                                                    singular={item.type === 'car' ? 'يوم' : 'فرد'}
                                                    plural={item.type === 'car' ? 'أيام' : 'أفراد'}
                                                    options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: String(n) }))}
                                                />
                                            </Field>
                                        )}
                                    </div>

                                    {/* شرائح العمر — للخدمات غير الفنادق فقط */}
                                    {!pooled && ageTiers.length > 0 && (
                                        <div className="mt-4 rounded-input border border-black/[.06] bg-beige/50 p-4">
                                            <AgesPopover
                                                guests={data.guests}
                                                ages={data.guests_ages}
                                                tiers={ageTiers}
                                                onChange={(arr) => setData('guests_ages', arr)}
                                                unitPrice={item.price}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── §6: طريقة الوصول (فنادق/رحلات فقط) ── */}
                                {showTransport && (
                                    <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                        <h3 className="mb-1 font-head text-[19px] text-navy">إزاي هتوصل؟</h3>
                                        <p className="mb-4 text-sm text-muted">اختر طريقة الوصول (اختياري) — احنا نظبّطلك الباقي</p>
                                        <RadioGroup
                                            value={data.transport_mode}
                                            onValueChange={(v) => setData('transport_mode', v)}
                                            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                                        >
                                            {[
                                                { key: 'own_car', label: 'هوصّل بعربيتي', Icon: Car, hint: 'تصريح دخول QR ينزل مع الحجز' },
                                                { key: 'bus', label: 'أحجز باص', Icon: Bus, hint: 'من رحلات المنصة المجدولة' },
                                                { key: 'rented_car', label: 'أحجز عربية', Icon: Truck, hint: 'من الأسطول أو مزوّدينا' },
                                            ].map((opt) => {
                                                const sel = data.transport_mode === opt.key;
                                                return (
                                                    <label
                                                        key={opt.key}
                                                        dir="rtl"
                                                        className={cn(
                                                            'block cursor-pointer rounded-input border-[1.5px] p-4 text-right transition-colors hover:border-coral',
                                                            sel ? 'border-coral bg-coral/[.06]' : 'border-black/[.08]',
                                                        )}
                                                    >
                                                        <RadioGroupItem value={opt.key} className="sr-only" />
                                                        <div className="flex items-center gap-2">
                                                            <opt.Icon className="h-5 w-5 flex-none text-coral-deep" />
                                                            <span className="font-bold text-navy">{opt.label}</span>
                                                        </div>
                                                        <p className="mt-1.5 text-right text-[12.5px] leading-snug text-muted">{opt.hint}</p>
                                                    </label>
                                                );
                                            })}
                                        </RadioGroup>
                                        {data.transport_mode === 'own_car' && (
                                            <div dir="rtl" className="mt-4 flex items-start gap-2 rounded-input border border-royal/25 bg-royal/[.04] p-3 text-right text-[12.5px] text-navy">
                                                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-royal" />
                                                <span>هيصدر تصريح دخول QR عند تأكيد الحجز — يظهر في صفحة التأكيد وبروفايلك.</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── §5: طريقة الدفع + توقيته ── */}
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <div className="mb-3.5 flex items-center justify-between">
                                        <h3 className="font-head text-[19px] text-navy">طريقة الدفع</h3>
                                        <span className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                                            timing === 'prepaid' ? 'bg-royal text-white'
                                                : timing === 'on_arrival' ? 'bg-makfol text-white'
                                                : 'bg-navy text-white',
                                        )}>
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {TIMING_LABEL[timing]}
                                        </span>
                                    </div>

                                    {prepayRequired && (
                                        <div className="mb-3.5 flex items-start gap-2 rounded-input border border-royal/30 bg-royal/[.06] p-3 text-[13px] text-navy">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-royal" />
                                            <span>
                                                {data.booking_for === 'other'
                                                    ? 'الحجز لطرف آخر — الدفع الكامل المسبق إلزامي (كارت أو محفظة).'
                                                    : 'صاحب السعادة — الدفع مقدّم عند الحجز.'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        {PAY.filter((p) => !(prepayRequired && p.key === 'on_arrival')).map((p) => {
                                            const sel = data.payment_method === p.key;
                                            return (
                                                <div key={p.key} onClick={() => setData('payment_method', p.key)}
                                                    className={cn(
                                                        'flex min-w-[150px] flex-1 cursor-pointer items-center gap-2.5 rounded-input border-[1.5px] p-4 font-bold text-navy transition-colors hover:border-coral',
                                                        sel ? 'border-coral bg-coral/[.06]' : 'border-black/[.06]',
                                                    )}>
                                                    <p.Icon className="h-5 w-5 text-coral-deep" /> {p.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ── الملخص الجانبي ── */}
                            <div>
                                <div className="rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk lg:sticky lg:top-[92px]">
                                    <div className="mb-4 flex items-center gap-3 border-b border-black/[.06] pb-4">
                                        <img src={item.image_url} className="h-16 w-16 rounded-xl object-cover" alt="" />
                                        <div className="flex-1">
                                            <b className="font-head text-navy">{item.title}</b>
                                            {item.room_type && (
                                                <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-coral/[.08] px-2 py-0.5 text-[11.5px] font-bold text-coral-deep">
                                                    {item.room_type.title}
                                                    {item.room_type.includes_breakfast && <span className="text-[10.5px] text-makfol">· إفطار</span>}
                                                </div>
                                            )}
                                            <div className="mt-1 text-[13px] font-semibold text-muted">
                                                {pooled ? `${data.nights} ليالي · ${data.units} غرفة · ${data.guests} ضيوف` : `${data.guests} ${item.unit}`}
                                            </div>
                                        </div>
                                    </div>

                                    {ageSubtotal > 0 ? (
                                        <div className="space-y-1 py-1">
                                            {Object.entries(
                                                data.guests_ages.reduce((acc, a) => {
                                                    const t = tierFor(Number(a) || 0, ageTiers);
                                                    const key = t.label;
                                                    acc[key] = acc[key] || { count: 0, mult: Number(t.multiplier) || 1 };
                                                    acc[key].count += 1;
                                                    return acc;
                                                }, {}),
                                            ).map(([label, { count, mult }]) => (
                                                <div key={label} className="flex justify-between text-sm">
                                                    <span>{label} × {count}</span>
                                                    <span>{money(count * item.price * mult)} ج.م</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between py-[9px] text-sm">
                                            <span>{pooled ? `السعر (${data.nights}×${data.units})` : `السعر (${data.guests} ${item.unit})`}</span>
                                            <span>{money(subtotal)} ج.م</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-[9px] text-sm"><span>رسوم الخدمة</span><span>{money(fee)} ج.م</span></div>
                                    {discount > 0 && (
                                        <div className="flex justify-between py-[9px] text-sm"><span>خصم مكفول</span><span className="text-makfol">−{money(discount)} ج.م</span></div>
                                    )}
                                    <div className="mt-2 flex justify-between border-t border-black/[.06] pb-[9px] pt-3.5 text-base font-extrabold">
                                        <span>الإجمالي</span>
                                        <b className="font-head text-xl text-coral-deep">{money(total)} ج.م</b>
                                    </div>

                                    <Separator className="my-3" />
                                    <div className="flex items-center gap-2 text-[12.5px] text-muted">
                                        <ShieldCheck className="h-3.5 w-3.5 text-makfol" />
                                        <span>{TIMING_LABEL[timing]} — سياسة إلغاء ٤٨س قبل الميعاد</span>
                                    </div>

                                    <Button type="submit" disabled={processing} block size="lg" className="mt-4">
                                        {processing ? 'جاري التأكيد…' : (timing === 'prepaid' ? 'أكّد وادفع' : 'أكّد الحجز')}
                                    </Button>
                                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-muted"><Lock className="h-3.5 w-3.5" /> دفع آمن ومشفّر</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        </SiteLayout>
    );
}

// ── Popover: أعمار الأفراد (شرائح التسعير) ──
function AgesPopover({ guests, ages, tiers, onChange, unitPrice }) {
    const [open, setOpen] = useState(false);
    const activeAges = ages.length === guests ? ages : Array.from({ length: guests }, (_, i) => ages[i] ?? 30);
    const filledCount = ages.length;

    const setAge = (i, val) => {
        const next = [...activeAges];
        next[i] = Math.max(0, Math.min(120, Number(val) || 0));
        onChange(next);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-start"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                        <Users className="h-4 w-4 text-coral-deep" />
                        {filledCount > 0
                            ? `تم إدخال ${filledCount} عمر · تسعير بالشرائح`
                            : 'حدّد عمر كل فرد (اختياري — للتسعير حسب الشرائح)'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted transition-transform" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px]" align="end">
                <div className="mb-3">
                    <Label className="text-sm font-bold text-navy">عمر كل فرد</Label>
                    <p className="mt-0.5 text-[12px] text-muted">التسعير يتحسب حسب الشريحة المناسبة</p>
                </div>
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                    {Array.from({ length: guests }).map((_, i) => {
                        const age = Number(activeAges[i]) || 0;
                        const t = tierFor(age, tiers);
                        return (
                            <div key={i} className="flex items-center gap-3 rounded-input border border-black/[.06] bg-white p-2.5">
                                <span className="w-16 text-[13px] font-bold text-muted">فرد {i + 1}</span>
                                <input
                                    type="number" min={0} max={120}
                                    value={activeAges[i] ?? ''}
                                    onChange={(e) => setAge(i, e.target.value)}
                                    className="h-9 w-16 rounded-md border border-black/10 text-center text-sm font-bold text-navy outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                                    placeholder="30"
                                />
                                <span className="text-[12.5px] text-muted">سنة</span>
                                <span className="ms-auto rounded-full bg-beige px-2.5 py-1 text-[11.5px] font-bold text-navy">
                                    {t.label} · {Math.round(Number(t.multiplier) * 100)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-muted">الإجمالي (قبل الرسوم)</span>
                    <b className="font-head text-coral-deep">
                        {money(activeAges.slice(0, guests).reduce((s, a) => {
                            const t = tierFor(Number(a) || 0, tiers);
                            return s + Math.round(unitPrice * (Number(t.multiplier) || 1));
                        }, 0))} ج.م
                    </b>
                </div>
                <Button type="button" block className="mt-3" onClick={() => setOpen(false)}>تم</Button>
            </PopoverContent>
        </Popover>
    );
}
