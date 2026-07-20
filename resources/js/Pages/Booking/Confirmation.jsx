import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link } from '@inertiajs/react';
import { Check, Car, Bus, ShieldCheck, User, UserPlus, BedDouble, Coffee } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';

const TRANSPORT_LABELS = {
    own_car: 'بعربيتي',
    bus: 'باص المنصة',
    rented_car: 'عربية مستأجرة',
};
const TIMING_LABELS = {
    on_arrival: 'الدفع عند الوصول',
    on_use: 'الدفع عند الاستخدام',
    prepaid: 'مدفوع مسبقاً',
};

export default function Confirmation({ booking }) {
    const bookingQr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(booking.code)}`;
    const entry = booking.entry_pass;

    return (
        <SiteLayout>
            <Head title="تم تأكيد الحجز" />
            <section className="py-14">
                <div className="mx-auto w-full max-w-[860px] px-5">
                    {/* Header نجاح */}
                    <div className="text-center">
                        <div className="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-makfol text-white shadow-[0_12px_30px_rgba(30,122,82,.32)] duration-500 animate-in fade-in slide-in-from-bottom-3">
                            <Check className="h-11 w-11" strokeWidth={3} />
                        </div>
                        <h1 className="font-head text-3xl font-bold text-navy md:text-4xl">تم تأكيد حجزك!</h1>
                        <p className="mt-2 text-[17px] text-muted">رحلتك محفولة مكفولة — كل التفاصيل وصلتك على الموبايل والإيميل.</p>
                    </div>

                    {/* Entry Pass (QR) — لو جاي بعربيته */}
                    {entry && (
                        <div className="mt-8 overflow-hidden rounded-card border-2 border-royal/40 bg-gradient-to-br from-royal/[.05] to-navy/[.03] shadow-mk delay-100 duration-500 animate-in fade-in slide-in-from-bottom-3">
                            <div className="flex items-center justify-between border-b border-royal/20 bg-royal/[.08] px-6 py-4">
                                <div>
                                    <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-royal">
                                        <ShieldCheck className="h-4 w-4" /> تصريح دخول QR
                                    </div>
                                    <div className="text-[12.5px] text-muted">اعرضه للمنشأة عند الوصول — تُمسحه من لوحتها</div>
                                </div>
                                <Badge variant="royal">{entry.code}</Badge>
                            </div>
                            <div className="grid grid-cols-1 items-center gap-4 p-6 sm:grid-cols-[auto_1fr]">
                                <img src={entry.qr_image_url} alt="QR" className="h-[220px] w-[220px] rounded-xl border-2 border-royal/20 bg-white p-2" />
                                <div className="text-start">
                                    <div className="mb-2 flex items-center gap-2 font-head text-lg font-bold text-navy">
                                        <Car className="h-5 w-5 text-royal" /> جاي بعربيتك
                                    </div>
                                    <p className="mb-3 text-sm text-muted">تصريح دخول شخصي مربوط بحجزك — يعمل مرة واحدة فقط.</p>
                                    <ul className="space-y-1 text-[13px] text-navy">
                                        <li className="flex gap-2"><span className="w-24 text-muted">صالح من</span><b>{entry.valid_from}</b></li>
                                        <li className="flex gap-2"><span className="w-24 text-muted">صالح حتى</span><b>{entry.valid_until}</b></li>
                                        <li className="flex gap-2"><span className="w-24 text-muted">الكود</span><code className="rounded bg-beige px-2 py-0.5 font-mono text-[12px]">{entry.code}</code></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* بطاقة الحجز */}
                    <div className="mt-6 overflow-hidden rounded-card border border-black/[.06] bg-white text-start shadow-mk delay-200 duration-500 animate-in fade-in slide-in-from-bottom-3">
                        <div className="flex items-center justify-between bg-navy px-6 py-5 text-white">
                            <div>
                                <div className="text-xs opacity-70">رقم الحجز</div>
                                <div className="font-head text-xl">{booking.code}</div>
                            </div>
                            <Badge variant={booking.status === 'confirmed' ? 'makfol' : 'soft'}>{booking.status_label}</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1fr_auto]">
                            <div className="grid gap-3 text-sm">
                                <Row label="الباقة"><b>{booking.title}</b></Row>
                                {booking.room_type && (
                                    <Row label="نوع الغرفة">
                                        <span className="inline-flex items-center gap-1.5 font-bold text-navy">
                                            <BedDouble className="h-3.5 w-3.5 text-coral-deep" />
                                            {booking.room_type.title}
                                            {booking.room_type.includes_breakfast && <Coffee className="h-3.5 w-3.5 text-makfol" title="شامل الإفطار" />}
                                        </span>
                                    </Row>
                                )}
                                {booking.location && <Row label="الوجهة"><b>{booking.location}</b></Row>}
                                {booking.start_date && <Row label="الموعد"><b>{booking.start_date}{booking.end_date && ` → ${booking.end_date}`}</b></Row>}
                                <Row label="المسافرون">
                                    <b>{booking.guests} فرد</b>
                                    {booking.guests_ages?.length > 0 && (
                                        <span className="ms-2 text-[12px] text-muted">
                                            (أعمار: {booking.guests_ages.join(' · ')})
                                        </span>
                                    )}
                                </Row>
                                <Row label="لمن الحجز">
                                    <span className="inline-flex items-center gap-1.5 font-bold">
                                        {booking.booking_for === 'other' ? (
                                            <><UserPlus className="h-3.5 w-3.5 text-royal" /> {booking.beneficiary_name || 'طرف آخر'}</>
                                        ) : (
                                            <><User className="h-3.5 w-3.5 text-coral-deep" /> ليّا شخصياً</>
                                        )}
                                    </span>
                                </Row>
                                {booking.transport_mode && (
                                    <Row label="طريقة الوصول">
                                        <span className="inline-flex items-center gap-1.5 font-bold">
                                            {booking.transport_mode === 'bus'
                                                ? <Bus className="h-3.5 w-3.5 text-navy" />
                                                : <Car className="h-3.5 w-3.5 text-navy" />}
                                            {TRANSPORT_LABELS[booking.transport_mode]}
                                        </span>
                                    </Row>
                                )}
                                <Separator className="my-1" />
                                <Row label="الإجمالي">
                                    <b className="font-head text-lg text-coral-deep">{money(booking.total)} ج.م</b>
                                    <span className="ms-2 text-[12px] text-muted">· {TIMING_LABELS[booking.payment_timing] || booking.payment_timing}</span>
                                </Row>
                            </div>
                            <img className="h-[120px] w-[120px] rounded-xl border border-black/[.06]" src={bookingQr} alt="QR" />
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button asChild><Link href="/account">عرض حجوزاتي</Link></Button>
                        <Button asChild variant="secondary"><Link href="/">الرئيسية</Link></Button>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}

function Row({ label, children }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-[90px] text-[13px] font-semibold text-muted">{label}</span>
            <span>{children}</span>
        </div>
    );
}
