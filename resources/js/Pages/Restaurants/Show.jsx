import SiteLayout from '@/Layouts/SiteLayout';
import { Badge } from '@/Components/UI';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MapPin, Star, Check, Utensils, Coffee, Info, Clock, Users2, Sparkles } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { Separator } from '@/Components/ui/separator';
import { cn } from '@/lib/utils';

export default function Show({ restaurant, reviews, review_type, review_id, query_date }) {
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState(query_date || '');
    const [time, setTime] = useState('20:00');
    const [tableId, setTableId] = useState(null);
    const [activeMenuTab, setActiveMenuTab] = useState(restaurant.menu[0]?.id || null);

    const gallery = restaurant.gallery.length ? restaurant.gallery : [
        restaurant.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/rg${restaurant.id}${n}/400/400`),
    ];

    const availableTables = useMemo(() => restaurant.tables.filter(t => !t.booked && t.capacity >= guests), [restaurant.tables, guests]);
    const bookedTables = useMemo(() => restaurant.tables.filter(t => t.booked), [restaurant.tables]);
    const smallTables = useMemo(() => restaurant.tables.filter(t => !t.booked && t.capacity < guests), [restaurant.tables, guests]);

    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', guests);
        q.set('start_time', time);
        if (tableId) q.set('restaurant_table_id', tableId);
        return `${restaurant.checkout_url}?${q.toString()}`;
    };

    const activeSection = restaurant.menu.find(s => s.id === activeMenuTab);
    const isCafe = restaurant.venue_type === 'cafe';

    return (
        <SiteLayout active="restaurants">
            <Head title={restaurant.title} />
            <section className="pt-[26px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-3.5 text-[13.5px] font-semibold text-muted">
                        <Link href="/" className="text-coral-deep">الرئيسية</Link> ›{' '}
                        <Link href="/restaurants" className="text-coral-deep">المطاعم</Link> › {restaurant.title}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        <h1 className="font-head text-3xl font-bold text-navy">{restaurant.title}</h1>
                        <Badge type="soft" className="inline-flex items-center gap-1">
                            {isCafe ? <><Coffee className="h-3.5 w-3.5" /> كافيه</> : <><Utensils className="h-3.5 w-3.5" /> مطعم</>}
                        </Badge>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                        {restaurant.cuisines.map((c, i) => (
                            <span key={i} className="rounded-full border border-black/[.06] bg-beige px-[11px] py-[5px] text-xs font-bold text-muted">{c}</span>
                        ))}
                        <span className="rounded-full border border-black/[.06] bg-beige px-[11px] py-[5px] text-xs font-bold text-muted">{restaurant.price_range}</span>
                    </div>
                    <div className="mb-[18px] flex items-center gap-4 text-sm font-semibold text-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {restaurant.address}</span>
                        {restaurant.review_score > 0 && (
                            <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-vip">
                                <Star className="h-3.5 w-3.5 fill-vip text-vip" /> {restaurant.review_score.toFixed(1)}
                                <span className="ms-1 text-muted">({restaurant.review_count})</span>
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 overflow-hidden rounded-section lg:grid-cols-[2fr_1fr_1fr]">
                        <img className="col-span-2 aspect-[16/9] h-full w-full object-cover lg:col-span-1 lg:row-span-2 lg:aspect-auto" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => (
                            <img key={i} className="aspect-square h-full w-full object-cover" src={g} alt="" />
                        ))}
                    </div>

                    <div className="mt-[30px] grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
                        <div>
                            <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">عن المكان</h3>
                                <p className="text-muted">{restaurant.content}</p>
                            </div>

                            {/* شمول الرسوم/الضريبة (§9) */}
                            {(restaurant.fees_note.service_fee_pct > 0 || restaurant.fees_note.tax_pct > 0) && (
                                <div dir="rtl" className="mb-5 flex items-start gap-2 rounded-input border border-royal/25 bg-royal/[.04] p-3 text-[13px] text-navy">
                                    <Info className="mt-0.5 h-4 w-4 flex-none text-royal" />
                                    <span>
                                        الأسعار المعلنة{' '}
                                        <b>{restaurant.fees_note.service_fee_inclusive ? 'شاملة' : 'غير شاملة'}</b>
                                        {' '}رسوم الخدمة ({restaurant.fees_note.service_fee_pct}%) و{' '}
                                        <b>{restaurant.fees_note.tax_inclusive ? 'شاملة' : 'غير شاملة'}</b>
                                        {' '}الضريبة ({restaurant.fees_note.tax_pct}%).
                                    </span>
                                </div>
                            )}

                            {/* المنيو (§9) */}
                            {restaurant.menu.length > 0 && (
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-3.5 flex items-center gap-2 font-head text-[19px] font-semibold text-navy">
                                        <Utensils className="h-5 w-5 text-coral-deep" /> المنيو
                                    </h3>
                                    <div className="mb-4 flex flex-wrap gap-2 border-b border-black/[.06] pb-3">
                                        {restaurant.menu.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setActiveMenuTab(s.id)}
                                                className={cn(
                                                    'rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors',
                                                    activeMenuTab === s.id
                                                        ? 'bg-coral text-white'
                                                        : 'bg-beige text-navy hover:bg-coral/10',
                                                )}
                                            >
                                                {s.title}
                                            </button>
                                        ))}
                                    </div>
                                    {activeSection && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {activeSection.items.map(it => (
                                                <div key={it.id} className="flex gap-3 rounded-input border border-black/[.06] p-3">
                                                    <img src={it.image_url} className="h-16 w-16 flex-none rounded-md object-cover" alt="" />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="font-bold text-navy">
                                                                {it.title}
                                                                {it.is_signature && <Sparkles className="ms-1 inline h-3.5 w-3.5 text-vip" title="طبق مميّز" />}
                                                            </div>
                                                            <b className="whitespace-nowrap font-head text-coral-deep">{it.price} ج.م</b>
                                                        </div>
                                                        {it.description && <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{it.description}</p>}
                                                        {it.tags.length > 0 && (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {it.tags.map((t, i) => (
                                                                    <span key={i} className="rounded-full bg-beige px-2 py-0.5 text-[11px] font-bold text-muted">{t}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>

                        <div>
                            <div className="rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk lg:sticky lg:top-[92px]">
                                <h3 className="mb-3.5 font-head text-[19px] font-semibold text-navy">احجز ترابيزة</h3>
                                <div className="flex flex-col gap-3.5">
                                    <Field label="التاريخ">
                                        <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTableId(null); }} />
                                    </Field>
                                    <Field label={<span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-coral-deep" /> الوقت</span>}>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {restaurant.slots.map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setTime(t)}
                                                    className={cn(
                                                        'rounded-md border px-2 py-1.5 text-[12.5px] font-bold transition-colors',
                                                        time === t
                                                            ? 'border-coral bg-coral/[.08] text-coral-deep'
                                                            : 'border-black/[.08] bg-white text-navy hover:border-coral',
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                    <Field label={<span className="inline-flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5 text-coral-deep" /> عدد الأشخاص</span>}>
                                        <PartySizeField
                                            value={guests}
                                            onChange={(n) => { setGuests(n || 1); setTableId(null); }}
                                            singular="شخص"
                                            plural="أشخاص"
                                            options={[2, 3, 4, 5, 6, 8].map((n) => ({ value: n, label: `${n} أشخاص` }))}
                                        />
                                    </Field>
                                </div>

                                <Separator className="my-4" />

                                {/* اختيار ترابيزة فعلية */}
                                <div className="mb-3">
                                    <div className="mb-2 font-head text-[15px] font-bold text-navy">اختر ترابيزتك</div>
                                    {availableTables.length === 0 && (
                                        <p className="rounded-input border border-danger/25 bg-danger/[.04] p-2.5 text-[12.5px] text-danger">
                                            مافيش ترابيزات كافية لعدد {guests} شخص في التاريخ ده.
                                        </p>
                                    )}
                                    <div className="space-y-1.5">
                                        {availableTables.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setTableId(t.id)}
                                                className={cn(
                                                    'flex w-full items-center justify-between gap-2 rounded-input border-[1.5px] p-2.5 text-right transition-colors hover:border-coral',
                                                    tableId === t.id ? 'border-coral bg-coral/[.06]' : 'border-black/[.08]',
                                                )}
                                            >
                                                <span className="inline-flex items-center gap-2 font-bold text-navy">
                                                    <Utensils className="h-4 w-4 text-coral-deep" />
                                                    {t.label || `ترابيزة ${t.code}`}
                                                </span>
                                                <span className="text-[12px] text-muted">
                                                    {t.area || '—'} · {t.capacity} أشخاص
                                                </span>
                                            </button>
                                        ))}
                                        {smallTables.length > 0 && (
                                            <p className="text-[11.5px] text-muted">
                                                {smallTables.length} ترابيزة صغيرة (أقل من {guests} أشخاص) — قلّل العدد لتظهر.
                                            </p>
                                        )}
                                        {bookedTables.length > 0 && (
                                            <p className="text-[11.5px] text-muted">
                                                {bookedTables.length} ترابيزة محجوزة اليوم.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3.5">
                                    <Badge type="makfol"><Check className="h-3.5 w-3.5" /> حجز فوري ومؤكّد</Badge>
                                </div>
                                <Button asChild block size="lg" className="mt-3.5" disabled={!tableId || !date}>
                                    {tableId && date
                                        ? <Link href={checkoutUrl()}>احجز الترابيزة</Link>
                                        : <span>{!date ? 'حدّد التاريخ' : 'اختر ترابيزة'}</span>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
