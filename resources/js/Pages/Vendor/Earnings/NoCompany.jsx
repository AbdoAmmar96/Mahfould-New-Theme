import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';

/**
 * المزوّد داخل على صفحة الأرباح وهو لسه مالوش ملف شركة.
 * (EarningsController@index بيرندر الصفحة دي لما $user->company تبقى null)
 */
export default function NoCompany() {
    return (
        <AdminLayout>
            <Head title="الأرباح" />

            <div className="mx-auto max-w-[720px] py-10">
                <div className="rounded-card border border-black/[.06] bg-white p-8 text-center shadow-mk">
                    <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-beige text-navy">
                        <Building2 className="h-8 w-8" />
                    </span>

                    <h1 className="mb-2.5 font-head text-2xl font-bold text-navy">
                        لسه مافيش ملف شركة مربوط بحسابك
                    </h1>
                    <p className="mx-auto mb-7 max-w-[460px] text-[15px] leading-relaxed text-muted">
                        صفحة الأرباح والتسويات بتشتغل بعد ما يتربط حسابك بملف شركة مُعتمد.
                        كلّم فريق محفول مكفول عشان يستكمل بياناتك ويفعّل الملف.
                    </p>

                    <div className="mb-7 grid grid-cols-1 gap-3 text-start sm:grid-cols-3">
                        {[
                            { Icon: FileText, title: 'استكمال البيانات', desc: 'السجل التجاري والبطاقة الضريبية' },
                            { Icon: ShieldCheck, title: 'مراجعة واعتماد', desc: 'فريقنا بيراجع المستندات' },
                            { Icon: Building2, title: 'تفعيل الأرباح', desc: 'تتابع أرباحك وتسوياتك' },
                        ].map(({ Icon, title, desc }, i) => (
                            <div key={i} className="rounded-input border border-black/[.06] bg-beige/40 p-4">
                                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-coral-deep">
                                    <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <b className="block text-[14px] font-extrabold text-navy">{title}</b>
                                <span className="text-[12.5px] text-muted">{desc}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button asChild>
                            <Link href="/p/contact">تواصل مع الفريق</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href="/vendor">
                                <ArrowLeft className="h-4 w-4" /> رجوع للوحة
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
