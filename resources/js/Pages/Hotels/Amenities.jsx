// مرافق الفندق — صفحة مستقلة
import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { Waves, UtensilsCrossed, Umbrella, Sparkles, Wifi, Car, Dumbbell, Wind, Coffee, ConciergeBell } from 'lucide-react';
import MobileSubPage from '@/Components/mobile/MobileSubPage';
import { useIsMobile } from '@/lib/useIsMobile';
import { hotelNav } from '@/lib/detailNav';
import { readId } from '@/lib/pick';

// مقسّمة لمجموعات — 8 أيقونات في شبكة واحدة كانت بتبقى كتلة مش بتتقرا
const GROUPS = [
    ['الترفيه والاستجمام', [
        [Waves, 'حمام سباحة', 'حمام سباحة خارجي بمساحات للراحة'],
        [Umbrella, 'شاطئ خاص', 'شاطئ مخصص لنزلاء الفندق'],
        [Sparkles, 'سبا وساونا', 'جلسات استرخاء ومساج بحجز مسبق'],
        [Dumbbell, 'جيم', 'صالة رياضية بأجهزة حديثة'],
    ]],
    ['الأكل والشرب', [
        [UtensilsCrossed, 'مطاعم متعددة', 'أكل شرقي وعالمي طول اليوم'],
        [Coffee, 'كافيه', 'مشروبات ساخنة وباردة على مدار اليوم'],
    ]],
    ['خدمات عامة', [
        [Wifi, 'واي فاي مجاني', 'إنترنت في الغرف وكل المناطق العامة'],
        [Car, 'موقف سيارات', 'موقف آمن داخل الفندق'],
        [Wind, 'تكييف مركزي', 'تكييف في كل الغرف والمرافق'],
        [ConciergeBell, 'خدمة الغرف', 'طلبات الغرف متاحة خلال اليوم'],
    ]],
];

export default function Amenities({ hotel }) {
    const isMobile = useIsMobile();

    const grid = (
        <div className="space-y-6">
            {GROUPS.map(([group, rows]) => (
                <div key={group}>
                    <h2 className="mb-2.5 font-head text-[16px] font-bold text-navy">{group}</h2>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {rows.map(([Icon, label, desc], i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 rounded-card bg-white p-3.5 shadow-[0_1px_5px_rgba(54,54,119,.06)]"
                            >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-beige">
                                    <Icon className="h-[19px] w-[19px] text-navy" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14.5px] font-extrabold text-navy">{label}</span>
                                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{desc}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    if (isMobile) {
        return (
            <SiteLayout active="hotels" anim="flow">
                <Head title={`المرافق — ${hotel.title}`} />

                <MobileSubPage
                    eyebrow={hotel.title}
                    title="المرافق والخدمات"
                    nav={hotelNav(hotel.slug, 'amenities', {
                        rooms: hotel.rooms_count,
                        selected: !!readId(`mk:hotel:${hotel.slug}:room`, 'room'),
                    })}
                >
                    <div className="px-4 pb-8">{grid}</div>
                </MobileSubPage>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="hotels" anim="fade">
            <Head title={`المرافق — ${hotel.title}`} />
            <section className="py-12">
                <div className="mx-auto w-full max-w-[860px] px-5">
                    <div className="mb-5 text-[13.5px] font-semibold text-muted">
                        <Link href="/hotels" className="text-coral-deep hover:underline">الفنادق</Link> ›{' '}
                        <Link href={`/hotels/${hotel.slug}`} className="text-coral-deep hover:underline">{hotel.title}</Link> › المرافق
                    </div>
                    <h1 className="mb-6 font-head text-[28px] font-bold text-navy">المرافق والخدمات</h1>
                    {grid}
                </div>
            </section>
        </SiteLayout>
    );
}
