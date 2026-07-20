// محفول مكفول — Layout لوحات التحكم (أدمن + بائع)
import '../../css/admin.css'; // لازم: صفحات اللوحة (children) بتعتمد على كلاسات mkad-* (جداول/فورم/بطاقات)
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    LayoutDashboard, Plane, BedDouble, UtensilsCrossed, Car, MapPin,
    Gift, FileText, Ticket, LogOut, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Toaster, toast } from '@/Components/ui/sonner';

const NAV = {
    admin: [
        { href: '/admin', label: 'الرئيسية', Icon: LayoutDashboard, exact: true },
        { sep: true },
        { href: '/admin/tours', label: 'الرحلات', Icon: Plane },
        { href: '/admin/hotels', label: 'الفنادق', Icon: BedDouble },
        { href: '/admin/restaurants', label: 'المطاعم', Icon: UtensilsCrossed },
        { href: '/admin/cars', label: 'السيارات', Icon: Car },
        { href: '/admin/locations', label: 'الوجهات', Icon: MapPin },
        { href: '/admin/sahb', label: 'صاحب السعادة', Icon: Gift },
        { href: '/admin/pages', label: 'الصفحات', Icon: FileText },
        { sep: true },
        { href: '/admin/bookings', label: 'الحجوزات', Icon: Ticket },
        { href: '/admin/approvals', label: 'الموافقات', Icon: ShieldCheck },
    ],
    vendor: [
        { href: '/vendor', label: 'الرئيسية', Icon: LayoutDashboard, exact: true },
        { sep: true },
        { href: '/vendor/tours', label: 'رحلاتي', Icon: Plane },
        { href: '/vendor/hotels', label: 'فنادقي', Icon: BedDouble },
        { href: '/vendor/restaurants', label: 'مطاعمي', Icon: UtensilsCrossed },
        { href: '/vendor/cars', label: 'سياراتي', Icon: Car },
        { sep: true },
        { href: '/vendor/bookings', label: 'حجوزاتي', Icon: Ticket },
    ],
};

export default function AdminLayout({ title, crumb, actions, children }) {
    const page = usePage();
    const url = page.url;
    const flash = page.props.flash || {};
    const user = page.props.auth?.user;

    const panel = url.startsWith('/vendor') ? 'vendor' : 'admin';
    const brandSub = panel === 'vendor' ? 'بوابة الشركاء' : 'لوحة التحكم';

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash.success, flash.error]);

    const isActive = (item) => {
        const path = url.split('?')[0];
        return item.exact ? path === item.href : path === item.href || path.startsWith(item.href + '/');
    };

    const logout = () => router.post(`/${panel}/logout`);

    return (
        <div className="flex min-h-screen flex-col bg-cream font-body text-navy min-[860px]:flex-row-reverse">
            <Toaster />

            <aside className="flex w-full shrink-0 flex-col overflow-y-auto bg-gradient-to-br from-navy to-navy-light px-4 py-[22px] text-white min-[860px]:sticky min-[860px]:top-0 min-[860px]:h-screen min-[860px]:w-[264px]">
                <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5 font-head text-xl font-bold">
                    <img src="/assets/img/logo-t.png" alt="محفول مكفول" className="h-[38px]" />
                    <div>محفول مكفول<small className="block text-xs font-normal text-white/60">{brandSub}</small></div>
                </div>
                <nav className="mt-2 flex flex-row flex-wrap gap-[3px] min-[860px]:flex-col">
                    {NAV[panel].map((item, i) =>
                        item.sep ? <div key={i} className="mx-1.5 my-3 h-px w-full bg-white/[.12]" /> : (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex shrink-0 items-center gap-[11px] rounded-input px-[13px] py-[11px] text-[15px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white',
                                    isActive(item) && 'bg-gradient-to-br from-coral to-coral-deep text-white shadow-[0_10px_26px_rgba(234,75,59,.28)] hover:text-white',
                                )}
                            >
                                <item.Icon className="h-[18px] w-[18px] shrink-0" /> {item.label}
                            </Link>
                        )
                    )}
                </nav>
                <div className="mt-auto pt-4">
                    <div className="mx-1.5 my-3 h-px bg-white/[.12]" />
                    <div className="px-2 pb-2 text-[13px] text-white/60">{user?.name} · {user?.role === 'admin' ? 'مدير' : 'شريك'}</div>
                    <Button
                        variant="ghost"
                        block
                        onClick={logout}
                        className="border-white/20 text-white/90 hover:border-danger hover:bg-danger hover:text-white"
                    >
                        <LogOut className="h-4 w-4" /> تسجيل الخروج
                    </Button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-sandline bg-white px-7 py-4">
                    <div>
                        <h1 className="font-head text-[22px] font-bold">{title}</h1>
                        {crumb && <div className="text-[13px] text-muted">{crumb}</div>}
                    </div>
                    {actions}
                </header>
                <div className="flex-1 px-3.5 py-[18px] min-[860px]:px-7 min-[860px]:py-[26px]">{children}</div>
            </div>
        </div>
    );
}
