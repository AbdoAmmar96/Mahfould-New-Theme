import SiteLayout from '@/Layouts/SiteLayout';
import { Badge, money } from '@/Components/UI';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Show({ tour, reviews, review_type, review_id }) {
    const [guests, setGuests] = useState(2);
    const unit = tour.sale_price || tour.price;
    const fee = 200;
    const total = useMemo(() => unit * guests + fee, [unit, guests]);

    const gallery = tour.gallery.length ? tour.gallery : [
        tour.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/g${tour.id}${n}/400/400`),
    ];

    return (
        <SiteLayout active="tours">
            <Head title={tour.title} />

            <section className="mk-sec" style={{ padding: '26px 0 0' }}>
                <div className="mk-wrap">
                    <div className="mk-crumb" style={{ color: 'var(--mk-muted)', marginBottom: 14 }}>
                        <Link href="/" style={{ color: 'var(--mk-coral-deep)' }}>الرئيسية</Link> ›{' '}
                        <Link href="/tours" style={{ color: 'var(--mk-coral-deep)' }}>الرحلات</Link> › {tour.title}
                    </div>

                    <div className="mk-between" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                        <div>
                            <div className="mk-flex" style={{ gap: 8, marginBottom: 8 }}>
                                {tour.is_guaranteed && <Badge type="makfol">✓ مكفول</Badge>}
                                {tour.sale_price && <Badge type="best">أفضل سعر</Badge>}
                            </div>
                            <h1 style={{ margin: 0 }}>{tour.title}</h1>
                            <div className="mk-flex" style={{ gap: 16, marginTop: 8, color: 'var(--mk-muted)', fontWeight: 600, fontSize: 14 }}>
                                <span>📍 {tour.location}</span>
                                {tour.review_score > 0 && <span className="mk-rate">★ {tour.review_score.toFixed(1)} ({tour.review_count} تقييم)</span>}
                            </div>
                        </div>
                        <button className="mk-btn mk-btn-secondary">♡ حفظ</button>
                    </div>

                    <div className="mk-gallery">
                        <img className="big" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => <img key={i} src={g} alt="" />)}
                    </div>

                    <div className="mk-detail">
                        <div>
                            <div className="mk-detail-block">
                                <h3>عن الرحلة</h3>
                                <p style={{ color: 'var(--mk-muted)', margin: 0 }}>{tour.content}</p>
                            </div>

                            {tour.included.length > 0 && (
                                <div className="mk-detail-block">
                                    <h3>الرحلة بتشمل إيه</h3>
                                    <div className="mk-feats-grid">
                                        {tour.included.map((f, i) => <div key={i} className="mk-feat"><i>✓</i> {f}</div>)}
                                    </div>
                                </div>
                            )}

                            {tour.itinerary.length > 0 && (
                                <div className="mk-detail-block">
                                    <h3>برنامج الرحلة</h3>
                                    <div className="mk-itin">
                                        {tour.itinerary.map((d, i) => (
                                            <div key={i} className="mk-itin-item"><b>{d.title}</b><p>{d.desc}</p></div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>

                        {/* صندوق الحجز */}
                        <div>
                            <div className="mk-book">
                                <div className="mk-book-price">
                                    <span className="p">{money(unit)}</span><span>ج.م</span>
                                    {tour.sale_price && <s>{money(tour.price)}</s>}
                                </div>
                                <div className="mk-book-sub">للفرد · شامل كل الخدمات</div>

                                <label className="mk-field"><span className="mk-label">تاريخ الرحلة</span><input className="mk-input" type="date" /></label>
                                <label className="mk-field"><span className="mk-label">عدد المسافرين</span>
                                    <select className="mk-select" value={guests} onChange={(e) => setGuests(+e.target.value)}>
                                        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} فرد</option>)}
                                    </select>
                                </label>

                                <div style={{ margin: '16px 0 6px' }}>
                                    <div className="mk-summary-row"><span>{money(unit)} × {guests} فرد</span><span>{money(unit * guests)} ج.م</span></div>
                                    <div className="mk-summary-row"><span>رسوم الخدمة</span><span>{fee} ج.م</span></div>
                                    <div className="mk-summary-row total"><span>الإجمالي</span><b>{money(total)} ج.م</b></div>
                                </div>

                                <Link href={tour.checkout_url} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg">احجز دلوقتي</Link>
                                <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--mk-muted)', margin: '12px 0 0' }}>🛡️ حجز مكفول — إلغاء مجاني حتى 48 ساعة</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
