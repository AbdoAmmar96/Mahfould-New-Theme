// حفظ اختيارات العميل وهو بيتنقّل بين صفحات نفس المنتج.
//
// المشكلة: أقسام التفاصيل بقت صفحات مستقلة (الغرف، الفعاليات…)، وInertia
// بيفكّك الكومبوننت مع كل تنقّل — يعني أي useState بيضيع. ولو مشّينا الاختيار
// في الـURL على كل زرار في شريط الأقسام هيبقى كل رابط شايل حالة مش بتاعته.
//
// الحل: sessionStorage للجلسة الحالية، والـURL بيغلب لو موجود (عشان الروابط
// اللي بتتبعت تفضل شغّالة). sessionStorage مش localStorage عن قصد —
// الاختيار ده مؤقت ومالوش لازمة بعد ما التبويب يتقفل.

const safe = (fn, fallback) => {
    try { return fn(); } catch { return fallback; }   // وضع التصفح الخاص بيرمي أحياناً
};

/** يقرأ قائمة أرقام: من الـURL الأول، وإلا من التخزين */
export function readIds(key, urlParam) {
    if (typeof window === 'undefined') return [];

    const raw = new URLSearchParams(window.location.search).get(urlParam);
    if (raw !== null) {
        const ids = raw.split(',').map(Number).filter(Boolean);
        writeIds(key, ids);          // نثبّت اللي جه من الرابط
        return ids;
    }

    return safe(() => {
        const s = sessionStorage.getItem(key);
        return s ? s.split(',').map(Number).filter(Boolean) : [];
    }, []);
}

export function writeIds(key, ids) {
    if (typeof window === 'undefined') return;
    safe(() => {
        ids.length ? sessionStorage.setItem(key, ids.join(',')) : sessionStorage.removeItem(key);
    });
}

/** نفس الفكرة بس لقيمة واحدة (نوع الغرفة مثلاً) */
export function readId(key, urlParam) {
    const [first] = readIds(key, urlParam);
    return first ?? null;
}

export function writeId(key, id) {
    writeIds(key, id ? [id] : []);
}
