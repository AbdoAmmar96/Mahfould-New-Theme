import SiteLayout from '@/Layouts/SiteLayout';
import { ListingCard } from '@/Components/UI';
import { Head, Link, router } from '@inertiajs/react';

const stars = (n) => '⭐'.repeat(n);

export default function Index({ hotels, locations, filters }) {
    const byLoc = (slug) => router.get('/hotels', { location: slug }, { preserveState: true });
    return (
        <SiteLayout active="hotels">
            <Head title="الفنادق" />
            <section className="mk-pagehead">
                <div className="mk-wrap">
                    <div className="mk-crumb"><Link href="/">الرئيسية</Link> › الفنادق</div>
                    <h1>فنادق ومنتجعات</h1>
                    <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>حجز فوري وتأكيد لحظي — بأفضل الأسعار المكفولة</p>
                </div>
            </section>
            <section className="mk-sec" style={{ paddingTop: 34 }}>
                <div className="mk-wrap">
                    <div className="mk-listing">
                        <aside className="mk-filter">
                            <h4>فلترة النتائج</h4>
                            <div className="mk-filter-group">
                                <label>المدينة</label>
                                {locations.map((l) => (
                                    <label key={l.slug} className="mk-check" onClick={() => byLoc(l.slug)} style={{ cursor: 'pointer' }}>
                                        <input type="checkbox" readOnly checked={filters.location === l.slug} /> {l.name} <span className="c">{l.count}</span>
                                    </label>
                                ))}
                            </div>
                            {filters.location && <Link href="/hotels" className="mk-btn mk-btn-secondary mk-btn-block" style={{ marginTop: 12 }}>مسح الفلتر</Link>}
                        </aside>
                        <div>
                            <div className="mk-results-bar"><div className="n"><b>{hotels.total}</b> فندق متاح</div></div>
                            {hotels.data.map((h) => (
                                <ListingCard key={h.id} item={h} unit="الليلة"
                                    feats={[stars(h.star_rating), '🏊 حمام سباحة', '🍽️ All Inclusive']} />
                            ))}
                            {hotels.data.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--mk-muted)' }}>مفيش فنادق مطابقة.</div>}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
