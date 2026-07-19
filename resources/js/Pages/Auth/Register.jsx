import { Head, Link, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', phone: '', email: '', password: '', password_confirmation: '',
    });
    const submit = (e) => { e.preventDefault(); post('/register'); };

    return (
        <>
            <Head title="حساب جديد" />
            <div className="grid min-h-[calc(100vh-74px)] grid-cols-1 lg:grid-cols-2">
                {/* اللوحة التعريفية */}
                <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy to-navy-light p-[60px] text-white lg:flex lg:flex-col lg:justify-center">
                    <div className="pointer-events-none absolute -bottom-40 -start-24 h-[400px] w-[400px] rounded-full bg-coral opacity-30 blur-[110px]" />
                    <div className="relative z-[1]">
                        <Badge variant="makfol"><Check className="h-3.5 w-3.5" /> انضم لمحفول مكفول</Badge>
                        <h2 className="mt-4 font-head text-[34px] font-bold leading-[1.35] text-white">ابدأ رحلتك<br />الأولى معانا</h2>
                        <p className="mt-2 text-base text-white/[.78]">سجّل في دقيقة، واحجز رحلات وفنادق ومطاعم — كلها بسعر مكفول.</p>
                    </div>
                </div>

                {/* النموذج */}
                <div className="flex items-center justify-center p-[34px_22px] sm:p-[60px]">
                    <form onSubmit={submit} className="w-full max-w-[380px]">
                        <img className="mb-[26px] h-10" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 className="mb-1 font-head text-[26px] font-bold text-navy">حساب جديد</h2>
                        <p className="mb-[22px] text-muted">مجاني تماماً</p>

                        <div className="space-y-3.5">
                            <Field label="الاسم بالكامل">
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="عمرو شلبي" className={errors.name ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} />
                            </Field>
                            <Field label="رقم الموبايل">
                                <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="010xxxxxxxx" className={errors.phone ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} />
                            </Field>
                            <Field label="البريد الإلكتروني">
                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="you@email.com" className={errors.email ? 'border-danger focus:border-danger focus:ring-danger/20' : ''} />
                            </Field>
                            {errors.email && <p className="text-[13px] text-danger">{errors.email}</p>}
                            <Field label="كلمة المرور">
                                <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" />
                            </Field>
                            <Field label="تأكيد كلمة المرور">
                                <Input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" />
                            </Field>
                        </div>

                        <Button type="submit" disabled={processing} block size="lg" className="mt-4">{processing ? 'جاري التسجيل…' : 'إنشاء الحساب'}</Button>
                        <p className="mt-[22px] text-center text-sm">عندك حساب؟ <Link href="/login" className="font-extrabold text-coral-deep">سجّل دخول</Link></p>
                    </form>
                </div>
            </div>
        </>
    );
}
