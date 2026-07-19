// محفول مكفول — Layout لوحات التحكم (أدمن + بائع)
import '../../css/admin.css';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const NAV = {
    admin: [
        { href: '/admin', label: 'الرئيسية', icon: '📊', exact: true },
        { sep: true },
        { href: '/admin/tours', label: 'الرحلات', icon: '🌍' },
        { href: '/admin/hotels', label: 'الفنادق', icon: '🏨' },
        { href: '/admin/restaurants', label: 'المطاعم', icon: '🍽️' },
        { href: '/admin/cars', label: 'السيارات', icon: '🚗' },
        { href: '/admin/locations', label: 'الوجهات', icon: '📍' },
        { href: '/admin/sahb', label: 'صاحب السعادة', icon: '🎁' },
        { href: '/admin/pages', label: 'الصفحات', icon: '📄' },
        { sep: true },
        { href: '/admin/bookings', label: 'الحجوزات', icon: '🎫' },
    ],
    vendor: [
        { href: '/vendor', label: 'الرئيسية', icon: '📊', exact: true },
        { sep: true },
        { href: '/vendor/tours', label: 'رحلاتي', icon: '🌍' },
        { href: '/vendor/hotels', label: 'فنادقي', icon: '🏨' },
        { href: '/vendor/restaurants', label: 'مطاعمي', icon: '🍽️' },
        { href: '/vendor/cars', label: 'سياراتي', icon: '🚗' },
        { sep: true },
        { href: '/vendor/bookings', label: 'حجوزاتي', icon: '🎫' },
    ],
};

export default function AdminLayout({ title, crumb, actions, children }) {
    const page = usePage();
    const url = page.url;
    const flash = page.props.flash || {};
    const user = page.props.auth?.user;

    const panel = url.startsWith('/vendor') ? 'vendor' : 'admin';
    const brandSub = panel === 'vendor' ? 'بوابة الشركاء' : 'لوحة التحكم';

    const [toast, setToast] = useState(null);
    useEffect(() => {
        const msg = flash.success || flash.error;
        if (msg) {
            setToast({ type: flash.success ? 'success' : 'error', msg });
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash.success, flash.error]);

    const isActive = (item) => {
        const path = url.split('?')[0];
        return item.exact ? path === item.href : path === item.href || path.startsWith(item.href + '/');
    };

    const logout = () => router.post(`/${panel}/logout`);

    return (
        <div className="mkad">
            {toast && <div className={`mkad-toast ${toast.type}`}>{toast.type === 'success' ? '✓' : '⚠️'} {toast.msg}</div>}

            <aside className="mkad-sidebar">
                <div className="mkad-brand">
                    <img src="/assets/img/logo-t.png" alt="محفول مكفول" />
                    <div>محفول مكفول<small>{brandSub}</small></div>
                </div>
                <nav className="mkad-nav">
                    {NAV[panel].map((item, i) =>
                        item.sep ? <div key={i} className="sep" /> : (
                            <Link key={item.href} href={item.href} className={isActive(item) ? 'is-active' : ''}>
                                <span className="ic">{item.icon}</span> {item.label}
                            </Link>
                        )
                    )}
                </nav>
                <div className="mkad-side-foot">
                    <div className="sep" />
                    <div className="who">{user?.name} · {user?.role === 'admin' ? 'مدير' : 'شريك'}</div>
                    <button className="mkad-iconbtn danger" style={{ width: '100%' }} onClick={logout}>تسجيل الخروج</button>
                </div>
            </aside>

            <div className="mkad-main">
                <header className="mkad-topbar">
                    <div>
                        <h1>{title}</h1>
                        {crumb && <div className="crumb">{crumb}</div>}
                    </div>
                    {actions}
                </header>
                <div className="mkad-body">{children}</div>
            </div>
        </div>
    );
}
