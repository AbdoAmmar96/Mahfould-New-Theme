import SiteLayout from '@/Layouts/SiteLayout';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    MapPin, Star, Check, Waves, UtensilsCrossed, Umbrella, Sparkles, Wifi, Car,
    Banknote, ShieldCheck, TriangleAlert, Coffee, Users, BedDouble, Info, Headphones,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Select, Field } from '@/Components/ui/input';
import { PartySizeField } from '@/Components/ui/party-size';
import { Separator } from '@/Components/ui/separator';
import { money } from '@/Components/ui/service-card';
import { useAvailability, remainingForRange, ymd } from '@/lib/useAvailability';
import { MobileStickyBar, MobileSheet, MobileCTA } from '@/Components/mobile/primitives';
import MobileDetailShell from '@/Components/mobile/MobileDetailShell';
import { Heading, FactGrid, NoteList, PeekRow } from '@/Components/mobile/InfoBlocks';
import { useIsMobile } from '@/lib/useIsMobile';
import { hotelNav } from '@/lib/detailNav';
import { readId, writeId } from '@/lib/pick';
import { cn } from '@/lib/utils';

const AMENITIES = [
    [Waves, 'حمام سباحة'],
    [UtensilsCrossed, 'مطاعم متعددة'],
    [Umbrella, 'شاطئ خاص'],
    [Sparkles, 'سبا وساونا'],
    [Wifi, 'واي فاي مجاني'],
    [Car, 'موقف سيارات'],
];

export default function Show({ hotel, room_types = [], reviews, review_type, review_id }) {
    const isMobile = useIsMobile();
    const [bookOpen, setBookOpen] = useState(false);
    // §7: نوع الغرفة — مفيش اختيار مسبق، العميل هو اللي يحدّد.
    // الاختيار بيتعمل في /hotels/{slug}/rooms وبيرجع محفوظ للجلسة.
    const [selectedId, setSelectedId] = useState(() => readId(`mk:hotel:${hotel.slug}:room`, 'room'));
    const selected = useMemo(
        () => room_types.find((r) => r.id === selectedId) || null,
        [selectedId, room_types],
    );

    const [nights, setNights] = useState('');
    const [rooms, setRooms] = useState('');
    const [guests, setGuests] = useState('');
    const [date, setDate] = useState('');

    // «يبدأ من» — أرخص نوع غرفة، للعرض قبل ما يختار
    const fromPrice = useMemo(
        () => (room_types.length
            ? Math.min(...room_types.map((r) => r.effective_price))
            : (hotel.sale_price ?? hotel.price)),
        [room_types, hotel.sale_price, hotel.price],
    );

    const unit = selected?.effective_price ?? fromPrice;
    const fee = 200;
    const nightsN = Number(nights) || 0;
    const roomsN = Number(rooms) || 0;
    const total = useMemo(
        () => (selected && nightsN && roomsN ? unit * nightsN * roomsN + fee : 0),
        [selected, unit, nightsN, roomsN, fee],
    );

    const today = ymd(new Date());
    const unitsTotal = selected?.units_total ?? 1;

    // إتاحة حيّة لنوع الغرفة المحدّد
    const availUrl = selected
        ? `${hotel.availability_url}?room_type_id=${selected.id}`
        : hotel.availability_url;
    const availability = useAvailability(availUrl);
    const rangeRemaining = useMemo(
        () => remainingForRange(availability, date, nightsN),
        [availability, date, nightsN],
    );
    const soldOut = date && rangeRemaining === 0;
    const notEnough = date && rangeRemaining !== null && roomsN > rangeRemaining && rangeRemaining > 0;
    const canBook = !!selected && !!date && nightsN > 0 && roomsN > 0
        && rangeRemaining !== null && roomsN <= rangeRemaining && rangeRemaining > 0;

    // أول حاجة ناقصة — عشان نقول للعميل يعمل إيه بالظبط
    const missing = !selected ? 'اختار نوع الغرفة'
        : !date ? 'اختار تاريخ الوصول'
        : !nightsN ? 'اختار عدد الليالي'
        : !roomsN ? 'اختار عدد الغرف'
        : soldOut ? 'مفيش إتاحة'
        : notEnough ? `المتاح ${rangeRemaining} غرفة بس`
        : null;

    const checkoutUrl = () => {
        const q = new URLSearchParams();
        q.set('start_date', date);
        q.set('nights', nights);
        q.set('units', rooms);
        q.set('guests', guests);
        q.set('room_type_id', selected.id);
        return `/checkout/hotel/${hotel.id}?${q.toString()}`;
    };

    const gallery = hotel.gallery.length ? hotel.gallery : [
        hotel.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/hg${hotel.id}${n}/400/400`),
    ];

    if (isMobile) {
        return (
            <SiteLayout active="hotels" anim="detail" bare>
                <Head title={hotel.title} />

                <MobileDetailShell
                    title={hotel.title}
                    location={hotel.location}
                    score={hotel.review_score}
                    count={hotel.review_count}
                    images={gallery}
                    badges={<Badge variant="makfol"><Check className="h-3 w-3" /> مكفول</Badge>}
                    facts={[
                        hotel.star_rating && <><Star className="h-[15px] w-[15px] fill-vip text-vip" /> {hotel.star_rating} نجوم</>,
                        <><Waves className="h-[15px] w-[15px] text-coral-deep" /> حمام سباحة</>,
                        <><ShieldCheck className="h-[15px] w-[15px] text-makfol" /> تأكيد لحظي</>,
                    ]}
                    nav={hotelNav(hotel.slug, 'overview', {
                        rooms: room_types.length,
                        selected: !!selectedId,
                    })}
                >
                    <div className="space-y-6 px-4">
                        <div>
                            {hotel.short_desc && (
                                <p className="mb-2.5 text-[15px] font-bold leading-relaxed text-navy">{hotel.short_desc}</p>
                            )}
                            <p className="text-[15px] leading-[1.85] text-navy/75">{hotel.content}</p>
                        </div>

                        <div>
                            <Heading icon={Info}>تفاصيل الإقامة</Heading>
                            <FactGrid
                                items={[
                                    hotel.star_rating && {
                                        icon: Star, value: `${hotel.star_rating} نجوم`, label: 'تصنيف الفندق',
                                    },
                                    hotel.location && { icon: MapPin, value: hotel.location, label: 'الموقع' },
                                    room_types.length > 0 && {
                                        icon: BedDouble, value: `${room_types.length} نوع`, label: 'أنواع الغرف',
                                    },
                                    fromPrice > 0 && {
                                        icon: Banknote, value: `${money(fromPrice)} ج.م`, label: 'يبدأ من / الليلة',
                                    },
                                ]}
                            />
                        </div>

                        <div className="space-y-2.5">
                            <PeekRow
                                href={`/hotels/${hotel.slug}/rooms`}
                                icon={BedDouble}
                                label={selected ? selected.title : 'اختار نوع الغرفة'}
                                sub={selected
                                    ? `${money(selected.effective_price)} ج.م / الليلة`
                                    : `${room_types.length} أنواع متاحة — الأسعار بتختلف حسب النوع`}
                                cta={selected ? 'تغيير' : 'اختار'}
                            />
                            <PeekRow
                                href={`/hotels/${hotel.slug}/amenities`}
                                icon={Waves}
                                label="المرافق والخدمات"
                                sub="حمام سباحة · مطاعم · سبا · واي فاي وأكتر"
                            />
                        </div>

                        <div>
                            <Heading icon={ShieldCheck}>ليه تحجز من محفول مكفول</Heading>
                            <NoteList
                                tone="makfol"
                                items={[
                                    {
                                        icon: ShieldCheck,
                                        title: 'تأكيد لحظي',
                                        text: 'الغرفة بتتحجز باسمك على طول، وبيوصلك كود الحجز فوراً.',
                                    },
                                    {
                                        icon: Banknote,
                                        title: 'سعر واضح من الأول',
                                        text: `السعر حسب نوع الغرفة وعدد الليالي، ورسوم الخدمة ${fee} ج.م بتبان قبل الدفع.`,
                                    },
                                    {
                                        icon: Headphones,
                                        title: 'دعم طول الإقامة',
                                        text: 'أي مشكلة في الفندق كلّمنا وإحنا نتصرّف.',
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </MobileDetailShell>

                {/* لما يبقى في غرفة متحددة نعرض سعرها هي — قبل كده كان بيعرض
                    أرخص سعر (fromPrice) وتحته اسم الغرفة المختارة، فالرقم كان
                    بيبان غلط جنب اسم غرفة سعرها مختلف. */}
                <MobileStickyBar
                    price={total || unit}
                    unit={total ? null : 'الليلة'}
                    note={total ? `${nightsN} ليالي · ${roomsN} غرفة` : selected ? selected.title : 'يبدأ من'}
                    ctaLabel={total ? 'كمّل الحجز' : 'اختار تواريخك'}
                    onCta={() => setBookOpen(true)}
                />

                <MobileSheet
                    open={bookOpen}
                    onOpenChange={setBookOpen}
                    title="تفاصيل الإقامة"
                    footer={
                        <MobileCTA href={canBook ? checkoutUrl() : undefined} disabled={!canBook}>
                            {missing ?? `متابعة الحجز · ${money(total)} ج.م`}
                        </MobileCTA>
                    }
                >
                    <div className="space-y-4">
                        {/* نوع الغرفة بقى صفحة لوحده — هنا بنعرض المختار وبس */}
                        {room_types.length > 0 && (
                            <div>
                                <p className="mb-2 text-[12.5px] font-extrabold text-muted">نوع الغرفة</p>
                                <Link
                                    href={`/hotels/${hotel.slug}/rooms`}
                                    className="mk-press flex items-center gap-3 rounded-input border-[1.5px] border-black/[.08] p-3"
                                >
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-beige">
                                        <BedDouble className="h-[17px] w-[17px] text-navy" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[14px] font-bold text-navy">
                                            {selected ? selected.title : 'اختار نوع الغرفة'}
                                        </span>
                                        {selected && (
                                            <span className="text-[12px] text-muted">
                                                {money(selected.effective_price)} ج.م / الليلة
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 text-[12.5px] font-bold text-coral-deep">
                                        {selected ? 'تغيير' : 'اختار'}
                                    </span>
                                </Link>
                            </div>
                        )}

                        <Field label="تاريخ الوصول">
                            <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="عدد الليالي">
                                <Select value={nights} onChange={(e) => setNights(e.target.value)}>
                                    <option value="">اختار</option>
                                    {[1, 2, 3, 4, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n} ليلة</option>)}
                                </Select>
                            </Field>
                            <Field label="عدد الغرف">
                                <Select value={rooms} onChange={(e) => setRooms(e.target.value)}>
                                    <option value="">اختار</option>
                                    {Array.from({ length: Math.max(unitsTotal, 1) }, (_, i) => i + 1).map((n) => (
                                        <option key={n} value={n}>{n} غرفة</option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        <Field label="عدد الأفراد">
                            <PartySizeField
                                value={guests}
                                onChange={(n) => setGuests(n || '')}
                                placeholder="اختار العدد"
                                options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} فرد` }))}
                            />
                        </Field>

                        {date && rangeRemaining !== null && (
                            <p className={cn(
                                'flex items-center gap-1.5 rounded-input px-3 py-2.5 text-[13px] font-semibold',
                                soldOut || notEnough ? 'bg-danger/10 text-danger' : 'bg-makfol/10 text-makfol',
                            )}>
                                {soldOut || notEnough ? <TriangleAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                {soldOut ? 'مفيش غرف متاحة في التواريخ دي' : `متاح ${rangeRemaining} غرفة`}
                            </p>
                        )}

                        <div className="rounded-card bg-beige/50 p-3.5 text-[14px]">
                            <div className="flex justify-between py-2">
                                <span>{money(unit)} × {nights} ليلة × {rooms}</span>
                                <span>{money(unit * nights * rooms)} ج.م</span>
                            </div>
                            <div className="flex justify-between py-2"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                            <div className="mt-1 flex justify-between border-t border-black/[.06] pt-3 font-extrabold">
                                <span>الإجمالي</span>
                                <b className="font-head text-[19px] text-coral-deep">{money(total)} ج.م</b>
                            </div>
                        </div>
                    </div>
                </MobileSheet>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="hotels" anim="detail">
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
                            {/* §7: أنواع الغرف — البطاقات */}
                            {room_types.length > 0 && (
                                <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
                                    <h3 className="mb-1 font-head text-[19px] font-semibold text-navy">أنواع الغرف المتاحة</h3>
                                    <p className="mb-4 text-sm text-muted">اختر النوع الأنسب — كل نوع بسعره وشروطه</p>
                                    <div className="grid grid-cols-1 gap-3.5">
                                        {room_types.map((r) => {
                                            const sel = selected?.id === r.id;
                                            const hasSale = r.sale_price && r.sale_price < r.price;
                                            return (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => setSelectedId(r.id)}
                                                    className={cn(
                                                        'group flex items-stretch gap-4 rounded-card border-[1.5px] p-4 text-start transition-all hover:border-coral',
                                                        sel ? 'border-coral bg-coral/[.04] shadow-mk' : 'border-black/[.06]',
                                                    )}
                                                >
                                                    <div className="relative aspect-[4/3] w-32 flex-none overflow-hidden rounded-input bg-beige">
                                                        <img src={r.image_url} alt={r.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                        {sel && (
                                                            <span className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-coral text-white shadow-mk">
                                                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 font-head text-base font-bold text-navy">
                                                                    <BedDouble className="h-4 w-4 text-coral-deep" />
                                                                    {r.title}
                                                                </div>
                                                                {r.description && <p className="mt-0.5 text-[13px] text-muted">{r.description}</p>}
                                                            </div>
                                                            <div className="text-end">
                                                                {hasSale && <div className="text-[12px] text-muted line-through">{money(r.price)} ج.م</div>}
                                                                <div className="font-head text-lg font-bold text-coral-deep">
                                                                    {money(r.effective_price)} <small className="text-[12px] font-semibold text-muted">ج.م / ليلة</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] font-semibold text-muted">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Users className="h-3.5 w-3.5" /> يتّسع لـ {r.capacity}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <BedDouble className="h-3.5 w-3.5" /> {r.units_total} غرفة متاحة
                                                            </span>
                                                            {r.includes_breakfast && (
                                                                <span className="inline-flex items-center gap-1 text-makfol">
                                                                    <Coffee className="h-3.5 w-3.5" /> شامل الإفطار
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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

                        {/* ── الصندوق الجانبي ── */}
                        <div>
                            <div className="sticky top-[92px] rounded-card border border-black/[.06] bg-white p-[22px] shadow-mk">
                                {selected && (
                                    <div className="mb-3 flex items-center gap-2 rounded-input bg-beige px-3 py-2 text-[12.5px] font-bold text-navy">
                                        <BedDouble className="h-4 w-4 text-coral-deep" />
                                        النوع المختار: <span className="text-coral-deep">{selected.title}</span>
                                    </div>
                                )}

                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="font-head text-[30px] font-bold text-coral-deep">{money(unit)}</span>
                                    <span>ج.م</span>
                                    {selected?.sale_price && selected.sale_price < selected.price && (
                                        <s className="text-base text-muted">{money(selected.price)}</s>
                                    )}
                                </div>
                                <div className="mb-[18px] text-[13px] text-muted">
                                    / الليلة {selected?.includes_breakfast && '· شامل الإفطار'}
                                </div>

                                <div className="mb-3.5 flex items-center gap-2 rounded-input bg-makfol/[.08] px-3 py-2 text-[13px] font-bold text-makfol">
                                    <Banknote className="h-4 w-4" /> ادفع في الفندق عند الوصول — من غير مقدّم
                                </div>

                                <Field label="تاريخ الوصول" className="mb-3.5">
                                    <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
                                </Field>
                                <div className="mb-3.5 grid grid-cols-2 gap-3">
                                    <Field label="عدد الليالي">
                                        <Select value={nights} onChange={(e) => setNights(+e.target.value)}>
                                            {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => <option key={n} value={n}>{n} ليالي</option>)}
                                        </Select>
                                    </Field>
                                    <Field label="عدد الغرف">
                                        <Select value={rooms} onChange={(e) => setRooms(+e.target.value)}>
                                            {Array.from({ length: unitsTotal }, (_, i) => i + 1).map((n) => (
                                                <option key={n} value={n}>{n} غرفة</option>
                                            ))}
                                        </Select>
                                    </Field>
                                </div>
                                <Field label="عدد الضيوف" className="mb-3.5">
                                    <PartySizeField
                                        value={guests}
                                        onChange={(n) => setGuests(n || 1)}
                                        singular="ضيف"
                                        plural="ضيوف"
                                        options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n} ضيوف` }))}
                                    />
                                </Field>

                                {date && rangeRemaining !== null && (
                                    soldOut ? (
                                        <div className="mb-3 flex items-center gap-1.5 rounded-input bg-danger/[.08] px-3 py-2 text-[13px] font-bold text-danger">
                                            <TriangleAlert className="h-4 w-4" /> مفيش غرف من "{selected?.title}" متاحة للتواريخ دي
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            'mb-3 flex items-center gap-1.5 rounded-input px-3 py-2 text-[13px] font-bold',
                                            notEnough ? 'bg-danger/[.08] text-danger' : 'bg-makfol/[.08] text-makfol',
                                        )}>
                                            {notEnough
                                                ? <><TriangleAlert className="h-4 w-4" /> متبقّي {rangeRemaining} غرفة بس — قلّل عدد الغرف</>
                                                : <><Check className="h-4 w-4" /> متاح · متبقّي {rangeRemaining} غرفة للتواريخ دي</>}
                                        </div>
                                    )
                                )}

                                <Separator className="my-3" />
                                <div className="mb-1.5">
                                    <div className="flex justify-between py-[9px] text-sm">
                                        <span>{money(unit)} × {nights} ليالي × {rooms} غرفة</span>
                                        <span>{money(unit * nights * rooms)} ج.م</span>
                                    </div>
                                    <div className="flex justify-between py-[9px] text-sm"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                                    <div className="mt-2 flex justify-between border-t border-black/[.06] pt-3.5 text-base font-extrabold">
                                        <span>الإجمالي</span>
                                        <b className="font-head text-xl text-coral-deep">{money(total)} ج.م</b>
                                    </div>
                                </div>

                                {canBook ? (
                                    <Button asChild size="lg" block>
                                        <Link href={checkoutUrl()}>احجز دلوقتي</Link>
                                    </Button>
                                ) : (
                                    <Button size="lg" block disabled>
                                        {!selected ? 'اختَر نوع الغرفة' : date ? 'غير متاح للتواريخ دي' : 'اختَر تاريخ الوصول'}
                                    </Button>
                                )}
                                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted">
                                    <ShieldCheck className="h-4 w-4" /> تأكيد فوري · إلغاء مجاني قبل 48 ساعة
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
