import SiteLayout from '@/Layouts/SiteLayout';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MapPin, Star, Check, Settings, Users, UserRound, KeyRound, Fuel, Snowflake, Luggage } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Select, Field } from '@/Components/ui/input';
import { money } from '@/Components/ui/service-card';
import {
    MobileGallery, MobileDetailHead, MobileSection, MobileStickyBar, MobileSheet, MobileCTA,
} from '@/Components/mobile/primitives';
import { useIsMobile } from '@/lib/useIsMobile';

export default function Show({ car, reviews, review_type, review_id }) {
    const isMobile = useIsMobile();
    const [bookOpen, setBookOpen] = useState(false);
    const [days, setDays] = useState(''); // مفيش اختيار مسبق
    const [date, setDate] = useState('');
    const unit = car.sale_price || car.price;
        // من الإعدادات مش مكتوبة بالكود — لازم تطابق صفحة الدفع
    const site = usePage().props.site || {};
    const fee = site.service_fee ?? 200;
    const discount = car.is_guaranteed ? (site.makfol_discount ?? 400) : 0;
    const daysN = Number(days) || 0;
    // من غير عدد أيام مفيش إجمالي — مش NaN
    const total = useMemo(() => (daysN ? Math.max(0, unit * daysN + fee - discount) : 0), [unit, daysN, fee, discount]);
    const canBook = !!date && daysN > 0;
    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('nights', days);   // مدة الإيجار بالأيام (وحدة الحجز في محرك الإتاحة)
        q.set('units', 1);       // عربية واحدة
        q.set('guests', 1);
        return `${car.checkout_url}?${q.toString()}`;
    };
    const gallery = car.gallery.length ? car.gallery : [
        car.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/cg${car.id}${n}/400/400`),
    ];

    const SPECS = [
        [Settings, car.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال'],
        [Users, `${car.seats} ركاب`],
        [car.with_driver ? UserRound : KeyRound, car.with_driver ? 'مع سائق' : 'بدون سائق'],
        [Fuel, 'بنزين'],
        [Snowflake, 'تكييف'],
        [Luggage, 'شنطة كبيرة'],
    ];

    if (isMobile) {
        return (
            <SiteLayout active="cars" anim="detail">
                <Head title={car.title} />

                <MobileGallery
                    images={gallery}
                    badges={
                        <>
                            {car.is_guaranteed && <Badge variant="makfol"><Check className="h-3 w-3" /> مكفول</Badge>}
                            {car.with_driver && <Badge variant="royal">مع سائق</Badge>}
                        </>
                    }
                />

                <MobileDetailHead
                    title={car.title}
                    location={car.location}
                    score={car.review_score}
                    count={car.review_count}
                    price={unit}
                    unit="اليوم"
                    facts={[
                        <><Settings className="h-[15px] w-[15px] text-coral-deep" /> {car.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال'}</>,
                        <><Users className="h-[15px] w-[15px] text-coral-deep" /> {car.seats} ركاب</>,
                        car.with_driver && <><UserRound className="h-[15px] w-[15px] text-makfol" /> مع سائق</>,
                    ]}
                />

                <MobileSection title="عن السيارة">
                    <p className="text-[14px] leading-relaxed text-muted">{car.content}</p>
                </MobileSection>

                <MobileSection title="المواصفات">
                    <div className="grid grid-cols-2 gap-3">
                        {SPECS.map(([Icon, label], i) => (
                            <div key={i} className="flex items-center gap-2.5 text-[13.5px] font-semibold text-navy">
                                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-beige">
                                    <Icon className="h-[17px] w-[17px] text-navy" />
                                </span>
                                {label}
                            </div>
                        ))}
                    </div>
                </MobileSection>

                <MobileSection title="التقييمات">
                    <Reviews reviews={reviews} type={review_type} id={review_id} />
                </MobileSection>

                <div className="h-[120px]" />

                <MobileStickyBar
                    price={total || unit}
                    unit={total ? null : 'اليوم'}
                    note={total ? `${daysN} يوم` : (car.with_driver ? 'شامل السائق' : 'بدون سائق')}
                    ctaLabel={total ? 'كمّل الحجز' : 'احجز دلوقتي'}
                    onCta={() => setBookOpen(true)}
                />

                <MobileSheet
                    open={bookOpen}
                    onOpenChange={setBookOpen}
                    title="تفاصيل الحجز"
                    footer={
                        <MobileCTA href={canBook ? checkoutUrl() : undefined} disabled={!canBook}>
                            {!date ? 'اختار تاريخ الاستلام' : !daysN ? 'اختار عدد الأيام' : `متابعة الحجز · ${money(total)} ج.م`}
                        </MobileCTA>
                    }
                >
                    <div className="space-y-4">
                        <Field label="تاريخ الاستلام">
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </Field>
                        <Field label="عدد الأيام">
                            <Select value={days} onChange={(e) => setDays(e.target.value)}>
                                <option value="">اختار عدد الأيام</option>
                                {[1, 2, 3, 5, 7, 14].map((n) => <option key={n} value={n}>{n} أيام</option>)}
                            </Select>
                        </Field>
                        {daysN > 0 && (
                            <div className="rounded-card bg-beige/50 p-3.5 text-[14px]">
                                <div className="flex justify-between py-2"><span>{money(unit)} × {daysN} يوم</span><span>{money(unit * daysN)} ج.م</span></div>
                                <div className="flex justify-between py-2"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                                <div className="mt-1 flex justify-between border-t border-black/[.06] pt-3 font-extrabold">
                                    <span>الإجمالي</span>
                                    <b className="font-head text-[19px] text-coral-deep">{money(total)} ج.م</b>
                                </div>
                            </div>
                        )}
                    </div>
                </MobileSheet>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="cars" anim="detail">
            <Head title={car.title} />
            <section className="pt-[26px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-3.5 text-[13.5px] font-semibold text-muted">
                        <Link href="/" className="text-coral-deep">الرئيسية</Link> ›{' '}
                        <Link href="/cars" className="text-coral-deep">السيارات</Link> › {car.title}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        {car.is_guaranteed && <Badge variant="makfol"><Check className="h-3.5 w-3.5" /> مكفول</Badge>}
                        {car.with_driver && <Badge variant="royal">مع سائق</Badge>}
                    </div>
                    <h1 className="mb-2 font-head text-3xl font-bold text-navy md:text-4xl">{car.title}</h1>
                    <div className="mb-[18px] flex flex-wrap items-center gap-4 text-sm font-semibold text-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {car.location}</span>
                        {car.review_score > 0 && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-vip">
                                <Star className="h-3.5 w-3.5 fill-vip" /> {car.review_score.toFixed(1)} ({car.review_count})
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 overflow-hidden rounded-section md:grid-cols-[2fr_1fr_1fr]">
                        <img className="col-span-2 aspect-[16/9] h-full w-full object-cover md:col-span-1 md:row-span-2 md:aspect-auto" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => <img key={i} className="aspect-square h-full w-full object-cover" src={g} alt="" />)}
                    </div>

                    <div className="mt-[30px] grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
                        <div>
                            <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">عن السيارة</h3>
                                <p className="m-0 text-muted">{car.content}</p>
                            </div>
                            <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">المواصفات</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                        <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy"><Settings className="h-[18px] w-[18px]" /></i>
                                        {car.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال'}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                        <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy"><Users className="h-[18px] w-[18px]" /></i>
                                        {car.seats} ركاب
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                        <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy">
                                            {car.with_driver ? <UserRound className="h-[18px] w-[18px]" /> : <KeyRound className="h-[18px] w-[18px]" />}
                                        </i>
                                        {car.with_driver ? 'مع سائق' : 'بدون سائق'}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                        <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy"><Fuel className="h-[18px] w-[18px]" /></i>
                                        بنزين
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                        <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy"><Snowflake className="h-[18px] w-[18px]" /></i>
                                        تكييف
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                        <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy"><Luggage className="h-[18px] w-[18px]" /></i>
                                        شنطة كبيرة
                                    </div>
                                </div>
                            </div>
                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>
                        <div>
                            <div className="sticky top-[92px] rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk">
                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="font-head text-[30px] font-bold text-coral-deep">{money(unit)}</span>
                                    <span>ج.م</span>
                                    {car.sale_price && <s className="text-base text-muted">{money(car.price)}</s>}
                                </div>
                                <div className="mb-[18px] text-[13px] text-muted">/ اليوم{car.with_driver ? ' · شامل السائق' : ''}</div>
                                <Field label="تاريخ الاستلام" className="mb-3.5">
                                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                </Field>
                                <Field label="عدد الأيام" className="mb-3.5">
                                    <Select value={days} onChange={(e) => setDays(+e.target.value)}>
                                        {[1, 2, 3, 5, 7, 14].map((n) => <option key={n} value={n}>{n} أيام</option>)}
                                    </Select>
                                </Field>
                                <div className="mb-1.5 mt-4">
                                    <div className="flex justify-between py-[9px] text-sm"><span>{money(unit)} × {days}</span><span>{money(unit * days)} ج.م</span></div>
                                    <div className="flex justify-between py-[9px] text-sm"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                                    <div className="mt-2 flex justify-between border-t border-black/[.06] pt-3.5 text-base font-extrabold"><span>الإجمالي</span><b className="font-head text-xl text-coral-deep">{money(total)} ج.م</b></div>
                                </div>
                                <Button asChild size="lg" block>
                                    <Link href={checkoutUrl()}>احجز دلوقتي</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
