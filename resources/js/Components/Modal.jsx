// محفول مكفول — نافذة منبثقة قابلة لإعادة الاستخدام (RTL) — Tailwind
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, icon, title, subtitle, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/50 p-4 backdrop-blur-sm animate-in fade-in"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-section bg-white p-6 shadow-mk-lg animate-in fade-in zoom-in-95"
            >
                <button
                    onClick={onClose}
                    aria-label="إغلاق"
                    className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-beige text-navy transition hover:bg-sandline"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="mb-4 flex items-center gap-3 pe-10">
                    {icon && <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] bg-beige text-2xl">{icon}</div>}
                    <div>
                        <h3 className="font-head text-xl font-bold text-navy">{title}</h3>
                        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                    </div>
                </div>
                <div className="text-[15px] leading-relaxed text-[#444] [&_a]:font-bold [&_a]:text-coral-deep [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-head [&_h2]:text-lg [&_h2]:text-navy [&_li]:mb-1.5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
