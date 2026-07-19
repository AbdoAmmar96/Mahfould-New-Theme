import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { Check, Lock, CreditCard, Wallet, Banknote } from 'lucide-react';

const PAY = [
    { key: 'card', label: 'بطاقة ائتمان', Icon: CreditCard },
    { key: 'wallet', label: 'محفظة إلكترونية', Icon: Wallet },
    { key: 'on_arrival', label: 'دفع عند الوصول', Icon: Banknote },
];

export default function Checkout({ item, prefill = {}, pricing = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        type: item.type, id: item.id,
        start_date: prefill.start_date || '', guests: Number(prefill.guests) || 2, slot: prefill.slot || '',
        customer_name: '', customer_phone: '', customer_email: '', customer_national_id: '',
        payment_method: 'card',
    });

    const fee = pricing.fee ?? 200;
    const discount = pricing.discount ?? 0;
    const subtotal = useMemo(() => item.price * data.guests, [item.price, data.guests]);
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
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-3.5 font-head text-[19px] text-navy">بيانات المسافر الأساسي</h3>
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
                                        <Field label={<>الرقم القومي <small className="text-muted">(اختياري)</small></>}>
                                            <Input value={data.customer_national_id} onChange={(e) => setData('customer_national_id', e.target.value)} placeholder="14 رقم" />
                                        </Field>
                                        <Field label={item.type === 'hotel' ? 'تاريخ الوصول' : item.type === 'car' ? 'تاريخ الاستلام' : 'التاريخ'}>
                                            <Input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                                        </Field>
                                        <Field label={item.type === 'hotel' ? 'عدد الليالي' : item.type === 'car' ? 'عدد الأيام' : 'عدد الأفراد'}>
                                            <PartySizeField
                                                value={data.guests}
                                                onChange={(n) => setData('guests', n || 1)}
                                                singular={item.type === 'hotel' ? 'ليلة' : item.type === 'car' ? 'يوم' : 'فرد'}
                                                plural={item.type === 'hotel' ? 'ليالي' : item.type === 'car' ? 'أيام' : 'أفراد'}
                                                options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: String(n) }))}
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-3.5 font-head text-[19px] text-navy">طريقة الدفع</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {PAY.map((p) => {
                                            const sel = data.payment_method === p.key;
                                            return (
                                                <div key={p.key} onClick={() => setData('payment_method', p.key)}
                                                    className={cn(
                                                        'flex min-w-[150px] flex-1 cursor-pointer items-center gap-2.5 rounded-input border-[1.5px] p-4 font-bold text-navy transition-colors hover:border-coral',
                                                        sel ? 'border-coral bg-coral/[.06]' : 'border-black/[.06]',
                                                    )}>
                                                    <p.Icon className="h-5 w-5 text-coral-deep" /> {p.label}
                                                    <span className={cn('ms-auto flex h-[18px] w-[18px] items-center justify-center rounded-full border-2', sel ? 'border-coral' : 'border-black/[.06]')}>
                                                        {sel && <span className="h-2 w-2 rounded-full bg-coral" />}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ملخص */}
                            <div>
                                <div className="rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk lg:sticky lg:top-[92px]">
                                    <div className="mb-4 flex items-center gap-3 border-b border-black/[.06] pb-4">
                                        <img src={item.image_url} className="h-16 w-16 rounded-xl object-cover" alt="" />
                                        <div>
                                            <b className="font-head text-navy">{item.title}</b>
                                            <div className="text-[13px] font-semibold text-muted">{data.guests} {item.unit}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between py-[9px] text-sm"><span>السعر ({data.guests} {item.unit})</span><span>{money(subtotal)} ج.م</span></div>
                                    <div className="flex justify-between py-[9px] text-sm"><span>رسوم الخدمة</span><span>{money(fee)} ج.م</span></div>
                                    {discount > 0 && (
                                        <div className="flex justify-between py-[9px] text-sm"><span>خصم مكفول</span><span className="text-makfol">−{money(discount)} ج.م</span></div>
                                    )}
                                    <div className="mt-2 flex justify-between border-t border-black/[.06] pb-[9px] pt-3.5 text-base font-extrabold"><span>الإجمالي</span><b className="font-head text-xl text-coral-deep">{money(total)} ج.م</b></div>
                                    <Button type="submit" disabled={processing} block size="lg" className="mt-4">
                                        {processing ? 'جاري التأكيد…' : 'أكّد وادفع'}
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
