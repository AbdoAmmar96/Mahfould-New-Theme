import SiteLayout from '@/Layouts/SiteLayout';
import { ListingCard } from '@/Components/UI';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ cars, locations, filters }) {
    const byLoc = (slug) => router.get('/cars', { ...filters, location: slug }, { preserveState: true });
    const byTrans = (t) => router.get('/cars', { ...filters, transmission: t }, { preserveState: true });

    return (
        <SiteLayout active="cars">
            <Head title="السيارات" />
            <section className="mk-pagehead">
                <div className="mk-wrap">
                    <div className="mk-crumb"><Link href="/">الرئيسية</Link> › السيارات</div>
                    <h1>سيارات وسواقين</h1>
                    <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>تنقّل مريح طول رحلتك — بسائق أو من غير</p>
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
                                        <input type="checkbox" readOnly checked={filters.location === l.slug} /> {l.name}
                                    </label>
                                ))}
                            </div>
                            <div className="mk-filter-group">
                                <label>ناقل الحركة</label>
                                <label className="mk-check" onClick={() => byTrans('automatic')} style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" readOnly checked={filters.transmission === 'automatic'} /> أوتوماتيك</label>
                                <label className="mk-check" onClick={() => byTrans('manual')} style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" readOnly checked={filters.transmission === 'manual'} /> مانيوال</label>
                            </div>
                            {(filters.location || filters.transmission) && (
                                <Link href="/cars" className="mk-btn mk-btn-secondary mk-btn-block" style={{ marginTop: 12 }}>مسح الفلتر</Link>
                            )}
                        </aside>
                        <div>
                            <div className="mk-results-bar"><div className="n"><b>{cars.total}</b> سيارة متاحة</div></div>
                            {cars.data.map((c) => (
                                <ListingCard key={c.id} item={c} unit="اليوم"
                                    feats={[
                                        `⚙️ ${c.transmission === 'automatic' ? 'أوتوماتيك' : 'مانيوال'}`,
                                        `👥 ${c.seats} ركاب`,
                                        c.with_driver ? '👨‍✈️ مع سائق' : '🔑 بدون سائق',
                                    ]} cta="احجز السيارة" />
                            ))}
                            {cars.data.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--mk-muted)' }}>مفيش سيارات مطابقة.</div>}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
