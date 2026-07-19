import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const submit = (e) => { e.preventDefault(); post('/forgot-password'); };

    return (
        <div className="mk">
            <Head title="نسيت كلمة المرور" />
            <div className="mk-auth">
                <div className="mk-auth-art">
                    <span className="mk-badge mk-badge-makfol">🔐 استرجاع آمن</span>
                    <h2 style={{ marginTop: 16 }}>نسيت كلمة<br />المرور؟</h2>
                    <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 16 }}>اكتب إيميلك وهنبعتلك رابط تعيّن بيه كلمة مرور جديدة.</p>
                </div>
                <div className="mk-auth-form">
                    <form onSubmit={submit}>
                        <img className="logo" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 style={{ marginBottom: 4 }}>استرجاع كلمة المرور</h2>
                        <p className="mk-muted" style={{ marginBottom: 22 }}>هنبعتلك رابط على إيميلك</p>

                        {status && <div className="mk-badge mk-badge-makfol" style={{ display: 'block', marginBottom: 16, padding: '10px 14px' }}>{status}</div>}

                        <label className="mk-field"><span className="mk-label">الإيميل</span>
                            <input className={`mk-input ${errors.email ? 'is-error' : ''}`} type="email" value={data.email}
                                onChange={(e) => setData('email', e.target.value)} placeholder="you@example.com" autoFocus /></label>
                        {errors.email && <p style={{ color: 'var(--mk-danger)', fontSize: 13, marginTop: -8 }}>{errors.email}</p>}

                        <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg" style={{ marginTop: 8 }}>
                            {processing ? 'جاري الإرسال…' : 'ابعتلي الرابط'}
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
