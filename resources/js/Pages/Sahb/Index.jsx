import SiteLayout from '@/Layouts/SiteLayout';
import { Badge, money } from '@/Components/UI';
import { Head, Link } from '@inertiajs/react';

const badgeType = (b) => b === 'VIP' ? 'vip' : b === 'مكفول' ? 'makfol' : 'royal';

export default function Index({ packages }) {
    return (
        <SiteLayout active="sahb">
            <Head title="صاحب السعادة" />
            <section className="mk-pagehead" style={{ background: 'var(--mk-grad-royal)' }}>
                <div className="mk-wrap">
                    <div className="mk-crumb"><Link href="/">الرئيسية</Link> › صاحب السعادة</div>
                    <span className="mk-badge mk-badge-vip">👑 تجربة مميزة</span>
                    <h1 style={{ marginTop: 12 }}>اصنع لحظة سعادة… أو سيبها علينا نرتّبها لك</h1>
                    <p style={{ color: 'rgba(255,255,255,.78)', margin: 0, maxWidth: 560 }}>
                        مش لاقي هدية أو مناسبة تفاجئ بيها حد بتحبه؟ اختار الباكدج، واحنا نظبّط كل حاجة — مكان، تزيين، كيك، ورد، وتصوير.
                    </p>
                </div>
            </section>

            <section className="mk-sec">
                <div className="mk-wrap">
                    <div className="mk-grid mk-grid-3">
                        {packages.map((p) => (
                            <article key={p.id} className="mk-card">
                                <div className="mk-card-media">
                                    {p.badge && <div className="mk-card-tags"><Badge type={badgeType(p.badge)}>{p.badge}</Badge></div>}
                                    <img src={p.image_url} alt={p.title} loading="lazy" />
                                </div>
                                <div className="mk-card-body">
                                    <h3 className="mk-card-title">{p.title}</h3>
                                    <p className="mk-muted" style={{ fontSize: 14, margin: '0 0 14px' }}>{p.short_desc}</p>
                                    <div className="mk-card-foot">
                                        <span className="mk-price">{p.price > 0 ? `${p.price_from ? 'من ' : ''}${money(p.price)}` : 'حسب الطلب'} {p.price > 0 && <small>ج.م</small>}</span>
                                        <Link href={p.checkout_url} className="mk-btn mk-btn-primary">اطلب</Link>
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
