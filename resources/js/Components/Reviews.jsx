// محفول مكفول — قسم التقييمات (عرض + إضافة)
import { usePage, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

function Stars({ value, onSelect }) {
    return (
        <div className="mk-stars" role={onSelect ? 'radiogroup' : undefined}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n}
                    className={`mk-star ${n <= value ? 'on' : ''} ${onSelect ? 'clickable' : ''}`}
                    onClick={onSelect ? () => onSelect(n) : undefined}>★</span>
            ))}
        </div>
    );
}

export default function Reviews({ reviews = [], type, id }) {
    const { auth } = usePage().props;
    const [rating, setRating] = useState(5);
    const { data, setData, post, processing, errors, reset } = useForm({ type, id, rating: 5, title: '', content: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/reviews', {
            preserveScroll: true,
            onSuccess: () => { reset('title', 'content'); setRating(5); },
        });
    };

    const setStars = (n) => { setRating(n); setData('rating', n); };
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

    return (
        <div className="mk-detail-block">
            <div className="mk-between" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>التقييمات {reviews.length > 0 && <span style={{ color: 'var(--mk-muted)', fontWeight: 600, fontSize: 15 }}>({reviews.length})</span>}</h3>
                {avg && <span className="mk-rate" style={{ fontSize: 16 }}>★ {avg}</span>}
            </div>

            {/* قائمة التقييمات */}
            {reviews.length === 0 && <p className="mk-muted" style={{ margin: '0 0 18px' }}>لسه مفيش تقييمات — كن أول واحد يقيّم.</p>}
            {reviews.map((r, i) => (
                <div key={i} className="mk-review">
                    <div className="mk-between">
                        <div className="mk-flex" style={{ gap: 10 }}>
                            <div className="mk-avatar" style={{ width: 38, height: 38, fontSize: 15 }}>{(r.name || '؟').trim().charAt(0)}</div>
                            <div>
                                <b style={{ fontFamily: 'var(--mk-font-head)' }}>{r.name}</b>
                                <div style={{ fontSize: 12, color: 'var(--mk-muted)' }}>{r.date}</div>
                            </div>
                        </div>
                        <Stars value={r.rating} />
                    </div>
                    {r.title && <b style={{ display: 'block', marginTop: 10 }}>{r.title}</b>}
                    {r.content && <p style={{ margin: '4px 0 0', color: 'var(--mk-muted)', fontSize: 14.5 }}>{r.content}</p>}
                </div>
            ))}

            {/* نموذج الإضافة */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--mk-border)' }}>
                {auth?.user ? (
                    <form onSubmit={submit}>
                        <b style={{ display: 'block', marginBottom: 10 }}>أضف تقييمك</b>
                        <div style={{ marginBottom: 12 }}><Stars value={rating} onSelect={setStars} /></div>
                        <label className="mk-field"><input className="mk-input" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="عنوان مختصر (اختياري)" /></label>
                        <label className="mk-field">
                            <textarea className={`mk-input ${errors.content ? 'is-error' : ''}`} rows={3} value={data.content}
                                onChange={(e) => setData('content', e.target.value)} placeholder="اكتب تجربتك…" style={{ resize: 'vertical' }} />
                        </label>
                        <button type="submit" disabled={processing} className="mk-btn mk-btn-primary">{processing ? 'جاري الإرسال…' : 'أرسل التقييم'}</button>
                    </form>
                ) : (
                    <p className="mk-muted" style={{ margin: 0 }}>
                        عايز تقيّم؟ <Link href="/login" style={{ color: 'var(--mk-coral-deep)', fontWeight: 700 }}>سجّل دخولك</Link> الأول.
                    </p>
                )}
            </div>
        </div>
    );
}
