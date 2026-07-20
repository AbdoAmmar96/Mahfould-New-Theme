import { Head, Link, router } from '@inertiajs/react';
import { Headphones, Ticket, Users, Clock, LogOut, Inbox, UserCircle2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
    open: 'best',
    in_progress: 'vip',
    waiting_customer: 'soft',
    resolved: 'makfol',
    closed: 'soft',
};

const FILTERS = [
    { v: 'open', label: 'مفتوحة', Icon: Inbox },
    { v: 'unassigned', label: 'غير مسندة', Icon: Ticket },
    { v: 'mine', label: 'تذاكري', Icon: UserCircle2 },
    { v: 'resolved', label: 'محلولة', Icon: Users },
    { v: 'all', label: 'الكل', Icon: Users },
];

export default function Dashboard({ tickets, stats, current_status }) {
    const logout = (e) => { e.preventDefault(); router.post('/logout'); };

    return (
        <>
            <Head title="لوحة الدعم" />
            <div className="min-h-screen bg-beige/30" dir="rtl">
                {/* Header */}
                <header className="bg-navy text-white">
                    <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-royal">
                                <Headphones className="h-5 w-5" />
                            </span>
                            <div>
                                <b className="font-head text-lg">لوحة الدعم الفني</b>
                                <div className="text-xs opacity-70">محفول مكفول</div>
                            </div>
                        </div>
                        <a href="#" onClick={logout} className="flex items-center gap-1.5 text-sm font-bold text-white/80 hover:text-white">
                            <LogOut className="h-4 w-4" /> خروج
                        </a>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1400px] px-5 py-8">
                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'مفتوحة', v: stats.open, Icon: Inbox, color: 'text-royal' },
                            { label: 'غير مسندة', v: stats.unassigned, Icon: Ticket, color: 'text-coral-deep' },
                            { label: 'تذاكري', v: stats.mine, Icon: UserCircle2, color: 'text-vip' },
                            { label: 'اليوم', v: stats.today, Icon: Clock, color: 'text-makfol' },
                        ].map(s => (
                            <div key={s.label} className="rounded-card border border-black/[.06] bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-11 w-11 place-items-center rounded-full bg-beige">
                                        <s.Icon className={cn('h-5 w-5', s.color)} />
                                    </span>
                                    <div>
                                        <div className="font-head text-2xl font-bold text-navy">{s.v}</div>
                                        <div className="text-[13px] font-semibold text-muted">{s.label}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        {FILTERS.map(({ v, label, Icon }) => (
                            <Link
                                key={v}
                                href={`/support?status=${v}`}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-colors',
                                    current_status === v ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-beige',
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" /> {label}
                            </Link>
                        ))}
                    </div>

                    {/* Tickets Table */}
                    <div className="overflow-hidden rounded-card border border-black/[.06] bg-white">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-navy/95 text-white">
                                <tr>
                                    <th className="p-3">الرقم</th>
                                    <th className="p-3">العميل</th>
                                    <th className="p-3">الموضوع</th>
                                    <th className="p-3">النوع</th>
                                    <th className="p-3">الحالة</th>
                                    <th className="p-3">مسند إلى</th>
                                    <th className="p-3">منذ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.map(t => (
                                    <tr key={t.code} className="border-b border-black/[.04] transition-colors hover:bg-beige/50">
                                        <td className="p-3">
                                            <Link href={`/support/tickets/${t.code}`} className="font-bold text-coral-deep hover:underline">
                                                {t.code}
                                            </Link>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-navy">{t.customer.name}</div>
                                            <div className="text-[12px] text-muted">{t.customer.email}</div>
                                        </td>
                                        <td className="p-3">{t.subject}</td>
                                        <td className="p-3 text-muted">{t.category_label}</td>
                                        <td className="p-3">
                                            <Badge variant={STATUS_VARIANT[t.status]}>{t.status_label}</Badge>
                                        </td>
                                        <td className="p-3 text-muted">{t.assignee || '—'}</td>
                                        <td className="p-3 text-[12px] text-muted">{t.created_ago}</td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr><td colSpan={7} className="p-12 text-center text-muted">لا توجد تذاكر بهذا الفلتر.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {tickets.last_page > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            {tickets.links?.map((lnk, i) => (
                                <Button key={i} asChild variant={lnk.active ? 'primary' : 'secondary'} size="sm">
                                    <Link href={lnk.url || '#'} dangerouslySetInnerHTML={{ __html: lnk.label }} />
                                </Button>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
