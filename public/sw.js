/* محفول مكفول — Service Worker
   الهدف الأساسي: الأداء على الشبكات الضعيفة + صفحة «مفيش نت» محترمة.

   الاستراتيجية عن قصد محافِظة:
   - صفحات HTML  → network-first (المحتوى لازم يبقى طازة: أسعار وإتاحة)
   - أصول البناء  → cache-first (أسماؤها فيها hash فمستحيل تبقى قديمة)
   - الصور        → stale-while-revalidate بسقف عدد
   - أي POST/طلب غير GET → مابنلمسهوش خالص (الحجز والدفع)
*/
// أي تغيير في الأصول المكاشة (لوجوهات/أيقونات) لازم يرفع الرقم ده،
// وإلا الزوّار القدام يفضلوا شايفين النسخة القديمة من الكاش.
const VERSION = 'mk-v2';
const SHELL = `${VERSION}-shell`;
const IMGS = `${VERSION}-img`;
const OFFLINE_URL = '/offline';
const MAX_IMAGES = 60;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL)
            .then((c) => c.addAll([OFFLINE_URL, '/assets/img/logo.png', '/assets/img/placeholder.svg']))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
            ))
            .then(() => self.clients.claim()),
    );
});

/** يقصّ الكاش لما يعدّي الحد — بدون ما يوقف الرد */
async function trim(cacheName, max) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= max) return;
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // أي حاجة مش GET (حجز، دفع، تسجيل) بتعدّي على طول
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // بس نفس الأصل — مانتدخلش في طلبات الدفع أو الخطوط الخارجية
    if (url.origin !== self.location.origin) return;

    // مانكاشش استجابات Inertia (JSON) عشان مايحصلش تعارض حالة
    if (request.headers.get('X-Inertia')) return;

    // ── صفحات HTML: الشبكة الأول، والكاش/offline احتياطي ──
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(SHELL).then((c) => c.put(request, copy)).catch(() => {});
                    return res;
                })
                .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL)),
        );
        return;
    }

    // ── أصول البناء (فيها hash) : كاش الأول ──
    if (url.pathname.startsWith('/build/')) {
        event.respondWith(
            caches.match(request).then((hit) => hit || fetch(request).then((res) => {
                const copy = res.clone();
                caches.open(SHELL).then((c) => c.put(request, copy)).catch(() => {});
                return res;
            })),
        );
        return;
    }

    // ── الصور: اعرض من الكاش فوراً وحدّث في الخلفية ──
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((hit) => {
                const net = fetch(request).then((res) => {
                    if (res.ok) {
                        const copy = res.clone();
                        caches.open(IMGS).then((c) => c.put(request, copy)).then(() => trim(IMGS, MAX_IMAGES)).catch(() => {});
                    }
                    return res;
                }).catch(() => hit || caches.match('/assets/img/placeholder.svg'));
                return hit || net;
            }),
        );
    }
});

/* ── Web Push ── */
self.addEventListener('push', (event) => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() }; }

    event.waitUntil(self.registration.showNotification(payload.title || 'محفول مكفول', {
        body: payload.body || '',
        // الاتنين لازم يكونوا مربّعين — أندرويد بيقص/يشوّه أي أبعاد تانية
        icon: '/assets/img/icon-192.png',
        badge: '/assets/img/favicon-32.png',
        dir: 'rtl',
        lang: 'ar',
        tag: payload.tag || 'mk-notification',
        data: { url: payload.url || '/account' },
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            // لو التطبيق مفتوح، ودّيه للصفحة بدل ما تفتح تاب جديد
            for (const client of list) {
                if ('focus' in client) { client.navigate(target); return client.focus(); }
            }
            return self.clients.openWindow(target);
        }),
    );
});
