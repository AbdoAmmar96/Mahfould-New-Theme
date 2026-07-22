// محفول مكفول — شاشة الانتقال بين الأقسام
//
// الفكرة: لما تدوس على قسم (رحلات/فنادق/مطاعم…) تظهر شاشة قصيرة
// بلون وأيقونة وجملة تخص القسم ده — بدل ما الشاشة تقف مكانها مستنية السيرفر.
//
// قاعدة مهمة: بتظهر بس في التنقّل *بين الأقسام*.
// الدخول على تفاصيل عنصر جوّه نفس القسم (رحلة من قائمة الرحلات) مبيوقفش
// المستخدم بشاشة — ده بيبقى مزعج وبيحسّس إن التطبيق بطيء مش العكس.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Plane, BedDouble, UtensilsCrossed, Car, Bus, Truck, Crown,
    User, Heart, Ticket, LifeBuoy, ShieldCheck,
} from 'lucide-react';
import { router } from '@inertiajs/react';

/* أقل مدة تفضل فيها الشاشة ظاهرة — أقل من كده بتبقى «رفة» مزعجة */
const MIN_SHOW = 480;
/* أقصى مدة — لو السيرفر اتأخر مش هنحبس المستخدم للأبد */
const MAX_SHOW = 4000;

/* لكل قسم: أيقونة + جملة + تدرّج + نوع الحركة */
const THEMES = {
    tours: {
        match: /^\/tours/,
        icon: Plane, label: 'الرحلات', tagline: 'اكتشف مصر… يوم بيوم',
        grad: 'from-[#2B2B63] via-[#3B3B7A] to-[#F5764E]', motion: 'mk-sp-fly',
    },
    hotels: {
        match: /^\/hotels/,
        icon: BedDouble, label: 'الفنادق', tagline: 'مكان يريّحك بعد يوم طويل',
        grad: 'from-[#1F2E52] via-[#33477A] to-[#6C8FC7]', motion: 'mk-sp-drop',
    },
    restaurants: {
        match: /^\/restaurants/,
        icon: UtensilsCrossed, label: 'المطاعم', tagline: 'أحلى أكل في أقرب مكان',
        grad: 'from-[#5A2733] via-[#8C3B45] to-[#F5764E]', motion: 'mk-sp-swing',
    },
    cars: {
        match: /^\/cars/,
        icon: Car, label: 'السيارات', tagline: 'عربيتك مستنياك',
        grad: 'from-[#1E3A34] via-[#2F5D52] to-[#4FA88E]', motion: 'mk-sp-drive',
    },
    buses: {
        match: /^\/buses/,
        icon: Bus, label: 'الباصات', tagline: 'رحلتك بين المدن — بسعر مريح',
        grad: 'from-[#2B2B63] via-[#3E4A8A] to-[#7C86D6]', motion: 'mk-sp-drive',
    },
    delivery: {
        match: /^\/delivery/,
        icon: Truck, label: 'التوصيل', tagline: 'اطلب… وإحنا نوصّلك',
        grad: 'from-[#4A3418] via-[#7A5624] to-[#E0A44A]', motion: 'mk-sp-drive',
    },
    sahb: {
        match: /^\/sahb-elsaada/,
        icon: Crown, label: 'صاحب السعادة', tagline: 'تجربة على مستوى تاني',
        grad: 'from-[#2A2244] via-[#4A3A6B] to-[#D4AF37]', motion: 'mk-sp-shine',
    },
    wishlist: {
        match: /^\/wishlist/,
        icon: Heart, label: 'المفضلة', tagline: 'اللي عجبك — محفوظ هنا',
        grad: 'from-[#5A2733] via-[#8C3B45] to-[#F5764E]', motion: 'mk-sp-beat',
    },
    support: {
        match: /^\/(account\/support|p\/help)/,
        icon: LifeBuoy, label: 'الدعم', tagline: 'إحنا معاك خطوة بخطوة',
        grad: 'from-[#1F2E52] via-[#33477A] to-[#6C8FC7]', motion: 'mk-sp-shine',
    },
    account: {
        match: /^\/account/,
        icon: Ticket, label: 'حجوزاتي', tagline: 'كل حجوزاتك في مكان واحد',
        grad: 'from-[#2B2B63] via-[#3B3B7A] to-[#5B5BA8]', motion: 'mk-sp-drop',
    },
    auth: {
        match: /^\/(login|register)/,
        icon: User, label: 'أهلاً بيك', tagline: 'خطوة واحدة وتبقى معانا',
        grad: 'from-[#2B2B63] via-[#3B3B7A] to-[#5B5BA8]', motion: 'mk-sp-drop',
    },
    checkout: {
        match: /^\/(checkout|booking)/,
        icon: ShieldCheck, label: 'إتمام الحجز', tagline: 'حجز مكفول — خطوة أخيرة',
        grad: 'from-[#173D2F] via-[#245A44] to-[#4FA88E]', motion: 'mk-sp-shine',
    },
};

const LIST = Object.values(THEMES);

/** بيرجّع «القسم» اللي المسار ده تابع له — أو null لو مالوش شاشة */
function themeOf(path) {
    return LIST.find((t) => t.match.test(path)) ?? null;
}

export default function RouteSplash() {
    const [theme, setTheme] = useState(null);
    const shownAt = useRef(0);
    const timers = useRef([]);

    useEffect(() => {
        const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

        // مهم: بنسمع 'before' مش 'start'.
        // لما الصفحة تكون متجابة مسبقاً، Inertia بيخدمها من الكاش وبيطلّع
        // before → navigate → success بس — من غير start ولا finish خالص.
        // فلو اعتمدنا على start، الشاشة مكانتش هتظهر في أسرع الحالات وأهمها.
        const offBefore = router.on('before', (e) => {
            const visit = e.detail.visit;

            // الجلب المسبق بيعدّي من هنا كمان — وده شغل خلفية مش تنقّل،
            // من غير الشرط ده الشاشة كانت بتولّع لوحدها بعد تحميل الرئيسية.
            if (visit.prefetch) return;

            // ديسكتوب — مفيش شاشات انتقال، ده سلوك أبليكشن مش ويب
            if (window.matchMedia('(min-width: 1024px)').matches) return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            // الشاشة دي للتنقّل العادي بس — مش للفورمات ولا الـpartial reloads
            if (visit.method !== 'get' || visit.only?.length) return;

            const to = themeOf(new URL(visit.url, window.location.origin).pathname);
            // 'before' بيحصل قبل ما الـURL يتغيّر، فده لسه مسار الصفحة الحالية
            const from = themeOf(window.location.pathname);

            // نفس القسم؟ يبقى دي حركة جوّه القسم — مالهاش شاشة
            if (!to || to === from) return;

            clear();
            shownAt.current = performance.now();
            setTheme(to);
            timers.current.push(setTimeout(() => setTheme(null), MAX_SHOW));
        });

        const hide = () => {
            if (!shownAt.current) return;
            // نكمّل الحد الأدنى عشان متبقاش رفّة
            const left = Math.max(0, MIN_SHOW - (performance.now() - shownAt.current));
            shownAt.current = 0;
            clear();
            timers.current.push(setTimeout(() => setTheme(null), left));
        };

        // 'navigate' بيجي في الحالتين (من الكاش ومن الشبكة)، و'finish' للشبكة.
        // بنسمع الاتنين وأول واحد بيوصل بيخفي — والباقي بيتجاهل نفسه.
        const offNavigate = router.on('navigate', hide);
        const offFinish = router.on('finish', hide);
        // لو الزيارة اتلغت أو حصل إيرور — منسيبش الشاشة معلّقة
        const offInvalid = router.on('invalid', hide);
        const offErr = router.on('exception', hide);

        return () => { offBefore(); offNavigate(); offFinish(); offInvalid(); offErr(); clear(); };
    }, []);

    if (!theme || typeof document === 'undefined') return null;

    const Icon = theme.icon;

    return createPortal(
        <div
            className={`mk-splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br ${theme.grad} lg:hidden`}
            role="status"
            aria-live="polite"
        >
            {/* دوائر خلفية بتوسّع — بتدي إحساس بالعمق */}
            <span className="mk-sp-ring absolute h-[190px] w-[190px] rounded-full border border-white/15" />
            <span className="mk-sp-ring absolute h-[190px] w-[190px] rounded-full border border-white/15" style={{ animationDelay: '.5s' }} />

            <div className={`${theme.motion} relative grid h-[92px] w-[92px] place-items-center rounded-[28px] bg-white/12 backdrop-blur-sm`}>
                <Icon className="h-11 w-11 text-white" strokeWidth={1.7} />
            </div>

            <p className="mk-sp-text mt-6 font-head text-[26px] font-bold text-white">{theme.label}</p>
            <p className="mk-sp-text mt-1.5 text-[14px] text-white/70" style={{ animationDelay: '.09s' }}>
                {theme.tagline}
            </p>

            {/* شريط تقدّم — بيقول «شغّال» من غير نسبة كدّابة */}
            <span className="absolute bottom-[18%] h-[3px] w-24 overflow-hidden rounded-full bg-white/15">
                <span className="mk-sp-bar block h-full w-1/3 rounded-full bg-white/80" />
            </span>
        </div>,
        document.body,
    );
}
