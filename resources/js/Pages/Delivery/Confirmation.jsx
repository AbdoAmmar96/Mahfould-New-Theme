import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, MapPin, Package, User, Phone, StickyNote, ShieldCheck } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

export default function Confirmation({ order }) {
    return (
        <SiteLayout anim="flow">
            <Head title={`طلب توصيل ${order.code}`} />
            <section className="py-6 lg:py-14">
                <div className="mx-auto w-full max-w-[720px] px-5">
                    <div className="text-center">
                        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-makfol text-white shadow-lg">
                            <CheckCircle2 className="h-10 w-10" strokeWidth={3} />
                        </div>
                        <h1 className="font-head text-3xl font-bold text-navy">تم استلام طلبك</h1>
                        <p className="mt-2 text-muted">هنبعتلك السائق قريب. الأجرة النهائية بتُدفع للسائق عند الاستخدام.</p>
                    </div>

                    <div className="mt-8 rounded-card border border-black/[.06] bg-white shadow-mk">
                        <div className="flex items-center justify-between bg-navy px-6 py-5 text-white">
                            <div>
                                <div className="text-xs opacity-70">رقم الطلب</div>
                                <div className="font-head text-xl">{order.code}</div>
                            </div>
                            <Badge variant="makfol">{order.status_label}</Badge>
                        </div>
                        <div className="p-6 text-sm">
                            <div className="mb-3 flex items-start gap-3 rounded-input bg-beige/40 p-3">
                                <Package className="mt-0.5 h-5 w-5 text-coral-deep" />
                                <div>
                                    <b className="text-navy">{order.service.title}</b>
                                    <div className="text-[12.5px] text-muted">
                                        {order.service.vehicle_type} · {order.service.provider}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-black/[.06] pt-3">
                                <Row icon={MapPin} label="الاستلام"><b>{order.pickup_address}</b></Row>
                                <Row icon={MapPin} label="التسليم"><b>{order.dropoff_address}</b></Row>
                                <Row label="المسافة"><b>{order.distance_km} كم</b></Row>
                                {order.recipient_name && <Row icon={User} label="المستلم"><b>{order.recipient_name}</b></Row>}
                                {order.recipient_phone && <Row icon={Phone} label="الموبايل"><b dir="ltr">{order.recipient_phone}</b></Row>}
                                {order.notes && <Row icon={StickyNote} label="ملاحظات">{order.notes}</Row>}
                            </div>

                            <div className="mt-4 flex justify-between border-t border-black/[.06] pt-3 text-base font-bold">
                                <span>الأجرة التقديرية</span>
                                <b className="font-head text-xl text-coral-deep">{order.estimated_fare} ج.م</b>
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-[12px] text-muted">
                                <ShieldCheck className="h-3 w-3" /> الأجرة النهائية تُحسب بالمسافة الفعلية وتُدفع للسائق مباشرة.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button asChild><Link href="/delivery">اطلب توصيلة أخرى</Link></Button>
                        <Button asChild variant="secondary"><Link href="/">الرئيسية</Link></Button>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}

function Row({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-2">
            {Icon && <Icon className="mt-0.5 h-4 w-4 flex-none text-muted" />}
            <span className="w-20 flex-none text-[13px] font-semibold text-muted">{label}</span>
            <span className="flex-1 text-navy">{children}</span>
        </div>
    );
}
