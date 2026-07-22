// محفول مكفول — كارت تفعيل إشعارات المتصفح
// بيختفي تماماً لو: المتصفح مش داعم، أو مفاتيح VAPID مش مضبوطة، أو المستخدم رفض قبل كده.
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { toast } from '@/Components/ui/sonner';
import { pushSupported, pushPermission, subscribeToPush, unsubscribeFromPush, isSubscribed } from '@/lib/push';

export default function PushToggle() {
    const { vapid_public_key: vapidKey } = usePage().props;
    const [state, setState] = useState('checking'); // checking | off | on | denied | hidden
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!vapidKey || !pushSupported()) { setState('hidden'); return; }
        const perm = pushPermission();
        if (perm === 'denied') { setState('denied'); return; }
        isSubscribed().then((yes) => setState(yes ? 'on' : 'off'));
    }, [vapidKey]);

    if (state === 'hidden' || state === 'checking') return null;

    const enable = async () => {
        setBusy(true);
        try {
            const ok = await subscribeToPush(vapidKey);
            if (ok) { setState('on'); toast.success('هنبعتلك إشعار أول ما يحصل جديد في حجوزاتك.'); }
            else if (pushPermission() === 'denied') { setState('denied'); }
            else { toast.error('مقدرناش نفعّل الإشعارات — جرّب تاني.'); }
        } catch {
            toast.error('مقدرناش نفعّل الإشعارات — جرّب تاني.');
        } finally {
            setBusy(false);
        }
    };

    const disable = async () => {
        setBusy(true);
        try {
            await unsubscribeFromPush();
            setState('off');
            toast.success('اتوقفت الإشعارات على الجهاز ده.');
        } finally {
            setBusy(false);
        }
    };

    // اتحظرت من إعدادات المتصفح — مفيش حاجة نقدر نعملها برمجياً
    if (state === 'denied') {
        return (
            <div className="mx-4 mt-3 flex items-start gap-3 rounded-card bg-beige/60 p-3.5">
                <BellOff className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
                <p className="text-[13px] leading-relaxed text-muted">
                    الإشعارات متمنوعة من إعدادات المتصفح. لو عايز تفعّلها، افتح إعدادات الموقع واسمح بالإشعارات.
                </p>
            </div>
        );
    }

    const on = state === 'on';

    return (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-card bg-white p-3.5 shadow-[0_2px_10px_rgba(54,54,119,.05)]">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${on ? 'bg-makfol/10' : 'bg-coral/10'}`}>
                {on ? <Check className="h-[19px] w-[19px] text-makfol" /> : <Bell className="h-[19px] w-[19px] text-coral-deep" />}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-extrabold text-navy">
                    {on ? 'الإشعارات مفعّلة' : 'فعّل الإشعارات'}
                </p>
                <p className="text-[12px] text-muted">
                    {on ? 'هتوصلك تأكيدات الحجز والتحديثات' : 'اعرف أول بأول لما حجزك يتأكّد'}
                </p>
            </div>
            <button
                type="button"
                onClick={on ? disable : enable}
                disabled={busy}
                className={`mk-press min-h-[40px] shrink-0 rounded-input px-4 text-[13.5px] font-extrabold disabled:opacity-50 ${
                    on ? 'bg-beige text-navy' : 'bg-gradient-to-l from-coral to-coral-deep text-white'
                }`}
            >
                {busy ? '…' : on ? 'إيقاف' : 'تفعيل'}
            </button>
        </div>
    );
}
