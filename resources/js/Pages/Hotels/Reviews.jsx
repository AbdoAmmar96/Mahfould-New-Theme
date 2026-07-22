// تقييمات الفندق — صفحة مستقلة
import SiteLayout from '@/Layouts/SiteLayout';
import ReviewsBlock from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, MessageSquare, LifeBuoy } from 'lucide-react';
import MobileSubPage from '@/Components/mobile/MobileSubPage';
import ReviewSummary from '@/Components/mobile/ReviewSummary';
import { NoteList } from '@/Components/mobile/InfoBlocks';
import { useIsMobile } from '@/lib/useIsMobile';
import { hotelNav } from '@/lib/detailNav';
import { readId } from '@/lib/pick';

export default function Reviews({ hotel, reviews, review_type, review_id }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <SiteLayout active="hotels" anim="flow">
                <Head title={`تقييمات — ${hotel.title}`} />

                <MobileSubPage
                    eyebrow={hotel.title}
                    title="التقييمات"
                    nav={hotelNav(hotel.slug, 'reviews', {
                        rooms: hotel.rooms_count,
                        selected: !!readId(`mk:hotel:${hotel.slug}:room`, 'room'),
                    })}
                >
                    <ReviewSummary
                        score={hotel.review_score}
                        count={hotel.review_count}
                        reviews={reviews}
                        noun="نزيل"
                    />
                    <div className="space-y-6 px-4 pb-8 pt-5">
                        <ReviewsBlock reviews={reviews} type={review_type} id={review_id} />

                        <NoteList
                            items={[
                                {
                                    icon: BadgeCheck,
                                    title: 'تقييمات من نزلاء حقيقيين',
                                    text: 'مش بنقبل تقييم غير من حد حجز وأقام في الفندق فعلاً.',
                                },
                                {
                                    icon: MessageSquare,
                                    title: 'رأيك بيفرق',
                                    text: 'لو أقمت هنا، اكتب تجربتك — بتساعد اللي بعدك يقرر.',
                                },
                                {
                                    icon: LifeBuoy,
                                    title: 'في مشكلة في إقامتك؟',
                                    text: 'كلّم الدعم على طول — بنتدخّل مع الفندق بدل ما تستنى.',
                                },
                            ]}
                        />
                    </div>
                </MobileSubPage>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="hotels" anim="fade">
            <Head title={`تقييمات — ${hotel.title}`} />
            <section className="py-12">
                <div className="mx-auto w-full max-w-[860px] px-5">
                    <div className="mb-5 text-[13.5px] font-semibold text-muted">
                        <Link href="/hotels" className="text-coral-deep hover:underline">الفنادق</Link> ›{' '}
                        <Link href={`/hotels/${hotel.slug}`} className="text-coral-deep hover:underline">{hotel.title}</Link> › التقييمات
                    </div>
                    <h1 className="mb-6 font-head text-[28px] font-bold text-navy">التقييمات</h1>
                    <ReviewsBlock reviews={reviews} type={review_type} id={review_id} />
                </div>
            </section>
        </SiteLayout>
    );
}
