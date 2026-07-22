// محفول مكفول — هيكل صفحة التفاصيل على الموبايل
//
// الفرق بينه وبين الشكل القديم (اللي كان «ويب في موبايل»):
//   • الصورة بتاخد الشاشة كلها من فوق — مفيش آب-بار أبيض قاطع المنظر.
//     الأزرار بتبقى دواير زجاجية عايمة فوق الصورة.
//   • الآب-بار الأبيض بيتكوّن تدريجياً وإنت بتنزل، وبيجيب العنوان معاه.
//   • العنوان والتقييم على الصورة نفسها — مش في كارت منفصل تحتها.
//   • شريط أقسام لاصق بيتابع مكانك في الصفحة (scroll-spy) زي Airbnb.
//   • الصور بتتفتح على الشاشة كاملة باللمس.
//
// ملاحظة تقنية مهمة: أي عنصر position:fixed هنا لازم يتعمله portal لـ<body>.
// السبب إن <main> عليه animation، والـtransform بيخلّيه containing block
// لأي fixed جوّاه — فالعنصر بيتثبّت جوّه الصفحة بدل الشاشة.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Heart, Share2, Star, MapPin } from 'lucide-react';
import { CloseButton } from './primitives';
import MobileSectionNav from './MobileSectionNav';
import MkImage from './MkImage';
import { cn } from '@/lib/utils';

/* ارتفاع الآب-بار — الهيرو بيتلاشى تحته بالتدريج */
const BAR = 56;

/* ══════════════ عارض الصور بملء الشاشة ══════════════ */
function PhotoViewer({ images, start = 0, onClose }) {
    const ref = useRef(null);
    const [idx, setIdx] = useState(start);

    useEffect(() => {
        // نقفل السكرول ورا العارض
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const el = ref.current;
        if (el) el.scrollLeft = (el.clientWidth * start) * (document.dir === 'rtl' ? -1 : 1);

        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    }, [start, onClose]);

    const onScroll = () => {
        const el = ref.current;
        if (el?.clientWidth) setIdx(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    };

    return createPortal(
        <div className="mk-viewer fixed inset-0 z-[90] bg-black lg:hidden">
            <CloseButton
                onClick={onClose}
                tone="dark"
                className="absolute end-3 top-[calc(12px+env(safe-area-inset-top))] z-10"
            />

            <span className="absolute start-1/2 top-[calc(20px+env(safe-area-inset-top))] z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-bold text-white backdrop-blur">
                {idx + 1} / {images.length}
            </span>

            <div ref={ref} onScroll={onScroll} className="mk-hscroll flex h-full w-full items-center overflow-x-auto">
                {images.map((src, i) => (
                    <div key={i} className="grid h-full w-full shrink-0 place-items-center p-2">
                        <img src={src} alt="" className="max-h-full w-full object-contain" loading={i === start ? 'eager' : 'lazy'} />
                    </div>
                ))}
            </div>
        </div>,
        document.body,
    );
}

/* ══════════════ الآب-بار العايم / المتكوّن ══════════════ */
function OverlayBar({ progress, title, saved, onToggleSave, onShare }) {
    // solid = 0 فوق الصورة (دواير زجاجية) → 1 بعد ما تعدّي الصورة (بار أبيض)
    const solid = progress > 0.6;

    const round = (extra) => cn(
        'mk-press grid h-10 w-10 place-items-center rounded-full transition-colors duration-200',
        solid ? 'bg-transparent' : 'bg-black/35 backdrop-blur-sm',
        extra,
    );

    return createPortal(
        <div
            className="mk-appbar fixed inset-x-0 top-0 z-40 lg:hidden"
            style={{
                // الخلفية بتتكوّن بالتدريج مع النزول — مش بتظهر فجأة
                backgroundColor: `rgba(255,255,255,${progress * 0.96})`,
                backdropFilter: progress > 0.15 ? 'blur(14px)' : 'none',
                boxShadow: progress > 0.9 ? '0 1px 0 rgba(0,0,0,.07)' : 'none',
            }}
        >
            <div className="flex h-[56px] items-center gap-2 px-3">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    aria-label="رجوع"
                    className={round()}
                >
                    <ArrowRight className={cn('h-[22px] w-[22px]', solid ? 'text-navy' : 'text-white')} strokeWidth={2.1} />
                </button>

                {/* العنوان بيتسلّل مع الآب-بار وهو بيتكوّن */}
                <p
                    className="min-w-0 flex-1 truncate font-head text-[16px] font-bold text-navy transition-opacity duration-200"
                    style={{ opacity: solid ? 1 : 0 }}
                    aria-hidden={!solid}
                >
                    {title}
                </p>

                <button type="button" onClick={onShare} aria-label="مشاركة" className={round('ms-auto')}>
                    <Share2 className={cn('h-[19px] w-[19px]', solid ? 'text-navy' : 'text-white')} />
                </button>
                <button type="button" onClick={onToggleSave} aria-label={saved ? 'إزالة من المفضلة' : 'حفظ'} className={round()}>
                    <Heart className={cn('h-[20px] w-[20px]', saved ? 'fill-coral-deep text-coral-deep' : solid ? 'text-navy' : 'text-white')} />
                </button>
            </div>
        </div>,
        document.body,
    );
}

/* ══════════════ الهيكل الكامل ══════════════ */
// السعر مش هنا عن قصد — الشريط الثابت تحت بيعرضه على طول،
// فتكراره فوق كان بيبان مرتين في نفس الشاشة.
export default function MobileDetailShell({
    title, location, score, count,
    images = [], badges, saved, onToggleSave,
    facts = [], nav = [], children,
}) {
    const [progress, setProgress] = useState(0);
    const [heroIdx, setHeroIdx] = useState(0);
    const [viewer, setViewer] = useState(null);

    const heroRef = useRef(null);
    const galleryRef = useRef(null);

    /* تكوين الآب-بار حسب النزول */
    useEffect(() => {
        const onScroll = () => {
            const h = (heroRef.current?.offsetHeight ?? 260) - BAR;
            setProgress(Math.min(1, Math.max(0, window.scrollY / h)));
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* الشريحة الظاهرة من المعرض */
    const onGalleryScroll = () => {
        const el = galleryRef.current;
        if (el?.clientWidth) setHeroIdx(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    };

    const share = async () => {
        const data = { title, text: location ? `${title} — ${location}` : title, url: window.location.href };
        try {
            if (navigator.share) await navigator.share(data);
            else await navigator.clipboard?.writeText(window.location.href);
        } catch { /* المستخدم قفل نافذة المشاركة — مش خطأ */ }
    };

    return (
        <div className="mk-detail">
            <OverlayBar progress={progress} title={title} saved={saved} onToggleSave={onToggleSave} onShare={share} />

            {/* ─── الهيرو: صور بملء العرض + العنوان فوقها ─── */}
            <div ref={heroRef} className="relative bg-navy">
                <div
                    ref={galleryRef}
                    onScroll={onGalleryScroll}
                    className="mk-hscroll flex w-full overflow-x-auto"
                >
                    {images.map((src, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setViewer(i)}
                            aria-label={`صورة ${i + 1} — اضغط للتكبير`}
                            className="w-full shrink-0"
                        >
                            <MkImage src={src} priority={i === 0} ratio="aspect-[4/5]" wrapperClassName="w-full" />
                        </button>
                    ))}
                </div>

                {/* تدرّج غامق تحت — عشان النص الأبيض يبان على أي صورة */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                {/* تدرّج خفيف فوق — عشان الأزرار الزجاجية تبان */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />

                {badges && <div className="absolute start-4 top-[68px] flex flex-col items-start gap-1.5">{badges}</div>}

                {/* عدّاد الصور */}
                {images.length > 1 && (
                    <span className="absolute end-4 bottom-[104px] rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
                        {heroIdx + 1} / {images.length}
                    </span>
                )}

                {/* العنوان — على الصورة، مش في كارت تحتها */}
                <div className="absolute inset-x-0 bottom-0 px-4 pb-7">
                    <h1 className="font-head text-[25px] font-bold leading-tight text-white drop-shadow-sm">{title}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] font-semibold text-white/85">
                        {location && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="h-[15px] w-[15px]" /> {location}
                            </span>
                        )}
                        {score > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-bold text-white backdrop-blur-sm">
                                <Star className="h-[14px] w-[14px] fill-vip text-vip" /> {score.toFixed(1)}
                                <span className="font-semibold text-white/70">({count})</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── الحقائق السريعة — بتطلع فوق الصورة بحواف دايرية ─── */}
            <div className="relative z-10 -mt-4 rounded-t-[20px] bg-cream pt-4">
                {facts.filter(Boolean).length > 0 && (
                    <div className="mk-hscroll flex gap-2 overflow-x-auto px-4 pb-1">
                        {facts.filter(Boolean).map((f, i) => (
                            <span key={i} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12.5px] font-bold text-navy shadow-[0_1px_5px_rgba(54,54,119,.07)]">
                                {f}
                            </span>
                        ))}
                        <span className="w-1 shrink-0" />
                    </div>
                )}
            </div>

            {/* ─── شريط الأقسام — سطر واحد وكل زر صفحة مستقلة ─── */}
            <MobileSectionNav items={nav} className="mt-3" />

            <div className="pt-5">{children}</div>

            {/* مساحة تحت الشريط الثابت + شريط التبويب */}
            <div className="h-[130px]" />

            {viewer !== null && <PhotoViewer images={images} start={viewer} onClose={() => setViewer(null)} />}
        </div>
    );
}
