// محفول مكفول — لبنات وضع الموبايل (إحساس أبليكشن)
// كل حاجة هنا بتتستعمل في صفحات الليست والتفاصيل بدل ما نكرّر الكود.
import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, MapPin, Heart, ChevronRight, ChevronLeft, ChevronDown, SlidersHorizontal, ArrowUpDown, X, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/Components/ui/sheet';
import { money } from '@/Components/ui/service-card';
import MkImage from './MkImage';
import { cn } from '@/lib/utils';

/** ارتفاع شريط التبويب السفلي — أي حاجة ثابتة تحت لازم تقف فوقه */
export const TABBAR_OFFSET = 'calc(57px + env(safe-area-inset-bottom))';

/* ══════════════ سكرول أفقي بمؤشّر «فيه كمان» ══════════════
   من غير المؤشّر ده المستخدم بيفتكر إن اللي ظاهر هو كل حاجة.
   بيظهر تدرّج + سهم على الحافة، ويختفي أول ما توصل للآخر. */
export function HScroller({ children, className, fadeFrom = 'from-white', onEndTap, arrowTop = '50%' }) {
    const ref = useRef(null);
    const [more, setMore] = useState(false);

    const update = () => {
        const el = ref.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        // في RTL بيبقى scrollLeft سالب في بعض المتصفحات — abs بيغطّي الحالتين
        setMore(max > 4 && Math.abs(el.scrollLeft) < max - 4);
    };

    useEffect(() => {
        update();
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [children]);

    const nudge = () => {
        const el = ref.current;
        if (!el) return;
        // في RTL الاتجاه للأمام بيبقى بالسالب
        el.scrollBy({ left: el.clientWidth * -0.7, behavior: 'smooth' });
    };

    return (
        <div className="relative">
            <div ref={ref} onScroll={update} className={cn('mk-hscroll flex overflow-x-auto', className)}>
                {children}
            </div>

            {more && (
                <>
                    <div className={cn('pointer-events-none absolute inset-y-0 end-0 w-14 bg-gradient-to-l', fadeFrom, 'to-transparent')} />
                    <button
                        type="button"
                        onClick={onEndTap ?? nudge}
                        aria-label="عرض المزيد"
                        style={{ top: arrowTop }}
                        className="mk-press absolute end-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-mk ring-1 ring-black/[.06] backdrop-blur"
                    >
                        <ChevronLeft className="h-[17px] w-[17px] text-navy" strokeWidth={2.6} />
                    </button>
                </>
            )}
        </div>
    );
}

/* ══════════════ زر إغلاق — دايرة صغيرة على قد علامة X ══════════════
   الزر نفسه 44×44 عشان هدف اللمس، والدايرة الظاهرة جوّاه 26px بس.
   ليه مش نصغّر الزر نفسه؟ لإن في app.css قاعدة عامة على الأجهزة اللمسية
   بتفرض min-height:44px على أي button — فزر 26px كان هيطلع بيضاوي
   (26 عرض × 44 ارتفاع) بدل ما يبقى دايرة. */
export function CloseButton({ onClick, tone = 'light', label = 'إغلاق', className }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn('mk-press grid h-11 w-11 shrink-0 place-items-center rounded-full', className)}
        >
            <span
                className={cn(
                    'mk-close grid h-[28px] w-[28px] place-items-center rounded-full border-[1.5px]',
                    tone === 'dark'
                        ? 'border-white/70 bg-white/25 text-white backdrop-blur-md'
                        : 'border-navy/25 bg-beige text-navy shadow-[0_1px_3px_rgba(54,54,119,.12)]',
                )}
            >
                <X className="h-[15px] w-[15px]" strokeWidth={2.8} />
            </span>
        </button>
    );
}

/* ══════════════ شيت بـgrabber ══════════════ */
export function MobileSheet({ open, onOpenChange, title, children, full = false, footer }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className={cn(
                    'mk mk-sheet flex flex-col rounded-t-[22px] border-0 p-0',
                    full ? 'h-[92vh]' : 'max-h-[86vh]',
                )}
            >
                <div className="shrink-0 px-4 pt-3">
                    <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-navy/20" />
                    <div className="flex items-center gap-2 pb-3">
                        <SheetTitle className="flex-1 text-[17px]">{title}</SheetTitle>
                        <CloseButton onClick={() => onOpenChange(false)} className="-me-2" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
                {footer && (
                    <div className="shrink-0 border-t border-black/[.06] bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
                        {footer}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

/* ══════════════ زرار أساسي بعرض كامل ══════════════ */
export function MobileCTA({ children, onClick, href, disabled, variant = 'primary' }) {
    const cls = cn(
        'mk-press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-input text-[16px] font-extrabold transition-opacity',
        variant === 'primary' && 'bg-gradient-to-l from-coral to-coral-deep text-white shadow-mk',
        variant === 'secondary' && 'border-2 border-navy/10 bg-white text-navy',
        disabled && 'pointer-events-none opacity-50',
    );
    if (href) return <Link href={href} className={cls}>{children}</Link>;
    return <button type="button" onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

/* ══════════════ شريط أكشن ثابت تحت (فوق التبويب) ══════════════
   مهم: بنعمله portal لـ<body> بدل ما يفضل جوّه <main>.
   السبب: <main> عليه animation بتخلّي الـtransform matrix (مش none)،
   وأي transform بيبقى containing block لأي position:fixed جوّاه —
   فالشريط كان بيقف في نص الصفحة بدل ما يفضل ثابت تحت. */
export function MobileStickyBar({ price, unit, note, ctaLabel, onCta, ctaHref, children }) {
    const bar = (
        <div
            className="mk-appbar fixed inset-x-0 z-30 border-t border-black/[.08] bg-white/95 px-4 py-2.5 backdrop-blur-xl lg:hidden"
            style={{ bottom: TABBAR_OFFSET }}
        >
            {children ?? (
                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1">
                            <span className="font-head text-[21px] font-extrabold text-coral-deep">{money(price)}</span>
                            <span className="text-[12px] font-semibold text-muted">ج.م{unit ? ` / ${unit}` : ''}</span>
                        </div>
                        {note && <p className="truncate text-[11.5px] text-muted">{note}</p>}
                    </div>
                    <div className="w-[46%] shrink-0">
                        <MobileCTA onClick={onCta} href={ctaHref}>{ctaLabel}</MobileCTA>
                    </div>
                </div>
            )}
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(bar, document.body) : bar;
}

/* ══════════════ معرض صور full-bleed بـsnap ══════════════
   نقاط مؤشّر بدل «1/5» + تدرّج تحت عشان العنوان اللي فوقه يبان. */
export function MobileGallery({ images = [], badges, saved, onToggleSave }) {
    const [idx, setIdx] = useState(0);
    const ref = useRef(null);

    const onScroll = () => {
        const el = ref.current;
        if (!el || !el.clientWidth) return;
        setIdx(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    };

    return (
        <div className="relative bg-beige">
            <div ref={ref} onScroll={onScroll} className="mk-hscroll flex w-full overflow-x-auto">
                {images.map((src, i) => (
                    <MkImage
                        key={i}
                        src={src}
                        priority={i === 0}
                        ratio="aspect-[4/3]"
                        wrapperClassName="w-full shrink-0"
                    />
                ))}
            </div>

            {/* تدرّج سفلي — بيفصل الصورة عن الكارت اللي طالع فوقها */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-deep/35 to-transparent" />

            {badges && <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">{badges}</div>}

            <button
                type="button"
                onClick={onToggleSave}
                aria-label={saved ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                className="mk-press absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-mk backdrop-blur"
            >
                <Heart className={cn('h-[19px] w-[19px]', saved ? 'fill-coral-deep text-coral-deep' : 'text-navy')} />
            </button>

            {/* نقاط — أنضف من عدّاد رقمي */}
            {images.length > 1 && (
                <div className="absolute inset-x-0 bottom-8 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                'h-1.5 rounded-full bg-white transition-all duration-300',
                                i === idx ? 'w-5 opacity-100' : 'w-1.5 opacity-50',
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ══════════════ قسم في صفحة التفاصيل ══════════════
   كارت بحواف دايرية على خلفية كريمي — بدل بلوكات بيضا ملزوقة (شكل ويب). */
export function MobileSection({ title, icon: Icon, children, collapsible = false, defaultOpen = true, action }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section className="mx-4 mt-3 rounded-card bg-white p-4 shadow-[0_2px_10px_rgba(54,54,119,.05)]">
            <div className="flex items-center gap-2">
                <h2 className="flex flex-1 items-center gap-2 font-head text-[16.5px] font-bold text-navy">
                    {Icon && <Icon className="h-[18px] w-[18px] text-coral-deep" />}
                    {title}
                </h2>
                {action}
                {collapsible && (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        aria-label={open ? 'إخفاء' : 'إظهار'}
                        className="mk-press flex h-9 w-9 items-center justify-center rounded-full"
                    >
                        <ChevronDown className={cn('h-5 w-5 text-navy/50 transition-transform duration-200', open && 'rotate-180')} />
                    </button>
                )}
            </div>
            {(!collapsible || open) && <div className="mt-3">{children}</div>}
        </section>
    );
}

/* ══════════════ رأس صفحة التفاصيل ══════════════
   كارت بيطلع فوق الصورة (‑mt) — النمط الكلاسيكي في تطبيقات السفر. */
export function MobileDetailHead({ title, location, score, count, sub, facts, price, unit }) {
    return (
        <div className="relative z-10 -mt-5 rounded-t-[22px] bg-cream px-4 pb-1 pt-4">
            <div className="flex items-start gap-3">
                <h1 className="flex-1 font-head text-[21px] font-bold leading-snug text-navy">{title}</h1>
                {price > 0 && (
                    <div className="shrink-0 text-end">
                        <div className="font-head text-[20px] font-extrabold leading-none text-coral-deep">{money(price)}</div>
                        <div className="mt-0.5 text-[11px] font-semibold text-muted">ج.م{unit ? ` / ${unit}` : ''}</div>
                    </div>
                )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-muted">
                {location && (
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="h-[15px] w-[15px]" /> {location}
                    </span>
                )}
                {score > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-navy">
                        <Star className="h-[15px] w-[15px] fill-vip text-vip" /> {score.toFixed(1)}
                        <span className="font-semibold text-muted">({count})</span>
                    </span>
                )}
            </div>

            {sub && <p className="mt-1.5 text-[13px] text-muted">{sub}</p>}

            {/* حقائق سريعة كـchips */}
            {facts?.length > 0 && (
                <div className="mk-hscroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
                    {facts.filter(Boolean).map((f, i) => (
                        <span key={i} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-bold text-navy shadow-[0_1px_4px_rgba(54,54,119,.06)]">
                            {f}
                        </span>
                    ))}
                    <span className="w-1 shrink-0" />
                </div>
            )}
        </div>
    );
}

/* ══════════════ كارت في قائمة (صورة + محتوى جنبها) ══════════════ */
export function MobileListCard({ item, unit, feats, badges }) {
    // مش كل خدمة ليها سعر رقمي — المطاعم مثلاً بتستعمل price_range ($$)
    const raw = item.sale_price ?? item.price;
    const hasPrice = Number.isFinite(Number(raw)) && Number(raw) > 0;

    return (
        <Link href={item.url} className="mk-press flex gap-3 border-b border-black/[.05] bg-white p-3 last:border-0">
            <div className="relative h-[104px] w-[104px] shrink-0">
                <MkImage src={item.image_url} alt={item.title} ratio="aspect-square" wrapperClassName="h-full w-full rounded-card" />
                {badges}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="line-clamp-2 text-[14.5px] font-extrabold leading-snug text-navy">{item.title}</h3>
                {(item.location || item.address) && (
                    <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{item.location || item.address}</span>
                    </p>
                )}
                {feats && <p className="mt-1 line-clamp-1 text-[11.5px] text-muted">{feats}</p>}
                <div className="mt-auto flex items-end justify-between pt-1.5">
                    <div>
                        {hasPrice ? (
                            <>
                                {item.sale_price && <s className="me-1 text-[11.5px] text-muted">{money(item.price)}</s>}
                                <span className="font-head text-[17px] font-extrabold text-coral-deep">{money(raw)}</span>
                                <span className="text-[11px] font-semibold text-muted"> ج.م{unit ? ` / ${unit}` : ''}</span>
                            </>
                        ) : (
                            item.price_range && (
                                <span className="font-head text-[15px] font-extrabold text-navy">{item.price_range}</span>
                            )
                        )}
                    </div>
                    {item.review_score > 0 && (
                        <span className="flex items-center gap-0.5 rounded-md bg-beige px-1.5 py-0.5 text-[11.5px] font-bold text-navy">
                            <Star className="h-3 w-3 fill-vip text-vip" /> {item.review_score.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* ══════════════ شريط بحث/فلترة ثابت فوق ══════════════ */
export function MobileFilterBar({
    q, onQ, placeholder = 'ابحث…',
    activeCount = 0, onOpenFilters,
    sortLabel, onOpenSort,
}) {
    return (
        <div className="sticky top-[56px] z-30 border-b border-black/[.06] bg-white/95 backdrop-blur-xl">
            {onQ && (
                <div className="px-4 pt-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-[17px] w-[17px] text-muted" />
                        <input
                            value={q}
                            onChange={(e) => onQ(e.target.value)}
                            placeholder={placeholder}
                            className="h-11 w-full rounded-input border border-black/[.08] bg-beige/50 pe-3 ps-10 text-[14.5px] text-navy outline-none placeholder:text-muted focus:border-coral"
                        />
                    </div>
                </div>
            )}
            <div className="flex gap-2 px-4 py-2.5">
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className={cn(
                        'mk-press flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-input border text-[13.5px] font-bold',
                        activeCount > 0 ? 'border-coral bg-coral/10 text-coral-deep' : 'border-black/[.1] text-navy',
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" /> فلترة
                    {activeCount > 0 && (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral-deep px-1 text-[11px] font-extrabold text-white">
                            {activeCount}
                        </span>
                    )}
                </button>
                {onOpenSort && (
                    <button
                        type="button"
                        onClick={onOpenSort}
                        className="mk-press flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-input border border-black/[.1] text-[13.5px] font-bold text-navy"
                    >
                        <ArrowUpDown className="h-4 w-4" /> {sortLabel || 'ترتيب'}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ══════════════ اختيار من قائمة داخل شيت ══════════════ */
export function MobileOptionList({ options, value, onChange }) {
    return (
        <div className="space-y-0.5">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className="mk-press flex min-h-[50px] w-full items-center gap-3 rounded-input px-2 text-start"
                >
                    <span
                        className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                            value === o.value ? 'border-coral-deep' : 'border-black/20',
                        )}
                    >
                        {value === o.value && <span className="h-2.5 w-2.5 rounded-full bg-coral-deep" />}
                    </span>
                    <span className={cn('text-[15px]', value === o.value ? 'font-extrabold text-navy' : 'font-semibold text-navy/80')}>
                        {o.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

/* ══════════════ حالة فاضية ══════════════ */
export function MobileEmpty({ text, actionLabel, onAction }) {
    return (
        <div className="px-6 py-16 text-center">
            <Search className="mx-auto h-11 w-11 text-muted/50" />
            <p className="mt-3 text-[14.5px] text-muted">{text}</p>
            {actionLabel && (
                <button type="button" onClick={onAction} className="mk-press mt-4 min-h-[44px] rounded-input bg-beige px-5 text-[14px] font-bold text-navy">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

/* ══════════════ ترقيم الصفحات — «حمّل المزيد» بدل أرقام ══════════════ */
export function MobilePager({ paginator }) {
    if (!paginator?.links || paginator.last_page <= 1) return null;
    const next = paginator.links.find((l) => l.label.includes('التالي') || l.label.includes('Next'))?.url;
    return (
        <div className="px-4 py-5">
            {next ? (
                <MobileCTA href={next} variant="secondary">
                    عرض المزيد <ChevronRight className="h-4 w-4 rotate-180" />
                </MobileCTA>
            ) : (
                <p className="text-center text-[13px] text-muted">وصلت لآخر النتائج</p>
            )}
        </div>
    );
}
