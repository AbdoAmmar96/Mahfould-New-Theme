// محفول مكفول — الصفحة الرئيسية للوحة الأدمن
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Badge, money } from '../../Components/Admin/cells';

export default function Dashboard({ stats, sales, recent }) {
    return (
        <AdminLayout title="لوحة التحكم" crumb="نظرة عامة على المنصة">
            <Head title="لوحة التحكم" />

            <div className="mkad-stats">
                {stats.map((s) => (
                    <Link key={s.label} href={s.href} className="mkad-stat">
                        <span className="ic">{s.icon}</span>
                        <span className="val">{s.value}</span>
                        <span className="lbl">{s.label}</span>
                    </Link>
                ))}
            </div>

            <div className="mkad-stats" style={{ marginTop: 16 }}>
                <div className="mkad-stat tone-info"><span className="ic">🎫</span><span className="val">{sales.bookings}</span><span className="lbl">إجمالي الحجوزات</span></div>
                <div className="mkad-stat tone-primary"><span className="ic">⏳</span><span className="val">{sales.pending}</span><span className="lbl">حجوزات في الانتظار</span></div>
                <div className="mkad-stat tone-good"><span className="ic">💰</span><span className="val">{money(sales.revenue)}</span><span className="lbl">الإيرادات المدفوعة (ج.م)</span></div>
                <div className="mkad-stat"><span className="ic">🏦</span><span className="val">{money(sales.commission)}</span><span className="lbl">عمولة المنصة (ج.م)</span></div>
            </div>

            <div className="mkad-panel" style={{ marginTop: 22 }}>
                <div className="mkad-toolbar"><strong style={{ fontFamily: 'var(--mk-font-head)', fontSize: 17 }}>أحدث الحجوزات</strong>
                    <span className="grow" /><Link href="/admin/bookings" className="mkad-iconbtn">عرض الكل</Link>
                </div>
                <div className="mkad-table-wrap">
                    <table className="mkad-table">
                        <thead><tr><th>الكود</th><th>العميل</th><th>الخدمة</th><th>الإجمالي</th><th>الحالة</th><th>الدفع</th><th>التاريخ</th></tr></thead>
                        <tbody>
                            {recent.map((b) => (
                                <tr key={b.id}>
                                    <td className="mkad-td-strong">{b.code}</td>
                                    <td>{b.customer_name}</td>
                                    <td>{b.service}</td>
                                    <td>{money(b.total)} <small className="mkad-money-muted">ج.م</small></td>
                                    <td><Badge value={b.status} /></td>
                                    <td><Badge value={b.payment_status} /></td>
                                    <td className="mkad-money-muted">{b.date}</td>
                                </tr>
                            ))}
                            {recent.length === 0 && <tr><td colSpan={7}><div className="mkad-empty"><div className="big">🎫</div>مفيش حجوزات لسه.</div></td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
