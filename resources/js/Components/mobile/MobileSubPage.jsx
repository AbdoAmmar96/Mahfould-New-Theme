// غلاف صفحات أقسام التفاصيل (الغرف، المرافق، الفعاليات…)
// بيوحّد الشكل: اسم المنتج فوق + شريط الأقسام + المحتوى.
import MobileSectionNav from './MobileSectionNav';

export default function MobileSubPage({ eyebrow, title, sub, nav, children }) {
    return (
        <>
            <div className="px-4 pb-3 pt-4">
                {eyebrow && <p className="mb-1 line-clamp-1 text-[12.5px] font-semibold text-muted">{eyebrow}</p>}
                <h1 className="font-head text-[22px] font-bold leading-tight text-navy">{title}</h1>
                {sub && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{sub}</p>}
            </div>

            <MobileSectionNav items={nav} />

            <div className="pt-4">{children}</div>
        </>
    );
}
