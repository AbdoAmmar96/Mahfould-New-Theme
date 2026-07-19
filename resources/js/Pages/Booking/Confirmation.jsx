import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

export default function Confirmation({ booking }) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(booking.code)}`;
    return (
        <SiteLayout>
            <Head title="تم تأكيد الحجز" />
            <section className="py-14">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="mx-auto max-w-[620px] text-center">
                        <div className="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-makfol text-white shadow-[0_12px_30px_rgba(30,122,82,.32)] duration-500 animate-in fade-in slide-in-from-bottom-3">
                            <Check className="h-11 w-11" strokeWidth={3} />
                        </div>
                        <h1 className="font-head text-3xl font-bold text-navy md:text-4xl">تم تأكيد حجزك!</h1>
                        <p className="mt-2 text-[17px] text-muted">رحلتك محفولة مكفولة — كل التفاصيل وصلتك على الموبايل والإيميل.</p>

                        <div className="mt-[26px] overflow-hidden rounded-card border border-black/[.06] bg-white text-start shadow-mk delay-150 duration-500 animate-in fade-in slide-in-from-bottom-3">
                            <div className="flex items-center justify-between bg-navy px-6 py-5 text-white">
                                <div>
                                    <div className="text-xs opacity-70">رقم الحجز</div>
                                    <div className="font-head text-xl">{booking.code}</div>
                                </div>
                                <Badge variant={booking.status === 'confirmed' ? 'makfol' : 'soft'}>{booking.status_label}</Badge>
                            </div>
                            <div className="grid grid-cols-1 items-center justify-items-center gap-6 p-6 text-center sm:grid-cols-[1fr_auto] sm:justify-items-stretch sm:text-start">
                                <div className="grid gap-3">
                                    <div className="flex gap-2 text-sm"><span className="min-w-[90px] font-semibold text-muted">الباقة</span><b className="font-bold">{booking.title}</b></div>
                                    {booking.location && <div className="flex gap-2 text-sm"><span className="min-w-[90px] font-semibold text-muted">الوجهة</span><b className="font-bold">{booking.location}</b></div>}
                                    {booking.start_date && <div className="flex gap-2 text-sm"><span className="min-w-[90px] font-semibold text-muted">الموعد</span><b className="font-bold">{booking.start_date}</b></div>}
                                    <div className="flex gap-2 text-sm"><span className="min-w-[90px] font-semibold text-muted">المسافرون</span><b className="font-bold">{booking.guests} فرد</b></div>
                                    <div className="flex gap-2 text-sm"><span className="min-w-[90px] font-semibold text-muted">الإجمالي</span><b className="font-bold text-coral-deep">{money(booking.total)} ج.م</b></div>
                                </div>
                                <img className="h-[120px] w-[120px] rounded-xl border border-black/[.06]" src={qr} alt="QR" />
                            </div>
                        </div>

                        <div className="mt-[26px] flex flex-wrap items-center justify-center gap-3">
                            <Button asChild><Link href="/account">عرض حجوزاتي</Link></Button>
                            <Button asChild variant="secondary"><Link href="/">الرئيسية</Link></Button>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
