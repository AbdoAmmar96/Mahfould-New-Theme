import SiteLayout from '@/Layouts/SiteLayout';
import { Badge } from '@/Components/UI';
import Reviews from '@/Components/Reviews';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ restaurant, reviews, review_type, review_id }) {
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('20:00');
    const gallery = restaurant.gallery.length ? restaurant.gallery : [
        restaurant.image_url, ...[2, 3, 4, 5].map((n) => `https://picsum.photos/seed/rg${restaurant.id}${n}/400/400`),
    ];
    const checkoutUrl = () => {
        const q = new URLSearchParams();
        if (date) q.set('start_date', date);
        q.set('guests', guests);
        q.set('slot', time);
        return `${restaurant.checkout_url}?${q.toString()}`;
    };

    return (
        <SiteLayout active="restaurants">
            <Head title={restaurant.title} />
            <section className="mk-sec" style={{ padding: '26px 0 0' }}>
                <div className="mk-wrap">
                    <div className="mk-crumb" style={{ color: 'var(--mk-muted)', marginBottom: 14 }}>
                        <Link href="/" style={{ color: 'var(--mk-coral-deep)' }}>الرئيسية</Link> ›{' '}
                        <Link href="/restaurants" style={{ color: 'var(--mk-coral-deep)' }}>المطاعم</Link> › {restaurant.title}
                    </div>
                    <h1 style={{ margin: '0 0 8px' }}>{restaurant.title}</h1>
                    <div className="mk-rest-tags" style={{ marginBottom: 8 }}>
                        {restaurant.cuisines.map((c, i) => <span key={i} className="mk-chip">{c}</span>)}
                        <span className="mk-chip">{restaurant.price_range}</span>
                    </div>
                    <div className="mk-flex" style={{ gap: 16, marginBottom: 18, color: 'var(--mk-muted)', fontWeight: 600, fontSize: 14 }}>
                        <span>📍 {restaurant.address}</span>
                        {restaurant.review_score > 0 && <span className="mk-rate">★ {restaurant.review_score.toFixed(1)}</span>}
                    </div>

                    <div className="mk-gallery">
                        <img className="big" src={gallery[0]} alt="" />
                        {gallery.slice(1, 5).map((g, i) => <img key={i} src={g} alt="" />)}
                    </div>

                    <div className="mk-detail">
                        <div>
                            <div className="mk-detail-block"><h3>عن المكان</h3><p style={{ color: 'var(--mk-muted)', margin: 0 }}>{restaurant.content}</p></div>
                            <Reviews reviews={reviews} type={review_type} id={review_id} />
                        </div>
                        <div>
                            <div className="mk-book">
                                <h3 style={{ fontFamily: 'var(--mk-font-head)', margin: '0 0 14px' }}>احجز ترابيزة</h3>
                                <label className="mk-field"><span className="mk-label">التاريخ</span>
                                    <input className="mk-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                                <label className="mk-field"><span className="mk-label">الوقت</span>
                                    <select className="mk-select" value={time} onChange={(e) => setTime(e.target.value)}>
                                        <option value="19:00">7:00 مساءً</option>
                                        <option value="20:00">8:00 مساءً</option>
                                        <option value="21:00">9:00 مساءً</option>
                                    </select></label>
                                <label className="mk-field"><span className="mk-label">عدد الأشخاص</span>
                                    <select className="mk-select" value={guests} onChange={(e) => setGuests(+e.target.value)}>
                                        {[2, 3, 4, 5, 6, 8].map((n) => <option key={n} value={n}>{n} أشخاص</option>)}
                                    </select></label>
                                <Badge type="makfol">✓ حجز فوري ومؤكّد</Badge>
                                <Link href={checkoutUrl()} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg" style={{ marginTop: 14 }}>احجز الترابيزة</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
