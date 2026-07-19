import SiteLayout from '@/Layouts/SiteLayout';
import { ListingCard } from '@/Components/UI';
import { Button } from '@/Components/ui/button';
import { Select } from '@/Components/ui/input';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Calendar, BedDouble, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Index({ tours, locations, filters }) {
    const [sort, setSort] = useState(filters.sort || '');
    const [price, setPrice] = useState(filters.max_price || 15000);
    const changeSort = (v) => { setSort(v); router.get('/tours', { ...filters, sort: v }, { preserveState: true, replace: true }); };
    const byLoc = (slug) => router.get('/tours', { ...filters, location: slug }, { preserveState: true });
    const applyPrice = (v) => router.get('/tours', { ...filters, max_price: v }, { preserveState: true, replace: true });

    return (
        <SiteLayout active="tours">
            <Head title="الرحلات" />

            {/* بانر الصفحة */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="transition-colors hover:text-white">الرئيسية</Link> › الرحلات
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">رحلات وبرامج سياحية</h1>
                    <p className="mt-1.5 text-white/70">كل الرحلات مكفولة — سعر متّفق عليه وضمان استرداد</p>
                </div>
            </section>

            <section className="pt-[34px] pb-14 md:pb-[72px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[280px_1fr]">
                        {/* الفلتر */}
                        <aside className="self-start rounded-card border border-black/[.06] bg-white p-5 lg:sticky lg:top-[92px]">
                            <h4 className="mb-1 font-head text-base font-bold text-navy">فلترة النتائج</h4>

                            <div className="border-b border-black/[.06] py-[18px]">
                                <label className="mb-3 block text-[13px] font-extrabold text-muted">الوجهة</label>
                                {locations.map((l) => (
                                    <label key={l.slug} onClick={() => byLoc(l.slug)}
                                        className="flex cursor-pointer items-center gap-[9px] py-1.5 text-sm font-semibold text-navy">
                                        <input type="checkbox" readOnly checked={filters.location === l.slug} className="h-[17px] w-[17px] accent-coral" /> {l.name}
                                        <span className="ms-auto text-xs font-semibold text-muted">{l.count}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="pt-[18px]">
                                <label className="mb-3 block text-[13px] font-extrabold text-muted">
                                    أقصى سعر: <b className="text-navy">{Number(price).toLocaleString('en-US')}</b> ج.م
                                </label>
                                <input type="range" className="w-full accent-coral" min="1000" max="15000" step="500"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    onMouseUp={(e) => applyPrice(e.target.value)}
                                    onTouchEnd={(e) => applyPrice(e.target.value)} />
                            </div>

                            {(filters.location || filters.max_price) && (
                                <Button asChild variant="secondary" block className="mt-3">
                                    <Link href="/tours">مسح الفلتر</Link>
                                </Button>
                            )}
                        </aside>

                        {/* النتائج */}
                        <div>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-[14px]">
                                <div className="font-bold text-navy"><b className="text-coral-deep">{tours.total}</b> رحلة متاحة</div>
                                <Select value={sort} onChange={(e) => changeSort(e.target.value)} className="w-auto">
                                    <option value="">الأنسب</option>
                                    <option value="price_asc">الأرخص سعراً</option>
                                    <option value="rating">الأعلى تقييماً</option>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-5">
                                {tours.data.map((t) => (
                                    <ListingCard key={t.id} item={t}
                                        feats={[
                                            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t.duration_days} أيام</span>,
                                            <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> إقامة مميزة</span>,
                                            <span className="inline-flex items-center gap-1"><Plane className="h-3.5 w-3.5" /> شامل الانتقالات</span>,
                                        ]} />
                                ))}
                            </div>

                            {tours.data.length === 0 && (
                                <div className="p-[60px] text-center text-muted">مفيش رحلات مطابقة — جرّب تغيّر الفلتر.</div>
                            )}

                            {/* Pagination */}
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
