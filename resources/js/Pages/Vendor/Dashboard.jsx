// محفول مكفول — الصفحة الرئيسية لبوابة الشركاء (البائع)
import { Head } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { money } from '../../Components/Admin/cells';

const TONE = {
    good: 'text-makfol',
    primary: 'text-coral-deep',
    info: 'text-navy',
};

export default function VendorDashboard({ stats }) {
    return (
        <AdminLayout title="بوابة الشركاء" crumb="ملخّص نشاطك على المنصة">
            <Head title="بوابة الشركاء" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="flex flex-col gap-1.5 rounded-card border border-black/[.06] bg-white p-5 shadow-mk">
                        <span className={`font-head text-[30px] font-bold leading-none ${TONE[s.tone] || 'text-navy'}`}>
                            {s.money ? `${money(s.value)} ج.م` : s.value}
                        </span>
                        <span className="text-sm font-semibold text-muted">{s.label}</span>
                        <span className="text-[12.5px] text-muted">{s.note}</span>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
