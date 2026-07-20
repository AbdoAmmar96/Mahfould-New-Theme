// محفول مكفول — نافذة منبثقة قابلة لإعادة الاستخدام (Shadcn Dialog تحت الغطاء)
// يحافظ على الـAPI القديم: <Modal open onClose icon title subtitle>{body}</Modal>
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog';

export default function Modal({ open, onClose, icon, title, subtitle, children }) {
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); }}>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    {icon && (
                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] bg-beige text-navy">
                            {typeof icon === 'string' ? <span className="text-2xl">{icon}</span> : icon}
                        </div>
                    )}
                    <div>
                        <DialogTitle>{title}</DialogTitle>
                        {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
                    </div>
                </DialogHeader>
                <div className="text-[15px] leading-relaxed text-[#444] [&_a]:font-bold [&_a]:text-coral-deep [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-head [&_h2]:text-lg [&_h2]:text-navy [&_li]:mb-1.5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-5">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}
