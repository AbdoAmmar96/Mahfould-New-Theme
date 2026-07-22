import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { Crown } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardMedia, CardBody, CardTitle, CardFooter } from '@/Components/ui/card';
import { money } from '@/Components/ui/service-card';
import { MobileCTA } from '@/Components/mobile/primitives';
import { useIsMobile } from '@/lib/useIsMobile';

const badgeType = (b) => b === 'VIP' ? 'vip' : b === 'مكفول' ? 'makfol' : 'royal';

export default function Index({ packages }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <SiteLayout active="sahb" anim="list">
                <Head title="صاحب السعادة" />

                <div className="bg-gradient-to-br from-[#2A2450] to-royal px-4 pb-5 pt-4 text-white">
                    <Badge variant="vip"><Crown className="h-3 w-3" /> تجربة مميزة</Badge>
                    <h1 className="mt-2.5 font-head text-[20px] font-bold leading-snug text-white">
                        اصنع لحظة سعادة… أو سيبها علينا
                    </h1>
                    <p className="mt-1.5 text-[13.5px] text-white/75">
                        اختار الباكدج واحنا نظبّط كل حاجة — مكان، تزيين، كيك، ورد، وتصوير.
                    </p>
                </div>

                <div className="space-y-3 p-4">
                    {packages.map((p) => (
                        <div key={p.id} className="overflow-hidden rounded-card bg-white shadow-mk">
                            <div className="relative aspect-[16/9] bg-beige">
                                <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                                {p.badge && (
                                    <span className="absolute start-2.5 top-2.5">
                                        <Badge variant={badgeType(p.badge)}>{p.badge}</Badge>
                                    </span>
                                )}
                            </div>
                            <div className="p-3.5">
                                <h3 className="text-[15.5px] font-extrabold text-navy">{p.title}</h3>
                                <p className="mt-1 text-[13px] text-muted">{p.short_desc}</p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <span className="font-head text-[19px] font-extrabold text-coral-deep">
                                        {p.price > 0 ? `${p.price_from ? 'من ' : ''}${money(p.price)}` : 'حسب الطلب'}
                                        {p.price > 0 && <small className="text-[12px] font-semibold text-muted"> ج.م</small>}
                                    </span>
                                    <div className="w-[42%]">
                                        <MobileCTA href={p.checkout_url}>اطلب</MobileCTA>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout active="sahb" anim="list">
            <Head title="صاحب السعادة" />

            {/* بانر الصفحة */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#2A2450] to-royal py-12 text-white">
                <div className="pointer-events-none absolute -top-28 -end-20 h-[340px] w-[340px] rounded-full bg-vip opacity-30 blur-[110px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="transition-colors hover:text-white">الرئيسية</Link> › صاحب السعادة
                    </div>
                    <div className="mt-3">
                        <Badge variant="vip"><Crown className="h-3.5 w-3.5" /> تجربة مميزة</Badge>
                    </div>
                    <h1 className="mt-3 font-head text-3xl font-bold text-white">اصنع لحظة سعادة… أو سيبها علينا نرتّبها لك</h1>
                    <p className="mt-1.5 max-w-[560px] text-white/[.78]">
                        مش لاقي هدية أو مناسبة تفاجئ بيها حد بتحبه؟ اختار الباكدج، واحنا نظبّط كل حاجة — مكان، تزيين، كيك، ورد، وتصوير.
                    </p>
                </div>
            </section>

            <section className="py-14 md:py-[72px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {packages.map((p) => (
                            <Card key={p.id}>
                                <CardMedia>
                                    {p.badge && (
                                        <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                                            <Badge variant={badgeType(p.badge)}>{p.badge}</Badge>
                                        </div>
                                    )}
                                    <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </CardMedia>
                                <CardBody>
                                    <CardTitle className="mb-1.5">{p.title}</CardTitle>
                                    <p className="mb-3.5 text-sm text-muted">{p.short_desc}</p>
                                    <CardFooter>
                                        <span className="font-head text-[22px] font-bold text-coral-deep">
                                            {p.price > 0 ? `${p.price_from ? 'من ' : ''}${money(p.price)}` : 'حسب الطلب'}{' '}
                                            {p.price > 0 && <small className="text-[13px] font-semibold text-muted">ج.م</small>}
                                        </span>
                                        <Button asChild size="sm"><Link href={p.checkout_url}>اطلب</Link></Button>
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
