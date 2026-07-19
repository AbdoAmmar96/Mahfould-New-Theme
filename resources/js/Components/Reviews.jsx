// محفول مكفول — قسم التقييمات (عرض + إضافة)
import { usePage, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

function Stars({ value, onSelect }) {
    return (
        <div className="inline-flex gap-0.5" role={onSelect ? 'radiogroup' : undefined}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n}
                    onClick={onSelect ? () => onSelect(n) : undefined}
                    className={cn(
                        onSelect ? 'h-[26px] w-[26px] cursor-pointer transition-transform hover:scale-[1.15]' : 'h-[18px] w-[18px]',
                        n <= value ? 'fill-[#F5A623] text-[#F5A623]' : 'fill-transparent text-sandline',
                    )} />
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
        <div className="mb-5 rounded-card border border-black/[.06] bg-white p-6">
            <div className="mb-3.5 flex items-center justify-between gap-4">
                <h3 className="font-head text-[19px] font-bold text-navy">التقييمات {reviews.length > 0 && <span className="text-[15px] font-semibold text-muted">({reviews.length})</span>}</h3>
                {avg && <span className="inline-flex items-center gap-1 text-base font-extrabold text-vip"><Star className="h-4 w-4 fill-vip text-vip" /> {avg}</span>}
            </div>

            {/* قائمة التقييمات */}
            {reviews.length === 0 && <p className="mb-[18px] text-muted">لسه مفيش تقييمات — كن أول واحد يقيّم.</p>}
            {reviews.map((r, i) => (
                <div key={i} className="border-b border-black/[.06] py-4 last-of-type:border-b-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-deep font-head text-[15px] font-bold text-white">{(r.name || '؟').trim().charAt(0)}</div>
                            <div>
                                <b className="font-head">{r.name}</b>
                                <div className="text-xs text-muted">{r.date}</div>
                            </div>
                        </div>
                        <Stars value={r.rating} />
                    </div>
                    {r.title && <b className="mt-2.5 block">{r.title}</b>}
                    {r.content && <p className="mt-1 text-[14.5px] text-muted">{r.content}</p>}
                </div>
            ))}

            {/* نموذج الإضافة */}
            <div className="mt-5 border-t border-black/[.06] pt-5">
                {auth?.user ? (
                    <form onSubmit={submit}>
                        <b className="mb-2.5 block">أضف تقييمك</b>
                        <div className="mb-3"><Stars value={rating} onSelect={setStars} /></div>
                        <Input className="mb-3.5" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="عنوان مختصر (اختياري)" />
                        <textarea
                            className={cn(
                                'mb-3.5 w-full resize-y rounded-input border bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-muted/70 focus:border-coral focus:ring-2 focus:ring-coral/20',
                                errors.content ? 'border-danger ring-2 ring-danger/20' : 'border-black/10',
                            )}
                            rows={3} value={data.content}
                            onChange={(e) => setData('content', e.target.value)} placeholder="اكتب تجربتك…" />
                        <Button type="submit" disabled={processing}>{processing ? 'جاري الإرسال…' : 'أرسل التقييم'}</Button>
                    </form>
                ) : (
                    <p className="text-muted">
                        عايز تقيّم؟ <Link href="/login" className="font-bold text-coral-deep">سجّل دخولك</Link> الأول.
                    </p>
                )}
            </div>
        </div>
    );
}
