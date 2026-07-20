import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Building2, User, CheckCircle2, XCircle, Clock, ShieldCheck, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';

const TYPE_LABELS = { tour: 'رحلة', hotel: 'فندق', restaurant: 'مطعم', car: 'عربية', sahb: 'باكدج' };

export default function Approvals({ stats, pending_providers = [], pending_services = [] }) {
    const [rejecting, setRejecting] = useState(null); // { kind, id, type? }
    const [reason, setReason] = useState('');

    const approveProvider = (c) => {
        if (!confirm(`الموافقة على ${c.name}؟`)) return;
        router.post(`/admin/approvals/providers/${c.id}/approve`);
    };
    const approveService = (s) => {
        router.post(`/admin/approvals/services/${s.type}/${s.id}/approve`);
    };

    const openReject = (kind, id, type = null) => {
        setRejecting({ kind, id, type });
        setReason('');
    };
    const confirmReject = () => {
        if (!reason.trim() || !rejecting) return;
        const url = rejecting.kind === 'provider'
            ? `/admin/approvals/providers/${rejecting.id}/reject`
            : `/admin/approvals/services/${rejecting.type}/${rejecting.id}/reject`;
        router.post(url, { reason }, {
            onSuccess: () => setRejecting(null),
        });
    };

    return (
        <AdminLayout title="لوحة الموافقات" crumb="مراجعة المزوّدين والخدمات">
            <Head title="الموافقات" />

            {/* الإحصائيات */}
            <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <StatCard icon={<Building2 className="h-5 w-5" />} label="مزوّدون في الانتظار" value={stats.pending_providers} tone="royal" />
                <StatCard icon={<ClipboardList className="h-5 w-5" />} label="خدمات في المراجعة" value={stats.pending_services} tone="coral" />
                <StatCard icon={<FileText className="h-5 w-5" />} label="مستندات في المراجعة" value={stats.pending_documents} tone="vip" />
            </div>

            {/* المزوّدون في الانتظار */}
            <section className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 font-head text-lg font-bold text-navy">
                    <Building2 className="h-5 w-5 text-coral-deep" />
                    مزوّدون في الانتظار ({pending_providers.length})
                </h2>
                {pending_providers.length === 0 ? (
                    <EmptyRow label="لا توجد طلبات مزوّدين حالياً" />
                ) : (
                    <div className="overflow-x-auto rounded-card border border-black/[.06] bg-white shadow-mk">
                        <table className="w-full text-start text-sm">
                            <thead className="bg-beige/60 text-navy">
                                <tr>
                                    <th className="px-4 py-3 text-start font-bold">المزوّد</th>
                                    <th className="px-4 py-3 text-start font-bold">النوع</th>
                                    <th className="px-4 py-3 text-start font-bold">التواصل</th>
                                    <th className="px-4 py-3 text-start font-bold">المستندات</th>
                                    <th className="px-4 py-3 text-start font-bold">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending_providers.map((c) => (
                                    <tr key={c.id} className="border-t border-black/[.06]">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-navy">{c.name}</div>
                                            <div className="text-[12.5px] text-muted">مالك: {c.owner}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="soft">
                                                {c.provider_type === 'individual' ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                                                {c.provider_type === 'individual' ? 'فرد' : 'شركة'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-[13px]">{c.phone || '—'}</div>
                                            <div className="text-[12.5px] text-muted">{c.email || '—'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-[13px] font-bold">{c.docs_count} مستند</div>
                                            {c.needs_criminal_record && (
                                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger">
                                                    <AlertTriangle className="h-3 w-3" /> فيش وتشبيه مطلوب
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button size="sm" onClick={() => approveProvider(c)}>
                                                    <CheckCircle2 className="h-4 w-4" /> موافقة
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => openReject('provider', c.id)}>
                                                    <XCircle className="h-4 w-4" /> رفض
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* الخدمات في الانتظار */}
            <section>
                <h2 className="mb-3 flex items-center gap-2 font-head text-lg font-bold text-navy">
                    <ClipboardList className="h-5 w-5 text-coral-deep" />
                    خدمات مطلوبة النشر ({pending_services.length})
                </h2>
                {pending_services.length === 0 ? (
                    <EmptyRow label="لا توجد خدمات مطلوبة النشر" />
                ) : (
                    <div className="overflow-x-auto rounded-card border border-black/[.06] bg-white shadow-mk">
                        <table className="w-full text-start text-sm">
                            <thead className="bg-beige/60 text-navy">
                                <tr>
                                    <th className="px-4 py-3 text-start font-bold">الخدمة</th>
                                    <th className="px-4 py-3 text-start font-bold">النوع</th>
                                    <th className="px-4 py-3 text-start font-bold">المزوّد</th>
                                    <th className="px-4 py-3 text-start font-bold">وقت الإرسال</th>
                                    <th className="px-4 py-3 text-start font-bold">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending_services.map((s) => (
                                    <tr key={`${s.type}-${s.id}`} className="border-t border-black/[.06]">
                                        <td className="px-4 py-3 font-bold text-navy">{s.title}</td>
                                        <td className="px-4 py-3"><Badge variant="soft">{TYPE_LABELS[s.type] ?? s.type}</Badge></td>
                                        <td className="px-4 py-3 text-[13px]">{s.provider}</td>
                                        <td className="px-4 py-3 text-[12.5px] text-muted">
                                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.submitted_at || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button size="sm" onClick={() => approveService(s)}>
                                                    <ShieldCheck className="h-4 w-4" /> نشر
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => openReject('service', s.id, s.type)}>
                                                    <XCircle className="h-4 w-4" /> رفض
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Modal الرفض */}
            <Dialog open={!!rejecting} onOpenChange={(v) => { if (!v) setRejecting(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] bg-danger/[.12] text-danger">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <DialogTitle>سبب الرفض</DialogTitle>
                    </DialogHeader>
                    <div className="mb-2 text-sm text-muted">اكتب سبب الرفض — سيصل للمزوّد ليعرف ما هو المطلوب.</div>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-input border border-black/10 bg-white p-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                        placeholder="مثلاً: المستندات ناقصة / السعر غير واقعي / …"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejecting(null)}>إلغاء</Button>
                        <Button onClick={confirmReject} disabled={!reason.trim()}>
                            تأكيد الرفض
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

function StatCard({ icon, label, value, tone = 'coral' }) {
    const toneMap = {
        coral: 'from-coral to-coral-deep',
        royal: 'from-royal to-[#2A2450]',
        vip: 'from-vip to-[#8B6A1E]',
    };
    return (
        <div className="flex items-center gap-4 rounded-card border border-black/[.06] bg-white p-5 shadow-mk">
            <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br ${toneMap[tone]} text-white`}>
                {icon}
            </div>
            <div>
                <div className="text-[13px] font-semibold text-muted">{label}</div>
                <div className="font-head text-2xl font-bold text-navy">{value}</div>
            </div>
        </div>
    );
}

function EmptyRow({ label }) {
    return (
        <div className="rounded-card border border-dashed border-black/[.12] bg-white p-6 text-center text-sm text-muted">
            {label}
        </div>
    );
}
