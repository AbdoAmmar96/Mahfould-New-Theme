import { Link, router, usePage } from '@inertiajs/react';
import { Heart, Star } from 'lucide-react';
import { Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export function money(n) {
    return new Intl.NumberFormat('en-US').format(Math.round(n));
}

// زر المفضلة (نفس منطق الويش ليست، بستايل جديد)
function FavButton({ type, id }) {
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

// بطاقة خدمة موحّدة (رحلة / فندق / سيارة)
export function ServiceCard({ item, type = 'tour', currency = 'ج.م', unit, cta }) {
    const meta = item.meta ?? `${item.location ?? ''}${item.duration_days ? ` · ${item.duration_days} أيام` : ''}`;

    return (
        <Card>
            <CardMedia>
                <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                    {item.is_guaranteed && <Badge variant="makfol">مكفول</Badge>}
                    {item.is_featured && <Badge variant="vip">VIP</Badge>}
                    {item.sale_price && <Badge variant="best">أفضل سعر</Badge>}
                </div>
                <FavButton type={type} id={item.id} />
                <Link href={item.url}>
                    <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </Link>
            </CardMedia>
            <CardBody>
                <CardTitle className="mb-1.5">
                    <Link href={item.url} className="transition-colors hover:text-coral-deep">{item.title}</Link>
                </CardTitle>
                <CardMeta className="mb-3.5">{meta}</CardMeta>
                <CardFooter>
                    <div>
                        {item.sale_price && (
                            <span className="me-1.5 text-[13px] text-muted line-through">{money(item.price)}</span>
                        )}
                        <span className="font-head text-[22px] font-bold text-coral-deep">
                            {money(item.sale_price || item.price)}{' '}
                            <small className="text-[13px] font-semibold text-muted">
                                {currency}{unit ? ` / ${unit}` : ''}
                            </small>
                        </span>
                    </div>
                    {item.review_score > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[13px] font-bold text-navy">
                            <Star className="h-3.5 w-3.5 fill-vip text-vip" /> {item.review_score.toFixed(1)}
                        </span>
                    ) : (
                        cta && (
                            <Button asChild variant="secondary" size="sm">
                                <Link href={item.url}>{cta}</Link>
                            </Button>
                        )
                    )}
                </CardFooter>
            </CardBody>
        </Card>
    );
}
