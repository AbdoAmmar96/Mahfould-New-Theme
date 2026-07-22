// لبنات محتوى بتتكرّر في صفحات التفاصيل.
import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/** عنوان قسم داخل الصفحة */
export function Heading({ children, icon: Icon, action }) {
    return (
        <div className="mb-3 flex items-center gap-2">
            <h2 className="flex flex-1 items-center gap-2 font-head text-[18px] font-bold text-navy">
                {Icon && <Icon className="h-[18px] w-[18px] text-coral-deep" />}
                {children}
            </h2>
            {action}
        </div>
    );
}

/** شبكة حقائق — أيقونة + قيمة + وصف */
export function FactGrid({ items = [] }) {
    const shown = items.filter(Boolean);
    if (!shown.length) return null;

    return (
        <div className="grid grid-cols-2 gap-2.5">
            {shown.map(({ icon: Icon, value, label }, i) => (
                <div key={i} className="rounded-card bg-white p-3.5 shadow-[0_1px_5px_rgba(54,54,119,.06)]">
                    <Icon className="h-[19px] w-[19px] text-coral-deep" />
                    <div className="mt-2 text-[15px] font-extrabold leading-tight text-navy">{value}</div>
                    <div className="mt-0.5 text-[12px] text-muted">{label}</div>
                </div>
            ))}
        </div>
    );
}

/** صفوف ملاحظات — أيقونة + عنوان + شرح */
export function NoteList({ items = [], tone = 'plain' }) {
    const shown = items.filter(Boolean);
    if (!shown.length) return null;

    return (
        <div
            className={cn(
                'overflow-hidden rounded-card',
                tone === 'plain' ? 'bg-white shadow-[0_1px_5px_rgba(54,54,119,.06)]' : 'bg-makfol/[.07]',
            )}
        >
            {shown.map(({ icon: Icon, title, text }, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-black/[.05] p-3.5 last:border-0">
                    <span
                        className={cn(
                            'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
                            tone === 'plain' ? 'bg-beige' : 'bg-makfol/15',
                        )}
                    >
                        <Icon className={cn('h-[16px] w-[16px]', tone === 'plain' ? 'text-navy' : 'text-makfol')} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-extrabold text-navy">{title}</span>
                        {text && <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{text}</span>}
                    </span>
                </div>
            ))}
        </div>
    );
}

/** صف بيودّي لصفحة قسم تاني — للتشويق والتنقّل */
export function PeekRow({ href, icon: Icon, label, sub, cta = 'اعرض' }) {
    return (
        <Link
            href={href}
            className="mk-press flex items-center gap-3 rounded-card bg-white p-3.5 shadow-[0_1px_5px_rgba(54,54,119,.06)]"
        >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-beige">
                <Icon className="h-[19px] w-[19px] text-coral-deep" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-extrabold text-navy">{label}</span>
                {sub && <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-muted">{sub}</span>}
            </span>
            <span className="shrink-0 text-[12.5px] font-bold text-coral-deep">{cta}</span>
            <ChevronLeft className="h-[17px] w-[17px] shrink-0 text-navy/25" />
        </Link>
    );
}
