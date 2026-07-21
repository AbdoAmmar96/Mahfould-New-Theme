import { Link } from '@inertiajs/react';
import { Store, LogIn, TrendingUp, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

/**
 * بانر انضمام المزوّدين — مدخلان واضحان:
 *   • سجّل كمقدم خدمة  → /provider/register
 *   • دخول شريك        → /vendor/login
 */
export default function ProviderBanner({ className }) {
    return (
        <section className={cn('relative overflow-hidden rounded-section bg-gradient-to-br from-navy to-navy-light p-7 text-white md:p-9', className)}>
            <div className="pointer-events-none absolute -top-20 -end-16 h-[260px] w-[260px] rounded-full bg-coral opacity-25 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -start-10 h-[220px] w-[220px] rounded-full bg-royal opacity-25 blur-[90px]" />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                        <Store className="h-3.5 w-3.5" /> للشركات وأصحاب الخدمات
                    </span>

                    <h2 className="mt-3.5 font-head text-2xl font-bold leading-[1.45] md:text-3xl">
                        عندك فندق أو رحلات أو مطعم؟ <span className="bg-gradient-to-br from-coral to-coral-deep bg-clip-text text-transparent">اعرضه على محفول مكفول</span>
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                        سجّل خدمتك ووصّل لعملاء جدد كل يوم — إدارة كاملة لحجوزاتك وأرباحك من مكان واحد.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5 text-[13.5px] font-semibold text-white/85">
                        <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-coral" /> عملاء جدد باستمرار</span>
                        <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4 text-coral" /> تسويات وأرباح واضحة</span>
                        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-coral" /> حجوزات مضمونة</span>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col lg:min-w-[230px]">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/provider/register">
                            <Store className="h-[18px] w-[18px]" /> سجّل كمقدم خدمة
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="light" className="w-full">
                        <Link href="/vendor/login">
                            <LogIn className="h-[18px] w-[18px]" /> دخول شريك
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
