// محفول مكفول — الصفحة الرئيسية للوحة الأدمن
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Badge, money } from '../../Components/Admin/cells';
import { Button } from '@/Components/ui/button';
import { Ticket, Clock, Banknote, Landmark, ArrowLeft } from 'lucide-react';

// كارت إحصاء + خلايا الجدول — كلاسات مشتركة بهوية محفول مكفول
const STAT_CARD = 'flex flex-col gap-1.5 rounded-card border border-black/[.06] bg-white p-5 shadow-mk';
const TH = 'whitespace-nowrap border-b border-black/[.06] bg-cream px-3.5 py-3 text-right text-[12.5px] font-bold text-muted';
const TD = 'border-b border-black/[.06] px-3.5 py-[11px] align-middle text-sm';

export default function Dashboard({ stats, sales, recent }) {
    return (
        <AdminLayout title="لوحة التحكم" crumb="نظرة عامة على المنصة">
            <Head title="لوحة التحكم" />

            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                {stats.map((s) => (
                    <Link
                        key={s.label}
                        href={s.href}
                        className={`${STAT_CARD} transition-all hover:-translate-y-0.5 hover:shadow-mk-lg`}
                    >
                        <span className="text-[26px]">{s.icon}</span>
                        <span className="font-head text-[30px] font-bold leading-none text-navy">{s.value}</span>
                        <span className="text-sm font-semibold text-muted">{s.label}</span>
                    </Link>
                ))}
            </div>

            <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                <div className={STAT_CARD}>
                    <Ticket className="h-7 w-7 text-navy" />
                    <span className="font-head text-[30px] font-bold leading-none text-navy">{sales.bookings}</span>
                    <span className="text-sm font-semibold text-muted">إجمالي الحجوزات</span>
                </div>
                <div className={STAT_CARD}>
                    <Clock className="h-7 w-7 text-coral-deep" />
                    <span className="font-head text-[30px] font-bold leading-none text-coral-deep">{sales.pending}</span>
                    <span className="text-sm font-semibold text-muted">حجوزات في الانتظار</span>
                </div>
                <div className={STAT_CARD}>
                    <Banknote className="h-7 w-7 text-makfol" />
                    <span className="font-head text-[30px] font-bold leading-none text-makfol">{money(sales.revenue)}</span>
                    <span className="text-sm font-semibold text-muted">الإيرادات المدفوعة (ج.م)</span>
                </div>
                <div className={STAT_CARD}>
                    <Landmark className="h-7 w-7 text-navy" />
                    <span className="font-head text-[30px] font-bold leading-none text-navy">{money(sales.commission)}</span>
                    <span className="text-sm font-semibold text-muted">عمولة المنصة (ج.م)</span>
                </div>
            </div>

            <div className="mt-[22px] overflow-hidden rounded-card border border-black/[.06] bg-white shadow-mk">
                <div className="flex flex-wrap items-center gap-2.5 border-b border-black/[.06] px-4 py-3.5">
                    <strong className="font-head text-[17px] text-navy">أحدث الحجوزات</strong>
                    <span className="flex-1" />
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/bookings">عرض الكل <ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className={TH}>الكود</th>
                                <th className={TH}>العميل</th>
                                <th className={TH}>الخدمة</th>
                                <th className={TH}>الإجمالي</th>
                                <th className={TH}>الحالة</th>
                                <th className={TH}>الدفع</th>
                                <th className={TH}>التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map((b) => (
                                <tr key={b.id} className="transition-colors hover:bg-[#FCFAF6] [&:last-child>td]:border-b-0">
                                    <td className={`${TD} font-extrabold`}>{b.code}</td>
                                    <td className={TD}>{b.customer_name}</td>
                                    <td className={TD}>{b.service}</td>
                                    <td className={TD}>{money(b.total)} <small className="text-muted">ج.م</small></td>
                                    <td className={TD}><Badge value={b.status} /></td>
                                    <td className={TD}><Badge value={b.payment_status} /></td>
                                    <td className={`${TD} text-muted`}>{b.date}</td>
                                </tr>
                            ))}
                            {recent.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="px-5 py-[60px] text-center text-muted">
                                            <Ticket className="mx-auto mb-2 h-10 w-10 opacity-50" />
                                            مفيش حجوزات لسه.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
