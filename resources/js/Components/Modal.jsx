// محفول مكفول — نافذة منبثقة قابلة لإعادة الاستخدام (RTL)
import { useEffect } from 'react';

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
        <div className="mk-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="mk-modal-card" role="dialog" aria-modal="true" aria-label={title}>
                <button className="mk-modal-close" onClick={onClose} aria-label="إغلاق">×</button>
                <div className="mk-modal-head">
                    {icon && <div className="mk-modal-ico">{icon}</div>}
                    <div>
                        <h3>{title}</h3>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                </div>
                <div className="mk-modal-body">{children}</div>
            </div>
        </div>
    );
}
