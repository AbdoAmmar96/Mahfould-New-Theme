// محفول مكفول — صفحة محتوى ثابت (شروط، خصوصية، من احنا...)
import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

// حاوية بعرض ثابت
const Wrap = ({ className, children }) => (
    <div className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</div>
);

export default function Page({ page }) {
    return (
        <SiteLayout anim="fade">
            <Head title={page.title} />

            {/* عنوان مضغوط — موبايل (الآب-بار فوقه شايل زر الرجوع) */}
            <div className="border-b border-black/[.06] bg-white px-4 pb-4 pt-3 lg:hidden">
                <h1 className="font-head text-[21px] font-bold text-navy">{page.title}</h1>
                {page.excerpt && <p className="mt-1 text-[13.5px] text-muted">{page.excerpt}</p>}
            </div>

            {/* بانر الصفحة — ويب */}
            <section className="relative hidden overflow-hidden bg-gradient-to-br from-navy to-navy-light py-12 text-white lg:block">
                <div className="pointer-events-none absolute -top-40 -start-20 h-[360px] w-[360px] rounded-full bg-coral opacity-30 blur-[100px]" />
                <Wrap className="relative z-[1]">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> › {page.title}
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">{page.title}</h1>
                    {page.excerpt && <p className="mt-1 text-white/70">{page.excerpt}</p>}
                </Wrap>
            </section>

            {/* المحتوى */}
            <Wrap className="px-4 lg:px-5">
                <article className="mx-auto max-w-[820px] pb-10 pt-5 lg:pb-16 lg:pt-11">
                    <div
                        className={cn(
                            'text-base leading-[2] text-[#444]',
                            '[&_h2]:mb-2.5 [&_h2]:mt-7 [&_h2]:font-head [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-navy',
                            '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-navy',
                            '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-[22px]',
                            '[&_li]:mb-2',
                            '[&_p]:mb-3.5',
                            '[&_a]:font-bold [&_a]:text-coral-deep',
                        )}
                        dangerouslySetInnerHTML={{ __html: page.body || '<p>المحتوى قيد التحديث.</p>' }}
                    />
                </article>
            </Wrap>
        </SiteLayout>
    );
}
