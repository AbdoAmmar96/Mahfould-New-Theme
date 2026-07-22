import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { MessageCircleQuestion, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { MobileCTA, MobileStickyBar } from '@/Components/mobile/primitives';

const STATUS_VARIANT = {
    open: 'best',
    in_progress: 'vip',
    waiting_customer: 'soft',
    resolved: 'makfol',
    closed: 'soft',
};
const STATUS_ICON = {
    open: AlertCircle,
    in_progress: Clock,
    waiting_customer: MessageCircleQuestion,
    resolved: CheckCircle2,
    closed: CheckCircle2,
};

export default function Index({ tickets }) {
    return (
        <SiteLayout anim="fade">
            <Head title="الدعم الفني" />
            <section className="hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white lg:block">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> ›{' '}
                        <Link href="/account" className="hover:text-white">حسابي</Link> › الدعم الفني
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">الدعم الفني</h1>
                </div>
            </section>

            <section className="py-14">
                <div className="mx-auto w-full max-w-[900px] px-4 lg:px-5">
                    <div className="mb-4 flex items-center justify-between lg:mb-6">
                        <h2 className="font-head text-[19px] font-semibold text-navy lg:text-xl">
                            تذاكري <span className="text-sm font-normal text-muted">({tickets.total})</span>
                        </h2>
                        {/* على الموبايل الزر بيبقى تحت ثابت — هنا للويب بس */}
                        <Button asChild className="hidden lg:inline-flex">
                            <Link href="/account/support/create"><Plus className="h-4 w-4" /> فتح تذكرة جديدة</Link>
                        </Button>
                    </div>

                    {tickets.data.length === 0 ? (
                        <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-12 text-center">
                            <MessageCircleQuestion className="mx-auto h-12 w-12 text-muted" />
                            <p className="mt-3 text-muted">لسه معندكش أي تذاكر.</p>
                            <Button asChild className="mt-4">
                                <Link href="/account/support/create">افتح أول تذكرة</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.data.map((t) => {
                                const StatusIcon = STATUS_ICON[t.status] || AlertCircle;
                                return (
                                    <Link
                                        key={t.code}
                                        href={`/account/support/${t.code}`}
                                        className="block rounded-card border border-black/[.06] bg-white p-4 transition-colors hover:border-coral"
                                    >
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <b className="font-head text-navy">{t.subject}</b>
                                            <Badge variant={STATUS_VARIANT[t.status]} className="inline-flex items-center gap-1">
                                                <StatusIcon className="h-3 w-3" /> {t.status_label}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
                                            <span className="rounded-full bg-beige px-2 py-0.5 font-bold">{t.code}</span>
                                            <span>{t.category_label}</span>
                                            <span>{t.created_at}</span>
                                            {t.messages_count > 0 && <span>{t.messages_count} رد</span>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* مساحة تحت الزر الثابت */}
                    <div className="h-[86px] lg:hidden" />
                </div>
            </section>

            {/* زر «تذكرة جديدة» ثابت — موبايل */}
            <MobileStickyBar>
                <MobileCTA href="/account/support/create">
                    <Plus className="h-[18px] w-[18px]" /> فتح تذكرة جديدة
                </MobileCTA>
            </MobileStickyBar>
        </SiteLayout>
    );
}
