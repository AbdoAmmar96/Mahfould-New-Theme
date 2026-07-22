import SiteLayout from '@/Layouts/SiteLayout';
import { ListingCard, Btn } from '@/Components/UI';
import MobileListing from '@/Components/mobile/MobileListing';
import { MobileListCard } from '@/Components/mobile/primitives';
import { Head, Link, router } from '@inertiajs/react';
import { Cog, Users, UserRound, KeyRound } from 'lucide-react';
import { useIsMobile } from '@/lib/useIsMobile';
import { cn } from '@/lib/utils';

// حاوية بعرض ثابت
const Wrap = ({ className, children }) => (
    <div className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</div>
);

export default function Index({ cars, locations, filters }) {
    const isMobile = useIsMobile();
    const byLoc = (slug) => router.get('/cars', { ...filters, location: slug }, { preserveState: true });
    const byTrans = (t) => router.get('/cars', { ...filters, transmission: t }, { preserveState: true });

    if (isMobile) {
        return (
            <SiteLayout active="cars" anim="list">
                <Head title="السيارات" />
                <MobileListing
                    count={cars.total ?? cars.data.length} countLabel="سيارة متاحة"
                    activeCount={[filters.location, filters.transmission].filter(Boolean).length}
                    onClear={() => router.get('/cars')}
                    filters={
                        <>
                            <div className="border-b border-black/[.06] pb-4">
                                <p className="pb-1.5 text-[12.5px] font-extrabold text-muted">المدينة</p>
                                {locations.map((l) => (
                                    <label key={l.slug} className="flex cursor-pointer items-center gap-2.5 text-[15px] font-semibold text-navy">
                                        <input type="checkbox" readOnly checked={filters.location === l.slug} onClick={() => byLoc(l.slug)} className="accent-coral" />
                                        {l.name}
                                        <span className="ms-auto text-[12.5px] text-muted">{l.count}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="pt-4">
                                <p className="pb-2 text-[12.5px] font-extrabold text-muted">ناقل الحركة</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[['automatic', 'أوتوماتيك'], ['manual', 'مانيوال']].map(([v, label]) => (
                                        <button key={v} type="button" onClick={() => byTrans(filters.transmission === v ? undefined : v)}
                                            className={cn(
                                                'mk-press rounded-input border text-[14px] font-bold',
                                                filters.transmission === v ? 'border-coral bg-coral/10 text-coral-deep' : 'border-black/[.1] text-navy',
                                            )}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    }
                    items={cars.data}
                    renderItem={(c) => (
                        <MobileListCard
                            key={c.id}
                            item={c}
                            unit="اليوم"
                            feats={`${c.transmission === 'manual' ? 'مانيوال' : 'أوتوماتيك'} · ${c.seats ?? 4} راكب`}
                        />
                    )}
                    paginator={cars}
                    emptyText="مفيش سيارات مطابقة."
                />
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="cars" anim="list">
            <Head title="السيارات" />

            {/* بانر الصفحة */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <Wrap className="relative z-[1]">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> › السيارات
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">سيارات وسواقين</h1>
                    <p className="mt-1 text-white/70">تنقّل مريح طول رحلتك — بسائق أو من غير</p>
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
                                    </label>
                                ))}
                            </div>
                            <div className="border-b border-black/[.06] py-[18px] last:border-b-0 last:pb-0">
                                <label className="mb-3 block text-[13px] font-extrabold text-muted">ناقل الحركة</label>
                                <label
                                    className="flex cursor-pointer items-center gap-[9px] py-1.5 text-sm font-semibold"
                                    onClick={() => byTrans('automatic')}
                                >
                                    <input type="checkbox" readOnly checked={filters.transmission === 'automatic'} className="h-[17px] w-[17px] accent-coral" /> أوتوماتيك
                                </label>
                                <label
                                    className="flex cursor-pointer items-center gap-[9px] py-1.5 text-sm font-semibold"
                                    onClick={() => byTrans('manual')}
                                >
                                    <input type="checkbox" readOnly checked={filters.transmission === 'manual'} className="h-[17px] w-[17px] accent-coral" /> مانيوال
                                </label>
                            </div>
                            {(filters.location || filters.transmission) && (
                                <Btn href="/cars" variant="secondary" block className="mt-3">مسح الفلتر</Btn>
                            )}
                        </aside>

                        {/* النتائج */}
                        <div>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
                                <div className="font-bold text-navy"><b className="text-coral-deep">{cars.total}</b> سيارة متاحة</div>
                            </div>
                            <div className="flex flex-col gap-5">
                                {cars.data.map((c) => (
                                    <ListingCard
                                        key={c.id}
                                        item={c}
                                        unit="اليوم"
                                        feats={[
                                            <span className="inline-flex items-center gap-1"><Cog className="h-3.5 w-3.5" /> {c.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال'}</span>,
                                            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.seats} ركاب</span>,
                                            c.with_driver
                                                ? <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> مع سائق</span>
                                                : <span className="inline-flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> بدون سائق</span>,
                                        ]}
                                        cta="احجز السيارة"
                                    />
                                ))}
                            </div>
                            {cars.data.length === 0 && (
                                <div className="py-[60px] text-center text-muted">مفيش سيارات مطابقة.</div>
                            )}
                        </div>
                    </div>
                </Wrap>
            </section>
        </SiteLayout>
    );
}
