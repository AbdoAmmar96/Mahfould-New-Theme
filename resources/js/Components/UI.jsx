// محفول مكفول — مكتبة مكوّنات مشتركة (Tailwind + Shadcn)
import { Link, router, usePage } from '@inertiajs/react';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Badge as UIBadge } from '@/Components/ui/badge';
import { ServiceCard, money } from '@/Components/ui/service-card';

export { ServiceCard, money };

// زر المفضلة — toggle حقيقي للمستخدم المسجّل
export function FavButton({ type, id }) {
    const page = usePage();
    const wishlist = page.props.wishlist || [];
    const authed = !!page.props.auth?.user;
    const active = wishlist.includes(`${type}:${id}`);

    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!authed) return router.visit('/login');
        router.post('/wishlist/toggle', { type, id }, { preserveScroll: true, preserveState: true });
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="حفظ في المفضلة"
            className={cn(
                'absolute top-3 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm backdrop-blur transition hover:scale-110 hover:text-coral-deep',
                active && 'text-coral-deep',
            )}
        >
            <Heart className="h-4 w-4" fill={active ? 'currentColor' : 'none'} />
        </button>
    );
}

// زر متوافق مع الاستخدام القديم (href/variant/lg/block)
export function Btn({ href, variant = 'primary', lg, block, className = '', children, ...props }) {
    const size = lg ? 'lg' : 'default';
    if (href) {
        return (
            <Button asChild variant={variant} size={size} block={block} className={className}>
                <Link href={href} {...props}>{children}</Link>
            </Button>
        );
    }
    return <Button variant={variant} size={size} block={block} className={className} {...props}>{children}</Button>;
}

// شارة متوافقة مع الاستخدام القديم (type)
export function Badge({ type = 'soft', children }) {
    return <UIBadge variant={type}>{children}</UIBadge>;
}

export function Rule({ center }) {
    return <div className={cn('mb-3 h-1 w-12 rounded-full bg-gradient-to-br from-coral to-coral-deep', center && 'mx-auto')} />;
}

export function SectionHead({ title, sub, center, action }) {
    return (
        <div className={cn('mb-8 flex flex-wrap items-end gap-4', action && 'justify-between', center && 'flex-col items-center text-center')}>
            <div>
                <Rule center={center} />
                <h2 className="font-head text-[26px] font-bold text-navy md:text-[30px]">{title}</h2>
                {sub && <p className="mt-1.5 text-base text-muted">{sub}</p>}
            </div>
            {action}
        </div>
    );
}

// بطاقة قائمة أفقية
export function ListingCard({ item, feats = [], currency = 'ج.م', unit = 'للفرد', cta = 'التفاصيل والحجز' }) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-card border border-black/[.06] bg-white shadow-mk transition-all hover:shadow-mk-lg sm:flex-row">
            <div className="relative aspect-[4/3] overflow-hidden bg-beige sm:aspect-auto sm:w-72 sm:flex-none">
                <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                    {item.is_guaranteed && <UIBadge variant="makfol">مكفول</UIBadge>}
                    {item.is_best_value && <UIBadge variant="vip">⭐ أفضل قيمة</UIBadge>}
                    {item.sale_price && <UIBadge variant="best">أفضل سعر</UIBadge>}
                    {item.is_featured && !item.sale_price && !item.is_best_value && <UIBadge variant="vip">VIP</UIBadge>}
                </div>
                <Link href={item.url} aria-label={item.title} className="block h-full w-full">
                    <img src={item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </Link>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <h3 className="font-head text-xl font-semibold text-navy">
                    <Link href={item.url} className="transition-colors hover:text-coral-deep">{item.title}</Link>
                </h3>
                <div className="mt-1 text-[13px] font-semibold text-muted">{item.location}{item.short_desc ? ` · ${item.short_desc}` : ''}</div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                    {feats.map((f, i) => <span key={i}>{f}</span>)}
                    {item.review_score > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-navy"><Star className="h-3.5 w-3.5 fill-vip text-vip" /> {item.review_score.toFixed(1)} ({item.review_count})</span>
                    )}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                    <div>
                        {item.sale_price && <span className="me-1.5 text-[13px] text-muted line-through">{money(item.price)}</span>}
                        <span className="font-head text-[22px] font-bold text-coral-deep">
                            {money(item.sale_price || item.price)} <small className="text-[13px] font-semibold text-muted">{currency} / {unit}</small>
                        </span>
                    </div>
                    <Button asChild><Link href={item.url}>{cta}</Link></Button>
                </div>
            </div>
        </article>
    );
}
