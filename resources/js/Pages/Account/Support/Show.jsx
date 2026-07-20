import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Send, User, Headphones } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

export default function Show({ ticket }) {
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const isClosed = ['resolved', 'closed'].includes(ticket.status);
    const submit = (e) => {
        e.preventDefault();
        post(`/account/support/${ticket.code}/reply`, { onSuccess: () => reset() });
    };

    return (
        <SiteLayout>
            <Head title={`${ticket.code} — ${ticket.subject}`} />
            <section className="bg-gradient-to-br from-navy to-navy-light py-10 text-white">
                <div className="mx-auto w-full max-w-[900px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/account/support" className="hover:text-white">الدعم الفني</Link> › {ticket.code}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
                        <h1 className="font-head text-2xl font-bold text-white">{ticket.subject}</h1>
                        <Badge variant={isClosed ? 'makfol' : 'best'}>{ticket.status_label}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[12.5px] text-white/70">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5">{ticket.code}</span>
                        <span>{ticket.category_label}</span>
                        <span>الأولوية: {ticket.priority_label}</span>
                        {ticket.booking_code && <span>حجز: {ticket.booking_code}</span>}
                        <span>{ticket.created_at}</span>
                    </div>
                </div>
            </section>

            <section className="py-10">
                <div className="mx-auto w-full max-w-[900px] px-5">
                    {/* الرسالة الأصلية */}
                    <div className="mb-4 rounded-card border border-black/[.06] bg-white p-5">
                        <p className="whitespace-pre-wrap text-navy">{ticket.description}</p>
                    </div>

                    {/* المحادثة */}
                    <div className="space-y-3">
                        {ticket.messages.map((m, i) => (
                            <div key={i} className={cn(
                                'flex gap-3',
                                m.is_customer ? 'justify-end' : 'justify-start',
                            )}>
                                <div className={cn(
                                    'max-w-[80%] rounded-card border-[1.5px] p-4',
                                    m.is_customer ? 'border-coral/25 bg-coral/[.04]' : 'border-royal/25 bg-royal/[.04]',
                                )}>
                                    <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-navy">
                                        {m.is_customer
                                            ? <><User className="h-3.5 w-3.5 text-coral-deep" /> {m.author_name}</>
                                            : <><Headphones className="h-3.5 w-3.5 text-royal" /> {m.author_name} · فريق الدعم</>}
                                        <span className="ms-1 font-normal text-muted">{m.created_at}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm text-navy">{m.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* الرد */}
                    {!isClosed ? (
                        <form onSubmit={submit} className="mt-5 rounded-card border border-black/[.06] bg-white p-4">
                            <textarea
                                rows={4}
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                placeholder="اكتب ردّك هنا…"
                                className="w-full rounded-input border-[1.5px] border-black/[.08] bg-white px-3 py-2 text-sm text-navy focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
                            />
                            <div className="mt-3 flex justify-end">
                                <Button type="submit" disabled={processing || !data.body.trim()}>
                                    <Send className="h-4 w-4" /> إرسال الرد
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-5 rounded-input border border-black/[.08] bg-beige/40 p-4 text-center text-sm text-muted">
                            التذكرة {ticket.status_label}. لو محتاج تفتح تذكرة جديدة{' '}
                            <Link href="/account/support/create" className="font-bold text-coral-deep hover:underline">اضغط هنا</Link>.
                        </div>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
