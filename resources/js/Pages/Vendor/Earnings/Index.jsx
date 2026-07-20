import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Wallet, TrendingUp, Percent, BadgeAlert, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { cn } from '@/lib/utils';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const money = (n) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n || 0);

export default function Earnings({ company, summary, monthly, recent }) {
    const { data, setData, put, processing } = useForm({
        bank_holder: company.bank_holder || '',
        bank_iban: company.bank_iban || '',
        tax_id: company.tax_id || '',
    });

    const submit = (e) => { e.preventDefault(); put('/vendor/earnings/banking'); };

    return (
        <AdminLayout title="الأرباح والتسويات" crumb="لوحة الشريك › التسويات">
            <Head title="الأرباح" />

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <KpiCard icon={Wallet} label="إجمالي الحجوزات" value={`${money(summary.gross)} ج.م`} sub={`${summary.count} حجز`} color="text-navy" />
                <KpiCard icon={Percent} label="عمولة محفول" value={`${money(summary.commission)} ج.م`} sub={`${company.commission_rate}%`} color="text-coral-deep" />
                <KpiCard icon={TrendingUp} label="صافيك" value={`${money(summary.net)} ج.م`} sub="بعد العمولة" color="text-makfol" />
                <KpiCard icon={Wallet} label="مدفوع" value={`${money(summary.paid)} ج.م`} sub="Cleared" color="text-makfol" />
                <KpiCard icon={BadgeAlert} label="قيد التسوية" value={`${money(summary.unpaid)} ج.م`} sub="Pending" color="text-vip" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                {/* Monthly Chart + Recent */}
                <div>
                    <div className="mb-5 rounded-card border border-black/[.06] bg-white p-5">
                        <h3 className="mb-4 font-head text-base font-bold text-navy">الأرباح الشهرية</h3>
                        <div className="h-[260px]">
                            {monthly.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: monthly.map(m => m.month),
                                        datasets: [
                                            { label: 'الإجمالي', data: monthly.map(m => m.gross), backgroundColor: '#363677' },
                                            { label: 'صافيك', data: monthly.map(m => m.net), backgroundColor: '#1E7A52' },
                                            { label: 'عمولة محفول', data: monthly.map(m => m.commission), backgroundColor: '#FC7660' },
                                        ],
                                    }}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } },
                                    }}
                                />
                            ) : (
                                <div className="grid h-full place-items-center text-muted">لسه معندكش حجوزات.</div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-card border border-black/[.06] bg-white p-5">
                        <h3 className="mb-4 font-head text-base font-bold text-navy">آخر الحجوزات</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-beige/50 text-[12.5px] text-muted">
                                    <tr>
                                        <th className="p-2.5">الكود</th>
                                        <th className="p-2.5">الخدمة</th>
                                        <th className="p-2.5">العميل</th>
                                        <th className="p-2.5">التاريخ</th>
                                        <th className="p-2.5">الإجمالي</th>
                                        <th className="p-2.5">صافيك</th>
                                        <th className="p-2.5">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((b) => (
                                        <tr key={b.code} className="border-b border-black/[.04] transition-colors hover:bg-beige/30">
                                            <td className="p-2.5 font-mono text-[11.5px] text-coral-deep">{b.code}</td>
                                            <td className="p-2.5 text-navy">{b.service}</td>
                                            <td className="p-2.5 text-navy">{b.customer}</td>
                                            <td className="p-2.5 text-muted">{b.date || '—'}</td>
                                            <td className="p-2.5 font-bold text-navy">{money(b.total)}</td>
                                            <td className="p-2.5 font-bold text-makfol">{money(b.net)}</td>
                                            <td className="p-2.5">
                                                <Badge variant={b.status === 'confirmed' ? 'makfol' : 'soft'}>{b.status_label}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {recent.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-muted">لا توجد حجوزات.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Banking Settings */}
                <div>
                    <div className="rounded-card border border-black/[.06] bg-white p-5 lg:sticky lg:top-[92px]">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-royal/[.1] text-royal">
                                <CreditCard className="h-4 w-4" />
                            </span>
                            <h3 className="font-head text-base font-bold text-navy">بيانات التسوية</h3>
                        </div>
                        <p className="mb-4 text-[12.5px] text-muted">
                            بنستخدم البيانات دي في تحويل صافي الأرباح لحسابك في تسويات دورية.
                        </p>
                        <form onSubmit={submit} className="space-y-3.5">
                            <Field label="اسم صاحب الحساب">
                                <Input value={data.bank_holder} onChange={e => setData('bank_holder', e.target.value)} placeholder="مطابق للبطاقة" />
                            </Field>
                            <Field label="IBAN">
                                <Input value={data.bank_iban} onChange={e => setData('bank_iban', e.target.value)} placeholder="EG— — —" dir="ltr" className="text-left font-mono" />
                            </Field>
                            <Field label="السجل الضريبي (اختياري)">
                                <Input value={data.tax_id} onChange={e => setData('tax_id', e.target.value)} placeholder="123-456-789" />
                            </Field>
                            <Button type="submit" block disabled={processing}>
                                {processing ? 'جاري…' : 'حفظ بيانات التسوية'}
                            </Button>
                        </form>

                        {/* Status */}
                        <div className="mt-5 rounded-input border border-black/[.06] bg-beige/40 p-3 text-[12.5px]">
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted" />
                                <b className="text-navy">{company.name}</b>
                            </div>
                            <div className="mt-1 text-muted">
                                حالة التوثيق: <Badge variant={company.verification_status === 'verified' ? 'makfol' : 'soft'}>
                                    {company.verification_status === 'verified' ? 'موثّق' : company.verification_status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
    return (
        <div className="rounded-card border border-black/[.06] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-beige">
                    <Icon className={cn('h-4 w-4', color)} />
                </span>
                <span className="text-[12px] font-bold text-muted">{label}</span>
            </div>
            <div className="font-head text-lg font-bold text-navy">{value}</div>
            <div className="text-[11px] text-muted">{sub}</div>
        </div>
    );
}
