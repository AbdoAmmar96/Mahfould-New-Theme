import SiteLayout from '@/Layouts/SiteLayout';
import { Badge, Btn, SectionHead, ServiceCard, money } from '@/Components/UI';
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
const STEPS = [
    ['🔎', 'اختار خدمتك', 'رحلة، فندق، مطعم، أو عربية — كله في مكان واحد بسعر واضح.'],
    ['📝', 'احجز في دقايق', 'حدّد التاريخ والعدد، اكمل بياناتك، وخلاص.'],
    ['🛡️', 'ادفع بأمان', 'كارت، محفظة، أو عند الوصول — وتأكيد لحظي بضمان استرداد.'],
];

// بطاقة مطعم (نفس ستايل صفحة المطاعم)
function RestaurantCard({ r }) {
    return (
        <article className="mk-card">
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
                    {r.price_range && <span className="mk-chip">{r.price_range}</span>}
                </div>
                <div className="mk-card-foot" style={{ marginTop: 14 }}>
                    {r.review_score > 0
                        ? <span className="mk-rate">★ {r.review_score.toFixed(1)} ({r.review_count})</span>
                        : <span className="mk-card-meta">مطعم مميّز</span>}
                    <Link href={r.url} className="mk-btn mk-btn-primary">احجز ترابيزة</Link>
                </div>
            </div>
        </article>
    );
}

export default function Home({ locations, featured, hotels, restaurants, cars, packages, testimonials, stats }) {
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

    const NUMBERS = [
        [`+${stats.services}`, 'خدمة متاحة'],
        [stats.destinations, 'وجهة سياحية'],
        ['24/7', 'دعم مصري'],
        ['100%', 'حجز مكفول'],
    ];

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

            {/* رحلات مختارة */}
            <section className="mk-sec" style={{ paddingTop: 0 }}>
                <div className="mk-wrap">
                    <SectionHead title="عروض مكفولة النهاردة" sub="أسعار ثابتة — مفيش مفاجآت في الآخر"
                        action={<Btn href="/tours" variant="secondary">كل الرحلات ←</Btn>} />
                    <div className="mk-grid mk-grid-4">
                        {featured.map((t) => <ServiceCard key={t.id} item={t} type="tour" />)}
                    </div>
                </div>
            </section>

            {/* فنادق مختارة */}
            {hotels.length > 0 && (
                <section className="mk-sec" style={{ paddingTop: 0 }}>
                    <div className="mk-wrap">
                        <SectionHead title="فنادق ومنتجعات مختارة" sub="إقامة مكفولة بأحسن الأسعار وتأكيد لحظي"
                            action={<Btn href="/hotels" variant="secondary">كل الفنادق ←</Btn>} />
                        <div className="mk-grid mk-grid-4">
                            {hotels.map((h) => <ServiceCard key={h.id} item={h} type="hotel" unit="الليلة" />)}
                        </div>
                    </div>
                </section>
            )}

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

            {/* مطاعم */}
            {restaurants.length > 0 && (
                <section className="mk-sec">
                    <div className="mk-wrap">
                        <SectionHead title="مطاعم وكافيهات يوصّى بيها" sub="احجز ترابيزتك في أحسن الأماكن جنبك"
                            action={<Btn href="/restaurants" variant="secondary">كل المطاعم ←</Btn>} />
                        <div className="mk-grid mk-grid-3">
                            {restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* سيارات */}
            {cars.length > 0 && (
                <section className="mk-sec" style={{ paddingTop: 0 }}>
                    <div className="mk-wrap">
                        <SectionHead title="عربيات جاهزة لرحلتك" sub="تنقّل مريح — بسائق أو بدون، تسليم في مكانك"
                            action={<Btn href="/cars" variant="secondary">كل السيارات ←</Btn>} />
                        <div className="mk-grid mk-grid-4">
                            {cars.map((c) => <ServiceCard key={c.id} item={c} type="car" unit="اليوم" />)}
                        </div>
                    </div>
                </section>
            )}

            {/* إزاي بتحجز */}
            <section className="mk-sec" style={{ background: 'var(--mk-beige)' }}>
                <div className="mk-wrap">
                    <SectionHead center title="إزاي بتحجز؟" sub="3 خطوات وانت خلّصت" />
                    <div className="mk-grid mk-grid-3">
                        {STEPS.map(([ico, t, d], i) => (
                            <div key={i} className="mk-howto">
                                <div className="mk-howto-num">{i + 1}</div>
                                <div className="mk-howto-ico">{ico}</div>
                                <h3>{t}</h3>
                                <p>{d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* أرقام المنصة */}
            <section className="mk-numbers">
                <div className="mk-wrap">
                    <div className="mk-numbers-grid">
                        {NUMBERS.map(([v, l], i) => (
                            <div key={i} className="mk-number">
                                <div className="v">{v}</div>
                                <div className="l">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* آراء العملاء */}
            {testimonials.length > 0 && (
                <section className="mk-sec">
                    <div className="mk-wrap">
                        <SectionHead center title="عملاؤنا بيقولوا إيه" sub="تقييمات حقيقية من ناس جرّبت محفول مكفول" />
                        <div className="mk-grid mk-grid-3">
                            {testimonials.map((t, i) => (
                                <div key={i} className="mk-testi">
                                    <div className="mk-testi-stars">{'★'.repeat(t.rating)}<span>{'★'.repeat(5 - t.rating)}</span></div>
                                    {t.title && <h4>{t.title}</h4>}
                                    <p>{t.content}</p>
                                    <div className="mk-testi-foot">
                                        <div className="mk-avatar">{t.name.slice(0, 1)}</div>
                                        <div>
                                            <strong>{t.name}</strong>
                                            {t.service && <span>{t.service}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

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

            {/* دعوة أخيرة */}
            <section className="mk-cta">
                <div className="mk-wrap">
                    <h2>جاهز تبدأ رحلتك؟</h2>
                    <p>آلاف الخدمات المكفولة في انتظارك — احجز دلوقتي وادفع وانت مطمّن.</p>
                    <div className="mk-cta-btns">
                        <Btn href="/tours" variant="primary" lg>ابدأ الحجز</Btn>
                        <Btn href="/p/partner" variant="ghost" lg>كن شريكاً معنا</Btn>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
