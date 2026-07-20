import { Head, Link, useForm, router } from '@inertiajs/react';
import { Headphones, ArrowRight, Send, User, Phone, Mail, Ticket, Lock } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
    open: 'best', in_progress: 'vip', waiting_customer: 'soft', resolved: 'makfol', closed: 'soft',
};

export default function Show({ ticket }) {
    const { data, setData, post, processing, reset } = useForm({
        body: '', is_internal: false, new_status: '',
    });
    const submit = (e) => {
        e.preventDefault();
        post(`/support/tickets/${ticket.code}/reply`, { onSuccess: () => reset() });
    };
    const assignSelf = () => router.post(`/support/tickets/${ticket.code}/assign`, {}, { preserveScroll: true });

    return (
        <>
            <Head title={`${ticket.code} — ${ticket.subject}`} />
            <div className="min-h-screen bg-beige/30" dir="rtl">
                <header className="bg-navy text-white">
                    <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <Link href="/support" className="text-sm font-bold text-white/80 hover:text-white">
                                <ArrowRight className="inline h-4 w-4 rotate-180" /> رجوع
                            </Link>
                            <span className="text-white/40">|</span>
                            <b className="font-head">{ticket.code}</b>
                        </div>
                    </div>
                </header>

                <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
                    {/* Left: Ticket + Conversation */}
                    <div>
                        <div className="mb-5 rounded-card border border-black/[.06] bg-white p-5">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h1 className="flex-1 font-head text-xl font-bold text-navy">{ticket.subject}</h1>
                                <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status_label}</Badge>
                                <Badge variant={ticket.priority === 'urgent' ? 'best' : 'soft'}>الأولوية: {ticket.priority_label}</Badge>
                            </div>
                            <div className="mb-3 flex flex-wrap gap-3 text-[12.5px] text-muted">
                                <span>{ticket.category_label}</span>
                                {ticket.booking && <span>· حجز: <b className="text-navy">{ticket.booking.code}</b></span>}
                                <span>· {ticket.created_at}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-navy">{ticket.description}</p>
                        </div>

                        <div className="space-y-3">
                            {ticket.messages.map((m, i) => (
                                <div key={i} className={cn(
                                    'rounded-card border-[1.5px] p-4',
                                    m.is_internal ? 'border-vip/40 bg-vip/[.06]'
                                        : m.is_customer ? 'border-coral/25 bg-coral/[.04]'
                                        : 'border-royal/25 bg-royal/[.04]',
                                )}>
                                    <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-navy">
                                        {m.is_customer
                                            ? <><User className="h-3.5 w-3.5 text-coral-deep" /> {m.author_name}</>
                                            : <><Headphones className="h-3.5 w-3.5 text-royal" /> {m.author_name} · دعم</>}
                                        {m.is_internal && <span className="inline-flex items-center gap-0.5 rounded-full bg-vip px-2 py-0.5 text-[10.5px] text-white"><Lock className="h-2.5 w-2.5" /> داخلية</span>}
                                        <span className="ms-1 font-normal text-muted">{m.created_at}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm text-navy">{m.body}</p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={submit} className="mt-5 rounded-card border border-black/[.06] bg-white p-4">
                            <textarea
                                rows={5}
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                placeholder="اكتب ردّك…"
                                className="w-full rounded-input border-[1.5px] border-black/[.08] bg-white px-3 py-2 text-sm text-navy focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
                            />
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2 text-[12.5px] text-navy">
                                    <input type="checkbox" checked={data.is_internal} onChange={e => setData('is_internal', e.target.checked)} className="h-4 w-4 accent-vip" />
                                    ملاحظة داخلية (العميل مش هيشوفها)
                                </label>
                                <div className="flex items-center gap-2">
                                    <Select value={data.new_status} onChange={e => setData('new_status', e.target.value)}>
                                        <option value="">إبقاء الحالة</option>
                                        <option value="in_progress">قيد المعالجة</option>
                                        <option value="waiting_customer">بانتظار العميل</option>
                                        <option value="resolved">محلولة</option>
                                        <option value="closed">إغلاق</option>
                                    </Select>
                                    <Button type="submit" disabled={processing || !data.body.trim()}>
                                        <Send className="h-4 w-4" /> إرسال
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right: Sidebar */}
                    <aside>
                        <div className="mb-4 rounded-card border border-black/[.06] bg-white p-4">
                            <b className="mb-3 block font-head text-sm text-navy">بيانات العميل</b>
                            <div className="space-y-1.5 text-[13px]">
                                <div className="flex items-center gap-2 text-navy"><User className="h-3.5 w-3.5 text-muted" /> {ticket.customer.name}</div>
                                <div className="flex items-center gap-2 text-navy"><Mail className="h-3.5 w-3.5 text-muted" /> {ticket.customer.email}</div>
                                {ticket.customer.phone && <div className="flex items-center gap-2 text-navy"><Phone className="h-3.5 w-3.5 text-muted" /> {ticket.customer.phone}</div>}
                            </div>
                        </div>

                        <div className="mb-4 rounded-card border border-black/[.06] bg-white p-4">
                            <b className="mb-3 block font-head text-sm text-navy">الإسناد</b>
                            {ticket.assignee ? (
                                <p className="text-sm text-navy">مسند إلى: <b>{ticket.assignee.name}</b></p>
                            ) : (
                                <>
                                    <p className="mb-2 text-[13px] text-muted">لسه محدش استلم التذكرة.</p>
                                    <Button block onClick={assignSelf}>استلم التذكرة</Button>
                                </>
                            )}
                        </div>

                        {ticket.booking && (
                            <div className="rounded-card border border-black/[.06] bg-white p-4">
                                <b className="mb-3 block font-head text-sm text-navy">الحجز المرتبط</b>
                                <div className="flex items-center gap-2 text-navy">
                                    <Ticket className="h-3.5 w-3.5 text-coral-deep" />
                                    <b>{ticket.booking.code}</b>
                                </div>
                                <p className="mt-1 text-[13px] text-muted">إجمالي: {ticket.booking.total} ج.م</p>
                            </div>
                        )}
                    </aside>
                </main>
            </div>
        </>
    );
}
