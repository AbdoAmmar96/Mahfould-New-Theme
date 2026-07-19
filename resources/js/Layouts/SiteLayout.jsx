// محفول مكفول — Layout الأساسي (هيدر + فوتر)
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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

    const [toast, setToast] = useState(null);
    useEffect(() => {
        const msg = flash?.success || flash?.error;
        if (msg) {
            setToast({ type: flash.success ? 'success' : 'error', msg });
            const t = setTimeout(() => setToast(null), 4500);
            return () => clearTimeout(t);
        }
    }, [flash]);

    return (
        <div className="mk">
            {toast && (
                <div className={`mk-toast mk-toast-${toast.type}`} role="status">
                    {toast.type === 'success' ? '✓' : '⚠️'} {toast.msg}
                </div>
            )}
            <header className="mk-header">
                <div className="mk-header-in">
                    <Link href="/" className="mk-logo"><img src="/assets/img/logo.png" alt="محفول مكفول" /></Link>
                    <nav className="mk-nav">
                        {NAV.map((n) => (
                            <Link key={n.key} href={n.href}
                                className={(active === n.key || url === n.href) ? 'is-active' : ''}>
                                {n.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="mk-header-cta">
                        {auth?.user ? (
                            <Link href="/account" className="mk-btn mk-btn-secondary">{auth.user.name}</Link>
                        ) : (
                            <>
                                <Link href="/login" className="mk-btn mk-btn-secondary">دخول</Link>
                                <Link href="/register" className="mk-btn mk-btn-primary">سجّل مجاناً</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main>{children}</main>

            <footer className="mk-footer">
                <div className="mk-wrap">
                    <div className="mk-footer-grid">
                        <div>
                            <div className="mk-footer-logo"><img src="/assets/img/logo-t.png" alt="محفول مكفول" /></div>
                            <p style={{ fontSize: '14.5px', maxWidth: '320px' }}>
                                منصة سياحة مصرية — رحلتك محفولة مكفولة، من أول ما تفكر لحد ما ترجع.
                            </p>
                        </div>
                        {Object.entries(FOOTER).map(([title, links]) => (
                            <div key={title}>
                                <h4>{title}</h4>
                                {links.map(([href, label], i) => <Link key={i} href={href}>{label}</Link>)}
                            </div>
                        ))}
                    </div>
                    <div className="mk-footer-bar">
                        <span>© {new Date().getFullYear()} محفول مكفول — كل الحقوق محفوظة</span>
                        <span>صُنع في مصر 🇪🇬</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
