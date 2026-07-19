import { Head, Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token, email: email || '', password: '', password_confirmation: '',
    });
    const submit = (e) => { e.preventDefault(); post('/reset-password'); };

    return (
        <div className="mk">
            <Head title="إعادة تعيين كلمة المرور" />
            <div className="mk-auth">
                <div className="mk-auth-art">
                    <span className="mk-badge mk-badge-makfol">🔐 خطوة أخيرة</span>
                    <h2 style={{ marginTop: 16 }}>كلمة مرور<br />جديدة</h2>
                    <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 16 }}>اختار كلمة مرور قوية وابدأ رحلتك من جديد.</p>
                </div>
                <div className="mk-auth-form">
                    <form onSubmit={submit}>
                        <img className="logo" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 style={{ marginBottom: 22 }}>تعيين كلمة مرور جديدة</h2>

                        <label className="mk-field"><span className="mk-label">الإيميل</span>
                            <input className={`mk-input ${errors.email ? 'is-error' : ''}`} type="email" value={data.email}
                                onChange={(e) => setData('email', e.target.value)} /></label>
                        {errors.email && <p style={{ color: 'var(--mk-danger)', fontSize: 13, marginTop: -8 }}>{errors.email}</p>}

                        <label className="mk-field"><span className="mk-label">كلمة المرور الجديدة</span>
                            <input className={`mk-input ${errors.password ? 'is-error' : ''}`} type="password" value={data.password}
                                onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" /></label>
                        {errors.password && <p style={{ color: 'var(--mk-danger)', fontSize: 13, marginTop: -8 }}>{errors.password}</p>}

                        <label className="mk-field"><span className="mk-label">تأكيد كلمة المرور</span>
                            <input className="mk-input" type="password" value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" /></label>

                        <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg" style={{ marginTop: 8 }}>
                            {processing ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14 }}>
                            <Link href="/login" style={{ color: 'var(--mk-coral-deep)', fontWeight: 800 }}>← رجوع لتسجيل الدخول</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
