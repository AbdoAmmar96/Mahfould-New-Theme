// «الرحلة بتشمل إيه» — صفحة مستقلة
import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { Check, ShieldCheck, Info, Banknote, Sparkles, CreditCard } from 'lucide-react';
import MobileSubPage from '@/Components/mobile/MobileSubPage';
import { Heading, NoteList } from '@/Components/mobile/InfoBlocks';
import { useIsMobile } from '@/lib/useIsMobile';
import { tourNav } from '@/lib/detailNav';
import { readIds } from '@/lib/pick';

export default function Included({ tour }) {
    const isMobile = useIsMobile();

    const list = (
        <div className="space-y-2.5">
            {tour.included.map((f, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 rounded-card bg-white p-3.5 shadow-[0_1px_5px_rgba(54,54,119,.06)]"
                >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-makfol/10">
                        <Check className="h-[18px] w-[18px] text-makfol" strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-navy">{f}</span>
                </div>
            ))}
        </div>
    );

    if (isMobile) {
        return (
            <SiteLayout active="tours" anim="flow">
                <Head title={`بيشمل إيه — ${tour.title}`} />

                <MobileSubPage
                    eyebrow={tour.title}
                    title="الرحلة بتشمل إيه"
                    nav={tourNav(tour.slug, 'included', {
                        included: tour.included_count,
                        activities: tour.activities_count,
                        days: tour.days_count,
                        selected: readIds(`mk:tour:${tour.slug}:activities`, 'activities').length,
                    })}
                >
                    <div className="space-y-6 px-4 pb-8">
                        <div>
                            <Heading icon={Check}>داخل في السعر</Heading>
                            {list}
                        </div>

                        <div>
                            <Heading icon={Info}>حاجات تعرفها قبل ما تحجز</Heading>
                            <NoteList
                                items={[
                                    {
                                        icon: Banknote,
                                        title: 'رسوم الخدمة',
                                        text: 'بتتضاف 200 ج.م رسوم خدمة على الحجز، وبتبان في ملخّص السعر قبل الدفع.',
                                    },
                                    {
                                        icon: Sparkles,
                                        title: 'الفعاليات الإضافية اختيارية',
                                        text: 'أي فعالية تضيفها بيبقى سعرها للفرد وبيتحسب فوق سعر الرحلة.',
                                    },
                                    {
                                        icon: CreditCard,
                                        title: 'تأكيد الحجز',
                                        text: 'هتوصلك رسالة تأكيد فيها كود الحجز أول ما الدفع يتم.',
                                    },
                                ]}
                            />
                        </div>

                        <NoteList
                            tone="makfol"
                            items={[{
                                icon: ShieldCheck,
                                title: 'كل اللي فوق داخل في السعر المعروض',
                                text: 'من غير أي رسوم مخفية — واللي مش مذكور هنا اسأل الدعم قبل الحجز.',
                            }]}
                        />
                    </div>
                </MobileSubPage>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="tours" anim="fade">
            <Head title={`بيشمل إيه — ${tour.title}`} />
            <section className="py-12">
                <div className="mx-auto w-full max-w-[760px] px-5">
                    <div className="mb-5 text-[13.5px] font-semibold text-muted">
                        <Link href="/tours" className="text-coral-deep hover:underline">الرحلات</Link> ›{' '}
                        <Link href={`/tours/${tour.slug}`} className="text-coral-deep hover:underline">{tour.title}</Link> › بيشمل إيه
                    </div>
                    <h1 className="mb-6 font-head text-[28px] font-bold text-navy">الرحلة بتشمل إيه</h1>
                    {list}
                </div>
            </section>
        </SiteLayout>
    );
}
