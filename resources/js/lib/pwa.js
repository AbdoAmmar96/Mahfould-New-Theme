// محفول مكفول — تسجيل الـService Worker
// بيتسجّل بعد load عشان مايزاحمش تحميل الصفحة الأولى على الشبكات الضعيفة.
// في التطوير بنلغي التسجيل عشان مايكاشش أصول Vite.

export function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (import.meta.env.DEV) {
        // نضّف أي SW قديم متسجّل من بناء إنتاجي على نفس الـorigin
        navigator.serviceWorker.getRegistrations()
            .then((regs) => regs.forEach((r) => r.unregister()))
            .catch(() => {});
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // فشل التسجيل مش مشكلة — الموقع شغّال عادي من غيره
        });
    });
}
