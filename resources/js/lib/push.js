// محفول مكفول — اشتراك إشعارات المتصفح (Web Push)

/** VAPID public key بيتبعت base64url — الـPushManager عايزه Uint8Array */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** الجهاز/المتصفح يدعم الإشعارات أصلاً؟ */
export function pushSupported() {
    return typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

/** الحالة الحالية: 'unsupported' | 'default' | 'granted' | 'denied' */
export function pushPermission() {
    if (!pushSupported()) return 'unsupported';
    return Notification.permission;
}

const csrf = () => document.querySelector('meta[name=csrf-token]')?.content ?? '';

/**
 * يطلب الإذن ويسجّل الاشتراك على السيرفر.
 * بيرجّع true لو الاشتراك تم.
 */
export async function subscribeToPush(vapidPublicKey) {
    if (!pushSupported() || !vapidPublicKey) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;

    // لو فيه اشتراك قديم بمفتاح مختلف، نلغيه الأول
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe().catch(() => {});

    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const res = await fetch('/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' },
        body: JSON.stringify(sub.toJSON()),
    });

    return res.ok;
}

/** يلغي اشتراك الجهاز الحالي (محلياً وعلى السيرفر) */
export async function unsubscribeFromPush() {
    if (!pushSupported()) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const { endpoint } = sub.toJSON();
    await sub.unsubscribe().catch(() => {});
    await fetch('/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' },
        body: JSON.stringify({ endpoint }),
    }).catch(() => {});
}

/** هل الجهاز ده مشترك حالياً؟ */
export async function isSubscribed() {
    if (!pushSupported() || Notification.permission !== 'granted') return false;
    try {
        const reg = await navigator.serviceWorker.ready;
        return !!(await reg.pushManager.getSubscription());
    } catch {
        return false;
    }
}
