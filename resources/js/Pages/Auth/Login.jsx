import { Head, Link, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({ login: '', password: '', remember: false });
    const submit = (e) => { e.preventDefault(); post('/login'); };

    return (
        <div className="mk">
            <Head title="تسجيل الدخول" />
            <div className="mk-auth">
                <div className="mk-auth-art">
                    <span className="mk-badge mk-badge-makfol">✓ رحلتك محفولة مكفولة</span>
                    <h2 style={{ marginTop: 16 }}>أهلاً بيك تاني في<br />محفول مكفول</h2>
                    <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 16 }}>سجّل دخولك وكمّل رحلتك — حجوزاتك، مفضلتك، وكل مفاجآتك في مكان واحد.</p>
                    <div style={{ display: 'flex', gap: 22, marginTop: 26 }}>
                        <div><div style={{ fontFamily: 'var(--mk-font-head)', fontSize: 26, fontWeight: 700 }}>50k+</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>رحلة مكفولة</div></div>
                        <div><div style={{ fontFamily: 'var(--mk-font-head)', fontSize: 26, fontWeight: 700 }}>4.9★</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>تقييم العملاء</div></div>
                    </div>
                </div>
                <div className="mk-auth-form">
                    <form onSubmit={submit}>
                        <img className="logo" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 style={{ marginBottom: 4 }}>تسجيل الدخول</h2>
                        <p className="mk-muted" style={{ marginBottom: 22 }}>أدخل بياناتك للمتابعة</p>
                        <label className="mk-field"><span className="mk-label">رقم الموبايل أو الإيميل</span>
                            <input className={`mk-input ${errors.login ? 'is-error' : ''}`} value={data.login} onChange={(e) => setData('login', e.target.value)} placeholder="010xxxxxxxx" /></label>
                        {errors.login && <p style={{ color: 'var(--mk-danger)', fontSize: 13, marginTop: -8 }}>{errors.login}</p>}
                        <label className="mk-field"><span className="mk-label">كلمة المرور</span>
                            <input className="mk-input" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" /></label>
                        <div className="mk-between" style={{ marginBottom: 18 }}>
                            <label className="mk-check" style={{ fontSize: 13 }}><input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} /> تذكرني</label>
                            <Link href="/forgot-password" style={{ color: 'var(--mk-coral-deep)', fontSize: 13, fontWeight: 700 }}>نسيت كلمة المرور؟</Link>
                        </div>
                        <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg">{processing ? 'جاري الدخول…' : 'دخول'}</button>
                        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14 }}>لسه معندكش حساب؟ <Link href="/register" style={{ color: 'var(--mk-coral-deep)', fontWeight: 800 }}>سجّل مجاناً</Link></p>
                    </form>
                </div>
            </div>
        </div>
    );
}
