import SiteLayout from '@/Layouts/SiteLayout';
import Reviews from '@/Components/Reviews';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MapPin, Star, Heart, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { money } from '@/Components/ui/service-card';

export default function Show({ tour, reviews, review_type, review_id }) {
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState('');
    const unit = tour.sale_price || tour.price;
    const fee = 200;
    const total = useMemo(() => unit * guests + fee, [unit, guests]);

    const page = usePage();
    const authed = !!page.props.auth?.user;
    const saved = (page.props.wishlist || []).includes(`tour:${tour.id}`);
    const toggleSave = () => {
        if (!authed) { router.visit('/login'); return; }
        router.post('/wishlist/toggle', { type: 'tour', id: tour.id }, { preserveScroll: true, preserveState: true });
    };

    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', guests);
        return `${tour.checkout_url}?${q.toString()}`;
    };

    const gallery = tour.gallery.length ? tour.gallery : [
        tour.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/g${tour.id}${n}/400/400`),
    ];

    return (
        <SiteLayout active="tours">
            <Head title={tour.title} />

            <section className="pt-[26px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-3.5 text-[13.5px] font-semibold text-muted">
                        <Link href="/" className="text-coral-deep hover:underline">الرئيسية</Link> ›{' '}
                        <Link href="/tours" className="text-coral-deep hover:underline">الرحلات</Link> › {tour.title}
                    </div>

                    <div className="mb-[18px] flex flex-wrap items-center justify-between gap-2.5">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                {tour.is_guaranteed && <Badge variant="makfol"><Check className="h-3.5 w-3.5" /> مكفول</Badge>}
                                {tour.sale_price && <Badge variant="best">أفضل سعر</Badge>}
                            </div>
                            <h1 className="m-0 font-head text-[28px] font-bold text-navy md:text-[32px]">{tour.title}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-muted">
                                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {tour.location}</span>
                                {tour.review_score > 0 && (
                                    <span className="inline-flex items-center gap-1 font-bold text-vip">
                                        <Star className="h-3.5 w-3.5 fill-vip text-vip" /> {tour.review_score.toFixed(1)} ({tour.review_count} تقييم)
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button variant="secondary" onClick={toggleSave}>
                            <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} /> {saved ? 'محفوظة' : 'حفظ'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 overflow-hidden rounded-section lg:grid-cols-[2fr_1fr_1fr]">
                        <img className="col-span-2 aspect-[16/9] h-full w-full object-cover lg:col-span-1 lg:row-span-2 lg:aspect-auto" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => <img key={i} className="aspect-square h-full w-full object-cover" src={g} alt="" />)}
                    </div>

                    <div className="mt-[30px] grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
                        <div>
                            <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">عن الرحلة</h3>
                                <p className="m-0 text-muted">{tour.content}</p>
                            </div>

                            {tour.included.length > 0 && (
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">الرحلة بتشمل إيه</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {tour.included.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] bg-beige text-navy">
                                                    <Check className="h-4 w-4" />
                                                </span>
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tour.itinerary.length > 0 && (
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">برنامج الرحلة</h3>
                                    <div className="relative ps-[26px]">
                                        <div className="absolute bottom-1.5 start-[7px] top-1.5 w-0.5 bg-black/[.06]" />
                                        {tour.itinerary.map((d, i) => (
                                            <div key={i} className="relative pb-5">
                                                <span className="absolute -start-[23px] top-1 h-3 w-3 rounded-full bg-coral shadow-[0_0_0_3px_#fff,0_0_0_4px_rgba(0,0,0,.06)]" />
                                                <b className="block font-head text-navy">{d.title}</b>
                                                <p className="mt-0.5 text-sm text-muted">{d.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>

                        {/* صندوق الحجز */}
                        <div>
                            <div className="rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk lg:sticky lg:top-[92px]">
                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="font-head text-[30px] font-bold text-coral-deep">{money(unit)}</span><span>ج.م</span>
                                    {tour.sale_price && <s className="text-base text-muted">{money(tour.price)}</s>}
                                </div>
                                <div className="mb-[18px] text-[13px] text-muted">للفرد · شامل كل الخدمات</div>

                                <div className="space-y-3.5">
                                    <Field label="تاريخ الرحلة">
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                    </Field>
                                    <Field label="عدد المسافرين">
                                        <PartySizeField
                                            value={guests}
                                            onChange={(n) => setGuests(n || 1)}
                                            options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} فرد` }))}
                                        />
                                    </Field>
                                </div>

                                <div className="mb-1.5 mt-4">
                                    <div className="flex justify-between py-[9px] text-sm"><span>{money(unit)} × {guests} فرد</span><span>{money(unit * guests)} ج.م</span></div>
                                    <div className="flex justify-between py-[9px] text-sm"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                                    <div className="mt-2 flex justify-between border-t border-black/[.06] pt-3.5 text-base font-extrabold"><span>الإجمالي</span><b className="font-head text-xl text-coral-deep">{money(total)} ج.م</b></div>
                                </div>

                                <Button asChild size="lg" block>
                                    <Link href={checkoutUrl()}>احجز دلوقتي</Link>
                                </Button>
                                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted">
                                    <ShieldCheck className="h-4 w-4" /> حجز مكفول — إلغاء مجاني حتى 48 ساعة
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
