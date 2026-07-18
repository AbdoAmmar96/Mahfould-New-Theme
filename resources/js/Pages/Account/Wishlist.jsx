import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link, router } from '@inertiajs/react';

const typeLabel = { tour: 'رحلة', hotel: 'فندق', restaurant: 'مطعم', car: 'سيارة', sahb: 'صاحب السعادة' };

export default function Wishlist({ items }) {
    const remove = (type, id, e) => {
        e.preventDefault();
        router.post('/wishlist/toggle', { type, id }, { preserveScroll: true });
    };

    return (
        <SiteLayout>
            <Head title="المفضلة" />
            <section className="mk-pagehead">
                <div className="mk-wrap"><div className="mk-crumb"><Link href="/">الرئيسية</Link> › <Link href="/account">حسابي</Link> › المفضلة</div><h1>المفضلة ♥</h1></div>
            </section>

            <section className="mk-sec" style={{ paddingTop: 34 }}>
                <div className="mk-wrap">
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mk-muted)' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🤍</div>
                            <p>لسه مضفتش حاجة للمفضلة.</p>
                            <Link href="/tours" className="mk-btn mk-btn-primary" style={{ marginTop: 8 }}>اكتشف الرحلات ←</Link>
                        </div>
                    ) : (
                        <div className="mk-grid mk-grid-4">
                            {items.map((it, i) => (
                                <article key={i} className="mk-card">
                                    <div className="mk-card-media">
                                        <div className="mk-card-tags"><span className="mk-badge mk-badge-soft">{typeLabel[it.type] || it.type}</span></div>
                                        <button className="mk-card-fav is-active" type="button" onClick={(e) => remove(it.type, it.id, e)} aria-label="إزالة">♥</button>
                                        <Link href={it.url}><img src={it.image_url} alt={it.title} loading="lazy" /></Link>
                                    </div>
                                    <div className="mk-card-body">
                                        <h3 className="mk-card-title"><Link href={it.url}>{it.title}</Link></h3>
                                        <div className="mk-card-meta">{it.location}</div>
                                        <div className="mk-card-foot">
                                            {it.price > 0 && <span className="mk-price">{money(it.price)} <small>ج.م</small></span>}
                                            <Link href={it.url} className="mk-btn mk-btn-secondary">التفاصيل</Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
