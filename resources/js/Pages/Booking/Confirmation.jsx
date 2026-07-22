import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link } from '@inertiajs/react';
import { Check, Car, Bus, ShieldCheck, User, UserPlus, BedDouble, Coffee } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { MobileSection, MobileCTA } from '@/Components/mobile/primitives';
import { useIsMobile } from '@/lib/useIsMobile';

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
    const isMobile = useIsMobile();
    const bookingQr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(booking.code)}`;
    const entry = booking.entry_pass;

    if (isMobile) {
        return (
            <SiteLayout anim="success">
                <Head title="تم تأكيد الحجز" />

                {/* شاشة نجاح — زي ما التطبيقات بتعمل */}
                <div className="bg-makfol px-5 pb-7 pt-8 text-center text-white">
                    <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/20 backdrop-blur duration-500 animate-in fade-in zoom-in">
                        <Check className="h-10 w-10" strokeWidth={3} />
                    </div>
                    <h1 className="font-head text-[24px] font-bold text-white">تم تأكيد حجزك!</h1>
                    <p className="mt-1.5 text-[14px] text-white/85">
                        كل التفاصيل وصلتك على الموبايل والإيميل.
                    </p>
                </div>

                {/* تذكرة الحجز — QR في النص زي بطاقة الصعود */}
                <div className="px-4 pt-4">
                    <div className="overflow-hidden rounded-card bg-white shadow-mk">
                        <div className="flex items-center justify-between bg-navy px-4 py-3.5 text-white">
                            <div>
                                <div className="text-[11px] opacity-70">رقم الحجز</div>
                                <div className="font-head text-[18px]">{booking.code}</div>
                            </div>
                            <Badge variant={booking.status === 'confirmed' ? 'makfol' : 'soft'}>{booking.status_label}</Badge>
                        </div>

                        <div className="flex justify-center border-b border-dashed border-black/[.1] p-4">
                            <img className="h-[150px] w-[150px] rounded-xl border border-black/[.06]" src={bookingQr} alt="QR" />
                        </div>

                        <div className="space-y-2.5 p-4 text-[13.5px]">
                            <MRow label="الباقة" value={booking.title} />
                            {booking.room_type && <MRow label="نوع الغرفة" value={booking.room_type.title} />}
                            {booking.location && <MRow label="الوجهة" value={booking.location} />}
                            {booking.start_date && (
                                <MRow label="الموعد" value={`${booking.start_date}${booking.end_date ? ` → ${booking.end_date}` : ''}`} />
                            )}
                            <MRow label="المسافرون" value={`${booking.guests} فرد`} />
                            <MRow
                                label="لمن الحجز"
                                value={booking.booking_for === 'other' ? (booking.beneficiary_name || 'طرف آخر') : 'ليّا شخصياً'}
                            />
                            {booking.transport_mode && (
                                <MRow label="طريقة الوصول" value={TRANSPORT_LABELS[booking.transport_mode]} />
                            )}
                            <div className="flex items-center justify-between border-t border-black/[.06] pt-3">
                                <span className="text-[13px] font-semibold text-muted">الإجمالي</span>
                                <b className="font-head text-[19px] text-coral-deep">{money(booking.total)} ج.م</b>
                            </div>
                            <p className="text-end text-[11.5px] text-muted">
                                {TIMING_LABELS[booking.payment_timing] || booking.payment_timing}
                            </p>
                        </div>
                    </div>
                </div>

                {/* تصريح الدخول QR */}
                {entry && (
                    <MobileSection title="تصريح دخول QR" icon={ShieldCheck}>
                        <p className="mb-3 text-[13px] text-muted">اعرضه للمنشأة عند الوصول — يعمل مرة واحدة بس.</p>
                        <div className="rounded-card border-2 border-royal/40 bg-royal/[.04] p-4 text-center">
                            <img src={entry.qr_image_url} alt="QR" className="mx-auto h-[170px] w-[170px] rounded-xl border-2 border-royal/20 bg-white p-2" />
                            <div className="mt-3 space-y-1.5 text-start text-[13px]">
                                <MRow label="صالح من" value={entry.valid_from} />
                                <MRow label="صالح حتى" value={entry.valid_until} />
                                <MRow label="الكود" value={entry.code} />
                            </div>
                        </div>
                    </MobileSection>
                )}

                <div className="space-y-2.5 p-4">
                    <MobileCTA href="/account">عرض حجوزاتي</MobileCTA>
                    <MobileCTA href="/" variant="secondary">الرئيسية</MobileCTA>
                </div>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout anim="success">
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

// صف label/value مضغوط لبطاقة الموبايل
function MRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-[12.5px] font-semibold text-muted">{label}</span>
            <b className="text-end text-[13.5px] font-bold text-navy">{value}</b>
        </div>
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
