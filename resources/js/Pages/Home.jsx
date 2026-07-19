import SiteLayout from '@/Layouts/SiteLayout';
import { Badge, Btn, Rule, SectionHead, ServiceCard, money } from '@/Components/UI';
import Modal from '@/Components/Modal';
import { TRUST } from '@/data/trust';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const TABS = [
    { icon: '🧳', label: 'رحلات', route: '/tours', ph: 'شرم الشيخ، الغردقة، سيوة…' },
    { icon: '🏨', label: 'فنادق', route: '/hotels', ph: 'مدينة أو منطقة…' },
    { icon: '🍽️', label: 'مطاعم', route: '/restaurants', ph: 'مطعم أو نوع مطبخ…' },
    { icon: '🚗', label: 'سيارات', route: '/cars', ph: 'مكان الاستلام…' },
    { icon: '👑', label: 'صاحب السعادة', route: '/sahb-elsaada', ph: 'المناسبة…' },
];
const SERVICES = [
    ['🧳', 'رحلات وبرامج', 'داخلي وخارجي بأسعار مكفولة', '/tours'],
    ['🏨', 'فنادق ومنتجعات', 'حجز فوري وتأكيد لحظي', '/hotels'],
    ['🍽️', 'مطاعم وكافيهات', 'احجز ترابيزتك جنبك دلوقتي', '/restaurants'],
    ['🚗', 'سيارات وسواقين', 'تنقّل مريح طول الرحلة', '/cars'],
];

export default function Home({ locations, featured, packages }) {
    const [tab, setTab] = useState(0);
    const [loc, setLoc] = useState('');
    const [date, setDate] = useState('');
    const [guests, setGuests] = useState('');
    const [trustOpen, setTrustOpen] = useState(null);

    const search = (e) => {
        e.preventDefault();
        const q = {};
        if (loc) q.location = loc;
        if (date) q.start_date = date;
        if (guests) q.guests = guests;
        router.get(TABS[tab].route, q);
    };

    return (
        <SiteLayout active="home">
            <Head title="رحلتك محفولة مكفولة" />

            {/* الهيرو */}
            <section className="mk-hero">
                <div className="mk-wrap">
                    <div className="mk-reveal">
                        <Badge type="makfol">✓ كل حجز مكفول 100%</Badge>
                        <h1 style={{ marginTop: 16 }}>قوللنا مزاجك…<br />واحنا نرتّبلك <span className="mk-hl">الرحلة كلها</span> من غير تعب</h1>
                        <p className="mk-hero-sub">رحلات، فنادق، مطاعم، وتجارب — كلها في مكان واحد، بسعر مضمون وضمان استرداد.</p>
                    </div>
                    <div className="mk-reveal" style={{ animationDelay: '.12s' }}>
                        <div className="mk-tabs">
                            {TABS.map((t, i) => (
                                <button key={i} type="button" className={`mk-tab ${tab === i ? 'is-active' : ''}`} onClick={() => setTab(i)}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                        <form className="mk-search" onSubmit={search}>
                            <label className="mk-field"><span className="mk-label">فين حابب تروح؟</span>
                                <input className="mk-input" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder={TABS[tab].ph} /></label>
                            <label className="mk-field"><span className="mk-label">التاريخ</span>
                                <input className="mk-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                            <label className="mk-field"><span className="mk-label">عدد الأفراد</span>
                                <select className="mk-select" value={guests} onChange={(e) => setGuests(e.target.value)}>
                                    <option value="">أي عدد</option>
                                    <option value="2">فردين</option>
                                    <option value="3">3 أفراد</option>
                                    <option value="4">عائلة (4+)</option>
                                </select></label>
                            <button type="submit" className="mk-btn mk-btn-primary mk-btn-lg">🔍 دوّر</button>
                        </form>
                    </div>
                </div>
            </section>

            {/* شريط الثقة */}
            <div className="mk-wrap">
                <div className="mk-trust mk-reveal" style={{ animationDelay: '.2s' }}>
                    {TRUST.map((t, i) => (
                        <div key={i} className="mk-trust-item" role="button" tabIndex={0}
                            onClick={() => setTrustOpen(i)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setTrustOpen(i); }}>
                            <div className="mk-trust-ico">{t.icon}</div>
                            <div><strong>{t.title}</strong><span>{t.short}</span></div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal open={trustOpen !== null} onClose={() => setTrustOpen(null)}
                icon={trustOpen !== null ? TRUST[trustOpen].icon : null}
                title={trustOpen !== null ? TRUST[trustOpen].title : ''}>
                {trustOpen !== null && TRUST[trustOpen].body}
            </Modal>

            {/* الوجهات */}
            <section className="mk-sec">
                <div className="mk-wrap">
                    <SectionHead title="وجهات تستاهل تجربتها" sub="أكتر الأماكن اللي المصريين بيحجزوها دلوقتي" />
                    <div className="mk-grid mk-grid-4">
                        {locations.map((l) => (
                            <Link key={l.slug} className="mk-dest" href={l.url}>
                                <img src={l.image_url} alt={l.name} loading="lazy" />
                                <div className="mk-dest-cap"><strong>{l.name}</strong><span>{l.tours_count} رحلة متاحة</span></div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* العروض */}
            <section className="mk-sec" style={{ paddingTop: 0 }}>
                <div className="mk-wrap">
                    <SectionHead title="عروض مكفولة النهاردة" sub="أسعار ثابتة — مفيش مفاجآت في الآخر"
                        action={<Btn href="/tours" variant="secondary">شوف الكل ←</Btn>} />
                    <div className="mk-grid mk-grid-4">
                        {featured.map((t) => <ServiceCard key={t.id} item={t} type="tour" />)}
                    </div>
                </div>
            </section>

            {/* الخدمات */}
            <section className="mk-sec" style={{ background: 'var(--mk-beige)' }}>
                <div className="mk-wrap">
                    <SectionHead center title="كل خدماتك في مكان واحد" sub="من أول التذكرة لحد آخر أكلة — احنا معاك" />
                    <div className="mk-grid mk-grid-4">
                        {SERVICES.map(([ico, t, d, href], i) => (
                            <Link key={i} className="mk-service" href={href}>
                                <div className="mk-service-ico">{ico}</div><h3>{t}</h3><p>{d}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* صاحب السعادة */}
            <section className="mk-sec">
                <div className="mk-wrap">
                    <div className="mk-panel-dark">
                        <div className="mk-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 32 }}>
                            <div style={{ maxWidth: 520 }}>
                                <Badge type="vip">👑 تجربة مميزة</Badge>
                                <h2 style={{ marginTop: 14 }}>اصنع لحظة سعادة…<br />أو سيبها علينا نرتّبها لك</h2>
                                <p className="mk-mt-0">مش لاقي هدية؟ اختار الباكدج، واحنا نظبّط كل حاجة — من الورد لحد الكاميرا.</p>
                            </div>
                            <Btn href="/sahb-elsaada" variant="ghost" lg>اطلب مفاجأة مكفولة</Btn>
                        </div>
                        <div className="mk-grid mk-grid-3">
                            {packages.map((p, i) => (
                                <Link key={i} className="mk-pkg" href="/sahb-elsaada">
                                    <h3>{p.title}</h3>
                                    <p style={{ fontSize: 14 }}>{p.short_desc}</p>
                                    <div className="mk-price">{p.price > 0 ? money(p.price) : 'حسب الطلب'} {p.price > 0 && <small style={{ color: 'rgba(255,255,255,.6)' }}>ج.م</small>}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
