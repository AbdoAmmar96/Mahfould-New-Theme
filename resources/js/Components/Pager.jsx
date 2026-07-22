import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

/**
 * ترقيم صفحات موحّد لكل القوائم.
 *
 * كان موجود في صفحة الرحلات بس — الفنادق والسيارات والمطاعم والباصات
 * مكانش عندهم أي ترقيم خالص، يعني أي نتيجة بعد الصفحة الأولى مستحيل توصلها
 * (70 رحلة باص × 12 لكل صفحة = 58 رحلة مخفية).
 *
 * بيترجم لافتات Laravel الإنجليزية (« Previous / Next ») لعربي،
 * وبيخلي الأسهم المعطّلة نص مش لينك عشان الضغط عليها ما يعملش زيارة فاضية.
 */
export default function Pager({ paginator, className }) {
    if (! paginator?.links || (paginator.last_page ?? 1) <= 1) return null;

    const label = (raw) => {
        const clean = String(raw).replace(/&laquo;|&raquo;|«|»/g, '').trim();
        if (/previous/i.test(clean)) return 'السابق';
        if (/next/i.test(clean)) return 'التالي';
        return clean;
    };

    return (
        <nav aria-label="صفحات النتائج" className={cn('mt-8 flex flex-wrap justify-center gap-2', className)}>
            {paginator.links.map((lnk, i) =>
                lnk.url ? (
                    <Button key={i} asChild size="sm" variant={lnk.active ? 'primary' : 'secondary'} className="min-w-[42px]">
                        <Link href={lnk.url} aria-current={lnk.active ? 'page' : undefined}>{label(lnk.label)}</Link>
                    </Button>
                ) : (
                    // معطّل — span مش Link، عشان ما يبعتش زيارة للصفحة الحالية
                    <span
                        key={i}
                        aria-disabled="true"
                        className="inline-flex min-w-[42px] cursor-not-allowed items-center justify-center rounded-input px-3 py-2 text-[13px] font-bold text-muted opacity-50"
                    >
                        {label(lnk.label)}
                    </span>
                ),
            )}
        </nav>
    );
}
