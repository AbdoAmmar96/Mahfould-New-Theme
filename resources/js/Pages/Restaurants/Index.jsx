import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { MapPin, Star } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter } from '@/Components/ui/card';

export default function Index({ restaurants }) {
    return (
        <SiteLayout active="restaurants">
            <Head title="المطاعم" />

            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="transition-colors hover:text-white">الرئيسية</Link> › المطاعم
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">مطاعم وكافيهات</h1>
                    <p className="mt-1.5 text-white/70">احجز ترابيزتك في أحسن الأماكن جنبك دلوقتي</p>
                </div>
            </section>

            <section className="py-14 md:py-[72px]" style={{ paddingTop: 34 }}>
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5 font-bold">
                        <div><b className="text-coral-deep">{restaurants.total}</b> مطعم وكافيه</div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {restaurants.data.map((r) => (
                            <Card key={r.id}>
                                <CardMedia>
                                    <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                                        {r.instant && <Badge variant="best">حجز فوري</Badge>}
                                        {r.is_guaranteed && <Badge variant="makfol">مكفول</Badge>}
                                    </div>
                                    <Link href={r.url}>
                                        <img src={r.image_url} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </Link>
                                </CardMedia>
                                <CardBody>
                                    <CardTitle className="mb-1.5"><Link href={r.url} className="transition-colors hover:text-coral-deep">{r.title}</Link></CardTitle>
                                    <CardMeta className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.address || r.location}</CardMeta>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {r.cuisines.map((c, i) => <span key={i} className="rounded-full border border-black/[.06] bg-beige px-2.5 py-1 text-xs font-bold text-muted">{c}</span>)}
                                        <span className="rounded-full border border-black/[.06] bg-beige px-2.5 py-1 text-xs font-bold text-muted">{r.price_range}</span>
                                    </div>
                                    <CardFooter className="mt-3.5">
                                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-vip"><Star className="h-3.5 w-3.5 fill-vip text-vip" /> {r.review_score.toFixed(1)} <span className="text-muted">({r.review_count})</span></span>
                                        <Button asChild><Link href={r.url}>احجز ترابيزة</Link></Button>
                                    </CardFooter>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
