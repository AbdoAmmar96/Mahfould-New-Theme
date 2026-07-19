import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

const PAY = [
    { key: 'card', label: '💳 بطاقة ائتمان' },
    { key: 'wallet', label: '📱 محفظة إلكترونية' },
    { key: 'on_arrival', label: '💵 دفع عند الوصول' },
];

export default function Checkout({ item, prefill = {}, pricing = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        type: item.type, id: item.id,
        start_date: prefill.start_date || '', guests: prefill.guests || 2, slot: prefill.slot || '',
        customer_name: '', customer_phone: '', customer_email: '', customer_national_id: '',
        payment_method: 'card',
    });

    const fee = pricing.fee ?? 200;
    const discount = pricing.discount ?? 0;
    const subtotal = useMemo(() => item.price * data.guests, [item.price, data.guests]);
    const total = Math.max(0, subtotal + fee - discount);

    const submit = (e) => { e.preventDefault(); post('/checkout'); };

    return (
        <SiteLayout>
            <Head title="إتمام الحجز" />
            <section className="mk-sec" style={{ padding: '34px 0' }}>
                <div className="mk-wrap" style={{ maxWidth: 1080 }}>
                    <h1 style={{ marginBottom: 22 }}>إتمام الحجز</h1>

                    <div className="mk-steps">
                        <div className="mk-step done"><span className="num">✓</span><span>اختيار الخدمة</span></div>
                        <div className="mk-step-line" />
                        <div className="mk-step active"><span className="num">2</span><span>البيانات والمراجعة</span></div>
                        <div className="mk-step-line" />
                        <div className="mk-step"><span className="num">3</span><span>الدفع الآمن</span></div>
                    </div>

                    <form onSubmit={submit}>
                        <div className="mk-checkout">
                            <div>
                                <div className="mk-detail-block">
                                    <h3>بيانات المسافر الأساسي</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        <label className="mk-field"><span className="mk-label">الاسم بالكامل</span>
                                            <input className={`mk-input ${errors.customer_name ? 'is-error' : ''}`} value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} placeholder="عمرو شلبي" /></label>
                                        <label className="mk-field"><span className="mk-label">رقم الموبايل</span>
                                            <input className={`mk-input ${errors.customer_phone ? 'is-error' : ''}`} value={data.customer_phone} onChange={(e) => setData('customer_phone', e.target.value)} placeholder="010xxxxxxxx" /></label>
                                        <label className="mk-field"><span className="mk-label">البريد الإلكتروني</span>
                                            <input className="mk-input" type="email" value={data.customer_email} onChange={(e) => setData('customer_email', e.target.value)} placeholder="you@email.com" /></label>
                                        <label className="mk-field"><span className="mk-label">الرقم القومي <small style={{ color: 'var(--mk-muted)' }}>(اختياري)</small></span>
                                            <input className="mk-input" value={data.customer_national_id} onChange={(e) => setData('customer_national_id', e.target.value)} placeholder="14 رقم" /></label>
                                        <label className="mk-field"><span className="mk-label">{item.type === 'hotel' ? 'تاريخ الوصول' : item.type === 'car' ? 'تاريخ الاستلام' : 'التاريخ'}</span>
                                            <input className="mk-input" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} /></label>
                                        <label className="mk-field"><span className="mk-label">{item.type === 'hotel' ? 'عدد الليالي' : item.type === 'car' ? 'عدد الأيام' : 'عدد الأفراد'}</span>
                                            <select className="mk-select" value={data.guests} onChange={(e) => setData('guests', +e.target.value)}>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                                            </select></label>
                                    </div>
                                </div>

                                <div className="mk-detail-block">
                                    <h3>طريقة الدفع</h3>
                                    <div className="mk-pay">
                                        {PAY.map((p) => (
                                            <div key={p.key} className={`mk-pay-opt ${data.payment_method === p.key ? 'sel' : ''}`}
                                                onClick={() => setData('payment_method', p.key)}>{p.label}<span className="r" /></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ملخص */}
                            <div>
                                <div className="mk-book">
                                    <div className="mk-flex" style={{ gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--mk-border)', marginBottom: 16 }}>
                                        <img src={item.image_url} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} alt="" />
                                        <div><b style={{ fontFamily: 'var(--mk-font-head)' }}>{item.title}</b>
                                            <div style={{ fontSize: 13, color: 'var(--mk-muted)', fontWeight: 600 }}>{data.guests} {item.unit}</div></div>
                                    </div>
                                    <div className="mk-summary-row"><span>السعر ({data.guests} {item.unit})</span><span>{money(subtotal)} ج.م</span></div>
                                    <div className="mk-summary-row"><span>رسوم الخدمة</span><span>{money(fee)} ج.م</span></div>
                                    {discount > 0 && (
                                        <div className="mk-summary-row"><span>خصم مكفول</span><span style={{ color: 'var(--mk-makfol)' }}>−{money(discount)} ج.م</span></div>
                                    )}
                                    <div className="mk-summary-row total"><span>الإجمالي</span><b>{money(total)} ج.م</b></div>
                                    <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg" style={{ marginTop: 16 }}>
                                        {processing ? 'جاري التأكيد…' : 'أكّد وادفع'}
                                    </button>
                                    <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--mk-muted)', margin: '12px 0 0' }}>🔒 دفع آمن ومشفّر</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        </SiteLayout>
    );
}
