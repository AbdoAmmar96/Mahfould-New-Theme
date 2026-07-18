import SiteLayout from '@/Layouts/SiteLayout';
import { Badge } from '@/Components/UI';
import { Head, Link } from '@inertiajs/react';

export default function Index({ restaurants }) {
    return (
        <SiteLayout active="restaurants">
            <Head title="المطاعم" />
            <section className="mk-pagehead">
                <div className="mk-wrap">
                    <div className="mk-crumb"><Link href="/">الرئيسية</Link> › المطاعم</div>
                    <h1>مطاعم وكافيهات</h1>
                    <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>احجز ترابيزتك في أحسن الأماكن جنبك دلوقتي</p>
                </div>
            </section>
            <section className="mk-sec" style={{ paddingTop: 34 }}>
                <div className="mk-wrap">
                    <div className="mk-results-bar"><div className="n"><b>{restaurants.total}</b> مطعم وكافيه</div></div>
                    <div className="mk-grid mk-grid-3">
                        {restaurants.data.map((r) => (
                            <article key={r.id} className="mk-card">
                                <div className="mk-card-media">
                                    <div className="mk-card-tags">
                                        {r.instant && <Badge type="best">حجز فوري</Badge>}
                                        {r.is_guaranteed && <Badge type="makfol">مكفول</Badge>}
                                    </div>
                                    <Link href={r.url}><img src={r.image_url} alt={r.title} loading="lazy" /></Link>
                                </div>
                                <div className="mk-card-body">
                                    <h3 className="mk-card-title"><Link href={r.url}>{r.title}</Link></h3>
                                    <div className="mk-card-meta">📍 {r.address || r.location}</div>
                                    <div className="mk-rest-tags">
                                        {r.cuisines.map((c, i) => <span key={i} className="mk-chip">{c}</span>)}
                                        <span className="mk-chip">{r.price_range}</span>
                                    </div>
                                    <div className="mk-card-foot" style={{ marginTop: 14 }}>
                                        <span className="mk-rate">★ {r.review_score.toFixed(1)} ({r.review_count})</span>
                                        <Link href={r.url} className="mk-btn mk-btn-primary">احجز ترابيزة</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
