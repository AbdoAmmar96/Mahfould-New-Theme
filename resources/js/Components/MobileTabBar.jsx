// محفول مكفول — شريط التبويب السفلي (وضع الموبايل / إحساس أبليكشن)
// بيظهر تحت lg بس — الديسكتوب بيستخدم النav العلوي زي ما هو.
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    House, LayoutGrid, Heart, Ticket, User,
    Plane, BedDouble, UtensilsCrossed, Car, Bus, Truck, Crown,
    MapPin, LifeBuoy, LogOut, ChevronLeft,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import { cn } from '@/lib/utils';

// الخدمات السبعة — جوّه شيت «الخدمات» بدل ما نحشرها في التابات
const SERVICES = [
    { href: '/tours', label: 'الرحلات', icon: Plane, tone: 'text-coral-deep bg-coral/10' },
    { href: '/hotels', label: 'الفنادق', icon: BedDouble, tone: 'text-navy bg-navy/10' },
    { href: '/restaurants', label: 'المطاعم', icon: UtensilsCrossed, tone: 'text-makfol bg-makfol/10' },
    { href: '/cars', label: 'السيارات', icon: Car, tone: 'text-royal bg-royal/10' },
    { href: '/buses', label: 'الباصات', icon: Bus, tone: 'text-navy-light bg-navy-light/10' },
    { href: '/delivery', label: 'التوصيل', icon: Truck, tone: 'text-coral-deep bg-coral/10' },
    { href: '/sahb-elsaada', label: 'صاحب السعادة', icon: Crown, tone: 'text-vip bg-vip/10' },
];

const ACCOUNT_LINKS = [
    { href: '/account', label: 'حجوزاتي وبياناتي', icon: Ticket },
    { href: '/account/addresses', label: 'عناويني', icon: MapPin },
    { href: '/account/support', label: 'الدعم والمساعدة', icon: LifeBuoy },
];

const GUEST_LINKS = [
    { href: '/p/help', label: 'مركز المساعدة' },
    { href: '/p/refund', label: 'سياسة الاسترداد' },
    { href: '/p/terms', label: 'الشروط والأحكام' },
    { href: '/p/privacy', label: 'الخصوصية' },
    { href: '/provider/register', label: 'سجّل كمقدم خدمة' },
];

/** تاب واحد — الحد الأدنى للمس 44px (الارتفاع 56 والعرض 1/5 الشاشة)
 *  التاب النشط بياخد مربع مدوّر مصمت ورا الأيقونة والأيقونة بتبقى بيضا،
 *  والاسم تحته بلون الهوية — نفس أسلوب الناف-بار اللي في المرجع. */
function Tab({ icon: Icon, label, active, onClick, href }) {
    const inner = (
        <>
            <span
                className={cn(
                    'flex h-[38px] w-[46px] items-center justify-center rounded-[14px] transition-all duration-200',
                    active
                        ? 'bg-gradient-to-br from-coral to-coral-deep shadow-[0_4px_12px_rgba(245,118,78,.34)]'
                        : 'bg-transparent',
                )}
            >
                <Icon
                    className={cn('h-[21px] w-[21px] transition-colors', active ? 'text-white' : 'text-navy/40')}
                    strokeWidth={active ? 2.3 : 1.9}
                />
            </span>
            <span
                className={cn(
                    'text-[11px] leading-none transition-colors',
                    active ? 'font-extrabold text-coral-deep' : 'font-semibold text-navy/45',
                )}
            >
                {label}
            </span>
        </>
    );

    const classes = 'mk-press flex h-full min-h-[56px] flex-1 flex-col items-center justify-center gap-1 select-none';

    return href ? (
        <Link href={href} className={classes} aria-current={active ? 'page' : undefined}>{inner}</Link>
    ) : (
        <button type="button" onClick={onClick} className={classes} aria-expanded={active}>{inner}</button>
    );
}

export default function MobileTabBar() {
    const { auth } = usePage().props;
    const url = usePage().url;
    const [sheet, setSheet] = useState(null); // 'services' | 'account' | null

    const isHome = url === '/';
    const isService = SERVICES.some((s) => url.startsWith(s.href));
    const authed = !!auth?.user;

    const go = (href) => { setSheet(null); router.visit(href); };

    return (
        <>
            <nav
                data-mk-tabbar
                className="mk-tabbar fixed inset-x-0 bottom-0 z-50 flex border-t border-black/[.07] bg-white/95 backdrop-blur-xl lg:hidden"
                aria-label="التنقل الأساسي"
            >
                <Tab icon={House} label="الرئيسية" href="/" active={isHome} />
                <Tab icon={LayoutGrid} label="الخدمات" active={sheet === 'services' || isService} onClick={() => setSheet('services')} />
                <Tab icon={Heart} label="المفضلة" href={authed ? '/wishlist' : '/login'} active={url.startsWith('/wishlist')} />
                <Tab icon={Ticket} label="حجوزاتي" href={authed ? '/account' : '/login'} active={url === '/account'} />
                <Tab icon={User} label="حسابي" active={sheet === 'account'} onClick={() => setSheet('account')} />
            </nav>

            {/* شيت الخدمات — جريد زي أبليكشن */}
            <Sheet open={sheet === 'services'} onOpenChange={(o) => !o && setSheet(null)}>
                <SheetContent side="bottom" className="mk mk-sheet rounded-t-[22px] border-0 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
                    <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-navy/20" />
                    <SheetHeader className="mb-4">
                        <SheetTitle>كل الخدمات</SheetTitle>
                    </SheetHeader>
                    <div className="grid grid-cols-3 gap-3">
                        {SERVICES.map((s) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.href}
                                    type="button"
                                    onClick={() => go(s.href)}
                                    className="mk-press flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-card bg-beige/60 p-3 text-center"
                                >
                                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-full', s.tone)}>
                                        <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
                                    </span>
                                    <span className="text-[12.5px] font-bold leading-tight text-navy">{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </SheetContent>
            </Sheet>

            {/* شيت الحساب */}
            <Sheet open={sheet === 'account'} onOpenChange={(o) => !o && setSheet(null)}>
                <SheetContent side="bottom" className="mk mk-sheet rounded-t-[22px] border-0 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
                    <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-navy/20" />
                    <SheetHeader className="mb-4">
                        <SheetTitle>{authed ? auth.user.name : 'حسابك'}</SheetTitle>
                    </SheetHeader>

                    {authed ? (
                        <div className="space-y-1">
                            {ACCOUNT_LINKS.map((l) => {
                                const Icon = l.icon;
                                return (
                                    <button
                                        key={l.href}
                                        type="button"
                                        onClick={() => go(l.href)}
                                        className="mk-press flex min-h-[52px] w-full items-center gap-3 rounded-input px-2 text-start"
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-beige">
                                            <Icon className="h-[18px] w-[18px] text-navy" strokeWidth={2} />
                                        </span>
                                        <span className="flex-1 text-[15px] font-bold text-navy">{l.label}</span>
                                        <ChevronLeft className="h-4 w-4 text-navy/30" />
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => { setSheet(null); router.post('/logout'); }}
                                className="mk-press flex min-h-[52px] w-full items-center gap-3 rounded-input px-2 text-start"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/10">
                                    <LogOut className="h-[18px] w-[18px] text-danger" strokeWidth={2} />
                                </span>
                                <span className="flex-1 text-[15px] font-bold text-danger">تسجيل الخروج</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-5 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => go('/login')}
                                    className="mk-press min-h-[48px] flex-1 rounded-input border-2 border-navy/10 text-[15px] font-extrabold text-navy"
                                >
                                    دخول
                                </button>
                                <button
                                    type="button"
                                    onClick={() => go('/register')}
                                    className="mk-press min-h-[48px] flex-1 rounded-input bg-gradient-to-l from-coral to-coral-deep text-[15px] font-extrabold text-white shadow-mk"
                                >
                                    سجّل مجاناً
                                </button>
                            </div>
                            <div className="space-y-0.5 border-t border-black/[.06] pt-3">
                                {GUEST_LINKS.map((l) => (
                                    <button
                                        key={l.href}
                                        type="button"
                                        onClick={() => go(l.href)}
                                        className="mk-press flex min-h-[46px] w-full items-center justify-between rounded-input px-2 text-start text-[14.5px] font-semibold text-navy/80"
                                    >
                                        {l.label}
                                        <ChevronLeft className="h-4 w-4 text-navy/25" />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
