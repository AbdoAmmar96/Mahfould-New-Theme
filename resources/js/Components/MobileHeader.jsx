// محفول مكفول — الآب-بار العلوي للموبايل + دروار الهامبرجر
// الصفحات الجذرية → زر هامبرجر. الصفحات الداخلية → سهم رجوع (زي الأبليكشنات).
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Menu, ArrowRight, Plane, BedDouble, UtensilsCrossed, Car, Bus, Truck, Crown,
    House, Ticket, Heart, MapPin, LifeBuoy, LogOut, Store, ChevronLeft,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/Components/ui/sheet';
import { cn } from '@/lib/utils';

const SERVICES = [
    { href: '/tours', label: 'الرحلات', icon: Plane },
    { href: '/hotels', label: 'الفنادق', icon: BedDouble },
    { href: '/restaurants', label: 'المطاعم', icon: UtensilsCrossed },
    { href: '/cars', label: 'السيارات', icon: Car },
    { href: '/buses', label: 'الباصات', icon: Bus },
    { href: '/delivery', label: 'التوصيل', icon: Truck },
    { href: '/sahb-elsaada', label: 'صاحب السعادة', icon: Crown },
];

// الصفحات اللي تعتبر «جذر» — بتاخد هامبرجر مش سهم رجوع
const ROOTS = ['/', ...SERVICES.map((s) => s.href), '/account', '/wishlist'];

const LEGAL = [
    ['/p/about', 'من احنا'],
    ['/p/help', 'مركز المساعدة'],
    ['/p/refund', 'سياسة الاسترداد'],
    ['/p/terms', 'الشروط والأحكام'],
    ['/p/privacy', 'الخصوصية'],
];

/** عنوان الصفحة الحالية للآب-بار الداخلي */
function titleFor(path) {
    const svc = SERVICES.find((s) => path.startsWith(s.href));
    if (path.startsWith('/account/addresses')) return 'عناويني';
    if (path.startsWith('/account/support')) return 'الدعم';
    if (path.startsWith('/booking') || path.startsWith('/checkout')) return 'إتمام الحجز';
    if (path.startsWith('/login')) return 'تسجيل الدخول';
    if (path.startsWith('/register')) return 'حساب جديد';
    if (path.startsWith('/provider')) return 'مقدّمي الخدمة';
    if (path.startsWith('/p/')) return 'معلومات';
    if (svc) return svc.label;
    return '';
}

function DrawerRow({ icon: Icon, label, onClick, danger = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mk-press flex min-h-[50px] w-full items-center gap-3 rounded-input px-2 text-start"
        >
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', danger ? 'bg-danger/10' : 'bg-beige')}>
                <Icon className={cn('h-[18px] w-[18px]', danger ? 'text-danger' : 'text-navy')} strokeWidth={2} />
            </span>
            <span className={cn('flex-1 text-[15px] font-bold', danger ? 'text-danger' : 'text-navy')}>{label}</span>
            {!danger && <ChevronLeft className="h-4 w-4 text-navy/25" />}
        </button>
    );
}

export default function MobileHeader() {
    const { auth } = usePage().props;
    const url = usePage().url;
    const [open, setOpen] = useState(false);

    const path = url.split('?')[0];
    const isRoot = ROOTS.includes(path);
    const title = titleFor(path);
    const authed = !!auth?.user;
    // الهوم — الآب-بار بيندمج مع بلوك البحث الـnavy تحته (زي بوكينج)
    const onNavy = path === '/';

    const go = (href) => { setOpen(false); router.visit(href); };

    return (
        <>
            <header
                className={cn(
                    'mk-appbar sticky top-0 z-40 lg:hidden',
                    onNavy
                        ? 'bg-navy'
                        : 'border-b border-black/[.06] bg-white/95 backdrop-blur-xl',
                )}
            >
                <div className="flex h-[56px] items-center gap-1.5 px-3">
                    {/* البداية (يمين في RTL) — اللوجو، أو سهم رجوع + عنوان في الصفحات الداخلية */}
                    {isRoot ? (
                        <Link href="/" className="mk-press flex h-11 items-center">
                            <img
                                src={onNavy ? '/assets/img/logo-footer.png' : '/assets/img/logo.png'}
                                alt="محفول مكفول"
                                className="h-[30px] w-auto"
                            />
                        </Link>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                aria-label="رجوع"
                                className="mk-press -ms-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                            >
                                <ArrowRight className="h-[23px] w-[23px] text-navy" strokeWidth={2.1} />
                            </button>
                            {/* مش h1 — العنوان الحقيقي للصفحة جوّه المحتوى، وعنوانين h1 بيضرّوا الـSEO */}
                            <p className="truncate font-head text-[17px] font-bold text-navy">{title}</p>
                        </>
                    )}

                    {/* النهاية (شمال في RTL) — الهامبرجر */}
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-label="القائمة"
                        className="mk-press ms-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    >
                        <Menu className={cn('h-[23px] w-[23px]', onNavy ? 'text-white' : 'text-navy')} strokeWidth={2.1} />
                    </button>
                </div>
            </header>

            {/* دروار الهامبرجر — بيفتح من اليمين (start في RTL) */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="mk mk-drawer flex w-[86%] max-w-[340px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[340px]">
                    <SheetTitle className="sr-only">القائمة</SheetTitle>

                    {/* رأس الدروار */}
                    <div className="bg-gradient-to-bl from-navy to-navy-light px-5 pb-5 pt-[calc(20px+env(safe-area-inset-top))] text-white">
                        <img src="/assets/img/logo-footer.png" alt="محفول مكفول" className="mb-3 h-11 w-auto" />
                        {authed ? (
                            <>
                                <p className="font-head text-[18px] font-bold">{auth.user.name}</p>
                                <p className="text-[13px] text-white/70">{auth.user.email ?? auth.user.phone}</p>
                            </>
                        ) : (
                            <>
                                <p className="mb-3 text-[14px] text-white/80">ادخل عشان تتابع حجوزاتك ومفضّلتك.</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => go('/login')}
                                        className="mk-press min-h-[42px] flex-1 rounded-input border border-white/30 text-[14px] font-extrabold text-white"
                                    >
                                        دخول
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => go('/register')}
                                        className="mk-press min-h-[42px] flex-1 rounded-input bg-gradient-to-l from-coral to-coral-deep text-[14px] font-extrabold text-white"
                                    >
                                        سجّل مجاناً
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex-1 px-3 py-3">
                        <DrawerRow icon={House} label="الرئيسية" onClick={() => go('/')} />

                        <p className="px-2 pb-1 pt-4 text-[12px] font-extrabold uppercase tracking-wide text-muted">الخدمات</p>
                        {SERVICES.map((s) => (
                            <DrawerRow key={s.href} icon={s.icon} label={s.label} onClick={() => go(s.href)} />
                        ))}

                        <p className="px-2 pb-1 pt-4 text-[12px] font-extrabold uppercase tracking-wide text-muted">حسابك</p>
                        <DrawerRow icon={Ticket} label="حجوزاتي" onClick={() => go(authed ? '/account' : '/login')} />
                        <DrawerRow icon={Heart} label="المفضلة" onClick={() => go(authed ? '/wishlist' : '/login')} />
                        {authed && <DrawerRow icon={MapPin} label="عناويني" onClick={() => go('/account/addresses')} />}
                        <DrawerRow icon={LifeBuoy} label="الدعم والمساعدة" onClick={() => go(authed ? '/account/support' : '/p/help')} />
                        <DrawerRow icon={Store} label="سجّل كمقدم خدمة" onClick={() => go('/provider/register')} />

                        <p className="px-2 pb-1 pt-4 text-[12px] font-extrabold uppercase tracking-wide text-muted">المنصة</p>
                        <div className="px-2">
                            {LEGAL.map(([href, label]) => (
                                <button
                                    key={href}
                                    type="button"
                                    onClick={() => go(href)}
                                    className="mk-press block min-h-[40px] w-full text-start text-[14px] font-semibold text-navy/70"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {authed && (
                            <div className="mt-3 border-t border-black/[.06] pt-2">
                                <DrawerRow
                                    icon={LogOut}
                                    label="تسجيل الخروج"
                                    danger
                                    onClick={() => { setOpen(false); router.post('/logout'); }}
                                />
                            </div>
                        )}

                        <p className="px-2 pb-[calc(12px+env(safe-area-inset-bottom))] pt-5 text-[12px] text-muted">
                            © {new Date().getFullYear()} محفول مكفول
                        </p>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
