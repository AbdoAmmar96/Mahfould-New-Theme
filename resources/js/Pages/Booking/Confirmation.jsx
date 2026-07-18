import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link } from '@inertiajs/react';

export default function Confirmation({ booking }) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(booking.code)}`;
    return (
        <SiteLayout>
            <Head title="تم تأكيد الحجز" />
            <section className="mk-sec" style={{ padding: '56px 0' }}>
                <div className="mk-wrap">
                    <div className="mk-confirm">
                        <div className="mk-confirm-ico mk-reveal">✓</div>
                        <h1>تم تأكيد حجزك!</h1>
                        <p className="mk-muted" style={{ fontSize: 17 }}>رحلتك محفولة مكفولة — كل التفاصيل وصلتك على الموبايل والإيميل.</p>

                        <div className="mk-ticket mk-reveal" style={{ animationDelay: '.15s' }}>
                            <div className="mk-ticket-top">
                                <div><div style={{ fontSize: 12, opacity: .7 }}>رقم الحجز</div><div className="rid">{booking.code}</div></div>
                                <span className={`mk-badge ${booking.status === 'confirmed' ? 'mk-badge-makfol' : 'mk-badge-soft'}`}>{booking.status_label}</span>
                            </div>
                            <div className="mk-ticket-body">
                                <div className="mk-ticket-rows">
                                    <div className="mk-ticket-row"><span>الباقة</span><b>{booking.title}</b></div>
                                    {booking.location && <div className="mk-ticket-row"><span>الوجهة</span><b>{booking.location}</b></div>}
                                    {booking.start_date && <div className="mk-ticket-row"><span>الموعد</span><b>{booking.start_date}</b></div>}
                                    <div className="mk-ticket-row"><span>المسافرون</span><b>{booking.guests} فرد</b></div>
                                    <div className="mk-ticket-row"><span>الإجمالي</span><b style={{ color: 'var(--mk-coral-deep)' }}>{money(booking.total)} ج.م</b></div>
                                </div>
                                <img className="mk-qr" src={qr} alt="QR" />
                            </div>
                        </div>

                        <div className="mk-flex" style={{ justifyContent: 'center', gap: 12, marginTop: 26 }}>
                            <Link href="/account" className="mk-btn mk-btn-primary">عرض حجوزاتي</Link>
                            <Link href="/" className="mk-btn mk-btn-secondary">الرئيسية</Link>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
