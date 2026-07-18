import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', phone: '', email: '', password: '', password_confirmation: '',
    });
    const submit = (e) => { e.preventDefault(); post('/register'); };

    return (
        <div className="mk">
            <Head title="حساب جديد" />
            <div className="mk-auth">
                <div className="mk-auth-art">
                    <span className="mk-badge mk-badge-makfol">✓ انضم لمحفول مكفول</span>
                    <h2 style={{ marginTop: 16 }}>ابدأ رحلتك<br />الأولى معانا</h2>
                    <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 16 }}>سجّل في دقيقة، واحجز رحلات وفنادق ومطاعم — كلها بسعر مكفول.</p>
                </div>
                <div className="mk-auth-form">
                    <form onSubmit={submit}>
                        <img className="logo" src="/assets/img/logo.png" alt="محفول مكفول" />
                        <h2 style={{ marginBottom: 4 }}>حساب جديد</h2>
                        <p className="mk-muted" style={{ marginBottom: 22 }}>مجاني تماماً</p>
                        <label className="mk-field"><span className="mk-label">الاسم بالكامل</span>
                            <input className={`mk-input ${errors.name ? 'is-error' : ''}`} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="عمرو شلبي" /></label>
                        <label className="mk-field"><span className="mk-label">رقم الموبايل</span>
                            <input className={`mk-input ${errors.phone ? 'is-error' : ''}`} value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="010xxxxxxxx" /></label>
                        <label className="mk-field"><span className="mk-label">البريد الإلكتروني</span>
                            <input className={`mk-input ${errors.email ? 'is-error' : ''}`} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="you@email.com" /></label>
                        {errors.email && <p style={{ color: 'var(--mk-danger)', fontSize: 13, marginTop: -8 }}>{errors.email}</p>}
                        <label className="mk-field"><span className="mk-label">كلمة المرور</span>
                            <input className="mk-input" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" /></label>
                        <label className="mk-field"><span className="mk-label">تأكيد كلمة المرور</span>
                            <input className="mk-input" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} placeholder="••••••••" /></label>
                        <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg" style={{ marginTop: 8 }}>{processing ? 'جاري التسجيل…' : 'إنشاء الحساب'}</button>
                        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14 }}>عندك حساب؟ <Link href="/login" style={{ color: 'var(--mk-coral-deep)', fontWeight: 800 }}>سجّل دخول</Link></p>
                    </form>
                </div>
            </div>
        </div>
    );
}
