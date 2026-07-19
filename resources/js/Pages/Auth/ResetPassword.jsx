import { Head, Link, useForm } from '@inertiajs/react';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token, email: email || '', password: '', password_confirmation: '',
    });
    const submit = (e) => { e.preventDefault(); post('/reset-password'); };

    return (
        <div dir="rtl" className="min-h-screen bg-cream font-body text-navy">
            <Head title="إعادة تعيين كلمة المرور" />
            <div className="grid min-h-[calc(100vh-74px)] grid-cols-1 md:grid-cols-2">
                {/* اللوحة الجانبية */}
                <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy to-navy-light p-[60px] text-white md:flex md:flex-col md:justify-center">
                    <div className="pointer-events-none absolute -bottom-40 -start-24 h-[400px] w-[400px] rounded-full bg-coral opacity-30 blur-[110px]" />
                    <div className="relative z-[1]">
                        <Badge variant="makfol" className="w-fit"><KeyRound className="h-3.5 w-3.5" /> خطوة أخيرة</Badge>
                        <h2 className="mt-4 font-head text-[34px] font-bold leading-tight text-white">كلمة مرور<br />جديدة</h2>
                        <p className="mt-2 text-base text-white/[.78]">اختار كلمة مرور قوية وابدأ رحلتك من جديد.</p>
                    </div>
                </div>

                {/* النموذج */}
                <div className="flex items-center px-[22px] py-[34px] md:p-[60px]">
                    <form onSubmit={submit} className="mx-auto w-full max-w-[380px]">
                        <img className="mb-[26px] h-10" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 className="mb-[22px] font-head text-[26px] font-bold text-navy">تعيين كلمة مرور جديدة</h2>

                        <div className="mb-3.5">
                            <Field label="الإيميل">
                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                    className={errors.email ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} />
                            </Field>
                            {errors.email && <p className="mt-1.5 text-[13px] text-danger">{errors.email}</p>}
                        </div>

                        <div className="mb-3.5">
                            <Field label="كلمة المرور الجديدة">
                                <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••"
                                    className={errors.password ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} />
                            </Field>
                            {errors.password && <p className="mt-1.5 text-[13px] text-danger">{errors.password}</p>}
                        </div>

                        <div className="mb-3.5">
                            <Field label="تأكيد كلمة المرور">
                                <Input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" />
                            </Field>
                        </div>

                        <Button type="submit" disabled={processing} block size="lg" className="mt-2">
                            {processing ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}
                        </Button>
                        <p className="mt-[22px] text-center text-sm">
                            <Link href="/login" className="inline-flex items-center gap-1 font-extrabold text-coral-deep hover:text-coral">
                                <ArrowLeft className="h-4 w-4" /> رجوع لتسجيل الدخول
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
