// محفول مكفول — الصفحة الرئيسية لبوابة الشركاء (البائع)
import { Head } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { money } from '../../Components/Admin/cells';

export default function VendorDashboard({ stats }) {
    return (
        <AdminLayout title="بوابة الشركاء" crumb="ملخّص نشاطك على المنصة">
            <Head title="بوابة الشركاء" />
            <div className="mkad-stats">
                {stats.map((s) => (
                    <div key={s.label} className={`mkad-stat tone-${s.tone}`}>
                        <span className="val">{s.money ? `${money(s.value)} ج.م` : s.value}</span>
                        <span className="lbl">{s.label}</span>
                        <span className="note">{s.note}</span>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
