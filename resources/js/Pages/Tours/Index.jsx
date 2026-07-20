import SiteLayout from '@/Layouts/SiteLayout';
import { ListingCard } from '@/Components/UI';
import { Button } from '@/Components/ui/button';
import { Select, Input } from '@/Components/ui/input';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Calendar, BedDouble, Plane, Search, Filter, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Index({ tours, locations, filters }) {
    const [q, setQ] = useState(filters?.q || '');
    const [sort, setSort] = useState(filters?.sort || '');
    const [minPrice, setMinPrice] = useState(filters?.min_price || '');
    const [maxPrice, setMaxPrice] = useState(filters?.max_price || 15000);
    const [duration, setDuration] = useState(filters?.duration_days || '');
    const [guaranteed, setGuaranteed] = useState(!!filters?.guaranteed);
    const [withActivities, setWithActivities] = useState(!!filters?.with_activities);

    // debounce للبحث النصّي
    useEffect(() => {
        const t = setTimeout(() => {
            if (q !== (filters?.q || '')) push({ q });
        }, 400);
        return () => clearTimeout(t);
    }, [q]); // eslint-disable-line

    const push = (patch = {}) => router.get('/tours', {
        ...filters, q, sort,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        duration_days: duration || undefined,
        guaranteed: guaranteed || undefined,
        with_activities: withActivities || undefined,
        ...patch,
    }, { preserveState: true, replace: true });

    const byLoc = (slug) => push({ location: filters.location === slug ? undefined : slug });
    const changeSort = (v) => { setSort(v); push({ sort: v }); };
    const clear = () => router.get('/tours');
    const hasActive = q || filters.location || minPrice || maxPrice !== 15000 || duration || guaranteed || withActivities || sort;

    return (
        <SiteLayout active="tours">
            <Head title="الرحلات" />

            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5 2xl:max-w-[1600px]">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="transition-colors hover:text-white">الرئيسية</Link> › الرحلات
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold">رحلات وبرامج سياحية</h1>
                    <p className="mt-1.5 text-white/70">كل الرحلات مكفولة — سعر متّفق عليه وضمان استرداد</p>

                    {/* بحث نصي داخل البانر */}
                    <div className="mt-5 flex max-w-2xl gap-2 rounded-input bg-white p-1.5">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="ابحث بالاسم أو الوجهة — شرم، الغردقة، غوص…"
                                className="h-11 w-full rounded-input border-none bg-transparent pe-3 ps-9 text-sm text-navy outline-none placeholder:text-muted"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="pt-[34px] pb-14 md:pb-[72px]">
                <div className="mx-auto w-full max-w-[1200px] px-5 2xl:max-w-[1600px]">
                    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[300px_1fr]">
                        {/* الفلتر */}
                        <aside className="self-start rounded-card border border-black/[.06] bg-white p-5 lg:sticky lg:top-[92px]">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="flex items-center gap-1.5 font-head text-base font-bold text-navy">
                                    <Filter className="h-4 w-4 text-coral-deep" /> فلترة النتائج
                                </h4>
                                {hasActive && (
                                    <button onClick={clear} className="text-[12px] font-bold text-coral-deep hover:underline">مسح</button>
                                )}
                            </div>

                            {/* الوجهة */}
                            <FilterSection title="الوجهة">
                                <div className="max-h-56 overflow-y-auto space-y-1">
                                    {locations.map((l) => (
                                        <label key={l.slug}
                                            className="flex cursor-pointer items-center gap-2 py-1 text-sm font-semibold text-navy">
                                            <input type="checkbox" checked={filters.location === l.slug}
                                                onChange={() => byLoc(l.slug)}
                                                className="h-[16px] w-[16px] accent-coral" />
                                            {l.name}
                                            <span className="ms-auto text-xs text-muted">{l.count}</span>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* السعر */}
                            <FilterSection title="نطاق السعر (ج.م)">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number" placeholder="من" min={0}
                                        value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                                        onBlur={() => push()}
                                        className="h-9 text-sm"
                                    />
                                    <Input
                                        type="number" placeholder="إلى" min={0}
                                        value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                                        onBlur={() => push()}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </FilterSection>

                            {/* مدة الرحلة */}
                            <FilterSection title="مدة الرحلة">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[2, 3, 4, 5, 7].map(d => (
                                        <button key={d}
                                            onClick={() => { setDuration(duration === String(d) ? '' : String(d)); push({ duration_days: duration === String(d) ? undefined : d }); }}
                                            className={cn(
                                                'rounded-md border py-1.5 text-[12.5px] font-bold transition-colors',
                                                +duration === d ? 'border-coral bg-coral/[.08] text-coral-deep' : 'border-black/[.08] text-navy hover:border-coral',
                                            )}>
                                            {d} {d > 2 ? 'أيام' : 'يوم'}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* ميّزات */}
                            <FilterSection title="ميّزات">
                                <label className="flex cursor-pointer items-center gap-2 py-1 text-sm font-semibold text-navy">
                                    <input type="checkbox" checked={guaranteed}
                                        onChange={(e) => { setGuaranteed(e.target.checked); push({ guaranteed: e.target.checked || undefined }); }}
                                        className="h-4 w-4 accent-coral" />
                                    <ShieldCheck className="h-3.5 w-3.5 text-makfol" /> مكفول فقط
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 py-1 text-sm font-semibold text-navy">
                                    <input type="checkbox" checked={withActivities}
                                        onChange={(e) => { setWithActivities(e.target.checked); push({ with_activities: e.target.checked || undefined }); }}
                                        className="h-4 w-4 accent-coral" />
                                    <Sparkles className="h-3.5 w-3.5 text-vip" /> بفعاليات إضافية
                                </label>
                            </FilterSection>
                        </aside>

                        {/* النتائج */}
                        <div>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-[14px]">
                                <div className="font-bold text-navy">
                                    <b className="text-coral-deep">{tours.total}</b> رحلة متاحة
                                    {q && <span className="ms-2 text-[13px] font-normal text-muted">للبحث: "{q}"</span>}
                                </div>
                                <Select value={sort} onChange={(e) => changeSort(e.target.value)} className="w-auto">
                                    <option value="">الأنسب</option>
                                    <option value="value">أفضل قيمة ⭐</option>
                                    <option value="price_asc">الأرخص سعراً</option>
                                    <option value="rating">الأعلى تقييماً</option>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-5">
                                {tours.data.map((t) => (
                                    <ListingCard key={t.id} item={t}
                                        feats={[
                                            <span key="d" className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t.duration_days} أيام</span>,
                                            <span key="b" className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> إقامة مميزة</span>,
                                            <span key="p" className="inline-flex items-center gap-1"><Plane className="h-3.5 w-3.5" /> شامل الانتقالات</span>,
                                        ]} />
                                ))}
                            </div>

                            {tours.data.length === 0 && (
                                <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-12 text-center">
                                    <Search className="mx-auto h-12 w-12 text-muted" />
                                    <p className="mt-3 text-muted">
                                        {q ? `مفيش رحلات مطابقة لـ "${q}"` : 'مفيش رحلات مطابقة للفلتر.'}
                                    </p>
                                    <Button variant="secondary" className="mt-4" onClick={clear}>مسح كل الفلاتر</Button>
                                </div>
                            )}

                            {tours.links && tours.last_page > 1 && (
                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {tours.links.map((lnk, i) => (
                                        <Button key={i} asChild variant={lnk.active ? 'primary' : 'secondary'} size="sm"
                                            className={cn('min-w-[42px]', !lnk.url && 'opacity-50')}>
                                            <Link href={lnk.url || '#'} dangerouslySetInnerHTML={{ __html: lnk.label }} />
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}

function FilterSection({ title, children }) {
    return (
        <div className="border-b border-black/[.06] py-4 last:border-0">
            <div className="mb-2.5 text-[12.5px] font-extrabold text-muted">{title}</div>
            {children}
        </div>
    );
}
