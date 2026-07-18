import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link, usePage, router } from '@inertiajs/react';

export default function Dashboard({ bookings, stats }) {
    const { auth } = usePage().props;
    const logout = (e) => { e.preventDefault(); router.post('/logout'); };

    return (
        <SiteLayout>
            <Head title="حسابي" />
            <section className="mk-pagehead">
                <div className="mk-wrap"><div className="mk-crumb"><Link href="/">الرئيسية</Link> › حسابي</div><h1>حسابي</h1></div>
            </section>

            <section className="mk-sec" style={{ paddingTop: 34 }}>
                <div className="mk-wrap">
                    <div className="mk-dash">
                        <aside className="mk-dash-side">
                            <div className="mk-dash-user">
                                <div className="mk-avatar">{auth.user.initials}</div>
                                <div><b style={{ fontFamily: 'var(--mk-font-head)' }}>{auth.user.name}</b><div style={{ fontSize: '12.5px', color: 'var(--mk-muted)' }}>عضو ⭐</div></div>
                            </div>
                            <nav className="mk-dash-nav">
                                <a href="#" className="is-active">🗂️ حجوزاتي</a>
                                <Link href="/wishlist">♥ المفضلة</Link>
                                <a href="/sahb-elsaada">👑 صاحب السعادة</a>
                                <a href="#">⚙️ الإعدادات</a>
                                <a href="#" onClick={logout} style={{ color: 'var(--mk-danger)' }}>🚪 خروج</a>
                            </nav>
                        </aside>

                        <div>
                            <div className="mk-stat">
                                <div className="mk-stat-card"><div className="v">{stats.total}</div><div className="l">رحلة محجوزة</div></div>
                                <div className="mk-stat-card"><div className="v">{stats.upcoming}</div><div className="l">رحلة قادمة</div></div>
                                <div className="mk-stat-card"><div className="v">{money(stats.spent)}</div><div className="l">ج.م إجمالي الإنفاق</div></div>
                            </div>

                            <div className="mk-between" style={{ marginBottom: 16 }}>
                                <h3 style={{ fontFamily: 'var(--mk-font-head)', margin: 0 }}>رحلاتك</h3>
                                <Link href="/tours" className="mk-btn mk-btn-secondary">احجز جديد +</Link>
                            </div>

                            {bookings.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 50, color: 'var(--mk-muted)' }}>
                                    لسه محجزتش أي رحلة. <Link href="/tours" style={{ color: 'var(--mk-coral-deep)', fontWeight: 700 }}>ابدأ دلوقتي ←</Link>
                                </div>
                            )}

                            {bookings.map((b) => (
                                <div key={b.code} className="mk-booking-row">
                                    <img src={b.image_url} alt="" />
                                    <div>
                                        <h4>{b.title}</h4>
                                        <div className="meta">{b.start_date ? `📅 ${b.start_date} · ` : ''}{b.guests} فرد · {b.code}</div>
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <span className={`mk-status ${b.status === 'confirmed' ? 'ok' : 'wait'}`}>{b.status_label}</span>
                                        <div style={{ fontWeight: 800, color: 'var(--mk-coral-deep)', marginTop: 6 }}>{money(b.total)} ج.م</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
