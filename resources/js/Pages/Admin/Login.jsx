// محفول مكفول — دخول لوحات التحكم (أدمن + بائع)
import { Head, useForm } from '@inertiajs/react';
import { LogIn } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';

export default function Login({ panel = 'admin', postUrl = '/admin/login', title = 'لوحة التحكم' }) {
    const { data, setData, post, processing, errors } = useForm({ login: '', password: '', remember: false });
    const submit = (e) => { e.preventDefault(); post(postUrl); };

    return (
        <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy to-navy-light p-6">
            <Head title={`دخول ${title}`} />
            <form onSubmit={submit} className="w-full max-w-[400px] rounded-section bg-white px-[34px] py-[38px] shadow-mk-lg">
                <img src="/assets/img/logo.png" alt="محفول مكفول" className="mx-auto mb-[18px] block h-[46px]" />
                <h2 className="mb-1 text-center font-head text-[23px] font-bold text-navy">{title}</h2>
                <p className="mb-6 text-center text-sm text-muted">
                    {panel === 'vendor' ? 'سجّل دخولك كشريك لإدارة خدماتك' : 'دخول مخصّص لفريق الإدارة'}
                </p>

                <Field label="رقم الموبايل أو الإيميل" className="mb-3.5">
                    <Input
                        value={data.login}
                        onChange={(e) => setData('login', e.target.value)}
                        placeholder="admin@mahfolmakfol.com"
                        autoFocus
                        className={errors.login ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
                    />
                    {errors.login && <span className="text-[12.5px] text-danger">{errors.login}</span>}
                </Field>

                <Field label="كلمة المرور" className="mb-[18px]">
                    <Input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                    />
                </Field>

                <label className="mb-[18px] flex cursor-pointer select-none items-center gap-2.5">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="peer sr-only"
                    />
                    <span className="relative h-[25px] w-11 flex-shrink-0 rounded-full bg-[#D8CFC0] transition-colors after:absolute after:top-[3px] after:start-[3px] after:h-[19px] after:w-[19px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,.2)] after:transition-transform peer-checked:bg-makfol peer-checked:after:-translate-x-[19px]" />
                    <span className="text-sm font-semibold">تذكرني</span>
                </label>

                <Button type="submit" disabled={processing} block size="lg">
                    <LogIn className="h-4 w-4" />
                    {processing ? 'جاري الدخول…' : 'دخول'}
                </Button>
            </form>
        </div>
    );
}
