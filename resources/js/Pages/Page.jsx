// محفول مكفول — صفحة محتوى ثابت (شروط، خصوصية، من احنا...)
import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link } from '@inertiajs/react';

export default function Page({ page }) {
    return (
        <SiteLayout>
            <Head title={page.title} />
            <section className="mk-pagehead">
                <div className="mk-wrap">
                    <div className="mk-crumb"><Link href="/">الرئيسية</Link> › {page.title}</div>
                    <h1>{page.title}</h1>
                    {page.excerpt && <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>{page.excerpt}</p>}
                </div>
            </section>

            <div className="mk-wrap">
                <article className="mk-content">
                    <div className="mk-content-body" dangerouslySetInnerHTML={{ __html: page.body || '<p>المحتوى قيد التحديث.</p>' }} />
                </article>
            </div>
        </SiteLayout>
    );
}
