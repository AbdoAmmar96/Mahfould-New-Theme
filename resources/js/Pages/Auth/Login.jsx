import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ShieldCheck, Star, Info, Store, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input, Field } from '@/Components/ui/input';
import MobileAuth from '@/Components/mobile/MobileAuth';
import { MobileCTA } from '@/Components/mobile/primitives';
import { useIsMobile } from '@/lib/useIsMobile';

export default function Login() {
    const isMobile = useIsMobile();
    const { data, setData, post, processing, errors } = useForm({ login: '', password: '', remember: false });
    const submit = (e) => { e.preventDefault(); post('/login'); };
    const page = usePage();
    // لو جاي من صفحة محمية (زي checkout) بيبيّن رسالة توضيحية
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    const cameFromCheckout = referrer.includes('/checkout');

    if (isMobile) {
        return (
            <>
                <Head title="تسجيل الدخول" />
                <MobileAuth
                    title="أهلاً بيك تاني"
                    sub="سجّل دخولك وكمّل رحلتك"
                    badge={<Badge variant="makfol"><ShieldCheck className="h-3 w-3" /> رحلتك محفولة مكفولة</Badge>}
                >
                    <form onSubmit={submit} className="flex flex-1 flex-col">
                        {cameFromCheckout && (
                            <div className="mb-4 flex items-start gap-2 rounded-input border border-royal/25 bg-royal/[.06] p-3 text-[13px] text-navy">
                                <Info className="mt-0.5 h-4 w-4 flex-none text-royal" />
                                <span>لازم تسجّل دخولك قبل ما تكمل الحجز — بنحفظ خطواتك تلقائياً.</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Field label="رقم الموبايل أو الإيميل">
                                <Input
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    placeholder="010xxxxxxxx"
                                    inputMode="email"
                                    className={errors.login ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
                                />
                            </Field>
                            {errors.login && <p className="-mt-2 text-[13px] text-danger">{errors.login}</p>}

                            <Field label="كلمة المرور">
                                <Input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                            </Field>

                            <div className="flex items-center justify-between gap-4">
                                <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-navy">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="accent-coral"
                                    /> تذكرني
                                </label>
                                <Link href="/forgot-password" className="mk-press text-[13.5px] font-bold text-coral-deep">
                                    نسيت كلمة المرور؟
                                </Link>
                            </div>
                        </div>

                        {/* الأكشن تحت — زي أبليكشن */}
                        <div className="mt-auto space-y-4 pt-8">
                            <button
                                type="submit"
                                disabled={processing}
                                className="mk-press flex min-h-[52px] w-full items-center justify-center rounded-input bg-gradient-to-l from-coral to-coral-deep text-[16px] font-extrabold text-white shadow-mk disabled:opacity-50"
                            >
                                {processing ? 'جاري الدخول…' : 'دخول'}
                            </button>
                            <p className="text-center text-[14px] text-navy">
                                لسه معندكش حساب؟ <Link href="/register" className="font-extrabold text-coral-deep">سجّل مجاناً</Link>
                            </p>
                            <div className="border-t border-black/[.07] pt-4">
                                <MobileCTA href="/vendor/login" variant="secondary">
                                    <Store className="h-4 w-4" /> دخول شريك
                                </MobileCTA>
                            </div>
                        </div>
                    </form>
                </MobileAuth>
            </>
        );
    }

    return (
        <>
            <Head title="تسجيل الدخول" />
            <div className="grid min-h-[calc(100vh-74px)] grid-cols-1 md:grid-cols-2 2xl:min-h-screen">
                <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-navy to-navy-light p-[60px] text-white md:flex 2xl:p-[80px]">
                    <div className="pointer-events-none absolute -bottom-40 -start-24 h-[400px] w-[400px] rounded-full bg-coral opacity-30 blur-[110px]" />
                    <div className="relative z-[1] mx-auto max-w-[560px] 2xl:max-w-[720px]">
                        <Badge variant="makfol"><ShieldCheck className="h-3.5 w-3.5" /> رحلتك محفولة مكفولة</Badge>
                        <h2 className="mt-4 font-head text-[34px] font-bold leading-[1.35] text-white 2xl:text-[44px]">أهلاً بيك تاني في<br />محفول مكفول</h2>
                        <p className="text-base text-white/[.78] 2xl:text-lg">سجّل دخولك وكمّل رحلتك — حجوزاتك، مفضلتك، وكل مفاجآتك في مكان واحد.</p>
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

                        {/* دخول شريك */}
                        <div className="mt-8 rounded-card border border-white/20 bg-white/[.06] p-4">
                            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold">
                                <Store className="h-4 w-4" /> شريك محفول مكفول؟
                            </div>
                            <p className="mb-3 text-[13px] text-white/70">دخول لوحة الشركاء لإدارة خدماتك وحجوزاتك.</p>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/vendor/login" className="inline-flex items-center gap-1 rounded-input bg-white/10 px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-white/20">
                                    دخول شريك <ArrowLeft className="h-3 w-3" />
                                </Link>
                                <Link href="/provider/register" className="inline-flex items-center gap-1 rounded-input border border-white/25 px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-white/10">
                                    تسجيل شريك جديد
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center px-[22px] py-[34px] md:p-[60px] 2xl:p-[80px]">
                    <form onSubmit={submit} className="mx-auto w-full max-w-[380px] 2xl:max-w-[440px]">
                        <img className="mb-[26px] h-10" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 className="mb-1 font-head text-[26px] font-bold text-navy">تسجيل الدخول</h2>
                        <p className="mb-[22px] text-muted">أدخل بياناتك للمتابعة</p>

                        {cameFromCheckout && (
                            <div className="mb-4 flex items-start gap-2 rounded-input border border-royal/25 bg-royal/[.06] p-3 text-[13px] text-navy">
                                <Info className="mt-0.5 h-4 w-4 flex-none text-royal" />
                                <span>لازم تسجّل دخولك قبل ما تكمل الحجز — بنحفظ خطواتك تلقائياً.</span>
                            </div>
                        )}

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
