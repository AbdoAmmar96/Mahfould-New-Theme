import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({ login: '', password: '', remember: false });
    const submit = (e) => { e.preventDefault(); post('/login'); };

    return (
        <>
            <Head title="تسجيل الدخول" />
            <div className="grid min-h-[calc(100vh-74px)] grid-cols-1 md:grid-cols-2">
                {/* اللوحة الفنية */}
                <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-navy to-navy-light p-[60px] text-white md:flex">
                    <div className="pointer-events-none absolute -bottom-40 -start-24 h-[400px] w-[400px] rounded-full bg-coral opacity-30 blur-[110px]" />
                    <div className="relative z-[1]">
                        <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> رحلتك محفولة مكفولة</Badge>
                        <h2 className="mt-4 font-head text-[34px] font-bold leading-[1.35] text-white">أهلاً بيك تاني في<br />محفول مكفول</h2>
                        <p className="text-base text-white/[.78]">سجّل دخولك وكمّل رحلتك — حجوزاتك، مفضلتك، وكل مفاجآتك في مكان واحد.</p>
                        <div className="mt-[26px] flex gap-[22px]">
                            <div>
                                <div className="font-head text-[26px] font-bold">50k+</div>
                                <div className="text-[13px] text-white/70">رحلة مكفولة</div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1 font-head text-[26px] font-bold">4.9 <Star className="h-5 w-5 fill-vip text-vip" /></div>
                                <div className="text-[13px] text-white/70">تقييم العملاء</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* النموذج */}
                <div className="flex items-center justify-center px-[22px] py-[34px] md:p-[60px]">
                    <form onSubmit={submit} className="mx-auto w-full max-w-[380px]">
                        <img className="mb-[26px] h-10" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 className="mb-1 font-head text-[26px] font-bold text-navy">تسجيل الدخول</h2>
                        <p className="mb-[22px] text-muted">أدخل بياناتك للمتابعة</p>

                        <Field label="رقم الموبايل أو الإيميل" className="mb-3.5">
                            <Input
                                value={data.login}
                                onChange={(e) => setData('login', e.target.value)}
                                placeholder="010xxxxxxxx"
                                className={errors.login ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
                            />
                        </Field>
                        {errors.login && <p className="-mt-2 mb-3.5 text-[13px] text-danger">{errors.login}</p>}

                        <Field label="كلمة المرور" className="mb-3.5">
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                        </Field>

                        <div className="mb-[18px] flex items-center justify-between gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-[17px] w-[17px] accent-coral"
                                /> تذكرني
                            </label>
                            <Link href="/forgot-password" className="text-[13px] font-bold text-coral-deep">نسيت كلمة المرور؟</Link>
                        </div>

                        <Button type="submit" disabled={processing} block size="lg">{processing ? 'جاري الدخول…' : 'دخول'}</Button>

                        <p className="mt-[22px] text-center text-sm">لسه معندكش حساب؟ <Link href="/register" className="font-extrabold text-coral-deep">سجّل مجاناً</Link></p>
                    </form>
                </div>
            </div>
        </>
    );
}
