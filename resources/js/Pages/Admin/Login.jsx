// محفول مكفول — دخول لوحات التحكم (أدمن + بائع)
import '../../../css/admin.css';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ panel = 'admin', postUrl = '/admin/login', title = 'لوحة التحكم' }) {
    const { data, setData, post, processing, errors } = useForm({ login: '', password: '', remember: false });
    const submit = (e) => { e.preventDefault(); post(postUrl); };

    return (
        <div className="mkad-login">
            <Head title={`دخول ${title}`} />
            <form className="mkad-login-card" onSubmit={submit}>
                <img src="/assets/img/logo.png" alt="محفول مكفول" />
                <h2>{title}</h2>
                <p className="sub">{panel === 'vendor' ? 'سجّل دخولك كشريك لإدارة خدماتك' : 'دخول مخصّص لفريق الإدارة'}</p>

                <div className="mkad-field" style={{ marginBottom: 14 }}>
                    <label>رقم الموبايل أو الإيميل</label>
                    <input className={`mkad-input ${errors.login ? 'is-error' : ''}`} value={data.login}
                        onChange={(e) => setData('login', e.target.value)} placeholder="admin@mahfolmakfol.com" autoFocus />
                    {errors.login && <span className="mkad-err">{errors.login}</span>}
                </div>

                <div className="mkad-field" style={{ marginBottom: 18 }}>
                    <label>كلمة المرور</label>
                    <input className="mkad-input" type="password" value={data.password}
                        onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" />
                </div>

                <label className="mkad-toggle" style={{ marginBottom: 18 }}>
                    <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                    <span className="track" /><span className="tlabel">تذكرني</span>
                </label>

                <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-block mk-btn-lg">
                    {processing ? 'جاري الدخول…' : 'دخول'}
                </button>
            </form>
        </div>
    );
}
