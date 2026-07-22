// الفعاليات الاختيارية — صفحة اختيار مستقلة
//
// الاختيار بيرجع لصفحة الرحلة عن طريق الـURL (activity_ids[]) مش state في الذاكرة،
// لإن Inertia بيفكّك الكومبوننت مع كل تنقّل. كده الاختيار بيعيش مع زر الرجوع
// ومع تحديث الصفحة، وكمان الرابط بيبقى قابل للمشاركة.
import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Sparkles, Check, Users, CalendarDays, RotateCcw } from 'lucide-react';
import { money } from '@/Components/ui/service-card';
import { MobileStickyBar, MobileCTA } from '@/Components/mobile/primitives';
import MobileSubPage from '@/Components/mobile/MobileSubPage';
import { NoteList } from '@/Components/mobile/InfoBlocks';
import MkImage from '@/Components/mobile/MkImage';
import { useIsMobile } from '@/lib/useIsMobile';
import { tourNav } from '@/lib/detailNav';
import { readIds, writeIds } from '@/lib/pick';
import { cn } from '@/lib/utils';

export default function Activities({ tour, activities }) {
    const isMobile = useIsMobile();
    const KEY = `mk:tour:${tour.slug}:activities`;
    const [selected, setSelected] = useState(() => readIds(KEY, 'selected'));

    // بنكتب مع كل ضغطة — لو المستخدم راح لقسم تاني من الشريط
    // من غير ما يدوس «تأكيد» الاختيار مايضيعش.
    const toggle = (id) => setSelected((s) => {
        const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
        writeIds(KEY, next);
        return next;
    });

    const sum = activities
        .filter((a) => selected.includes(a.id))
        .reduce((t, a) => t + a.price, 0);

    /** يرجّع لصفحة الرحلة ومعاه الاختيار */
    const confirm = () => {
        router.visit(`/tours/${tour.slug}${selected.length ? `?activities=${selected.join(',')}` : ''}`);
    };

    const cards = (
        <div className="space-y-3">
            {activities.map((a) => {
                const on = selected.includes(a.id);
                return (
                    <button
                        key={a.id}
                        type="button"
                        onClick={() => toggle(a.id)}
                        aria-pressed={on}
                        className={cn(
                            'mk-press flex w-full gap-3 rounded-card border-[1.5px] bg-white p-3 text-start transition-colors',
                            on ? 'border-coral bg-coral/[.05]' : 'border-transparent shadow-[0_1px_5px_rgba(54,54,119,.06)]',
                        )}
                    >
                        <MkImage
                            src={a.image_url}
                            alt=""
                            ratio="aspect-square"
                            wrapperClassName="h-[76px] w-[76px] shrink-0 rounded-[12px]"
                        />
                        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                            <span className="text-[15px] font-extrabold leading-snug text-navy">{a.title}</span>
                            {(a.short_desc || a.description) && (
                                <span className="line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                                    {a.short_desc || a.description}
                                </span>
                            )}
                            <span className="flex items-center justify-between gap-2">
                                <span className="font-head text-[16px] font-extrabold text-coral-deep">
                                    +{money(a.price)} <span className="text-[11px] font-semibold text-muted">ج.م / للفرد</span>
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
            <SiteLayout active="tours" anim="flow">
                <Head title={`فعاليات إضافية — ${tour.title}`} />

                <MobileSubPage
                    eyebrow={tour.title}
                    title="فعاليات إضافية"
                    sub="اختار اللي يعجبك — الأسعار للفرد وبتتضاف على سعر الرحلة."
                    nav={tourNav(tour.slug, 'activities', {
                        included: tour.included_count,
                        activities: tour.activities_count,
                        days: tour.days_count,
                        selected: selected.length,
                    })}
                >
                    <div className="space-y-6 px-4">
                        {cards}

                        <NoteList
                            items={[
                                {
                                    icon: Users,
                                    title: 'السعر للفرد',
                                    text: 'سعر أي فعالية بيتضرب في عدد المسافرين وبيتضاف على إجمالي الرحلة.',
                                },
                                {
                                    icon: CalendarDays,
                                    title: 'بتتأكد مع الحجز',
                                    text: 'الفعاليات بتتحجز مع الرحلة، والمواعيد بتتحدّد حسب برنامج اليوم.',
                                },
                                {
                                    icon: RotateCcw,
                                    title: 'تقدر تغيّر رأيك',
                                    text: 'اختيارك محفوظ وإنت بتتنقّل بين الأقسام، وتقدر تعدّله قبل الدفع.',
                                },
                            ]}
                        />
                    </div>
                    <div className="h-[130px]" />
                </MobileSubPage>

                <MobileStickyBar>
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-semibold text-muted">
                                {selected.length ? `${selected.length} فعالية` : 'مفيش حاجة متحددة'}
                            </div>
                            {sum > 0 && (
                                <div className="font-head text-[19px] font-extrabold text-coral-deep">
                                    +{money(sum)} <span className="text-[11.5px] font-semibold text-muted">ج.م / للفرد</span>
                                </div>
                            )}
                        </div>
                        <div className="w-[48%] shrink-0">
                            <MobileCTA onClick={confirm}>
                                {selected.length ? 'تأكيد الاختيار' : 'تخطّي'}
                            </MobileCTA>
                        </div>
                    </div>
                </MobileStickyBar>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="tours" anim="fade">
            <Head title={`فعاليات إضافية — ${tour.title}`} />
            <section className="py-12">
                <div className="mx-auto w-full max-w-[760px] px-5">
                    <div className="mb-5 text-[13.5px] font-semibold text-muted">
                        <Link href="/tours" className="text-coral-deep hover:underline">الرحلات</Link> ›{' '}
                        <Link href={`/tours/${tour.slug}`} className="text-coral-deep hover:underline">{tour.title}</Link> › فعاليات
                    </div>
                    <h1 className="mb-2 font-head text-[28px] font-bold text-navy">فعاليات إضافية</h1>
                    <p className="mb-6 text-muted">اختار اللي يعجبك — الأسعار للفرد وبتتضاف على سعر الرحلة.</p>
                    {cards}
                    <div className="mt-6 flex items-center justify-between gap-4 rounded-card border border-black/[.06] bg-white p-4">
                        <div>
                            <div className="text-[13px] font-semibold text-muted">
                                {selected.length ? `${selected.length} فعالية متحددة` : 'مفيش حاجة متحددة'}
                            </div>
                            {sum > 0 && <b className="font-head text-xl text-coral-deep">+{money(sum)} ج.م / للفرد</b>}
                        </div>
                        <button
                            type="button"
                            onClick={confirm}
                            className="min-h-[46px] rounded-input bg-gradient-to-l from-coral to-coral-deep px-6 text-[15px] font-extrabold text-white shadow-mk"
                        >
                            {selected.length ? 'تأكيد الاختيار' : 'رجوع للرحلة'}
                        </button>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
