import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link, router } from '@inertiajs/react';
import { Heart, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter } from '@/Components/ui/card';
import { MobileListCard, MobileEmpty } from '@/Components/mobile/primitives';
import { useIsMobile } from '@/lib/useIsMobile';

const typeLabel = { tour: 'رحلة', hotel: 'فندق', restaurant: 'مطعم', car: 'سيارة', sahb: 'صاحب السعادة' };

export default function Wishlist({ items }) {
    const isMobile = useIsMobile();
    const remove = (type, id, e) => {
        e.preventDefault();
        router.post('/wishlist/toggle', { type, id }, { preserveScroll: true });
    };

    if (isMobile) {
        return (
            <SiteLayout anim="fade">
                <Head title="المفضلة" />
                {items.length === 0 ? (
                    <MobileEmpty text="لسه مضفتش حاجة للمفضلة." actionLabel="اكتشف الرحلات" onAction={() => router.visit('/tours')} />
                ) : (
                    <div className="pt-1">
                        <p className="px-4 py-2.5 text-[13px] font-bold text-navy">
                            <b className="text-coral-deep">{items.length}</b> عنصر محفوظ
                        </p>
                        {items.map((it, i) => (
                            <div key={i} className="relative">
                                <MobileListCard
                                    item={it}
                                    badges={
                                        <span className="absolute start-1.5 top-1.5 rounded-full bg-navy/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                                            {typeLabel[it.type] || it.type}
                                        </span>
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={(e) => remove(it.type, it.id, e)}
                                    aria-label="إزالة من المفضلة"
                                    className="mk-press absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-coral-deep shadow-mk"
                                >
                                    <Heart className="h-[17px] w-[17px]" fill="currentColor" />
                                </button>
                            </div>
                        ))}
                        <div className="h-4" />
                    </div>
                )}
            </SiteLayout>
        );
    }

    return (
        <SiteLayout anim="fade">
            <Head title="المفضلة" />

            {/* بانر الصفحة */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="transition-colors hover:text-white">الرئيسية</Link> › <Link href="/account" className="transition-colors hover:text-white">حسابي</Link> › المفضلة
                    </div>
                    <h1 className="mt-1.5 flex items-center gap-2 font-head text-3xl font-bold text-white">المفضلة <Heart className="h-6 w-6 fill-current" /></h1>
                </div>
            </section>

            <section className="pt-[34px] pb-14 md:pb-[72px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    {items.length === 0 ? (
                        <div className="py-[60px] text-center text-muted">
                            <Heart className="mx-auto mb-3 h-12 w-12 text-coral/40" />
                            <p>لسه مضفتش حاجة للمفضلة.</p>
                            <Button asChild className="mt-3">
                                <Link href="/tours">اكتشف الرحلات <ArrowLeft className="h-4 w-4" /></Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {items.map((it, i) => (
                                <Card key={i}>
                                    <CardMedia>
                                        <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                                            <Badge variant="soft">{typeLabel[it.type] || it.type}</Badge>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => remove(it.type, it.id, e)}
                                            aria-label="إزالة"
                                            className="absolute top-3 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-coral-deep shadow-sm backdrop-blur transition hover:scale-110"
                                        >
                                            <Heart className="h-4 w-4" fill="currentColor" />
                                        </button>
                                        <Link href={it.url}>
                                            <img src={it.image_url} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        </Link>
                                    </CardMedia>
                                    <CardBody>
                                        <CardTitle className="mb-1.5"><Link href={it.url} className="transition-colors hover:text-coral-deep">{it.title}</Link></CardTitle>
                                        <CardMeta className="mb-3.5 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {it.location}</CardMeta>
                                        <CardFooter>
                                            {it.price > 0 ? (
                                                <span className="font-head text-[22px] font-bold text-coral-deep">{money(it.price)} <small className="text-[13px] font-semibold text-muted">ج.م</small></span>
                                            ) : <span />}
                                            <Button asChild variant="secondary" size="sm"><Link href={it.url}>التفاصيل</Link></Button>
                                        </CardFooter>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
