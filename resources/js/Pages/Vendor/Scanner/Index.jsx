import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ScanLine, CheckCircle2, XCircle, AlertCircle, User, Calendar, BedDouble, Users2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

const REASON_LABELS = {
    code_missing: 'كود مفقود',
    not_found: 'الكود غير موجود',
    already_used: 'تم استخدامه من قبل',
    expired: 'منتهي الصلاحية',
    inactive: 'غير نشط',
    invalid: 'توقيع غير صحيح',
};

export default function Scanner({ recent }) {
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [confirming, setConfirming] = useState(false);

    const csrf = () => document.querySelector('meta[name=csrf-token]')?.content;

    const verify = async () => {
        if (!code.trim()) return;
        setVerifying(true);
        setResult(null);
        try {
            // لو الماسح رجّع payload JSON (من QR فعلي)، نحاول نستخرج الكود
            let payload = null;
            let scanCode = code.trim();
            if (scanCode.startsWith('{')) {
                payload = scanCode; scanCode = null;
            }
            const res = await fetch('/vendor/scanner/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'Accept': 'application/json' },
                body: JSON.stringify({ code: scanCode, payload }),
            });
            setResult(await res.json());
        } finally {
            setVerifying(false);
        }
    };

    const confirm = async () => {
        if (!result?.pass?.code) return;
        setConfirming(true);
        try {
            const res = await fetch(`/vendor/scanner/${result.pass.code}/mark-used`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf(), 'Accept': 'application/json' },
            });
            const data = await res.json();
            if (data.ok) {
                setResult({ ...result, used: true, scanned_at: data.scanned_at });
            } else {
                alert('حصل خطأ — جرّب تاني.');
            }
        } finally {
            setConfirming(false);
        }
    };

    const reset = () => { setCode(''); setResult(null); };

    return (
        <AdminLayout title="مسح QR" crumb="لوحة الشريك › تصريح دخول">
            <Head title="مسح QR" />

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                {/* Scanner Panel */}
                <div>
                    <div className="rounded-card border border-black/[.06] bg-white p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-royal/[.1] text-royal">
                                <ScanLine className="h-6 w-6" />
                            </span>
                            <div>
                                <h2 className="font-head text-lg font-bold text-navy">قارئ تصريح الدخول</h2>
                                <p className="text-[13px] text-muted">اقرأ الـQR من موبايل العميل، أو الصق الكود يدوياً.</p>
                            </div>
                        </div>

                        <Field label="كود التصريح (EP-XXXX-XXXX-XXXX) أو الصق QR payload">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="EP-ABCD-EFGH-IJKL"
                                className="text-center font-mono"
                                onKeyDown={(e) => e.key === 'Enter' && verify()}
                                autoFocus
                            />
                        </Field>

                        <div className="mt-4 flex gap-2">
                            <Button block onClick={verify} disabled={verifying || !code.trim()}>
                                <ScanLine className="h-4 w-4" /> {verifying ? 'جاري التحقق…' : 'تحقّق'}
                            </Button>
                            {result && <Button variant="secondary" onClick={reset}>مسح</Button>}
                        </div>

                        {/* Result */}
                        {result && result.ok && (
                            <div className="mt-5 rounded-card border-2 border-makfol bg-makfol/[.06] p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="h-6 w-6 text-makfol" />
                                    <b className="font-head text-lg text-makfol">تصريح صحيح</b>
                                    {result.used && <Badge variant="soft">✓ تم الاعتماد</Badge>}
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Row icon={User} label="العميل"><b>{result.pass.booking.customer_name}</b></Row>
                                    <Row label="الموبايل"><b dir="ltr">{result.pass.booking.customer_phone}</b></Row>
                                    <Row icon={Calendar} label="التاريخ">
                                        <b>{result.pass.booking.start_date}{result.pass.booking.end_date && ` → ${result.pass.booking.end_date}`}</b>
                                        {result.pass.booking.nights && <span className="ms-2 text-muted">({result.pass.booking.nights} ليلة)</span>}
                                    </Row>
                                    <Row icon={BedDouble} label="الخدمة"><b>{result.pass.booking.service}</b></Row>
                                    {result.pass.booking.room_type && <Row label="نوع الغرفة"><b>{result.pass.booking.room_type}</b></Row>}
                                    <Row icon={Users2} label="عدد الأفراد"><b>{result.pass.booking.guests} فرد</b></Row>
                                    <Row label="رقم الحجز"><code className="rounded bg-white px-2 py-0.5 font-mono text-[12px] text-navy">{result.pass.booking.code}</code></Row>
                                </div>

                                {!result.used && (
                                    <Button block className="mt-4" onClick={confirm} disabled={confirming}>
                                        <CheckCircle2 className="h-4 w-4" /> {confirming ? 'جاري…' : 'اعتمد الدخول'}
                                    </Button>
                                )}
                                {result.used && (
                                    <p className="mt-3 flex items-center gap-1.5 rounded-input bg-white p-2.5 text-[12.5px] text-muted">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-makfol" /> اتعمد الدخول في {result.scanned_at}
                                    </p>
                                )}
                            </div>
                        )}

                        {result && !result.ok && (
                            <div className="mt-5 rounded-card border-2 border-danger bg-danger/[.06] p-5 text-center">
                                <XCircle className="mx-auto h-12 w-12 text-danger" />
                                <b className="mt-2 block font-head text-lg text-danger">تصريح غير صحيح</b>
                                <p className="mt-1 text-sm text-navy">
                                    السبب: <b>{REASON_LABELS[result.reason] || result.reason}</b>
                                </p>
                                {result.code && <code className="mt-2 inline-block rounded bg-white px-2 py-0.5 font-mono text-[11px] text-muted">{result.code}</code>}
                            </div>
                        )}

                        {/* Tip */}
                        {!result && (
                            <div className="mt-5 flex items-start gap-2 rounded-input bg-beige/40 p-3 text-[12.5px] text-muted">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-royal" />
                                <span>
                                    نصيحة: استخدم أي تطبيق قارئ QR على الموبايل، ثم انسخ الكود والصقه هنا.
                                    الأكواد بتبدأ بـ<b>EP-</b>.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Scans */}
                <div>
                    <div className="rounded-card border border-black/[.06] bg-white p-5">
                        <h3 className="mb-3 font-head text-base font-bold text-navy">آخر المسحوبين</h3>
                        {recent.length === 0 ? (
                            <p className="text-center text-[13px] text-muted">لسه معنش أي دخول اليوم.</p>
                        ) : (
                            <div className="space-y-2">
                                {recent.map((r) => (
                                    <div key={r.code} className="rounded-input border border-black/[.04] bg-beige/20 p-2.5 text-[12.5px]">
                                        <div className="flex items-center justify-between gap-2">
                                            <b className="text-navy">{r.customer_name}</b>
                                            <span className="text-muted">{r.scanned_at?.split(' ')[1]}</span>
                                        </div>
                                        <div className="text-muted">
                                            {r.booking_code} · <code className="text-[10px]">{r.code}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function Row({ icon: Icon, label, children }) {
    return (
        <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted" />}
            <span className={cn('flex-none text-[12.5px] text-muted', Icon ? 'w-24' : 'w-28 ps-6')}>{label}</span>
            <span className="text-navy">{children}</span>
        </div>
    );
}
