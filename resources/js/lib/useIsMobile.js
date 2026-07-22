import { useEffect, useState } from 'react';

// نفس نقطة القطع بتاعة Tailwind lg — لازم تفضل متطابقة معاها
const QUERY = '(max-width: 1023.98px)';

/**
 * بيرجّع true على مقاسات الموبايل/التابلت.
 * الاستخدام: نركّب شجرة واحدة بس (موبايل أو ويب) بدل ما نرندر التنين
 * ونخفي واحدة بـCSS — ده بيوفّر نُص الـDOM وطلبات الصور على الشبكات الضعيفة.
 * التطبيق client-rendered (createRoot) فمفيش مشكلة hydration mismatch.
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
    );

    useEffect(() => {
        const mq = window.matchMedia(QUERY);
        const onChange = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', onChange);
        setIsMobile(mq.matches); // لو اتغيّر بين أول رندر و الـeffect
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return isMobile;
}
