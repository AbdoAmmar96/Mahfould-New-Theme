// محفول مكفول — قالب شاشات الدخول/التسجيل على الموبايل
// شكل أبليكشن: رأس navy بالهوية، والفورم في «ورقة» بيضا بتطلع من تحت.
import { Link, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function MobileAuth({ title, sub, children, footer, badge }) {
    return (
        <div className="mk mk-app flex min-h-screen flex-col bg-navy font-body">
            {/* الرأس */}
            <div className="shrink-0 px-4 pb-6 pt-[calc(14px+env(safe-area-inset-top))]">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => (window.history.length > 1 ? window.history.back() : router.visit('/'))}
                        aria-label="رجوع"
                        className="mk-press -ms-2 flex h-11 w-11 items-center justify-center rounded-full"
                    >
                        <ArrowRight className="h-[23px] w-[23px] text-white" strokeWidth={2.1} />
                    </button>
                    <Link href="/" className="mk-press flex h-11 items-center">
                        <img src="/assets/img/logo-footer.png" alt="محفول مكفول" className="h-8 w-auto" />
                    </Link>
                </div>

                <div className="mt-4">
                    {badge}
                    <h1 className="mt-2 font-head text-[26px] font-bold text-white">{title}</h1>
                    {sub && <p className="mt-1 text-[14px] text-white/70">{sub}</p>}
                </div>
            </div>

            {/* ورقة الفورم */}
            <div className="flex flex-1 flex-col rounded-t-[24px] bg-cream px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6">
                {children}
                {footer && <div className="mt-auto pt-6">{footer}</div>}
            </div>
        </div>
    );
}
