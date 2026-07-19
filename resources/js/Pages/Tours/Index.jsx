import SiteLayout from '@/Layouts/SiteLayout';
import { ListingCard } from '@/Components/UI';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ tours, locations, filters }) {
    const [sort, setSort] = useState(filters.sort || '');
    const [price, setPrice] = useState(filters.max_price || 15000);
    const changeSort = (v) => { setSort(v); router.get('/tours', { ...filters, sort: v }, { preserveState: true, replace: true }); };
    const byLoc = (slug) => router.get('/tours', { ...filters, location: slug }, { preserveState: true });
    const applyPrice = (v) => router.get('/tours', { ...filters, max_price: v }, { preserveState: true, replace: true });

    return (
        <SiteLayout active="tours">
            <Head title="الرحلات" />

            <section className="mk-pagehead">
                <div className="mk-wrap">
                    <div className="mk-crumb"><Link href="/">الرئيسية</Link> › الرحلات</div>
                    <h1>رحلات وبرامج سياحية</h1>
                    <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>كل الرحلات مكفولة — سعر متّفق عليه وضمان استرداد</p>
                </div>
            </section>

            <section className="mk-sec" style={{ paddingTop: 34 }}>
                <div className="mk-wrap">
                    <div className="mk-listing">
                        {/* الفلتر */}
                        <aside className="mk-filter">
                            <h4>فلترة النتائج</h4>
                            <div className="mk-filter-group">
                                <label>الوجهة</label>
                                {locations.map((l) => (
                                    <label key={l.slug} className="mk-check" onClick={() => byLoc(l.slug)} style={{ cursor: 'pointer' }}>
                                        <input type="checkbox" readOnly checked={filters.location === l.slug} /> {l.name} <span className="c">{l.count}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mk-filter-group">
                                <label>أقصى سعر: <b>{Number(price).toLocaleString('en-US')}</b> ج.م</label>
                                <input type="range" className="mk-range" min="1000" max="15000" step="500"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    onMouseUp={(e) => applyPrice(e.target.value)}
                                    onTouchEnd={(e) => applyPrice(e.target.value)} />
                            </div>
                            {(filters.location || filters.max_price) && (
                                <Link href="/tours" className="mk-btn mk-btn-secondary mk-btn-block" style={{ marginTop: 12 }}>مسح الفلتر</Link>
                            )}
                        </aside>

                        {/* النتائج */}
                        <div>
                            <div className="mk-results-bar">
                                <div className="n"><b>{tours.total}</b> رحلة متاحة</div>
                                <select className="mk-select" style={{ width: 'auto' }} value={sort} onChange={(e) => changeSort(e.target.value)}>
                                    <option value="">الأنسب</option>
                                    <option value="price_asc">الأرخص سعراً</option>
                                    <option value="rating">الأعلى تقييماً</option>
                                </select>
                            </div>

                            {tours.data.map((t) => (
                                <ListingCard key={t.id} item={t}
                                    feats={[`📅 ${t.duration_days} أيام`, '🏨 إقامة مميزة', '✈️ شامل الانتقالات']} />
                            ))}

                            {tours.data.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--mk-muted)' }}>مفيش رحلات مطابقة — جرّب تغيّر الفلتر.</div>
                            )}

                            {/* Pagination */}
                            {tours.links && tours.last_page > 1 && (
                                <div className="mk-flex" style={{ justifyContent: 'center', gap: 8, marginTop: 32 }}>
                                    {tours.links.map((lnk, i) => (
                                        <Link key={i} href={lnk.url || '#'}
                                            className={`mk-btn ${lnk.active ? 'mk-btn-primary' : 'mk-btn-secondary'}`}
                                            style={{ minWidth: 42, padding: '11px 14px', opacity: lnk.url ? 1 : .5 }}
                                            dangerouslySetInnerHTML={{ __html: lnk.label }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
