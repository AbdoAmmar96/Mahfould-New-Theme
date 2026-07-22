// ملخّص التقييمات — المتوسط + توزيع النجوم.
// التوزيع بيتحسب من التقييمات اللي جاية فعلاً، مش أرقام مكتوبة بالإيد.
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReviewSummary({ score = 0, count = 0, reviews = [], noun = 'ضيف' }) {
    if (!score && !reviews.length) return null;

    // عدد كل تقييم من 5 لـ1
    const buckets = [5, 4, 3, 2, 1].map((n) => ({
        n,
        c: reviews.filter((r) => Math.round(r.rating) === n).length,
    }));
    const total = reviews.length;

    return (
        <div className="mx-4 rounded-card bg-white p-4 shadow-[0_1px_5px_rgba(54,54,119,.06)]">
            <div className="flex items-center gap-4">
                <div className="shrink-0 text-center">
                    <div className="font-head text-[34px] font-extrabold leading-none text-navy">
                        {score.toFixed(1)}
                    </div>
                    <div className="mt-1.5 flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                                key={n}
                                className={cn(
                                    'h-[13px] w-[13px]',
                                    n <= Math.round(score) ? 'fill-vip text-vip' : 'text-black/15',
                                )}
                            />
                        ))}
                    </div>
                    <div className="mt-1 text-[11.5px] font-semibold text-muted">{count} {noun}</div>
                </div>

                {/* أعمدة التوزيع — بتوضّح إذا كان المتوسط متماسك ولا متفرّق */}
                {total > 0 ? (
                    <div className="min-w-0 flex-1 space-y-1">
                        {buckets.map(({ n, c }) => (
                            <div key={n} className="flex items-center gap-2">
                                <span className="w-2 shrink-0 text-[11px] font-bold text-muted">{n}</span>
                                <Star className="h-[11px] w-[11px] shrink-0 fill-vip text-vip" />
                                <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-black/[.06]">
                                    <span
                                        className="block h-full rounded-full bg-vip transition-[width] duration-500"
                                        style={{ width: `${(c / total) * 100}%` }}
                                    />
                                </span>
                                <span className="w-4 shrink-0 text-end text-[11px] font-semibold text-muted">{c}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    // المتوسط محفوظ على المنتج نفسه، لكن مفيش تقييمات مكتوبة —
                    // بنقول كده صراحةً بدل ما نسيب أعمدة فاضية توحي إن في مشكلة.
                    <p className="min-w-0 flex-1 border-s border-black/[.07] ps-3 text-[13px] leading-relaxed text-muted">
                        ده متوسط التقييم العام. لسه مفيش مراجعات مكتوبة منشورة على الصفحة دي.
                    </p>
                )}
            </div>
        </div>
    );
}
