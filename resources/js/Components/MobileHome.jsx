// محفول مكفول — هوم الموبايل (تخطيط أبليكشن، مش نسخة مصغّرة من الويب)
// الترتيب: بحث → صف خدمات أفقي → كاروسيلات. زي بوكينج وأمثاله.
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plane, BedDouble, UtensilsCrossed, Car, Bus, Truck, Crown, LayoutGrid,
    Search, MapPin, Star, ChevronLeft, ShieldCheck, X,
} from 'lucide-react';
import { HScroller, MobileSheet } from '@/Components/mobile/primitives';
import MkImage from '@/Components/mobile/MkImage';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import { Input, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { money } from '@/Components/ui/service-card';
import { cn } from '@/lib/utils';

const CHIPS = [
    { href: '/tours', label: 'رحلات', icon: Plane, tone: 'bg-coral/10 text-coral-deep' },
    { href: '/hotels', label: 'فنادق', icon: BedDouble, tone: 'bg-navy/10 text-navy' },
    { href: '/restaurants', label: 'مطاعم', icon: UtensilsCrossed, tone: 'bg-makfol/10 text-makfol' },
    { href: '/cars', label: 'سيارات', icon: Car, tone: 'bg-royal/10 text-royal' },
    { href: '/buses', label: 'باصات', icon: Bus, tone: 'bg-navy-light/10 text-navy-light' },
    { href: '/delivery', label: 'توصيل', icon: Truck, tone: 'bg-coral/10 text-coral-deep' },
    { href: '/sahb-elsaada', label: 'صاحب السعادة', icon: Crown, tone: 'bg-vip/10 text-vip' },
];

const SEARCH_TABS = [
    { label: 'رحلات', route: '/tours', ph: 'شرم الشيخ، الغردقة، سيوة…' },
    { label: 'فنادق', route: '/hotels', ph: 'مدينة أو منطقة…' },
    { label: 'مطاعم', route: '/restaurants', ph: 'مطعم أو نوع مطبخ…' },
    { label: 'سيارات', route: '/cars', ph: 'مكان الاستلام…' },
];

/** عنوان قسم + «الكل» — سطر واحد مضغوط */
function Row({ title, href, children }) {
    return (
        <section className="pt-6">
            <div className="mb-3 flex items-baseline justify-between px-4">
                <h2 className="font-head text-[19px] font-bold text-navy">{title}</h2>
                {href && (
                    <Link href={href} className="mk-press flex items-center gap-0.5 text-[13.5px] font-bold text-coral-deep">
                        الكل <ChevronLeft className="h-4 w-4" />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

/** كاروسيل أفقي بـsnap — أهم عنصر بيخلي الشكل «أبليكشن» */
function Scroller({ children }) {
    return (
        <div className="mk-hscroll flex gap-3 overflow-x-auto px-4 pb-1">
            {children}
            {/* مساحة في الآخر عشان آخر كارت ميلزقش بالحافة */}
            <div className="w-1 shrink-0" />
        </div>
    );
}

/** كارت خدمة مضغوط — عرض ثابت جوّه الكاروسيل */
function MiniCard({ item, unit }) {
    return (
        <Link href={item.url} className="mk-press w-[63vw] max-w-[240px] shrink-0 overflow-hidden rounded-card bg-white shadow-mk">
            <div className="relative">
                <MkImage src={item.image_url} alt={item.title} ratio="aspect-[4/3]" />
                {item.is_guaranteed && (
                    <span className="absolute start-2 top-2 rounded-full bg-makfol px-2 py-0.5 text-[10.5px] font-bold text-white">
                        مكفول
                    </span>
                )}
            </div>
            <div className="p-3">
                <h3 className="mb-1 line-clamp-1 text-[14.5px] font-extrabold text-navy">{item.title}</h3>
                <p className="mb-2 flex items-center gap-1 text-[12px] text-muted">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{item.location || item.address}</span>
                </p>
                <div className="flex items-baseline justify-between">
                    <span className="text-[15px] font-extrabold text-coral-deep">
                        {money(item.price)}
                        {unit && <span className="text-[11px] font-semibold text-muted"> / {unit}</span>}
                    </span>
                    {item.review_score > 0 && (
                        <span className="flex items-center gap-0.5 text-[12px] font-bold text-navy">
                            <Star className="h-3 w-3 fill-vip text-vip" /> {item.review_score.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function MobileHome({ locations = [], featured = [], hotels = [], restaurants = [], cars = [] }) {
    const [open, setOpen] = useState(false);
    const [services, setServices] = useState(false);
    const [tab, setTab] = useState(0);
    const [loc, setLoc] = useState('');
    const [date, setDate] = useState('');
    const [guests, setGuests] = useState('');

    const submit = (e) => {
        e.preventDefault();
        const params = {};
        if (loc) params.q = loc;
        if (date) params.start_date = date;
        if (guests) params.guests = guests;
        setOpen(false);
        router.get(SEARCH_TABS[tab].route, params);
    };

    return (
        <div className="lg:hidden">
            {/* بلوك البحث — مكمّل للآب-بار الـnavy فوقه */}
            <div className="bg-navy px-4 pb-5 pt-1">
                <h1 className="mb-3 font-head text-[21px] font-bold leading-snug text-white">
                    رحلتك محفولة مكفولة
                </h1>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="ابحث"
                    className="mk-press flex min-h-[52px] w-full items-center gap-2.5 rounded-[14px] bg-white px-4 text-start shadow-mk-lg"
                >
                    <Search className="h-[19px] w-[19px] shrink-0 text-coral-deep" strokeWidth={2.4} />
                    <span className="text-[14.5px] font-semibold text-muted">فين حابب تروح؟</span>
                </button>
                <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-white/75">
                    <ShieldCheck className="h-4 w-4 text-makfol" />
                    كل حجز مكفول 100% — استرداد كامل لو حصل أي تغيير
                </p>
            </div>

            {/* صف الخدمات — سكرول أفقي مع مؤشّر إن فيه خدمات كمان ورا (7 مش 5) */}
            <div className="border-b border-black/[.05] bg-white py-3.5">
                {/* السهم على نص الأيقونة (23px = نص الـ46px) مش نص الصف — عشان ميقعش على الليبل */}
                <HScroller className="gap-2.5 px-4" fadeFrom="from-white" arrowTop="23px">
                    {CHIPS.map((c) => {
                        const Icon = c.icon;
                        return (
                            <Link
                                key={c.href}
                                href={c.href}
                                className="mk-press flex w-[64px] shrink-0 flex-col items-center gap-1.5"
                            >
                                <span className={cn('flex h-[46px] w-[46px] items-center justify-center rounded-[15px]', c.tone)}>
                                    <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                                </span>
                                <span className="text-center text-[11.5px] font-bold leading-tight text-navy">{c.label}</span>
                            </Link>
                        );
                    })}
                    {/* آخر عنصر — يوصّل لباقي الخدمات صراحةً */}
                    <button
                        type="button"
                        onClick={() => setServices(true)}
                        className="mk-press flex w-[64px] shrink-0 flex-col items-center gap-1.5"
                    >
                        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[15px] bg-beige">
                            <LayoutGrid className="h-[22px] w-[22px] text-navy" strokeWidth={2} />
                        </span>
                        <span className="text-center text-[11.5px] font-bold leading-tight text-navy">الكل</span>
                    </button>
                    <div className="w-8 shrink-0" />
                </HScroller>
            </div>

            {/* كل الخدمات — نفس شيت التبويب السفلي */}
            <MobileSheet open={services} onOpenChange={setServices} title="كل الخدمات">
                <div className="grid grid-cols-3 gap-3 pb-2">
                    {CHIPS.map((c) => {
                        const Icon = c.icon;
                        return (
                            <Link
                                key={c.href}
                                href={c.href}
                                onClick={() => setServices(false)}
                                className="mk-press flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-card bg-beige/60 p-3 text-center"
                            >
                                <span className={cn('flex h-11 w-11 items-center justify-center rounded-full', c.tone)}>
                                    <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
                                </span>
                                <span className="text-[12.5px] font-bold leading-tight text-navy">{c.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </MobileSheet>

            {/* الوجهات — كروت صغيرة أفقية */}
            {locations.length > 0 && (
                <Row title="وجهات تستاهل" href="/tours">
                    <Scroller>
                        {locations.map((l) => (
                            <Link key={l.slug} href={l.url} className="mk-press relative h-[112px] w-[142px] shrink-0 overflow-hidden rounded-card">
                                <MkImage src={l.image_url} alt={l.name} ratio="h-[112px] w-[142px]" wrapperClassName="rounded-card" />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 to-transparent" />
                                <div className="absolute inset-x-2.5 bottom-2 text-white">
                                    <strong className="block font-head text-[15px] font-bold leading-tight">{l.name}</strong>
                                    <span className="text-[11px] text-white/80">{l.tours_count} رحلة</span>
                                </div>
                            </Link>
                        ))}
                    </Scroller>
                </Row>
            )}

            {featured.length > 0 && (
                <Row title="عروض مكفولة النهاردة" href="/tours">
                    <Scroller>{featured.map((t) => <MiniCard key={t.id} item={t} />)}</Scroller>
                </Row>
            )}

            {hotels.length > 0 && (
                <Row title="فنادق ومنتجعات" href="/hotels">
                    <Scroller>{hotels.map((h) => <MiniCard key={h.id} item={h} unit="الليلة" />)}</Scroller>
                </Row>
            )}

            {restaurants.length > 0 && (
                <Row title="مطاعم وكافيهات" href="/restaurants">
                    <Scroller>{restaurants.map((r) => <MiniCard key={r.id} item={r} />)}</Scroller>
                </Row>
            )}

            {cars.length > 0 && (
                <Row title="سيارات وسواقين" href="/cars">
                    <Scroller>{cars.map((c) => <MiniCard key={c.id} item={c} unit="اليوم" />)}</Scroller>
                </Row>
            )}

            <div className="h-8" />

            {/* شيت البحث — full-height زي شاشة بحث في أبليكشن */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="bottom"
                    className="mk mk-sheet flex h-[92vh] flex-col rounded-t-[22px] border-0 p-0"
                >
                    <div className="flex items-center gap-2 border-b border-black/[.06] px-4 py-3">
                        <SheetTitle className="flex-1 text-[17px]">دوّر على اللي نفسك فيه</SheetTitle>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="إغلاق"
                            className="mk-press flex h-10 w-10 items-center justify-center rounded-full bg-beige"
                        >
                            <X className="h-[18px] w-[18px] text-navy" />
                        </button>
                    </div>

                    {/* تابات الخدمة */}
                    <div className="mk-hscroll flex gap-2 overflow-x-auto px-4 py-3">
                        {SEARCH_TABS.map((t, i) => (
                            <button
                                key={t.route}
                                type="button"
                                onClick={() => setTab(i)}
                                className={cn(
                                    'mk-press shrink-0 rounded-full px-4 text-[14px] font-bold transition-colors',
                                    tab === i ? 'bg-navy text-white' : 'bg-beige text-navy',
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                        <Field label="فين حابب تروح؟">
                            <Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder={SEARCH_TABS[tab].ph} autoFocus />
                        </Field>
                        <Field label="التاريخ">
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </Field>
                        <Field label="عدد الأفراد">
                            <PartySizeField
                                value={guests}
                                onChange={setGuests}
                                placeholder="حدّد العدد"
                                options={[
                                    { value: 1, label: 'فرد واحد' },
                                    { value: 2, label: 'فردين' },
                                    { value: 3, label: '3 أفراد' },
                                    { value: 4, label: 'عائلة (4+)' },
                                ]}
                            />
                        </Field>

                        {/* زرار الأكشن ثابت تحت — زي أبليكشن */}
                        <div className="mt-auto pb-[env(safe-area-inset-bottom)] pt-2">
                            <button
                                type="submit"
                                className="mk-press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-input bg-gradient-to-l from-coral to-coral-deep text-[16px] font-extrabold text-white shadow-mk"
                            >
                                <Search className="h-[18px] w-[18px]" /> بحث
                            </button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
