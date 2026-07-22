import SiteLayout from '@/Layouts/SiteLayout';
import Pager from '@/Components/Pager';
import { ListingCard, Btn } from '@/Components/UI';
import MobileListing from '@/Components/mobile/MobileListing';
import { MobileListCard } from '@/Components/mobile/primitives';
import { Head, Link, router } from '@inertiajs/react';
import { Star, Waves, UtensilsCrossed } from 'lucide-react';
import { useIsMobile } from '@/lib/useIsMobile';
import { cn } from '@/lib/utils';

// حاوية بعرض ثابت
const Wrap = ({ className, children }) => (
    <div className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</div>
);

// تقييم النجوم
const Stars = ({ n }) => (
    <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: n }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-vip text-vip" />
        ))}
    </span>
);

export default function Index({ hotels, locations, filters }) {
    const isMobile = useIsMobile();
    const byLoc = (slug) => router.get('/hotels', { location: slug }, { preserveState: true });

    if (isMobile) {
        return (
            <SiteLayout active="hotels" anim="list">
                <Head title="الفنادق" />
                <MobileListing
                    count={hotels.total} countLabel="فندق متاح"
                    activeCount={filters.location ? 1 : 0}
                    onClear={() => router.get('/hotels')}
                    filters={
                        <div className="space-y-0.5">
                            <p className="pb-1 text-[12.5px] font-extrabold text-muted">المدينة</p>
                            {locations.map((l) => (
                                <label key={l.slug} className="flex cursor-pointer items-center gap-2.5 text-[15px] font-semibold text-navy">
                                    <input type="checkbox" readOnly checked={filters.location === l.slug} onClick={() => byLoc(l.slug)} className="accent-coral" />
                                    {l.name}
                                    <span className="ms-auto text-[12.5px] text-muted">{l.count}</span>
                                </label>
                            ))}
                        </div>
                    }
                    items={hotels.data}
                    renderItem={(h) => (
                        <MobileListCard
                            key={h.id}
                            item={h}
                            unit="الليلة"
                            feats={`${h.star_rating} نجوم · حمام سباحة`}
                            badges={h.is_guaranteed && (
                                <span className="absolute start-1.5 top-1.5 rounded-full bg-makfol px-1.5 py-0.5 text-[10px] font-bold text-white">مكفول</span>
                            )}
                        />
                    )}
                    paginator={hotels}
                    emptyText="مفيش فنادق مطابقة."
                />
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="hotels" anim="list">
            <Head title="الفنادق" />

            {/* بانر الصفحة */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <Wrap className="relative z-[1]">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> › الفنادق
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">فنادق ومنتجعات</h1>
                    <p className="mt-1 text-white/70">حجز فوري وتأكيد لحظي — بأفضل الأسعار المكفولة</p>
                </Wrap>
            </section>

            <section className="pt-[34px] pb-14 md:pb-[72px]">
                <Wrap>
                    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[280px_1fr]">
                        {/* الفلتر */}
                        <aside className="self-start rounded-card border border-black/[.06] bg-white p-[22px] lg:sticky lg:top-[92px]">
                            <h4 className="mb-1 font-head text-base font-semibold text-navy">فلترة النتائج</h4>
                            <div className="border-b border-black/[.06] py-[18px] last:border-b-0 last:pb-0">
                                <label className="mb-3 block text-[13px] font-extrabold text-muted">المدينة</label>
                                {locations.map((l) => (
                                    <label
                                        key={l.slug}
                                        className="flex cursor-pointer items-center gap-[9px] py-1.5 text-sm font-semibold"
                                        onClick={() => byLoc(l.slug)}
                                    >
                                        <input type="checkbox" readOnly checked={filters.location === l.slug} className="h-[17px] w-[17px] accent-coral" /> {l.name}
                                        <span className="ms-auto text-xs font-semibold text-muted">{l.count}</span>
                                    </label>
                                ))}
                            </div>
                            {filters.location && (
                                <Btn href="/hotels" variant="secondary" block className="mt-3">مسح الفلتر</Btn>
                            )}
                        </aside>

                        {/* النتائج */}
                        <div>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
                                <div className="font-bold text-navy"><b className="text-coral-deep">{hotels.total}</b> فندق متاح</div>
                            </div>
                            <div className="flex flex-col gap-5">
                                {hotels.data.map((h) => (
                                    <ListingCard
                                        key={h.id}
                                        item={h}
                                        unit="الليلة"
                                        feats={[
                                            <Stars n={h.star_rating} />,
                                            <span className="inline-flex items-center gap-1"><Waves className="h-3.5 w-3.5" /> حمام سباحة</span>,
                                            <span className="inline-flex items-center gap-1"><UtensilsCrossed className="h-3.5 w-3.5" /> All Inclusive</span>,
                                        ]}
                                    />
                                ))}
                            </div>
                            {hotels.data.length === 0 && (
                                <div className="py-[60px] text-center text-muted">مفيش فنادق مطابقة.</div>
                            )}

                            <Pager paginator={hotels} />
                        </div>
                    </div>
                </Wrap>
            </section>
        </SiteLayout>
    );
}
