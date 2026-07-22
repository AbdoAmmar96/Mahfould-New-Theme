// محفول مكفول — Layout الأساسي (هيدر + فوتر) — Tailwind + Shadcn
import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Toaster, toast } from '@/Components/ui/sonner';
import MobileHeader from '@/Components/MobileHeader';
import MobileTabBar from '@/Components/MobileTabBar';
import { cn } from '@/lib/utils';

const NAV = [
    { href: '/', label: 'الرئيسية', key: 'home' },
    { href: '/tours', label: 'الرحلات', key: 'tours' },
    { href: '/hotels', label: 'الفنادق', key: 'hotels' },
    { href: '/restaurants', label: 'المطاعم', key: 'restaurants' },
    { href: '/cars', label: 'السيارات', key: 'cars' },
    { href: '/buses', label: 'الباصات', key: 'buses' },
    { href: '/delivery', label: 'التوصيل', key: 'delivery' },
    { href: '/sahb-elsaada', label: 'صاحب السعادة', key: 'sahb' },
];

const FOOTER = {
    'المنصة': [['/tours', 'الرحلات'], ['/hotels', 'الفنادق'], ['/restaurants', 'المطاعم'], ['/cars', 'السيارات'], ['/buses', 'الباصات'], ['/delivery', 'التوصيل'], ['/sahb-elsaada', 'صاحب السعادة']],
    'الشركة': [['/p/about', 'من احنا'], ['/provider/register', 'كن شريكاً (تسجيل مزوّد)'], ['/p/driver', 'انضم كسائق'], ['/p/contact', 'تواصل معانا']],
    'الدعم': [['/p/help', 'مركز المساعدة'], ['/p/refund', 'سياسة الاسترداد'], ['/p/terms', 'الشروط والأحكام'], ['/p/privacy', 'الخصوصية']],
};

// حركة الدخول لكل نوع صفحة — التفاصيل غير القوائم غير مسار الحجز
const ANIM = {
    home: 'mk-anim-home',
    list: 'mk-anim-list',
    detail: 'mk-anim-detail',
    flow: 'mk-anim-flow',
    fade: 'mk-anim-fade',
    success: 'mk-anim-success',
};

// bare = صفحات التفاصيل على الموبايل: بتستخدم آب-بار عايم فوق الصورة
// (جوّه MobileDetailShell) بدل الآب-بار الأبيض العادي.
export default function SiteLayout({ children, active = '', anim = 'fade', bare = false }) {
    const { auth, flash } = usePage().props;
    const url = usePage().url;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <div className="mk mk-app min-h-screen bg-cream font-body text-navy">
            <Toaster />

            {/* وضع الموبايل — آب-بار + هامبرجر + تبويب سفلي */}
            {!bare && <MobileHeader />}

            {/* شريط علوي — دخول الشركاء */}
            {!auth?.user && (
                <div className="hidden border-b border-black/[.06] bg-beige/40 py-1.5 text-[12.5px] text-navy/80 md:block">
                    <div className="mx-auto flex max-w-[1200px] items-center justify-end gap-3 px-5 2xl:max-w-[1600px]">
                        <Link href="/provider/register" className="font-bold hover:text-coral-deep">
                            سجّل كمقدم خدمة
                        </Link>
                        <span className="text-black/20">·</span>
                        <Link href="/vendor/login" className="font-bold hover:text-coral-deep">
                            دخول شريك
                        </Link>
                    </div>
                </div>
            )}

            <header className="sticky top-0 z-40 hidden border-b border-black/[.07] bg-white/95 backdrop-blur lg:block">
                <div className="mx-auto flex h-[74px] max-w-[1200px] items-center px-5 2xl:max-w-[1600px]">
                    <Link href="/" className="shrink-0">
                        <img src="/assets/img/logo.png" alt="محفول مكفول" className="h-9 w-auto" />
                    </Link>
                    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
                        {NAV.map((n) => {
                            const isActive = active === n.key || url === n.href;
                            return (
                                <Link
                                    key={n.key}
                                    href={n.href}
                                    className={cn(
                                        'relative rounded-input px-3 py-2 text-[15px] font-semibold transition-colors',
                                        isActive ? 'text-coral-deep' : 'text-navy/80 hover:text-coral-deep',
                                        isActive && 'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-coral after:to-coral-deep',
                                    )}
                                >
                                    {n.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="ms-auto flex items-center gap-2">
                        {auth?.user ? (
                            <Button asChild variant="secondary" size="sm"><Link href="/account">{auth.user.name}</Link></Button>
                        ) : (
                            <>
                                <Button asChild variant="secondary" size="sm"><Link href="/login">دخول</Link></Button>
                                <Button asChild size="sm"><Link href="/register">سجّل مجاناً</Link></Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* key={url} بيعيد تركيب الغلاف مع كل تنقّل عشان الحركة تشتغل من أول */}
            <main
                key={url}
                className={cn('mk-page pb-[calc(62px+env(safe-area-inset-bottom))] lg:pb-0', ANIM[anim] ?? ANIM.fade)}
            >
                {children}
            </main>

            {/* الفوتر ويب-only — على الموبايل روابطه كلها جوّه الدروار */}
            <footer className="mt-10 hidden bg-navy-deep pt-16 text-white/70 lg:block">
                <div className="mx-auto max-w-[1200px] px-5 2xl:max-w-[1600px]">
                    <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                        <div>
                            <img src="/assets/img/logo-footer.png" alt="محفول مكفول" className="mb-3.5 h-14 w-auto" />
                            <p className="max-w-[320px] text-[14.5px] leading-relaxed">
                                منصة سياحة مصرية — رحلتك محفولة مكفولة، من أول ما تفكر لحد ما ترجع.
                            </p>
                        </div>
                        {Object.entries(FOOTER).map(([title, links]) => (
                            <div key={title}>
                                <h4 className="mb-4 font-head text-[17px] text-white">{title}</h4>
                                {links.map(([href, label], i) => (
                                    <Link key={i} href={href} className="block py-1.5 text-[14.5px] transition-colors hover:text-coral">{label}</Link>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-white/10 py-5 text-[13.5px]">
                        <span>© {new Date().getFullYear()} محفول مكفول — كل الحقوق محفوظة</span>
                        <span>
                            بالشراكة مع{' '}
                            <a href="https://bp-eg.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-coral transition-colors hover:text-white">شركة شريك للأعمال</a>
                        </span>
                    </div>
                </div>
            </footer>

            <MobileTabBar />
        </div>
    );
}
