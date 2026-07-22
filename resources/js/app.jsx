import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from '@/lib/pwa';
import { installTouchPrefetch, warmDestinations } from '@/lib/prefetch';
import RouteSplash from '@/Components/mobile/RouteSplash';

const appName = import.meta.env.VITE_APP_NAME || 'محفول مكفول';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        // RouteSplash لازم يبقى *بره* <App> — كل صفحة بترسم SiteLayout بتاعها،
        // فأي حاجة جوّه الـlayout بتتفكّك وتترسم من جديد مع كل تنقّل وحالتها بتضيع.
        // لما كان جوّاه، الشاشة كانت بتتمسح في نفس اللحظة اللي المفروض تظهر فيها.
        createRoot(el).render(
            <>
                <RouteSplash />
                <App {...props} />
            </>,
        );
    },
    // delay أعلى من الافتراضي: مع الجلب المسبق أغلب التنقّلات بتخلص قبل كده،
    // فالشريط مبيرفّش على الفاضي.
    progress: { color: '#F5764E', delay: 260 },
});

installTouchPrefetch();

// تسخين أهم الوجهات مرة واحدة في عمر الصفحة — على الموبايل بس.
if (window.matchMedia('(max-width: 1023.98px)').matches) {
    warmDestinations(['/tours', '/hotels', '/restaurants']);
}

registerServiceWorker();
