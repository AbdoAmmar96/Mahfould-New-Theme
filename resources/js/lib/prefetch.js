// محفول مكفول — طبقة الجلب المسبق (prefetch)
//
// ليه الملف ده موجود أصلاً؟
// Inertia v2 فيه <Link prefetch> جاهز، بس أوضاعه الجاهزة مش مفيدة على الموبايل:
//   • hover → بيعتمد على mouseenter، واللي على اللمس بيحصل بعد ما الصباع يسيب الشاشة
//   • click → بيعتمد على mousedown، واللي على اللمس بيجي بعد touchend بـ~10ms بس
// يعني في الحالتين الجلب بيبدأ متأخر جداً عشان يفرق.
//
// الحل: نسمع touchstart (بيحصل قبل الـclick بـ100-250ms — الوقت اللي الصباع
// بياخده عشان يسيب الشاشة). ده بيدي السيرفر بداية سبق حقيقية، وساعات
// الصفحة بتبقى جاهزة خلاص قبل ما إيد المستخدم ترفع.
import { router } from '@inertiajs/react';

/** المدة اللي الاستجابة تفضل صالحة فيها في الكاش */
const CACHE_FOR = '30s';

/** مسارات ممنوع نجلبها مسبقاً — أفعال مش تنقّل */
const SKIP = /^\/(logout|wishlist\/toggle|checkout\/pay)/;

const seen = new Set();

function eligible(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    const href = a.getAttribute('href');
    // روابط داخلية بس — مفيش http خارجي ولا #anchor ولا tel:/mailto:
    if (!href || !href.startsWith('/') || href.startsWith('//')) return null;
    if (SKIP.test(href)) return null;
    return href;
}

function warm(href) {
    if (seen.has(href)) return;
    seen.add(href);
    // نسيبه ينسى بعد المدة عشان لو رجع للينك تاني يجيب نسخة طازة
    setTimeout(() => seen.delete(href), 30_000);
    router.prefetch(href, { method: 'get' }, { cacheFor: CACHE_FOR });
}

/** جلب مسبق أول ما الصباع يلمس — قبل الـclick بمدة معتبرة */
export function installTouchPrefetch() {
    if (typeof document === 'undefined') return;

    const onTouch = (e) => {
        const href = eligible(e.target.closest?.('a[href]'));
        if (href) warm(href);
    };

    // passive: مش هنمنع السكرول، فالمتصفح مش محتاج يستنى الـhandler
    document.addEventListener('touchstart', onTouch, { passive: true, capture: true });
    // للماوس — mousedown بيسبق click بوقت كافي على الديسكتوب
    document.addEventListener('mousedown', onTouch, { passive: true, capture: true });
}

/**
 * تسخين وجهات محدّدة بالتدريج.
 * بنعملها بالتتابع مش مرة واحدة عشان `php artisan serve` بيرد على
 * ريكوست واحد في المرة — 7 طلبات مع بعض هتزحم أول تحميل للصفحة.
 */
export function warmDestinations(urls, { delay = 400, gap = 350 } = {}) {
    if (typeof window === 'undefined') return;

    // لو المستخدم على شبكة موفّرة أو بطيئة — مانعملش أي جلب مسبق
    const conn = navigator.connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /2g/.test(conn.effectiveType)) return;

    urls.forEach((href, i) => {
        setTimeout(() => {
            // requestIdleCallback عشان ما نزاحمش رسم الصفحة الحالية
            const run = () => warm(href);
            'requestIdleCallback' in window
                ? requestIdleCallback(run, { timeout: 1200 })
                : run();
        }, delay + i * gap);
    });
}
