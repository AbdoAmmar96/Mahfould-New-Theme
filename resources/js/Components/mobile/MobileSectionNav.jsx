// شريط أقسام التفاصيل — سطر واحد، وكل زر بيفتح صفحة مستقلة.
//
// قبل كده كان scroll-spy جوّه صفحة واحدة طويلة؛ دلوقتي كل قسم صفحة لوحده
// والزر النشط هو الصفحة اللي إنت فيها.
import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function MobileSectionNav({ items = [], className }) {
    const ref = useRef(null);
    const shown = items.filter(Boolean);

    // الزر النشط يفضل في المنظر — مهم لما الأقسام تبقى أكتر من اللي بيبان
    useEffect(() => {
        ref.current?.querySelector('[data-active="true"]')
            ?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }, []);

    if (shown.length < 2) return null;

    return (
        <div
            className={cn(
                'sticky top-[56px] z-30 border-b border-black/[.06] bg-cream/95 backdrop-blur-xl lg:hidden',
                className,
            )}
        >
            <div ref={ref} className="mk-hscroll flex gap-1 overflow-x-auto px-3" style={{ scrollSnapType: 'none' }}>
                {shown.map((it) => (
                    <Link
                        key={it.href}
                        href={it.href}
                        data-active={it.active ? 'true' : 'false'}
                        aria-current={it.active ? 'page' : undefined}
                        className={cn(
                            'relative shrink-0 whitespace-nowrap px-3 py-3 text-[14px] font-bold transition-colors',
                            it.active ? 'text-coral-deep' : 'text-navy/55',
                        )}
                    >
                        {it.label}
                        {it.badge ? (
                            <span className="ms-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-coral/15 px-1 text-[10.5px] font-extrabold text-coral-deep">
                                {it.badge}
                            </span>
                        ) : null}
                        <span
                            className={cn(
                                'absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-coral-deep transition-transform duration-200',
                                it.active ? 'scale-x-100' : 'scale-x-0',
                            )}
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}
