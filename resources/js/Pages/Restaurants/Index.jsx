import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { MapPin, Star, Search, Utensils, Coffee, Navigation, Sparkles } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import MobileListing from '@/Components/mobile/MobileListing';
import { MobileListCard } from '@/Components/mobile/primitives';
import { useIsMobile } from '@/lib/useIsMobile';
import { cn } from '@/lib/utils';

const R_SORT = [
    { value: 'nearest', label: 'الأقرب ليك' },
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'price_asc', label: 'الأرخص' },
];

export default function Index({ restaurants, filters, user_location }) {
    const isMobile = useIsMobile();
    const [q, setQ] = useState(filters?.q || '');
    const [venue, setVenue] = useState(filters?.venue || '');
    const [sort, setSort] = useState(filters?.sort || 'nearest');
    const [gpsLoading, setGpsLoading] = useState(false);

    const push = (patch = {}) => router.get('/restaurants', {
        ...filters, q, venue, sort, ...patch,
    }, { preserveState: true, replace: true });

    // §12: geolocation لحظي
    const useLiveLocation = () => {
        if (!navigator.geolocation) return alert('المتصفح مش داعم لتحديد الموقع.');
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsLoading(false);
                router.get('/restaurants', { ...filters, q, venue, sort: 'nearest', lat: pos.coords.latitude, lng: pos.coords.longitude }, { preserveState: true });
            },
            () => { setGpsLoading(false); alert('لم نتمكن من قراءة موقعك.'); },
            { timeout: 8000 },
        );
    };

    // debounce للبحث
    useEffect(() => {
        const t = setTimeout(() => push(), 400);
        return () => clearTimeout(t);
    }, [q]); // eslint-disable-line

    if (isMobile) {
        const list = restaurants.data ?? restaurants;
        return (
            <SiteLayout active="restaurants" anim="list">
                <Head title="المطاعم" />
                <MobileListing
                    q={q} onQ={setQ}
                    searchPlaceholder="مطعم أو نوع مطبخ…"
                    count={restaurants.total ?? list.length} countLabel="مطعم متاح"
                    activeCount={venue ? 1 : 0}
                    onClear={() => router.get('/restaurants')}
                    sort={sort} onSort={(v) => { setSort(v); push({ sort: v }); }} sortOptions={R_SORT}
                    filters={
                        <>
                            <p className="pb-2 text-[12.5px] font-extrabold text-muted">نوع المكان</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[['', 'الكل'], ['restaurant', 'مطاعم'], ['cafe', 'كافيهات']].map(([v, label]) => (
                                    <button key={v || 'all'} type="button"
                                        onClick={() => { setVenue(v); push({ venue: v || undefined }); }}
                                        className={cn(
                                            'mk-press rounded-input border text-[14px] font-bold',
                                            venue === v ? 'border-coral bg-coral/10 text-coral-deep' : 'border-black/[.1] text-navy',
                                        )}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={useLiveLocation}
                                className="mk-press mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-input border border-black/[.1] text-[14px] font-bold text-navy">
                                <Navigation className="h-4 w-4 text-coral-deep" />
                                {gpsLoading ? 'بنحدّد موقعك…' : 'رتّب حسب الأقرب ليا'}
                            </button>
                        </>
                    }
                    items={list}
                    renderItem={(r) => (
                        <MobileListCard
                            key={r.id}
                            item={r}
                            feats={[r.cuisines?.join(' · '), r.price_range].filter(Boolean).join(' · ')}
                            badges={r.instant && (
                                <span className="absolute start-1.5 top-1.5 rounded-full bg-coral-deep px-1.5 py-0.5 text-[10px] font-bold text-white">فوري</span>
                            )}
                        />
                    )}
                    paginator={restaurants}
                    emptyText={q ? `مفيش مطاعم مطابقة لـ "${q}"` : 'مفيش مطاعم مطابقة.'}
                />
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="restaurants" anim="list">
            <Head title="المطاعم" />

            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="transition-colors hover:text-white">الرئيسية</Link> › المطاعم
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">مطاعم وكافيهات</h1>
                    <p className="mt-1.5 text-white/70">احجز ترابيزتك في أحسن الأماكن جنبك دلوقتي</p>
                </div>
            </section>

            <section className="py-14" style={{ paddingTop: 34 }}>
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    {/* شريط البحث + الفلاتر */}
                    <div className="mb-6 rounded-card border border-black/[.06] bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted" />
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="ابحث باسم المطعم أو العنوان…"
                                    className="pe-3 ps-9"
                                />
                            </div>
                            <div className="flex gap-1.5">
                                {[
                                    { v: '', label: 'الكل' },
                                    { v: 'restaurant', label: 'مطاعم', Icon: Utensils },
                                    { v: 'cafe', label: 'كافيهات', Icon: Coffee },
                                ].map(({ v, label, Icon }) => (
                                    <button
                                        key={v}
                                        onClick={() => { setVenue(v); push({ venue: v }); }}
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-input border-[1.5px] px-3 py-2 text-sm font-bold transition-colors',
                                            venue === v ? 'border-coral bg-coral/[.08] text-coral-deep' : 'border-black/[.08] text-navy hover:border-coral',
                                        )}
                                    >
                                        {Icon && <Icon className="h-3.5 w-3.5" />}
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); push({ sort: e.target.value }); }}
                                className="rounded-input border-[1.5px] border-black/[.08] bg-white px-3 py-2 text-sm font-bold text-navy focus:border-coral focus:outline-none"
                            >
                                <option value="nearest">الأقرب لك 📍</option>
                                <option value="rating">الأعلى تقييماً ⭐</option>
                                <option value="price">الأرخص</option>
                            </select>
                            <Button variant="secondary" onClick={useLiveLocation} disabled={gpsLoading}>
                                <Navigation className="h-4 w-4" />
                                {gpsLoading ? 'جاري…' : 'حدّد موقعي'}
                            </Button>
                        </div>
                        {user_location && sort === 'nearest' && (
                            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
                                <Sparkles className="h-3.5 w-3.5 text-coral-deep" />
                                نرتّبلك الأقرب {user_location.source === 'live' ? 'من موقعك دلوقتي' : 'من عنوانك الافتراضي'}.
                            </p>
                        )}
                    </div>

                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5 font-bold">
                        <div><b className="text-coral-deep">{restaurants.total}</b> مطعم وكافيه</div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {restaurants.data.map((r) => (
                            <Card key={r.id}>
                                <CardMedia>
                                    <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                                        {r.instant && <Badge variant="best">حجز فوري</Badge>}
                                        {r.is_guaranteed && <Badge variant="makfol">مكفول</Badge>}
                                        {r.personal_reasons?.length > 0 && (
                                            <Badge variant="vip" title={r.personal_reasons.join(' · ')}>
                                                <Sparkles className="me-0.5 inline h-3 w-3" /> ليك
                                            </Badge>
                                        )}
                                    </div>
                                    {r.distance_km !== null && r.distance_km !== undefined && (
                                        <div className="absolute end-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-extrabold text-navy shadow">
                                            {r.distance_km} كم
                                        </div>
                                    )}
                                    <Link href={r.url}>
                                        <img src={r.image_url} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </Link>
                                </CardMedia>
                                <CardBody>
                                    <CardTitle className="mb-1.5">
                                        <Link href={r.url} className="transition-colors hover:text-coral-deep">{r.title}</Link>
                                        {r.venue_type === 'cafe' && <Coffee className="ms-1 inline h-4 w-4 text-muted" />}
                                    </CardTitle>
                                    <CardMeta className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.address || r.location}</CardMeta>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {r.cuisines.map((c, i) => <span key={i} className="rounded-full border border-black/[.06] bg-beige px-2.5 py-1 text-xs font-bold text-muted">{c}</span>)}
                                        <span className="rounded-full border border-black/[.06] bg-beige px-2.5 py-1 text-xs font-bold text-muted">{r.price_range}</span>
                                    </div>
                                    <CardFooter className="mt-3.5">
                                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-vip"><Star className="h-3.5 w-3.5 fill-vip text-vip" /> {r.review_score.toFixed(1)} <span className="text-muted">({r.review_count})</span></span>
                                        <Button asChild><Link href={r.url}>احجز ترابيزة</Link></Button>
                                    </CardFooter>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {restaurants.data.length === 0 && (
                        <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-12 text-center">
                            <Search className="mx-auto h-12 w-12 text-muted" />
                            <p className="mt-3 text-muted">مافيش نتائج مطابقة.</p>
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
