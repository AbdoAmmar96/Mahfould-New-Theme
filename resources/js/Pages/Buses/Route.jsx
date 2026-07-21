import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { Bus, MapPin, Clock, Users, ShieldCheck, ArrowLeft, CircleDot } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { money } from '@/Components/ui/service-card';
import { cn } from '@/lib/utils';

const Wrap = ({ className, children }) => (
    <div className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</div>
);

const duration = (m) => {
    if (!m) return null;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return h ? `${h} ساعة${mm ? ` و${mm} د` : ''}` : `${mm} دقيقة`;
};

/** صفحة الخط: محطاته بالترتيب + رحلاته القادمة (BusController@route) */
export default function Route({ route }) {
    const stations = [...(route.stations || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const trips = route.trips || [];

    return (
        <SiteLayout active="buses">
            <Head title={route.name || 'خط الباص'} />

            {/* ترويسة الخط */}
            <section className="bg-gradient-to-br from-navy to-navy-light py-10 text-white">
                <Wrap>
                    <div className="mb-3.5 text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="text-white/90">الرئيسية</Link> ›{' '}
                        <Link href="/buses" className="text-white/90">الباصات</Link> › {route.name}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/10">
                            <Bus className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="font-head text-3xl font-bold">{route.name}</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-4 w-4" /> {route.from} ← {route.to}
                                </span>
                                {route.duration_minutes && (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-4 w-4" /> {duration(route.duration_minutes)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {route.provider && (
                            <div className="ms-auto flex items-center gap-2.5 rounded-input bg-white/10 px-3.5 py-2">
                                {route.provider.logo_url && (
                                    <img src={route.provider.logo_url} alt={route.provider.name} className="h-8 w-8 rounded-lg bg-white object-contain" />
                                )}
                                <div className="text-[13px]">
                                    <b className="block font-bold">{route.provider.name}</b>
                                    {route.provider.verified && (
                                        <span className="inline-flex items-center gap-1 text-white/75">
                                            <ShieldCheck className="h-3.5 w-3.5" /> مزوّد موثّق
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Wrap>
            </section>

            <Wrap className="py-8">
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[340px_1fr]">
                    {/* المحطات */}
                    <div className="rounded-card border border-black/[.06] bg-white p-6 shadow-mk">
                        <h2 className="mb-4 font-head text-[19px] font-semibold text-navy">محطات الخط</h2>

                        {stations.length === 0 ? (
                            <p className="text-sm text-muted">لسه مافيش محطات مسجّلة للخط ده.</p>
                        ) : (
                            <ol className="relative space-y-0">
                                {stations.map((s, i) => (
                                    <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
                                        {i < stations.length - 1 && (
                                            <span className="absolute start-[7px] top-5 h-full w-0.5 bg-sandline" />
                                        )}
                                        <CircleDot className="relative z-10 mt-1 h-4 w-4 flex-none text-coral" />
                                        <div>
                                            <b className="block text-[14.5px] font-extrabold text-navy">{s.name}</b>
                                            <span className="text-[12.5px] text-muted">
                                                {s.city}
                                                {s.zone_number != null && ` · المنطقة ${s.zone_number}`}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* الرحلات القادمة */}
                    <div>
                        <h2 className="mb-4 font-head text-[19px] font-semibold text-navy">
                            الرحلات القادمة {trips.length > 0 && <span className="text-muted">({trips.length})</span>}
                        </h2>

                        {trips.length === 0 ? (
                            <div className="rounded-card border border-black/[.06] bg-white p-8 text-center">
                                <Bus className="mx-auto mb-3 h-10 w-10 text-muted/60" />
                                <b className="mb-1 block font-head text-lg text-navy">مافيش رحلات متاحة دلوقتي</b>
                                <p className="mb-5 text-sm text-muted">جرّب تشوف باقي الخطوط أو ارجع تاني قريب.</p>
                                <Button asChild variant="secondary">
                                    <Link href="/buses"><ArrowLeft className="h-4 w-4" /> كل الرحلات</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {trips.map((t) => {
                                    const soldOut = t.seats_remaining <= 0;
                                    return (
                                        <div key={t.id} className="flex flex-wrap items-center gap-4 rounded-card border border-black/[.06] bg-white p-5 shadow-mk">
                                            <div className="min-w-[150px]">
                                                <div className="font-head text-lg font-bold text-navy">{t.departs_at}</div>
                                                <span className="text-[12.5px] text-muted">موعد القيام</span>
                                            </div>

                                            <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted">
                                                <Users className="h-4 w-4" />
                                                {soldOut ? (
                                                    <span className="font-bold text-danger">مكتمل العدد</span>
                                                ) : (
                                                    <>متبقّي {t.seats_remaining} من {t.seats_total} مقعد</>
                                                )}
                                            </div>

                                            <div className="ms-auto flex items-center gap-4">
                                                <div className="text-end">
                                                    <span className="font-head text-[22px] font-bold text-coral-deep">{money(t.price)}</span>
                                                    <span className="text-sm text-muted"> ج.م</span>
                                                </div>
                                                {soldOut ? (
                                                    <Button disabled>مكتمل</Button>
                                                ) : (
                                                    <Button asChild>
                                                        <Link href={t.checkout_url}>احجز</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5">
                            <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> مقاعد مضمونة — الحجز مؤكّد فورًا</Badge>
                        </div>
                    </div>
                </div>
            </Wrap>
        </SiteLayout>
    );
}
