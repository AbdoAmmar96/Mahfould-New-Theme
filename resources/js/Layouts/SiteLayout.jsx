// محفول مكفول — Layout الأساسي (هيدر + فوتر) — Tailwind + Shadcn
import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Toaster, toast } from '@/Components/ui/sonner';
import { cn } from '@/lib/utils';

const NAV = [
    { href: '/', label: 'الرئيسية', key: 'home' },
    { href: '/tours', label: 'الرحلات', key: 'tours' },
    { href: '/hotels', label: 'الفنادق', key: 'hotels' },
    { href: '/restaurants', label: 'المطاعم', key: 'restaurants' },
    { href: '/cars', label: 'السيارات', key: 'cars' },
    { href: '/sahb-elsaada', label: 'صاحب السعادة', key: 'sahb' },
];

const FOOTER = {
    'المنصة': [['/tours', 'الرحلات'], ['/hotels', 'الفنادق'], ['/restaurants', 'المطاعم'], ['/cars', 'السيارات'], ['/sahb-elsaada', 'صاحب السعادة']],
    'الشركة': [['/p/about', 'من احنا'], ['/p/partner', 'كن شريكاً'], ['/p/driver', 'انضم كسائق'], ['/p/contact', 'تواصل معانا']],
    'الدعم': [['/p/help', 'مركز المساعدة'], ['/p/refund', 'سياسة الاسترداد'], ['/p/terms', 'الشروط والأحكام'], ['/p/privacy', 'الخصوصية']],
};

export default function SiteLayout({ children, active = '' }) {
    const { auth, flash } = usePage().props;
    const url = usePage().url;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <div className="mk min-h-screen bg-cream font-body text-navy">
            <Toaster />

            <header className="sticky top-0 z-40 border-b border-black/[.07] bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-[74px] max-w-[1200px] items-center px-5">
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

            <main>{children}</main>

            <footer className="mt-10 bg-navy-deep pt-16 text-white/70">
                <div className="mx-auto max-w-[1200px] px-5">
                    <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                        <div>
                            <img src="/assets/img/logo-t.png" alt="محفول مكفول" className="mb-3.5 h-10 w-auto" />
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
        </div>
    );
}
