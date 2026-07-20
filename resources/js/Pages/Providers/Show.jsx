import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, ShieldCheck, Star, MapPin, Award, Verified, Users2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardMedia, CardBody, CardTitle, CardFooter } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
    tour: 'رحلات', hotel: 'فنادق', restaurant: 'مطاعم', car: 'عربيات', sahb: 'باقات', bus_trip: 'باصات',
};

export default function Show({ provider, stats, services, reviews }) {
    return (
        <SiteLayout>
            <Head title={provider.name} />

            {/* Header بلوجو */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-14 text-white">
                <div className="pointer-events-none absolute -end-20 -top-32 h-[360px] w-[360px] rounded-full bg-royal opacity-30 blur-[110px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="mb-3 text-[13.5px] text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> › مزوّدون › {provider.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-5">
                        <div className="grid h-24 w-24 flex-none place-items-center rounded-2xl bg-white/95 text-navy shadow-lg">
                            {provider.logo_url ? (
                                <img src={provider.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                                <Building2 className="h-10 w-10 text-coral-deep" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                <h1 className="font-head text-3xl font-bold">{provider.name}</h1>
                                {provider.is_first_party && <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> مكفول (طرف أول)</Badge>}
                                {provider.verification_status === 'verified' && <Badge variant="vip"><Verified className="h-3.5 w-3.5" /> موثّق</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[14px] text-white/85">
                                {provider.review_score > 0 && (
                                    <span className="inline-flex items-center gap-1 font-bold">
                                        <Star className="h-4 w-4 fill-vip text-vip" />
                                        {provider.review_score.toFixed(1)}
                                        <span className="opacity-70">({provider.review_count} تقييم)</span>
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1"><Users2 className="h-4 w-4" /> {stats.services_total} خدمة نشطة</span>
                                {provider.provider_type === 'company' ? 'شركة' : 'فرد'}
                                {provider.approved_at && <span>موثّق منذ {provider.approved_at}</span>}
                            </div>
                            {provider.about && <p className="mt-2 max-w-[720px] text-[14px] text-white/80">{provider.about}</p>}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    {/* توزيع التقييمات حسب النوع */}
                    {Object.keys(stats.breakdown || {}).length > 0 && (
                        <div className="mb-8 rounded-card border border-black/[.06] bg-white p-5">
                            <h3 className="mb-4 flex items-center gap-2 font-head text-lg font-semibold text-navy">
                                <Award className="h-5 w-5 text-vip" /> تقييمات موزّعة حسب نوع الخدمة
                            </h3>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {Object.entries(stats.breakdown).map(([type, row]) => (
                                    <div key={type} className="rounded-input border border-black/[.06] bg-beige/40 p-3 text-center">
                                        <div className="text-[13px] font-bold text-muted">{row.label}</div>
                                        <div className="mt-1 inline-flex items-center gap-1 font-head text-lg font-bold text-navy">
                                            <Star className="h-4 w-4 fill-vip text-vip" /> {row.avg.toFixed(1)}
                                        </div>
                                        <div className="text-[11.5px] text-muted">({row.count} تقييم)</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* خدمات المزوّد */}
                    <div className="mb-8">
                        <h3 className="mb-4 font-head text-xl font-semibold text-navy">
                            خدمات {provider.name}
                        </h3>
                        {services.length === 0 ? (
                            <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-8 text-center text-muted">
                                مفيش خدمات منشورة دلوقتي.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {services.map(s => (
                                    <Card key={`${s.type}-${s.id}`}>
                                        <CardMedia>
                                            <div className="absolute top-3 start-3 z-10 flex flex-col gap-1.5">
                                                <Badge variant="soft">{TYPE_LABELS[s.type]}</Badge>
                                                {s.is_guaranteed && <Badge variant="makfol">مكفول</Badge>}
                                            </div>
                                            {s.image_url && <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />}
                                        </CardMedia>
                                        <CardBody>
                                            <CardTitle>
                                                {s.url ? <Link href={s.url} className="hover:text-coral-deep">{s.title}</Link> : s.title}
                                            </CardTitle>
                                            <CardFooter>
                                                {s.review_score > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-[13px] font-bold text-vip">
                                                        <Star className="h-3.5 w-3.5 fill-vip text-vip" /> {s.review_score.toFixed(1)}
                                                        <span className="text-muted">({s.review_count})</span>
                                                    </span>
                                                ) : <span className="text-[12px] text-muted">لسه بدون تقييم</span>}
                                                <b className="font-head text-coral-deep">{s.price ? `${s.price} ج.م` : '—'}</b>
                                            </CardFooter>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* آخر تقييمات (مجمّعة من كل الخدمات) */}
                    <div>
                        <h3 className="mb-4 font-head text-xl font-semibold text-navy">
                            آخر التقييمات على كل خدمات {provider.name}
                        </h3>
                        {reviews.length === 0 ? (
                            <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-8 text-center text-muted">
                                مفيش تقييمات لسه.
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {reviews.map((r, i) => (
                                    <div key={i} className="rounded-card border border-black/[.06] bg-white p-4">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <b className="font-head text-navy">{r.name}</b>
                                            <span className="inline-flex items-center gap-0.5 text-[13px] font-bold text-vip">
                                                <Star className="h-3.5 w-3.5 fill-vip text-vip" /> {r.rating}
                                            </span>
                                        </div>
                                        <div className="mb-1.5 flex items-center gap-2 text-[11.5px] text-muted">
                                            <Badge variant="soft">{TYPE_LABELS[r.service_type]}</Badge>
                                            <span>{r.date}</span>
                                        </div>
                                        {r.title && <b className="mb-1 block text-sm text-navy">{r.title}</b>}
                                        {r.content && <p className="text-sm text-muted">{r.content}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
