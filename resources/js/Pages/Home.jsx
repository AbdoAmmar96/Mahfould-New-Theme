import SiteLayout from '@/Layouts/SiteLayout';
import Modal from '@/Components/Modal';
import { TRUST } from '@/data/trust';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plane, BedDouble, UtensilsCrossed, Car, Crown,
    Search, FileText, ShieldCheck, MapPin, Star, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter } from '@/Components/ui/card';
import { Input, Select, Field } from '@/Components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { ServiceCard, money } from '@/Components/ui/service-card';
import { cn } from '@/lib/utils';

const TABS = [
    { Icon: Plane, label: 'رحلات', route: '/tours', ph: 'شرم الشيخ، الغردقة، سيوة…' },
    { Icon: BedDouble, label: 'فنادق', route: '/hotels', ph: 'مدينة أو منطقة…' },
    { Icon: UtensilsCrossed, label: 'مطاعم', route: '/restaurants', ph: 'مطعم أو نوع مطبخ…' },
    { Icon: Car, label: 'سيارات', route: '/cars', ph: 'مكان الاستلام…' },
    { Icon: Crown, label: 'صاحب السعادة', route: '/sahb-elsaada', ph: 'المناسبة…' },
];
const SERVICES = [
    [Plane, 'رحلات وبرامج', 'داخلي وخارجي بأسعار مكفولة', '/tours'],
    [BedDouble, 'فنادق ومنتجعات', 'حجز فوري وتأكيد لحظي', '/hotels'],
    [UtensilsCrossed, 'مطاعم وكافيهات', 'احجز ترابيزتك جنبك دلوقتي', '/restaurants'],
    [Car, 'سيارات وسواقين', 'تنقّل مريح طول الرحلة', '/cars'],
];
const STEPS = [
    [Search, 'اختار خدمتك', 'رحلة، فندق، مطعم، أو عربية — كله في مكان واحد بسعر واضح.'],
    [FileText, 'احجز في دقايق', 'حدّد التاريخ والعدد، اكمل بياناتك، وخلاص.'],
    [ShieldCheck, 'ادفع بأمان', 'كارت، محفظة، أو عند الوصول — وتأكيد لحظي بضمان استرداد.'],
];

// حاوية بعرض ثابت
const Wrap = ({ className, children }) => (
    <div className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</div>
);

// عنوان قسم
function SectionHead({ title, sub, center, action }) {
    return (
        <div className={cn('mb-8 flex flex-wrap items-end gap-4', action && 'justify-between', center && 'flex-col items-center text-center')}>
            <div>
                <div className={cn('mb-3 h-1 w-12 rounded-full bg-gradient-to-br from-coral to-coral-deep', center && 'mx-auto')} />
                <h2 className="font-head text-[26px] font-bold text-navy md:text-[30px]">{title}</h2>
                {sub && <p className="mt-1.5 text-base text-muted">{sub}</p>}
            </div>
            {action}
        </div>
    );
}

const MoreBtn = ({ href, children }) => (
    <Button asChild variant="secondary" size="sm">
        <Link href={href}>{children} <ArrowLeft className="h-4 w-4" /></Link>
    </Button>
);

// بطاقة مطعم
function RestaurantCard({ r }) {
    return (
        <Card>
            <CardMedia>
                <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                    {r.instant && <Badge variant="best">حجز فوري</Badge>}
                    {r.is_guaranteed && <Badge variant="makfol">مكفول</Badge>}
                </div>
                <Link href={r.url}>
                    <img src={r.image_url} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </Link>
            </CardMedia>
            <CardBody>
                <CardTitle className="mb-1.5"><Link href={r.url} className="transition-colors hover:text-coral-deep">{r.title}</Link></CardTitle>
                <CardMeta className="mb-2.5 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.address || r.location}</CardMeta>
                <div className="mb-3 flex flex-wrap gap-1.5">
                    {r.cuisines.map((c, i) => <span key={i} className="rounded-full bg-beige px-2.5 py-1 text-xs font-semibold text-navy">{c}</span>)}
                    {r.price_range && <span className="rounded-full bg-beige px-2.5 py-1 text-xs font-semibold text-navy">{r.price_range}</span>}
                </div>
                <CardFooter>
                    {r.review_score > 0
                        ? <span className="inline-flex items-center gap-1 text-[13px] font-bold text-navy"><Star className="h-3.5 w-3.5 fill-vip text-vip" /> {r.review_score.toFixed(1)} <span className="text-muted">({r.review_count})</span></span>
                        : <span className="text-[13px] font-semibold text-muted">مطعم مميّز</span>}
                    <Button asChild size="sm"><Link href={r.url}>احجز ترابيزة</Link></Button>
                </CardFooter>
            </CardBody>
        </Card>
    );
}

export default function Home({ locations, featured, hotels, restaurants, cars, packages, testimonials, stats }) {
    const [tab, setTab] = useState(0);
    const [loc, setLoc] = useState('');
    const [date, setDate] = useState('');
    const [guests, setGuests] = useState('');
    const [trustOpen, setTrustOpen] = useState(null);

    const search = (e) => {
        e.preventDefault();
        const q = {};
        if (loc) q.location = loc;
        if (date) q.start_date = date;
        if (guests) q.guests = guests;
        router.get(TABS[tab].route, q);
    };

    return (
        <SiteLayout active="home">
            <Head title="رحلتك محفولة مكفولة" />

            {/* الهيرو */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light pt-16 pb-28 md:pt-20">
                <div className="pointer-events-none absolute -top-40 -start-28 h-[460px] w-[460px] rounded-full bg-coral opacity-30 blur-[90px]" />
                <div className="pointer-events-none absolute -bottom-44 -end-24 h-[380px] w-[380px] rounded-full bg-royal opacity-30 blur-[90px]" />
                <Wrap className="relative z-10">
                    <div className="duration-700 animate-in fade-in slide-in-from-bottom-3">
                        <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> كل حجز مكفول 100%</Badge>
                        <h1 className="mt-4 max-w-3xl font-head text-4xl font-bold leading-[1.2] text-white md:text-5xl">
                            قوللنا مزاجك…<br />واحنا نرتّبلك{' '}
                            <span className="bg-gradient-to-br from-coral to-coral-deep bg-clip-text text-transparent">الرحلة كلها</span>{' '}
                            من غير تعب
                        </h1>
                        <p className="mt-4 max-w-xl text-lg text-white/80">رحلات، فنادق، مطاعم، وتجارب — كلها في مكان واحد، بسعر مضمون وضمان استرداد.</p>
                    </div>

                    <div className="mt-8 delay-150 duration-700 animate-in fade-in slide-in-from-bottom-3">
                        <Tabs value={String(tab)} onValueChange={(v) => setTab(Number(v))}>
                            <TabsList>
                                {TABS.map((t, i) => (
                                    <TabsTrigger key={i} value={String(i)}><t.Icon className="h-4 w-4" /> {t.label}</TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <form onSubmit={search} className="grid grid-cols-1 items-end gap-4 rounded-section rounded-tl-none bg-white p-6 shadow-mk-lg sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
                            <Field label="فين حابب تروح؟"><Input className="h-[52px]" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder={TABS[tab].ph} /></Field>
                            <Field label="التاريخ"><Input className="h-[52px]" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                            <Field label="عدد الأفراد">
                                <Select className="h-[52px]" value={guests} onChange={(e) => setGuests(e.target.value)}>
                                    <option value="" disabled hidden>حدّد العدد</option>
                                    <option value="1">فرد واحد</option>
                                    <option value="2">فردين</option>
                                    <option value="3">3 أفراد</option>
                                    <option value="4">عائلة (4+)</option>
                                </Select>
                            </Field>
                            <Button type="submit" className="h-[52px] px-9 text-base"><Search className="h-[18px] w-[18px]" /> بحث</Button>
                        </form>
                    </div>
                </Wrap>
            </section>

            {/* شريط الثقة */}
            <Wrap>
                <div className="relative z-[5] -mt-16 grid grid-cols-2 gap-4 rounded-section border border-black/[.06] bg-white p-6 shadow-mk md:grid-cols-4">
                    {TRUST.map((t, i) => (
                        <button key={i} type="button" onClick={() => setTrustOpen(i)}
                            className="flex items-center gap-3 rounded-card p-2 text-start transition hover:-translate-y-0.5 hover:shadow-mk">
                            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-beige text-xl">{t.icon}</span>
                            <span>
                                <strong className="block text-[15px] font-extrabold text-navy">{t.title}</strong>
                                <span className="text-[13px] text-muted">{t.short}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </Wrap>

            <Modal open={trustOpen !== null} onClose={() => setTrustOpen(null)}
                icon={trustOpen !== null ? TRUST[trustOpen].icon : null}
                title={trustOpen !== null ? TRUST[trustOpen].title : ''}>
                {trustOpen !== null && TRUST[trustOpen].body}
            </Modal>

            {/* الوجهات */}
            <section className="py-14 md:py-[72px]">
                <Wrap>
                    <SectionHead title="وجهات تستاهل تجربتها" sub="أكتر الأماكن اللي المصريين بيحجزوها دلوقتي" />
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                        {locations.map((l) => (
                            <Link key={l.slug} href={l.url} className="group relative aspect-[4/3] overflow-hidden rounded-card shadow-mk transition-all hover:-translate-y-1.5 hover:shadow-mk-lg">
                                <img src={l.image_url} alt={l.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/20 to-transparent" />
                                <div className="absolute inset-x-4 bottom-4 z-[2] text-white">
                                    <strong className="block font-head text-xl font-bold">{l.name}</strong>
                                    <span className="text-[13px] font-semibold text-white/80">{l.tours_count} رحلة متاحة</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Wrap>
            </section>

            {/* رحلات مختارة */}
            <section className="pb-14 md:pb-[72px]">
                <Wrap>
                    <SectionHead title="عروض مكفولة النهاردة" sub="أسعار ثابتة — مفيش مفاجآت في الآخر" action={<MoreBtn href="/tours">كل الرحلات</MoreBtn>} />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {featured.map((t) => <ServiceCard key={t.id} item={t} type="tour" />)}
                    </div>
                </Wrap>
            </section>

            {/* فنادق مختارة */}
            {hotels.length > 0 && (
                <section className="pb-14 md:pb-[72px]">
                    <Wrap>
                        <SectionHead title="فنادق ومنتجعات مختارة" sub="إقامة مكفولة بأحسن الأسعار وتأكيد لحظي" action={<MoreBtn href="/hotels">كل الفنادق</MoreBtn>} />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {hotels.map((h) => <ServiceCard key={h.id} item={h} type="hotel" unit="الليلة" />)}
                        </div>
                    </Wrap>
                </section>
            )}

            {/* الخدمات */}
            <section className="bg-beige py-14 md:py-[72px]">
                <Wrap>
                    <SectionHead center title="كل خدماتك في مكان واحد" sub="من أول التذكرة لحد آخر أكلة — احنا معاك" />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {SERVICES.map(([Icon, t, d, href], i) => (
                            <Link key={i} href={href} className="group rounded-card border border-black/[.06] bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-coral/40 hover:shadow-mk">
                                <span className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-beige text-navy transition-colors group-hover:bg-gradient-to-br group-hover:from-coral group-hover:to-coral-deep group-hover:text-white">
                                    <Icon className="h-6 w-6" />
                                </span>
                                <h3 className="font-head text-[17px] font-semibold text-navy">{t}</h3>
                                <p className="mt-1 text-sm text-muted">{d}</p>
                            </Link>
                        ))}
                    </div>
                </Wrap>
            </section>

            {/* مطاعم */}
            {restaurants.length > 0 && (
                <section className="py-14 md:py-[72px]">
                    <Wrap>
                        <SectionHead title="مطاعم وكافيهات يوصّى بيها" sub="احجز ترابيزتك في أحسن الأماكن جنبك" action={<MoreBtn href="/restaurants">كل المطاعم</MoreBtn>} />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
                        </div>
                    </Wrap>
                </section>
            )}

            {/* سيارات */}
            {cars.length > 0 && (
                <section className="pb-14 md:pb-[72px]">
                    <Wrap>
                        <SectionHead title="عربيات جاهزة لرحلتك" sub="تنقّل مريح — بسائق أو بدون، تسليم في مكانك" action={<MoreBtn href="/cars">كل السيارات</MoreBtn>} />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {cars.map((c) => <ServiceCard key={c.id} item={c} type="car" unit="اليوم" />)}
                        </div>
                    </Wrap>
                </section>
            )}

            {/* بوستر صاحب السعادة */}
            <section className="relative min-h-[340px] overflow-hidden">
                <img src="https://loremflickr.com/1600/520/celebration,gift,party?lock=77" alt="صاحب السعادة" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-royal/95 via-royal/85 to-navy-deep/75" />
                <div className="pointer-events-none absolute -top-24 -start-16 h-[280px] w-[280px] rounded-full bg-vip opacity-30 blur-[100px]" />
                <div className="relative z-10 mx-auto flex min-h-[340px] max-w-[1200px] flex-col items-start justify-center gap-4 px-5 py-16 text-white">
                    <Badge variant="vip"><Crown className="h-3.5 w-3.5" /> صاحب السعادة</Badge>
                    <h2 className="max-w-2xl font-head text-3xl font-bold leading-tight text-white md:text-[40px]">لحظة سعادة تفضل في البال…<br />سيبها علينا نرتّبها لك</h2>
                    <p className="max-w-xl text-lg text-white/85">مفاجآت، احتفالات، هدايا، وتجارب مميزة — نجهّزها لك من الألف للياء بلمسة مكفولة.</p>
                    <Button asChild variant="light" size="lg" className="mt-2"><Link href="/sahb-elsaada">اكتشف صاحب السعادة</Link></Button>
                </div>
            </section>

            {/* إزاي بتحجز */}
            <section className="bg-beige py-14 md:py-[72px]">
                <Wrap>
                    <SectionHead center title="إزاي بتحجز؟" sub="3 خطوات وانت خلّصت" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {STEPS.map(([Icon, t, d], i) => (
                            <div key={i} className="relative rounded-card border border-black/[.06] bg-white p-8 pt-9 text-center shadow-mk transition-all hover:-translate-y-1">
                                <div className="absolute -top-4 left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-deep font-head font-extrabold text-white shadow-[0_10px_26px_rgba(234,75,59,.28)]">{i + 1}</div>
                                <Icon className="mx-auto mb-2.5 mt-1.5 h-9 w-9 text-coral" />
                                <h3 className="font-head text-[19px] font-semibold text-navy">{t}</h3>
                                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d}</p>
                            </div>
                        ))}
                    </div>
                </Wrap>
            </section>

            {/* آراء العملاء */}
            {testimonials.length > 0 && (
                <section className="py-14 md:py-[72px]">
                    <Wrap>
                        <SectionHead center title="عملاؤنا بيقولوا إيه" sub="تقييمات حقيقية من ناس جرّبت محفول مكفول" />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {testimonials.map((t, i) => (
                                <div key={i} className="flex flex-col rounded-card border border-black/[.06] bg-white p-6 shadow-mk">
                                    <div className="mb-2.5 text-[16px] tracking-[2px] text-[#F5A623]">{'★'.repeat(t.rating)}<span className="text-sandline">{'★'.repeat(5 - t.rating)}</span></div>
                                    {t.title && <h4 className="mb-2 font-head text-[17px] font-semibold text-navy">{t.title}</h4>}
                                    <p className="mb-4 flex-1 text-[15px] leading-relaxed text-[#555]">{t.content}</p>
                                    <div className="flex items-center gap-3 border-t border-black/[.06] pt-3.5">
                                        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-deep font-head font-bold text-white">{t.name.slice(0, 1)}</div>
                                        <div>
                                            <strong className="block text-[14.5px] text-navy">{t.name}</strong>
                                            {t.service && <span className="text-[12.5px] text-muted">{t.service}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Wrap>
                </section>
            )}

            {/* صاحب السعادة */}
            <section className="py-14 md:py-[72px]">
                <Wrap>
                    <div className="relative overflow-hidden rounded-section bg-gradient-to-br from-[#2A2450] to-royal p-8 text-white md:p-[52px]">
                        <div className="pointer-events-none absolute -top-28 -end-20 h-[340px] w-[340px] rounded-full bg-vip opacity-30 blur-[110px]" />
                        <div className="relative z-[1]">
                            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                                <div className="max-w-[520px]">
                                    <Badge variant="vip"><Crown className="h-3.5 w-3.5" /> تجربة مميزة</Badge>
                                    <h2 className="mt-3.5 font-head text-[28px] font-bold text-white md:text-[32px]">اصنع لحظة سعادة…<br />أو سيبها علينا نرتّبها لك</h2>
                                    <p className="mt-2 text-white/75">مش لاقي هدية؟ اختار الباكدج، واحنا نظبّط كل حاجة — من الورد لحد الكاميرا.</p>
                                </div>
                                <Button asChild variant="ghost" size="lg"><Link href="/sahb-elsaada">اطلب مفاجأة مكفولة</Link></Button>
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                {packages.map((p, i) => (
                                    <Link key={i} href="/sahb-elsaada" className="rounded-card border border-white/15 bg-white/[.08] p-5 transition hover:-translate-y-1 hover:bg-white/[.15]">
                                        <h3 className="font-head text-lg font-semibold text-white">{p.title}</h3>
                                        <p className="mt-1 text-sm text-white/75">{p.short_desc}</p>
                                        <div className="mt-3 font-head text-[22px] font-bold text-vip">{p.price > 0 ? money(p.price) : 'حسب الطلب'} {p.price > 0 && <small className="text-sm text-white/60">ج.م</small>}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </Wrap>
            </section>

            {/* دعوة أخيرة */}
            <section className="bg-gradient-to-br from-coral to-coral-deep py-[60px] text-center text-white">
                <Wrap>
                    <h2 className="font-head text-[32px] font-bold text-white">جاهز تبدأ رحلتك؟</h2>
                    <p className="mx-auto mt-2.5 max-w-[520px] text-[17px] text-white/90">آلاف الخدمات المكفولة في انتظارك — احجز دلوقتي وادفع وانت مطمّن.</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Button asChild variant="light" size="lg"><Link href="/tours">ابدأ الحجز</Link></Button>
                        <Button asChild variant="ghost" size="lg"><Link href="/sahb-elsaada">اكتشف صاحب السعادة</Link></Button>
                    </div>
                </Wrap>
            </section>
        </SiteLayout>
    );
}
