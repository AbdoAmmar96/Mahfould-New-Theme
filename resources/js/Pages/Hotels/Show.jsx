import SiteLayout from '@/Layouts/SiteLayout';
import { Badge, money } from '@/Components/UI';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const stars = (n) => '⭐'.repeat(n);

export default function Show({ hotel, reviews, review_type, review_id }) {
    const [nights, setNights] = useState(2);
    const [date, setDate] = useState('');
    const unit = hotel.sale_price || hotel.price;
    const fee = 200;
    const total = useMemo(() => unit * nights + fee, [unit, nights]);
    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', nights);
        return `${hotel.checkout_url}?${q.toString()}`;
    };
    const gallery = hotel.gallery.length ? hotel.gallery : [
        hotel.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/hg${hotel.id}${n}/400/400`),
    ];

    return (
        <SiteLayout active="hotels">
            <Head title={hotel.title} />
            <section className="mk-sec" style={{ padding: '26px 0 0' }}>
                <div className="mk-wrap">
                    <div className="mk-crumb" style={{ color: 'var(--mk-muted)', marginBottom: 14 }}>
                        <Link href="/" style={{ color: 'var(--mk-coral-deep)' }}>الرئيسية</Link> ›{' '}
                        <Link href="/hotels" style={{ color: 'var(--mk-coral-deep)' }}>الفنادق</Link> › {hotel.title}
                    </div>
                    <div className="mk-flex" style={{ gap: 8, marginBottom: 8 }}>
                        <Badge type="makfol">✓ مكفول</Badge><span style={{ fontWeight: 700 }}>{stars(hotel.star_rating)}</span>
                    </div>
                    <h1 style={{ margin: '0 0 8px' }}>{hotel.title}</h1>
                    <div className="mk-flex" style={{ gap: 16, marginBottom: 18, color: 'var(--mk-muted)', fontWeight: 600, fontSize: 14 }}>
                        <span>📍 {hotel.location}</span>
                        {hotel.review_score > 0 && <span className="mk-rate">★ {hotel.review_score.toFixed(1)} ({hotel.review_count})</span>}
                    </div>

                    <div className="mk-gallery">
                        <img className="big" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => <img key={i} src={g} alt="" />)}
                    </div>

                    <div className="mk-detail">
                        <div>
                            <div className="mk-detail-block"><h3>عن الفندق</h3><p style={{ color: 'var(--mk-muted)', margin: 0 }}>{hotel.content}</p></div>
                            <div className="mk-detail-block">
                                <h3>المرافق</h3>
                                <div className="mk-feats-grid">
                                    {['🏊 حمام سباحة', '🍽️ مطاعم متعددة', '🏖️ شاطئ خاص', '🧖 سبا وساونا', '🛜 واي فاي مجاني', '🚗 موقف سيارات'].map((f, i) => <div key={i} className="mk-feat"><i>✓</i> {f}</div>)}
                                </div>
                            </div>
                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>
                        <div>
                            <div className="mk-book">
                                <div className="mk-book-price"><span className="p">{money(unit)}</span><span>ج.م</span>{hotel.sale_price && <s>{money(hotel.price)}</s>}</div>
                                <div className="mk-book-sub">/ الليلة · شامل الإفطار</div>
                                <label className="mk-field"><span className="mk-label">تاريخ الوصول</span>
                                    <input className="mk-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                                <label className="mk-field"><span className="mk-label">عدد الليالي</span>
                                    <select className="mk-select" value={nights} onChange={(e) => setNights(+e.target.value)}>
                                        {[1, 2, 3, 4, 5, 7].map((n) => <option key={n} value={n}>{n} ليالي</option>)}
                                    </select></label>
                                <div style={{ margin: '16px 0 6px' }}>
                                    <div className="mk-summary-row"><span>{money(unit)} × {nights}</span><span>{money(unit * nights)} ج.م</span></div>
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
