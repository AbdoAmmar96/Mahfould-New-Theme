import SiteLayout from '@/Layouts/SiteLayout';
import { Badge, money } from '@/Components/UI';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Show({ car, reviews, review_type, review_id }) {
    const [days, setDays] = useState(3);
    const [date, setDate] = useState('');
    const unit = car.sale_price || car.price;
    const fee = 200;
    const total = useMemo(() => unit * days + fee, [unit, days]);
    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', days);
        return `${car.checkout_url}?${q.toString()}`;
    };
    const gallery = car.gallery.length ? car.gallery : [
        car.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/cg${car.id}${n}/400/400`),
    ];

    return (
        <SiteLayout active="cars">
            <Head title={car.title} />
            <section className="mk-sec" style={{ padding: '26px 0 0' }}>
                <div className="mk-wrap">
                    <div className="mk-crumb" style={{ color: 'var(--mk-muted)', marginBottom: 14 }}>
                        <Link href="/" style={{ color: 'var(--mk-coral-deep)' }}>الرئيسية</Link> ›{' '}
                        <Link href="/cars" style={{ color: 'var(--mk-coral-deep)' }}>السيارات</Link> › {car.title}
                    </div>
                    <div className="mk-flex" style={{ gap: 8, marginBottom: 8 }}>
                        {car.is_guaranteed && <Badge type="makfol">✓ مكفول</Badge>}
                        {car.with_driver && <Badge type="royal">مع سائق</Badge>}
                    </div>
                    <h1 style={{ margin: '0 0 8px' }}>{car.title}</h1>
                    <div className="mk-flex" style={{ gap: 16, marginBottom: 18, color: 'var(--mk-muted)', fontWeight: 600, fontSize: 14 }}>
                        <span>📍 {car.location}</span>
                        {car.review_score > 0 && <span className="mk-rate">★ {car.review_score.toFixed(1)} ({car.review_count})</span>}
                    </div>

                    <div className="mk-gallery">
                        <img className="big" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => <img key={i} src={g} alt="" />)}
                    </div>

                    <div className="mk-detail">
                        <div>
                            <div className="mk-detail-block"><h3>عن السيارة</h3><p style={{ color: 'var(--mk-muted)', margin: 0 }}>{car.content}</p></div>
                            <div className="mk-detail-block">
                                <h3>المواصفات</h3>
                                <div className="mk-feats-grid">
                                    <div className="mk-feat"><i>⚙️</i> {car.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال'}</div>
                                    <div className="mk-feat"><i>👥</i> {car.seats} ركاب</div>
                                    <div className="mk-feat"><i>{car.with_driver ? '👨‍✈️' : '🔑'}</i> {car.with_driver ? 'مع سائق' : 'بدون سائق'}</div>
                                    <div className="mk-feat"><i>⛽</i> بنزين</div>
                                    <div className="mk-feat"><i>❄️</i> تكييف</div>
                                    <div className="mk-feat"><i>🧳</i> شنطة كبيرة</div>
                                </div>
                            </div>
                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>
                        <div>
                            <div className="mk-book">
                                <div className="mk-book-price"><span className="p">{money(unit)}</span><span>ج.م</span>{car.sale_price && <s>{money(car.price)}</s>}</div>
                                <div className="mk-book-sub">/ اليوم{car.with_driver ? ' · شامل السائق' : ''}</div>
                                <label className="mk-field"><span className="mk-label">تاريخ الاستلام</span>
                                    <input className="mk-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                                <label className="mk-field"><span className="mk-label">عدد الأيام</span>
                                    <select className="mk-select" value={days} onChange={(e) => setDays(+e.target.value)}>
                                        {[1, 2, 3, 5, 7, 14].map((n) => <option key={n} value={n}>{n} أيام</option>)}
                                    </select></label>
                                <div style={{ margin: '16px 0 6px' }}>
                                    <div className="mk-summary-row"><span>{money(unit)} × {days}</span><span>{money(unit * days)} ج.م</span></div>
                                    <div className="mk-summary-row"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                                    <div className="mk-summary-row total"><span>الإجمالي</span><b>{money(total)} ج.م</b></div>
                                </div>
                                <Link href={checkoutUrl()} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg">احجز دلوقتي</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
