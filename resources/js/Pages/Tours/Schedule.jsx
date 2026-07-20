import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Users, MapPin, ShieldCheck, Download, Printer, ArrowLeft, Check, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { money } from '@/Components/ui/service-card';

export default function Schedule({ tour }) {
    // تحميل PDF = فتح صفحة الطباعة مع autoprint
    const downloadPdf = () => {
        const url = `${tour.print_url}?autoprint=1`;
        window.open(url, '_blank');
    };
    const printOnly = () => window.open(tour.print_url, '_blank');

    return (
        <SiteLayout>
            <Head title={`برنامج ${tour.title}`} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-14 text-white">
                <div className="pointer-events-none absolute -bottom-40 -start-24 h-[400px] w-[400px] rounded-full bg-coral opacity-30 blur-[110px]" />
                <div className="relative z-[1] mx-auto max-w-[1200px] px-5 2xl:max-w-[1600px]">
                    <div className="mb-3 text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> ›{' '}
                        <Link href="/tours" className="hover:text-white">الرحلات</Link> ›{' '}
                        <Link href={`/tours/${tour.slug}`} className="hover:text-white">{tour.title}</Link> ›
                        {' '}البرنامج
                    </div>

                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> برنامج مكفول</Badge>
                            <h1 className="mt-3 font-head text-3xl font-bold md:text-4xl">{tour.title}</h1>
                            <div className="mt-3 flex flex-wrap gap-3 text-[14px] text-white/85">
                                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {tour.location}</span>
                                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {tour.duration_days} أيام</span>
                                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> حتى {tour.max_people} فرد</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={downloadPdf} variant="secondary" className="bg-white text-navy hover:bg-white/90">
                                <Download className="h-4 w-4" /> تحميل PDF
                            </Button>
                            <Button onClick={printOnly} variant="ghost" className="border-white/25 text-white hover:bg-white/10">
                                <Printer className="h-4 w-4" /> طباعة
                            </Button>
                            <Button asChild>
                                <Link href={tour.checkout_url}>احجز دلوقتي <ArrowLeft className="h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10">
                <div className="mx-auto grid max-w-[1200px] gap-8 px-5 lg:grid-cols-[1fr_320px] 2xl:max-w-[1600px]">
                    <div>
                        {/* Included list */}
                        {tour.included.length > 0 && (
                            <div className="mb-6 rounded-card border border-black/[.06] bg-white p-6">
                                <h2 className="mb-4 flex items-center gap-2 font-head text-xl font-bold text-navy">
                                    <ShieldCheck className="h-5 w-5 text-makfol" /> الرحلة شاملة
                                </h2>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {tour.included.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 rounded-input bg-beige/40 p-2.5 text-sm font-semibold text-navy">
                                            <Check className="h-4 w-4 flex-none text-makfol" /> {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day-by-day timeline */}
                        {tour.itineraries.length > 0 && (
                            <div className="mb-6 rounded-card border border-black/[.06] bg-white p-6">
                                <h2 className="mb-6 flex items-center gap-2 font-head text-xl font-bold text-navy">
                                    <Calendar className="h-5 w-5 text-coral-deep" /> البرنامج اليومي
                                </h2>

                                <div className="relative ps-9">
                                    <div className="absolute inset-y-1 start-4 w-0.5 bg-gradient-to-b from-coral via-coral-deep to-royal" />

                                    {tour.itineraries.map((d, i) => (
                                        <div key={i} className="relative mb-6 last:mb-0">
                                            <span className="absolute -start-9 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-coral to-coral-deep text-sm font-extrabold text-white shadow-[0_0_0_4px_#fff,0_0_0_5px_rgba(0,0,0,.06)]">
                                                {d.day}
                                            </span>

                                            <div className="rounded-card border-[1.5px] border-black/[.08] bg-white p-5 transition-colors hover:border-coral">
                                                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-coral/[.08] px-3 py-0.5 text-[11.5px] font-bold text-coral-deep">
                                                    <Clock className="h-3 w-3" /> اليوم {d.day}
                                                </div>
                                                <h3 className="font-head text-lg font-bold text-navy">{d.title}</h3>
                                                {d.description && <p className="mt-2 text-sm text-navy/80">{d.description}</p>}
                                                {d.highlights && d.highlights.length > 0 && (
                                                    <ul className="mt-3 space-y-1.5">
                                                        {d.highlights.map((h, j) => (
                                                            <li key={j} className="flex items-start gap-2 text-[13.5px] text-navy">
                                                                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-coral" />
                                                                {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Optional activities */}
                        {tour.activities.length > 0 && (
                            <div className="rounded-card border border-black/[.06] bg-white p-6">
                                <h2 className="mb-4 flex items-center gap-2 font-head text-xl font-bold text-navy">
                                    <Sparkles className="h-5 w-5 text-vip" /> فعاليات اختيارية
                                </h2>
                                <p className="mb-4 text-sm text-muted">تقدر تضيف واحدة أو أكتر عند الحجز — الأسعار للفرد.</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {tour.activities.map((a, i) => (
                                        <div key={i} className="rounded-input border border-black/[.08] p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <b className="font-head text-navy">{a.title}</b>
                                                    {a.short_desc && <p className="mt-1 text-[12.5px] text-muted">{a.short_desc}</p>}
                                                </div>
                                                <b className="whitespace-nowrap font-head text-coral-deep">+{money(a.price)}</b>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Sidebar */}
                    <aside>
                        <div className="rounded-card border border-black/[.06] bg-white p-5 shadow-mk lg:sticky lg:top-[92px]">
                            <img src={tour.image_url} alt="" className="mb-4 h-40 w-full rounded-input object-cover" />

                            <div className="mb-4">
                                <div className="mb-1 flex items-baseline gap-2">
                                    <span className="font-head text-2xl font-bold text-coral-deep">{money(tour.sale_price || tour.price)}</span>
                                    <span className="text-sm text-muted">ج.م</span>
                                    {tour.sale_price && <s className="text-sm text-muted">{money(tour.price)}</s>}
                                </div>
                                <span className="text-[12.5px] text-muted">للفرد · شامل كل الخدمات</span>
                            </div>

                            <div className="mb-4 space-y-2 rounded-input bg-beige/40 p-3 text-[13px]">
                                <div className="flex justify-between"><span className="text-muted">المدة</span><b>{tour.duration_days} أيام</b></div>
                                <div className="flex justify-between"><span className="text-muted">أقصى عدد</span><b>{tour.max_people} فرد</b></div>
                                <div className="flex justify-between"><span className="text-muted">الفعاليات</span><b>{tour.activities.length}</b></div>
                                <div className="flex justify-between"><span className="text-muted">الأيام</span><b>{tour.itineraries.length}</b></div>
                            </div>

                            <Button asChild block size="lg">
                                <Link href={tour.checkout_url}>احجز دلوقتي <ArrowLeft className="h-4 w-4" /></Link>
                            </Button>
                            <Button onClick={downloadPdf} variant="secondary" block className="mt-2">
                                <Download className="h-4 w-4" /> تحميل PDF
                            </Button>

                            <p className="mt-3 flex items-center justify-center gap-1 text-[11.5px] text-muted">
                                <ShieldCheck className="h-3 w-3 text-makfol" /> إلغاء مجاني حتى 48 ساعة
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </SiteLayout>
    );
}
