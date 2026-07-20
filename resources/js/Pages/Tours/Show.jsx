import SiteLayout from '@/Layouts/SiteLayout';
import Reviews from '@/Components/Reviews';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Star, Heart, Check, ShieldCheck, Sparkles, CalendarDays, Download, FileText } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { money } from '@/Components/ui/service-card';
import { cn } from '@/lib/utils';

export default function Show({ tour, reviews, review_type, review_id }) {
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState('');

    // فعاليات مختارة — تُبدأ بالـdefault
    const defaultAddonIds = useMemo(
        () => tour.activities.filter(a => a.is_default).map(a => a.id),
        [tour.activities],
    );
    const [selectedAddons, setSelectedAddons] = useState(defaultAddonIds);

    // لو الرحلة اتغيّرت (route change) يترجع للـdefaults
    useEffect(() => { setSelectedAddons(defaultAddonIds); }, [defaultAddonIds]);

    const unit = tour.sale_price || tour.price;
    const fee = 200;
    const addonsSum = useMemo(
        () => tour.activities
            .filter(a => selectedAddons.includes(a.id))
            .reduce((s, a) => s + a.price * guests, 0),
        [tour.activities, selectedAddons, guests],
    );
    const total = useMemo(() => unit * guests + addonsSum + fee, [unit, guests, addonsSum]);

    const page = usePage();
    const authed = !!page.props.auth?.user;
    const saved = (page.props.wishlist || []).includes(`tour:${tour.id}`);
    const toggleSave = () => {
        if (!authed) { router.visit('/login'); return; }
        router.post('/wishlist/toggle', { type: 'tour', id: tour.id }, { preserveScroll: true, preserveState: true });
    };

    const toggleAddon = (id) => setSelectedAddons(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', guests);
        selectedAddons.forEach(id => q.append('activity_ids[]', id));
        return `${tour.checkout_url}?${q.toString()}`;
    };

    const gallery = tour.gallery.length ? tour.gallery : [
        tour.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/g${tour.id}${n}/400/400`),
    ];

    // استخدم itineraries الجديدة لو موجودة، وإلا itinerary القديم JSON
    const days = tour.itineraries.length > 0
        ? tour.itineraries
        : tour.itinerary.map((d, i) => ({ day: i + 1, title: d.title, description: d.desc, highlights: [] }));

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

                            {/* فعاليات اختيارية (add-ons) — §8 */}
                            {tour.activities.length > 0 && (
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-1 flex items-center gap-2 font-head text-[19px] font-semibold text-navy">
                                        <Sparkles className="h-5 w-5 text-vip" /> فعاليات اختيارية
                                    </h3>
                                    <p className="mb-4 text-sm text-muted">ضيف تجربة أعمق لرحلتك — أسعار للفرد.</p>
                                    <div className="space-y-2.5">
                                        {tour.activities.map(act => {
                                            const on = selectedAddons.includes(act.id);
                                            return (
                                                <label
                                                    key={act.id}
                                                    className={cn(
                                                        'flex cursor-pointer items-center gap-3 rounded-input border-[1.5px] p-3 transition-colors hover:border-coral',
                                                        on ? 'border-coral bg-coral/[.06]' : 'border-black/[.08]',
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={on}
                                                        onChange={() => toggleAddon(act.id)}
                                                        className="h-4 w-4 accent-coral"
                                                    />
                                                    <img src={act.image_url} className="h-14 w-14 flex-none rounded-md object-cover" alt="" />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-navy">{act.title}</div>
                                                        {act.short_desc && <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{act.short_desc}</p>}
                                                    </div>
                                                    <div className="text-end">
                                                        <b className="font-head text-coral-deep">+{money(act.price)}</b>
                                                        <div className="text-[11px] text-muted">للفرد</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* برنامج الرحلة يوم بيوم */}
                            {days.length > 0 && (
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="flex items-center gap-2 font-head text-[19px] font-semibold text-navy">
                                            <CalendarDays className="h-5 w-5 text-coral-deep" /> برنامج الرحلة
                                        </h3>
                                        <div className="flex gap-1.5">
                                            <Button asChild variant="secondary" size="sm">
                                                <Link href={`/tours/${tour.slug}/schedule`}>
                                                    <FileText className="h-3.5 w-3.5" /> البرنامج الكامل
                                                </Link>
                                            </Button>
                                            <Button asChild variant="secondary" size="sm">
                                                <a href={`/tours/${tour.slug}/schedule/print?autoprint=1`} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-3.5 w-3.5" /> PDF
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="relative ps-[26px]">
                                        <div className="absolute bottom-1.5 start-[7px] top-1.5 w-0.5 bg-black/[.06]" />
                                        {days.map((d, i) => (
                                            <div key={i} className="relative pb-5">
                                                <span className="absolute -start-[26px] top-0 grid h-6 w-6 place-items-center rounded-full bg-coral text-[11px] font-extrabold text-white shadow-[0_0_0_3px_#fff]">
                                                    {d.day}
                                                </span>
                                                <b className="block font-head text-navy">{d.title}</b>
                                                {d.description && <p className="mt-0.5 text-sm text-muted">{d.description}</p>}
                                                {d.highlights && d.highlights.length > 0 && (
                                                    <ul className="mt-1.5 space-y-1">
                                                        {d.highlights.map((h, j) => (
                                                            <li key={j} className="flex items-center gap-1.5 text-[13px] text-navy">
                                                                <Check className="h-3.5 w-3.5 flex-none text-makfol" /> {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
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
                                    {addonsSum > 0 && (
                                        <div className="flex justify-between py-[9px] text-sm">
                                            <span>فعاليات ({selectedAddons.length})</span>
                                            <span className="text-vip">+{money(addonsSum)} ج.م</span>
                                        </div>
                                    )}
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
