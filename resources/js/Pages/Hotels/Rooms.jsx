// أنواع الغرف — صفحة اختيار مستقلة.
// الاختيار بيتحفظ للجلسة وبيرجع لصفحة الفندق عشان يكمّل عليه الحجز.
import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Check, Users, Coffee, DoorOpen, Banknote, CalendarCheck, ShieldCheck } from 'lucide-react';
import { money } from '@/Components/ui/service-card';
import { MobileStickyBar, MobileCTA } from '@/Components/mobile/primitives';
import MobileSubPage from '@/Components/mobile/MobileSubPage';
import { NoteList } from '@/Components/mobile/InfoBlocks';
import MkImage from '@/Components/mobile/MkImage';
import { useIsMobile } from '@/lib/useIsMobile';
import { hotelNav } from '@/lib/detailNav';
import { readId, writeId } from '@/lib/pick';
import { cn } from '@/lib/utils';

export default function Rooms({ hotel, room_types = [] }) {
    const isMobile = useIsMobile();
    const KEY = `mk:hotel:${hotel.slug}:room`;
    // مفيش اختيار مسبق — العميل هو اللي يحدّد
    const [selectedId, setSelectedId] = useState(() => readId(KEY, 'room'));

    const pick = (id) => {
        const next = id === selectedId ? null : id;
        setSelectedId(next);
        writeId(KEY, next);
    };

    const selected = room_types.find((r) => r.id === selectedId) || null;

    const confirm = () => {
        router.visit(`/hotels/${hotel.slug}${selectedId ? `?room=${selectedId}` : ''}`);
    };

    const cards = (
        <div className="space-y-3">
            {room_types.map((r) => {
                const on = r.id === selectedId;
                return (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => pick(r.id)}
                        aria-pressed={on}
                        className={cn(
                            'mk-press flex w-full gap-3 rounded-card border-[1.5px] bg-white p-3 text-start transition-colors',
                            on ? 'border-coral bg-coral/[.05]' : 'border-transparent shadow-[0_1px_5px_rgba(54,54,119,.06)]',
                        )}
                    >
                        <MkImage
                            src={r.image_url}
                            alt=""
                            ratio="aspect-square"
                            wrapperClassName="h-[84px] w-[84px] shrink-0 rounded-[12px]"
                        />
                        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                            <span className="text-[15px] font-extrabold leading-snug text-navy">{r.title}</span>

                            {r.description && (
                                <span className="line-clamp-2 text-[12.5px] leading-relaxed text-muted">{r.description}</span>
                            )}

                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-muted">
                                {r.capacity > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-[13px] w-[13px]" /> حتى {r.capacity} أفراد
                                    </span>
                                )}
                                {r.includes_breakfast && (
                                    <span className="inline-flex items-center gap-1 text-makfol">
                                        <Coffee className="h-[13px] w-[13px]" /> فطار مشمول
                                    </span>
                                )}
                                {r.units_total > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <DoorOpen className="h-[13px] w-[13px]" /> {r.units_total} غرفة متاحة
                                    </span>
                                )}
                            </span>

                            <span className="flex items-center justify-between gap-2">
                                <span>
                                    {r.sale_price && <s className="me-1 text-[11.5px] text-muted">{money(r.price)}</s>}
                                    <span className="font-head text-[17px] font-extrabold text-coral-deep">
                                        {money(r.effective_price)}
                                    </span>
                                    <span className="text-[11px] font-semibold text-muted"> ج.م / الليلة</span>
                                </span>
                                <span
                                    className={cn(
                                        'grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 transition-colors',
                                        on ? 'border-coral-deep bg-coral-deep' : 'border-black/15',
                                    )}
                                >
                                    {on && <Check className="h-[15px] w-[15px] text-white" strokeWidth={3} />}
                                </span>
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );

    if (isMobile) {
        return (
            <SiteLayout active="hotels" anim="flow">
                <Head title={`الغرف — ${hotel.title}`} />

                <MobileSubPage
                    eyebrow={hotel.title}
                    title="أنواع الغرف"
                    sub="اختار نوع الغرفة الأول عشان نحسبلك السعر الصح."
                    nav={hotelNav(hotel.slug, 'rooms', { rooms: hotel.rooms_count, selected: !!selectedId })}
                >
                    <div className="space-y-6 px-4">
                        {cards}

                        <NoteList
                            items={[
                                {
                                    icon: Banknote,
                                    title: 'السعر لليلة الواحدة',
                                    text: 'الإجمالي = سعر الغرفة × عدد الليالي × عدد الغرف + رسوم الخدمة.',
                                },
                                {
                                    icon: CalendarCheck,
                                    title: 'الإتاحة بتتأكد لحظياً',
                                    text: 'بنراجع المتاح فعلياً في التواريخ اللي هتختارها قبل ما نأكّد الحجز.',
                                },
                                {
                                    icon: ShieldCheck,
                                    title: 'اختيارك محفوظ',
                                    text: 'الغرفة اللي اخترتها بتفضل معاك وإنت بتتنقّل بين أقسام الفندق.',
                                },
                            ]}
                        />
                    </div>
                    <div className="h-[130px]" />
                </MobileSubPage>

                <MobileStickyBar>
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[12.5px] font-semibold text-muted">
                                {selected ? selected.title : 'مفيش غرفة متحددة'}
                            </div>
                            {selected && (
                                <div className="font-head text-[19px] font-extrabold text-coral-deep">
                                    {money(selected.effective_price)}{' '}
                                    <span className="text-[11.5px] font-semibold text-muted">ج.م / الليلة</span>
                                </div>
                            )}
                        </div>
                        <div className="w-[48%] shrink-0">
                            <MobileCTA onClick={confirm} disabled={!selected}>
                                {selected ? 'كمّل الحجز' : 'اختار غرفة'}
                            </MobileCTA>
                        </div>
                    </div>
                </MobileStickyBar>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="hotels" anim="fade">
            <Head title={`الغرف — ${hotel.title}`} />
            <section className="py-12">
                <div className="mx-auto w-full max-w-[860px] px-5">
                    <div className="mb-5 text-[13.5px] font-semibold text-muted">
                        <Link href="/hotels" className="text-coral-deep hover:underline">الفنادق</Link> ›{' '}
                        <Link href={`/hotels/${hotel.slug}`} className="text-coral-deep hover:underline">{hotel.title}</Link> › الغرف
                    </div>
                    <h1 className="mb-6 font-head text-[28px] font-bold text-navy">أنواع الغرف</h1>
                    {cards}
                    <div className="mt-6 flex items-center justify-between gap-4 rounded-card border border-black/[.06] bg-white p-4">
                        <div className="text-[13px] font-semibold text-muted">
                            {selected ? selected.title : 'مفيش غرفة متحددة'}
                        </div>
                        <button
                            type="button"
                            onClick={confirm}
                            disabled={!selected}
                            className="min-h-[46px] rounded-input bg-gradient-to-l from-coral to-coral-deep px-6 text-[15px] font-extrabold text-white shadow-mk disabled:pointer-events-none disabled:opacity-50"
                        >
                            كمّل الحجز
                        </button>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
