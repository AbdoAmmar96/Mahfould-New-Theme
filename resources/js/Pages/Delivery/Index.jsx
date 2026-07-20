import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Truck, Bike, Package, Calculator, MapPin, Navigation, Star, ShieldCheck, Send } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

const VEHICLE_ICONS = {
    motorbike: Bike, car: Truck, van: Truck, truck: Truck,
};
const VEHICLE_LABELS = {
    motorbike: 'موتوسيكل', car: 'عربية ملاكي', van: 'فان', truck: 'ونش/شاحنة',
};

export default function Index({ services, user_location }) {
    const [selected, setSelected] = useState(null);
    const [estimate, setEstimate] = useState(null);
    const [estimating, setEstimating] = useState(false);

    const { data, setData, post, processing } = useForm({
        delivery_service_id: null,
        pickup_address: '',
        pickup_lat: user_location?.lat || '',
        pickup_lng: user_location?.lng || '',
        dropoff_address: '',
        dropoff_lat: '',
        dropoff_lng: '',
        recipient_name: '',
        recipient_phone: '',
        notes: '',
    });

    const useCurrentLocationForPickup = () => {
        if (!navigator.geolocation) return alert('المتصفح مش داعم للـGPS.');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setData({
                    ...data,
                    pickup_lat: pos.coords.latitude,
                    pickup_lng: pos.coords.longitude,
                    pickup_address: data.pickup_address || 'موقعي الحالي',
                });
            },
            () => alert('لم نتمكن من قراءة موقعك.'),
        );
    };

    const doEstimate = async () => {
        if (!selected || !data.pickup_lat || !data.dropoff_lat) return;
        setEstimating(true);
        try {
            const res = await fetch('/delivery/estimate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    delivery_service_id: selected.id,
                    pickup_lat: data.pickup_lat, pickup_lng: data.pickup_lng,
                    dropoff_lat: data.dropoff_lat, dropoff_lng: data.dropoff_lng,
                }),
            });
            setEstimate(await res.json());
        } finally {
            setEstimating(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post('/delivery/order');
    };

    const pick = (s) => {
        setSelected(s);
        setData('delivery_service_id', s.id);
        setEstimate(null);
    };

    return (
        <SiteLayout>
            <Head title="التوصيل" />
            <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="pointer-events-none absolute -end-20 -top-32 h-[360px] w-[360px] rounded-full bg-royal opacity-30 blur-[110px]" />
                <div className="relative z-[1] mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> › التوصيل
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold">خدمات التوصيل</h1>
                    <p className="mt-1.5 text-white/70">شركات وأفراد بتسعير شفاف بالكيلومتر — الدفع للسائق عند الاستخدام.</p>
                </div>
            </section>

            <section className="py-10">
                <div className="mx-auto grid w-full max-w-[1200px] gap-6 px-5 lg:grid-cols-[1fr_400px]">
                    {/* قائمة الشركات */}
                    <div>
                        <h3 className="mb-4 font-head text-xl font-semibold text-navy">
                            الخدمات المتاحة <span className="text-sm font-normal text-muted">({services.length})</span>
                        </h3>
                        <div className="space-y-3">
                            {services.map(s => {
                                const VIcon = VEHICLE_ICONS[s.vehicle_type] || Package;
                                const on = selected?.id === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => pick(s)}
                                        className={cn(
                                            'block w-full rounded-card border-[1.5px] bg-white p-4 text-right transition-all hover:border-coral',
                                            on ? 'border-coral shadow-md' : 'border-black/[.06]',
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-coral/[.08] text-coral-deep">
                                                <VIcon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                                    <b className="font-head text-navy">{s.title}</b>
                                                    <Badge variant="soft">{VEHICLE_LABELS[s.vehicle_type]}</Badge>
                                                    {s.max_kg && <Badge variant="soft">حتى {s.max_kg} كجم</Badge>}
                                                </div>
                                                <div className="text-[13px] text-muted">
                                                    من {s.provider?.name || 'مزوّد مستقل'} · نطاق {s.service_radius_km} كم
                                                    {s.distance_km !== null && ` · ${s.distance_km} كم من موقعك`}
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px]">
                                                    <span className="inline-flex items-center gap-0.5 font-bold text-vip">
                                                        <Star className="h-3.5 w-3.5 fill-vip text-vip" /> {s.review_score.toFixed(1)} <span className="text-muted">({s.review_count})</span>
                                                    </span>
                                                    <span className="text-navy">
                                                        <b className="text-coral-deep">{s.base_fare}</b> + <b className="text-coral-deep">{s.price_per_km}</b>/كم
                                                        <span className="text-muted"> · الحد الأدنى {s.min_fare} ج.م</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {services.length === 0 && (
                                <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-12 text-center text-muted">
                                    مفيش خدمات توصيل نشطة في المنطقة دلوقتي.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* فورم الطلب */}
                    <div className="lg:sticky lg:top-[92px]">
                        <div className="rounded-card border border-black/[.06] bg-white p-5">
                            <h3 className="mb-4 flex items-center gap-2 font-head text-lg font-semibold text-navy">
                                <Send className="h-5 w-5 text-coral-deep" /> اطلب توصيلة
                            </h3>

                            {!selected ? (
                                <p className="rounded-input border border-black/[.08] bg-beige/40 p-4 text-center text-[13px] text-muted">
                                    اختر خدمة من القائمة الأول.
                                </p>
                            ) : (
                                <form onSubmit={submit} className="space-y-3">
                                    <div className="rounded-input border border-royal/25 bg-royal/[.04] p-3 text-[12.5px] text-navy">
                                        <b>{selected.title}</b> — {VEHICLE_LABELS[selected.vehicle_type]}
                                    </div>

                                    <Field label="نقطة الاستلام">
                                        <Input
                                            value={data.pickup_address}
                                            onChange={e => setData('pickup_address', e.target.value)}
                                            placeholder="العنوان بالتفصيل"
                                        />
                                        <Button type="button" variant="secondary" size="sm" onClick={useCurrentLocationForPickup} className="mt-1.5">
                                            <Navigation className="h-3.5 w-3.5" /> استخدم موقعي الحالي
                                        </Button>
                                        {data.pickup_lat && (
                                            <p className="mt-1 text-[11.5px] text-muted">
                                                <MapPin className="me-0.5 inline h-3 w-3" />
                                                {(+data.pickup_lat).toFixed(4)}, {(+data.pickup_lng).toFixed(4)}
                                            </p>
                                        )}
                                    </Field>

                                    <Field label="نقطة التسليم">
                                        <Input
                                            value={data.dropoff_address}
                                            onChange={e => setData('dropoff_address', e.target.value)}
                                            placeholder="العنوان بالتفصيل"
                                        />
                                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                                            <Input
                                                type="number" step="any" placeholder="Lat"
                                                value={data.dropoff_lat}
                                                onChange={e => setData('dropoff_lat', e.target.value)}
                                            />
                                            <Input
                                                type="number" step="any" placeholder="Lng"
                                                value={data.dropoff_lng}
                                                onChange={e => setData('dropoff_lng', e.target.value)}
                                            />
                                        </div>
                                    </Field>

                                    <Button type="button" variant="secondary" block onClick={doEstimate} disabled={estimating || !data.dropoff_lat}>
                                        <Calculator className="h-4 w-4" /> {estimating ? 'جاري…' : 'قدّر الأجرة'}
                                    </Button>

                                    {estimate && (
                                        <div className={cn(
                                            'rounded-input border-[1.5px] p-3 text-[13px]',
                                            estimate.within_radius ? 'border-makfol/30 bg-makfol/[.06] text-navy' : 'border-danger/30 bg-danger/[.06] text-danger',
                                        )}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span>المسافة</span>
                                                <b>{estimate.distance_km} كم</b>
                                            </div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span>الأجرة التقديرية</span>
                                                <b className="font-head text-lg text-coral-deep">{estimate.estimated_fare} ج.م</b>
                                            </div>
                                            {!estimate.within_radius && (
                                                <p className="mt-2 text-[12px]">خارج نطاق الخدمة ({estimate.service_radius_km} كم).</p>
                                            )}
                                        </div>
                                    )}

                                    <Field label="اسم المستلم (اختياري)">
                                        <Input value={data.recipient_name} onChange={e => setData('recipient_name', e.target.value)} />
                                    </Field>
                                    <Field label="موبايل المستلم">
                                        <Input value={data.recipient_phone} onChange={e => setData('recipient_phone', e.target.value)} placeholder="010xxxxxxxx" />
                                    </Field>
                                    <Field label="ملاحظات">
                                        <Input value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="مثال: طابق 3 · اتصل قبل الوصول" />
                                    </Field>

                                    <Button
                                        type="submit"
                                        block
                                        size="lg"
                                        disabled={processing || !estimate?.within_radius || !data.pickup_address || !data.dropoff_address}
                                    >
                                        {processing ? 'جاري…' : 'اطلب التوصيل'}
                                    </Button>

                                    <p className="flex items-center gap-1 text-center text-[11.5px] text-muted">
                                        <ShieldCheck className="h-3 w-3" />
                                        الدفع للسائق عند الاستخدام — أجرة نهائية بالمسافة الفعلية.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
