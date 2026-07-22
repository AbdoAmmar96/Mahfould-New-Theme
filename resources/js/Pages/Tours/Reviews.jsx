// تقييمات الرحلة — صفحة مستقلة
import SiteLayout from '@/Layouts/SiteLayout';
import ReviewsBlock from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, MessageSquare, LifeBuoy } from 'lucide-react';
import MobileSubPage from '@/Components/mobile/MobileSubPage';
import ReviewSummary from '@/Components/mobile/ReviewSummary';
import { NoteList } from '@/Components/mobile/InfoBlocks';
import { useIsMobile } from '@/lib/useIsMobile';
import { tourNav } from '@/lib/detailNav';
import { readIds } from '@/lib/pick';

export default function Reviews({ tour, reviews, review_type, review_id }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <SiteLayout active="tours" anim="flow">
                <Head title={`تقييمات — ${tour.title}`} />

                <MobileSubPage
                    eyebrow={tour.title}
                    title="التقييمات"
                    nav={tourNav(tour.slug, 'reviews', {
                        included: tour.included_count,
                        activities: tour.activities_count,
                        days: tour.days_count,
                        selected: readIds(`mk:tour:${tour.slug}:activities`, 'activities').length,
                    })}
                >
                    <ReviewSummary
                        score={tour.review_score}
                        count={tour.review_count}
                        reviews={reviews}
                        noun="مسافر"
                    />
                    <div className="space-y-6 px-4 pb-8 pt-5">
                        <ReviewsBlock reviews={reviews} type={review_type} id={review_id} />

                        <NoteList
                            items={[
                                {
                                    icon: BadgeCheck,
                                    title: 'تقييمات من مسافرين حقيقيين',
                                    text: 'مش بنقبل تقييم غير من حد حجز الرحلة فعلاً وسافر.',
                                },
                                {
                                    icon: MessageSquare,
                                    title: 'رأيك بيفرق',
                                    text: 'لو سافرت معانا، اكتب تجربتك — بتساعد اللي بعدك يقرر.',
                                },
                                {
                                    icon: LifeBuoy,
                                    title: 'في مشكلة في رحلتك؟',
                                    text: 'كلّم الدعم بدل ما تستنى — بنحاول نحلّها وإنت لسه في الرحلة.',
                                },
                            ]}
                        />
                    </div>
                </MobileSubPage>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="tours" anim="fade">
            <Head title={`تقييمات — ${tour.title}`} />
            <section className="py-12">
                <div className="mx-auto w-full max-w-[860px] px-5">
                    <div className="mb-5 text-[13.5px] font-semibold text-muted">
                        <Link href="/tours" className="text-coral-deep hover:underline">الرحلات</Link> ›{' '}
                        <Link href={`/tours/${tour.slug}`} className="text-coral-deep hover:underline">{tour.title}</Link> › التقييمات
                    </div>
                    <h1 className="mb-6 font-head text-[28px] font-bold text-navy">التقييمات</h1>
                    <ReviewsBlock reviews={reviews} type={review_type} id={review_id} />
                </div>
            </section>
        </SiteLayout>
    );
}
