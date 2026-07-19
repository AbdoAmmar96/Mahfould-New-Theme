import SiteLayout from '@/Layouts/SiteLayout';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MapPin, Star, Check, Waves, UtensilsCrossed, Umbrella, Sparkles, Wifi, Car } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Select, Field } from '@/Components/ui/input';
import { money } from '@/Components/ui/service-card';

const AMENITIES = [
    [Waves, 'حمام سباحة'],
    [UtensilsCrossed, 'مطاعم متعددة'],
    [Umbrella, 'شاطئ خاص'],
    [Sparkles, 'سبا وساونا'],
    [Wifi, 'واي فاي مجاني'],
    [Car, 'موقف سيارات'],
];

export default function Show({ hotel, reviews, review_type, review_id }) {
    const [nights, setNights] = useState(2);
    const [date, setDate] = useState('');
    const unit = hotel.sale_price || hotel.price;
    const fee = 200;
    const total = useMemo(() => unit * nights + fee, [unit, nights]);
    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', nights);
        return `${hotel.checkout_url}?${q.toString()}`;
    };
    const gallery = hotel.gallery.length ? hotel.gallery : [
        hotel.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/hg${hotel.id}${n}/400/400`),
    ];

    return (
        <SiteLayout active="hotels">
            <Head title={hotel.title} />
            <section className="pt-[26px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-3.5 text-[13.5px] font-semibold text-muted">
                        <Link href="/" className="text-coral-deep">الرئيسية</Link> ›{' '}
                        <Link href="/hotels" className="text-coral-deep">الفنادق</Link> › {hotel.title}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        <Badge variant="makfol"><Check className="h-3.5 w-3.5" /> مكفول</Badge>
                        <span className="inline-flex items-center gap-0.5">
                            {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-vip text-vip" />
                            ))}
                        </span>
                    </div>
                    <h1 className="mb-2 font-head text-3xl font-bold text-navy md:text-4xl">{hotel.title}</h1>
                    <div className="mb-[18px] flex flex-wrap items-center gap-4 text-sm font-semibold text-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {hotel.location}</span>
                        {hotel.review_score > 0 && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-vip">
                                <Star className="h-3.5 w-3.5 fill-vip" /> {hotel.review_score.toFixed(1)} ({hotel.review_count})
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
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">عن الفندق</h3>
                                <p className="m-0 text-muted">{hotel.content}</p>
                            </div>
                            <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">المرافق</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {AMENITIES.map(([Icon, label], i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-[14.5px] font-semibold text-navy">
                                            <i className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-beige not-italic text-navy">
                                                <Icon className="h-[18px] w-[18px]" />
                                            </i>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>
                        <div>
                            <div className="sticky top-[92px] rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk">
                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="font-head text-[30px] font-bold text-coral-deep">{money(unit)}</span>
                                    <span>ج.م</span>
                                    {hotel.sale_price && <s className="text-base text-muted">{money(hotel.price)}</s>}
                                </div>
                                <div className="mb-[18px] text-[13px] text-muted">/ الليلة · شامل الإفطار</div>
                                <Field label="تاريخ الوصول" className="mb-3.5">
                                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                </Field>
                                <Field label="عدد الليالي" className="mb-3.5">
                                    <Select value={nights} onChange={(e) => setNights(+e.target.value)}>
                                        {[1, 2, 3, 4, 5, 7].map((n) => <option key={n} value={n}>{n} ليالي</option>)}
                                    </Select>
                                </Field>
                                <div className="mb-1.5 mt-4">
                                    <div className="flex justify-between py-[9px] text-sm"><span>{money(unit)} × {nights}</span><span>{money(unit * nights)} ج.م</span></div>
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
