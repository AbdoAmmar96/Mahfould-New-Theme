import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input, Field, Select } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { v: 'booking', label: 'مشكلة في حجز' },
    { v: 'payment', label: 'مشكلة دفع' },
    { v: 'refund', label: 'طلب استرداد' },
    { v: 'complaint', label: 'شكوى' },
    { v: 'general', label: 'استفسار عام' },
];

const PRIORITIES = [
    { v: 'low', label: 'منخفضة' },
    { v: 'normal', label: 'عادية' },
    { v: 'high', label: 'عالية' },
    { v: 'urgent', label: 'عاجلة' },
];

export default function Create({ bookings, preset_booking_id }) {
    const { data, setData, post, processing, errors } = useForm({
        subject: '',
        category: 'booking',
        description: '',
        booking_id: preset_booking_id || '',
        priority: 'normal',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/account/support');
    };

    return (
        <SiteLayout anim="fade">
            <Head title="فتح تذكرة" />
            <section className="hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white lg:block">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> ›{' '}
                        <Link href="/account/support" className="hover:text-white">الدعم الفني</Link> › تذكرة جديدة
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">فتح تذكرة جديدة</h1>
                </div>
            </section>

            <section className="py-14">
                <div className="mx-auto w-full max-w-[720px] px-5">
                    <form onSubmit={submit} className="space-y-4 rounded-card border border-black/[.06] bg-white p-6">
                        <Field label="نوع المشكلة">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c.v}
                                        type="button"
                                        onClick={() => setData('category', c.v)}
                                        className={cn(
                                            'rounded-input border-[1.5px] p-2 text-sm font-bold transition-colors',
                                            data.category === c.v ? 'border-coral bg-coral/[.08] text-coral-deep' : 'border-black/[.08] text-navy hover:border-coral',
                                        )}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="الحجز المرتبط (اختياري)">
                            <Select value={data.booking_id} onChange={e => setData('booking_id', e.target.value)}>
                                <option value="">— بدون حجز محدّد —</option>
                                {bookings.map(b => (
                                    <option key={b.id} value={b.id}>{b.code} · {b.title}</option>
                                ))}
                            </Select>
                        </Field>

                        <Field label="عنوان مختصر">
                            <Input
                                value={data.subject}
                                onChange={e => setData('subject', e.target.value)}
                                placeholder="مثال: اسم المسافر مكتوب غلط"
                                className={cn(errors.subject && 'border-danger')}
                            />
                        </Field>

                        <Field label="تفاصيل المشكلة">
                            <textarea
                                rows={6}
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="اشرح المشكلة بالتفصيل — كل ما كانت واضحة كل ما ردّينا أسرع…"
                                className={cn(
                                    'w-full rounded-input border-[1.5px] border-black/[.08] bg-white px-3 py-2 text-sm text-navy placeholder-muted/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20',
                                    errors.description && 'border-danger',
                                )}
                            />
                        </Field>

                        <Field label="الأولوية">
                            <div className="grid grid-cols-4 gap-2">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.v}
                                        type="button"
                                        onClick={() => setData('priority', p.v)}
                                        className={cn(
                                            'rounded-input border-[1.5px] p-2 text-sm font-bold transition-colors',
                                            data.priority === p.v ? 'border-coral bg-coral/[.08] text-coral-deep' : 'border-black/[.08] text-navy hover:border-coral',
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <div className="flex items-center justify-between border-t border-black/[.06] pt-4">
                            <Button asChild variant="secondary"><Link href="/account/support">إلغاء</Link></Button>
                            <Button type="submit" disabled={processing || !data.subject || !data.description}>
                                {processing ? 'جاري الإرسال…' : 'إرسال التذكرة'}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>
        </SiteLayout>
    );
}
