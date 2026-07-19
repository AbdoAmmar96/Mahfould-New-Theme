import SiteLayout from '@/Layouts/SiteLayout';
import { Badge } from '@/Components/UI';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { MapPin, Star, Check } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Select, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';

export default function Show({ restaurant, reviews, review_type, review_id }) {
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('20:00');
    const gallery = restaurant.gallery.length ? restaurant.gallery : [
        restaurant.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/rg${restaurant.id}${n}/400/400`),
    ];
    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', guests);
        q.set('slot', time);
        return `${restaurant.checkout_url}?${q.toString()}`;
    };

    return (
        <SiteLayout active="restaurants">
            <Head title={restaurant.title} />
            <section className="pt-[26px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-3.5 text-[13.5px] font-semibold text-muted">
                        <Link href="/" className="text-coral-deep">الرئيسية</Link> ›{' '}
                        <Link href="/restaurants" className="text-coral-deep">المطاعم</Link> › {restaurant.title}
                    </div>
                    <h1 className="mb-2 font-head text-3xl font-bold text-navy">{restaurant.title}</h1>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                        {restaurant.cuisines.map((c, i) => (
                            <span key={i} className="rounded-full border border-black/[.06] bg-beige px-[11px] py-[5px] text-xs font-bold text-muted">{c}</span>
                        ))}
                        <span className="rounded-full border border-black/[.06] bg-beige px-[11px] py-[5px] text-xs font-bold text-muted">{restaurant.price_range}</span>
                    </div>
                    <div className="mb-[18px] flex items-center gap-4 text-sm font-semibold text-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {restaurant.address}</span>
                        {restaurant.review_score > 0 && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-vip"><Star className="h-3.5 w-3.5 fill-vip text-vip" /> {restaurant.review_score.toFixed(1)}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 overflow-hidden rounded-section lg:grid-cols-[2fr_1fr_1fr]">
                        <img className="col-span-2 aspect-[16/9] h-full w-full object-cover lg:col-span-1 lg:row-span-2 lg:aspect-auto" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => (
                            <img key={i} className="aspect-square h-full w-full object-cover" src={g} alt="" />
                        ))}
                    </div>

                    <div className="mt-[30px] grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
                        <div>
                            <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">عن المكان</h3>
                                <p className="text-muted">{restaurant.content}</p>
                            </div>
                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>
                        <div>
                            <div className="rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk lg:sticky lg:top-[92px]">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">احجز ترابيزة</h3>
                                <div className="flex flex-col gap-3.5">
                                    <Field label="التاريخ">
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                    </Field>
                                    <Field label="الوقت">
                                        <Select value={time} onChange={(e) => setTime(e.target.value)}>
                                            <option value="19:00">7:00 مساءً</option>
                                            <option value="20:00">8:00 مساءً</option>
                                            <option value="21:00">9:00 مساءً</option>
                                        </Select>
                                    </Field>
                                    <Field label="عدد الأشخاص">
                                        <PartySizeField
                                            value={guests}
                                            onChange={(n) => setGuests(n || 1)}
                                            singular="شخص"
                                            plural="أشخاص"
                                            options={[2, 3, 4, 5, 6, 8].map((n) => ({ value: n, label: `${n} أشخاص` }))}
                                        />
                                    </Field>
                                </div>
                                <div className="mt-3.5">
                                    <Badge type="makfol"><Check className="h-3.5 w-3.5" /> حجز فوري ومؤكّد</Badge>
                                </div>
                                <Button asChild block size="lg" className="mt-3.5">
                                    <Link href={checkoutUrl()}>احجز الترابيزة</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
