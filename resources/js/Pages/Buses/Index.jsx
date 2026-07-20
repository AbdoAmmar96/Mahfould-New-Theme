import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Bus, ArrowLeft, MapPin, Clock, Users, ShieldCheck, Filter } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Select, Field } from '@/Components/ui/input';
import { money } from '@/Components/ui/service-card';
import { cn } from '@/lib/utils';

const Wrap = ({ className, children }) => (
    <div className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</div>
);

export default function Index({ trips, cities = [], filters = {} }) {
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');
    const [date, setDate] = useState(filters.date || '');

    const search = (e) => {
        e.preventDefault();
        const q = {};
        if (from) q.from = from;
        if (to) q.to = to;
        if (date) q.date = date;
        router.get('/buses', q);
    };

    const rows = trips?.data || [];

    return (
        <SiteLayout active="buses">
            <Head title="الباصات — رحلات مجدولة" />

            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-32 -start-16 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <Wrap className="relative z-[1]">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> › الباصات
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">رحلات باصات مجدولة</h1>
                    <p className="mt-1 text-white/70">اختار رحلتك بمقعدك — تأكيد فوري، تدفع في الباص</p>
                </Wrap>
            </section>

            <section className="pt-8 pb-14">
                <Wrap>
                    <form onSubmit={search} className="mb-6 grid grid-cols-1 items-end gap-3 rounded-card border border-black/[.06] bg-white p-5 shadow-mk sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
                        <Field label="من مدينة">
                            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                                <option value="">— كل المدن —</option>
                                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                        </Field>
                        <Field label="إلى مدينة">
                            <Select value={to} onChange={(e) => setTo(e.target.value)}>
                                <option value="">— كل المدن —</option>
                                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                        </Field>
                        <Field label="تاريخ السفر"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                        <Button type="submit"><Filter className="h-4 w-4" /> فلترة</Button>
                    </form>

                    {rows.length === 0 ? (
                        <div className="rounded-card border border-dashed border-black/[.12] bg-white p-12 text-center">
                            <Bus className="mx-auto mb-3 h-10 w-10 text-muted" />
                            <div className="font-head text-lg font-bold text-navy">لا توجد رحلات باصات مجدولة حالياً</div>
                            <p className="mt-1 text-sm text-muted">جرّب فلترة مختلفة أو تعال لاحقاً</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {rows.map((t) => (
                                <article key={t.id} className="grid grid-cols-1 items-stretch gap-0 overflow-hidden rounded-card border border-black/[.06] bg-white shadow-mk transition-all hover:shadow-mk-lg md:grid-cols-[1fr_260px]">
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            {t.provider?.is_first_party && <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> مكفول</Badge>}
                                            {t.provider?.verified && !t.provider.is_first_party && <Badge variant="vip">موثّق</Badge>}
                                            <span className="text-[13px] font-semibold text-muted">{t.route_name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="font-head text-lg font-bold text-navy">{t.from}</div>
                                                <div className="text-[13px] text-muted">إقلاع {t.departs_at}</div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 px-2">
                                                <ArrowLeft className="h-5 w-5 text-coral" />
                                                {t.duration_minutes && (
                                                    <span className="rounded-full bg-beige px-2 py-0.5 text-[11px] font-bold text-navy">
                                                        {Math.floor(t.duration_minutes / 60)}س {t.duration_minutes % 60}د
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 text-end">
                                                <div className="font-head text-lg font-bold text-navy">{t.to}</div>
                                                {t.arrives_at && <div className="text-[13px] text-muted">وصول {t.arrives_at}</div>}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                                            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t.seats_remaining}/{t.seats_total} مقعد متاح</span>
                                            {t.provider?.name && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t.provider.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-2 border-s border-dashed border-black/[.06] bg-beige/50 p-5 text-center md:min-w-[220px]">
                                        <div className="font-head text-2xl font-bold text-coral-deep">{money(t.price)} <small className="text-sm font-semibold text-muted">ج.م</small></div>
                                        <div className="text-[12px] text-muted">للمقعد</div>
                                        {t.seats_remaining > 0 ? (
                                            <Button asChild size="lg" className="w-full">
                                                <Link href={t.checkout_url}>احجز مقعدك</Link>
                                            </Button>
                                        ) : (
                                            <Button size="lg" className="w-full" disabled>مكتمل</Button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </Wrap>
            </section>
        </SiteLayout>
    );
}
