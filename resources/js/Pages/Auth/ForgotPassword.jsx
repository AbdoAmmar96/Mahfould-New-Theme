import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const submit = (e) => { e.preventDefault(); post('/forgot-password'); };

    return (
        <div className="mk min-h-screen bg-cream font-body text-navy">
            <Head title="نسيت كلمة المرور" />
            <div className="grid min-h-[calc(100vh-74px)] grid-cols-1 lg:grid-cols-2">
                {/* اللوحة الجانبية */}
                <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy to-navy-light p-[60px] text-white lg:flex lg:flex-col lg:justify-center">
                    <div className="pointer-events-none absolute -bottom-40 -start-24 h-[400px] w-[400px] rounded-full bg-coral opacity-30 blur-[110px]" />
                    <div className="relative z-[1]">
                        <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> استرجاع آمن</Badge>
                        <h2 className="mt-4 mb-2 font-head text-[34px] font-bold leading-tight text-white">نسيت كلمة<br />المرور؟</h2>
                        <p className="text-base text-white/[.78]">اكتب إيميلك وهنبعتلك رابط تعيّن بيه كلمة مرور جديدة.</p>
                    </div>
                </div>

                {/* النموذج */}
                <div className="flex items-center p-[34px_22px] lg:p-[60px]">
                    <form onSubmit={submit} className="mx-auto w-full max-w-[380px]">
                        <img className="mb-[26px] h-10" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 className="mb-1 font-head text-[26px] font-bold text-navy">استرجاع كلمة المرور</h2>
                        <p className="mb-[22px] text-muted">هنبعتلك رابط على إيميلك</p>

                        {status && (
                            <div className="mb-4 block rounded-full bg-makfol px-3.5 py-2.5 text-sm font-semibold text-white">{status}</div>
                        )}

                        <Field label="الإيميل">
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@example.com"
                                autoFocus
                                className={errors.email ? 'border-danger bg-danger/[.04]' : ''}
                            />
                        </Field>
                        {errors.email && <p className="mt-1.5 text-[13px] text-danger">{errors.email}</p>}

                        <Button type="submit" disabled={processing} block size="lg" className="mt-2">
                            {processing ? 'جاري الإرسال…' : 'ابعتلي الرابط'}
                        </Button>
                        <p className="mt-[22px] text-center text-sm">
                            <Link href="/login" className="inline-flex items-center gap-1 font-extrabold text-coral-deep">
                                <ArrowLeft className="h-4 w-4" /> رجوع لتسجيل الدخول
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
