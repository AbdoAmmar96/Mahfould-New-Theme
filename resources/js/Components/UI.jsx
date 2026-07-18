// محفول مكفول — مكتبة مكوّنات مشتركة (مبنية على design system)
import { Link, router, usePage } from '@inertiajs/react';

// زر المفضلة — toggle حقيقي للمستخدم المسجّل
export function FavButton({ type, id }) {
    const page = usePage();
    const wishlist = page.props.wishlist || [];
    const authed = !!page.props.auth?.user;
    const key = `${type}:${id}`;
    const active = wishlist.includes(key);

    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!authed) { router.visit('/login'); return; }
        router.post('/wishlist/toggle', { type, id }, { preserveScroll: true, preserveState: true });
    };

    return (
        <button className={`mk-card-fav ${active ? 'is-active' : ''}`} type="button" onClick={toggle} aria-label="حفظ">
            {active ? '♥' : '♡'}
        </button>
    );
}

export function Btn({ href, variant = 'primary', lg, block, className = '', children, ...props }) {
    const cls = `mk-btn mk-btn-${variant} ${lg ? 'mk-btn-lg' : ''} ${block ? 'mk-btn-block' : ''} ${className}`;
    if (href) return <Link href={href} className={cls} {...props}>{children}</Link>;
    return <button className={cls} {...props}>{children}</button>;
}

export function Badge({ type = 'soft', children }) {
    return <span className={`mk-badge mk-badge-${type}`}>{children}</span>;
}

export function Rule({ center }) {
    return <div className="mk-rule" style={center ? { marginInline: 'auto' } : undefined} />;
}

export function SectionHead({ title, sub, center, action }) {
    return (
        <div className={`mk-sec-head ${action ? 'mk-between' : ''} ${center ? 'mk-center' : ''}`}>
            <div>
                <Rule center={center} />
                <h2>{title}</h2>
                {sub && <p>{sub}</p>}
            </div>
            {action}
        </div>
    );
}

export function money(n) {
    return new Intl.NumberFormat('en-US').format(Math.round(n));
}

// بطاقة عرض (رحلة / فندق)
export function ServiceCard({ item, type = 'tour', currency = 'ج.م' }) {
    return (
        <article className="mk-card">
            <div className="mk-card-media">
                <div className="mk-card-tags">
                    {item.is_guaranteed && <Badge type="makfol">مكفول</Badge>}
                    {item.is_featured && <Badge type="vip">VIP</Badge>}
                    {item.sale_price && <Badge type="best">أفضل سعر</Badge>}
                </div>
                <FavButton type={type} id={item.id} />
                <Link href={item.url}><img src={item.image_url} alt={item.title} loading="lazy" /></Link>
            </div>
            <div className="mk-card-body">
                <h3 className="mk-card-title"><Link href={item.url}>{item.title}</Link></h3>
                <div className="mk-card-meta">
                    {item.location}{item.duration_days ? ` · ${item.duration_days} أيام` : ''}
                </div>
                <div className="mk-card-foot">
                    <div>
                        {item.sale_price && <span className="mk-price-was">{money(item.price)}</span>}
                        <span className="mk-price">{money(item.sale_price || item.price)} <small>{currency}</small></span>
                    </div>
                    {item.review_score > 0 && <span className="mk-rate">★ {item.review_score.toFixed(1)}</span>}
                </div>
            </div>
        </article>
    );
}

// بطاقة قائمة أفقية
export function ListingCard({ item, feats = [], currency = 'ج.م', unit = 'للفرد', cta = 'التفاصيل والحجز' }) {
    return (
        <article className="mk-lcard">
            <div className="mk-lcard-media">
                <div className="mk-lcard-tags">
                    {item.is_guaranteed && <Badge type="makfol">مكفول</Badge>}
                    {item.sale_price && <Badge type="best">أفضل سعر</Badge>}
                    {item.is_featured && !item.sale_price && <Badge type="vip">VIP</Badge>}
                </div>
                <img src={item.image_url} alt={item.title} loading="lazy" />
            </div>
            <div className="mk-lcard-body">
                <h3>{item.title}</h3>
                <div className="mk-card-meta">{item.location}{item.short_desc ? ` · ${item.short_desc}` : ''}</div>
                <div className="mk-lcard-feats">
                    {feats.map((f, i) => <span key={i}>{f}</span>)}
                    {item.review_score > 0 && <span>★ {item.review_score.toFixed(1)} ({item.review_count})</span>}
                </div>
                <div className="mk-lcard-foot">
                    <div>
                        {item.sale_price && <span className="mk-price-was">{money(item.price)}</span>}
                        <span className="mk-price">{money(item.sale_price || item.price)} <small>{currency} / {unit}</small></span>
                    </div>
                    <Link href={item.url} className="mk-btn mk-btn-primary">{cta}</Link>
                </div>
            </div>
        </article>
    );
}
