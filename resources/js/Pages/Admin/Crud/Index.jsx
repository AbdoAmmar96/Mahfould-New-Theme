// محفول مكفول — جدول عام لأي مورد في اللوحة (يعرض meta + columns + rows)
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Undo2, Trash2, FolderOpen } from 'lucide-react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Cell } from '../../../Components/Admin/cells';
import { Button } from '@/Components/ui/button';
import { Input, Select } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

const actionBtn = 'inline-flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[13px] font-bold transition';
const editBtn = cn(actionBtn, 'border-black/[.06] bg-white text-navy hover:bg-beige');
const dangerBtn = cn(actionBtn, 'border-[#F0D2CC] bg-white text-danger hover:bg-[#FBEBE8]');

export default function CrudIndex({ meta, columns, filters, rows, query }) {
    const [search, setSearch] = useState(query.q || '');

    const applyFilter = (patch) => {
        router.get(meta.base, { ...query, ...patch }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitSearch = (e) => {
        e.preventDefault();
        applyFilter({ q: search || undefined });
    };

    const remove = (id) => {
        if (confirm(`متأكد إنك عايز تحذف ${meta.singular} ده؟`)) {
            router.delete(`${meta.base}/${id}`, { preserveScroll: true });
        }
    };

    const refund = (id) => {
        if (confirm('تأكيد استرجاع مبلغ هذا الحجز عبر بوابة الدفع؟')) {
            router.post(`${meta.base}/${id}/refund`, {}, { preserveScroll: true });
        }
    };

    const hasActions = meta.canEdit || meta.canDelete;

    return (
        <AdminLayout
            title={meta.label}
            crumb={`${rows.total} ${meta.singular}`}
            actions={meta.canCreate && (
                <Button asChild>
                    <Link href={`${meta.base}/create`}><Plus className="h-4 w-4" /> إضافة {meta.singular}</Link>
                </Button>
            )}
        >
            <Head title={meta.label} />

            <div className="overflow-hidden rounded-card border border-black/[.06] bg-white shadow-mk">
                <div className="flex flex-wrap items-center gap-2.5 border-b border-black/[.06] px-4 py-3.5">
                    <form onSubmit={submitSearch} className="flex-1">
                        <Input className="min-w-[220px] bg-cream" placeholder={`ابحث في ${meta.label}…`}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </form>
                    {filters.map((f) => (
                        <Select key={f.name} className="w-auto" value={query[f.name] || ''}
                            onChange={(e) => applyFilter({ [f.name]: e.target.value || undefined })}>
                            <option value="">{f.label}: الكل</option>
                            {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </Select>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {columns.map((c) => (
                                    <th key={c.key} className="whitespace-nowrap border-b border-black/[.06] bg-cream px-3.5 py-3 text-right text-[12.5px] font-bold text-muted">{c.label}</th>
                                ))}
                                {hasActions && <th className="whitespace-nowrap border-b border-black/[.06] bg-cream px-3.5 py-3 text-right text-[12.5px] font-bold text-muted">إجراءات</th>}
                            </tr>
                        </thead>
                        <tbody className="[&>tr:last-child>td]:border-b-0">
                            {rows.data.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-[#FCFAF6]">
                                    {columns.map((c) => (
                                        <td key={c.key} className="border-b border-black/[.06] px-3.5 py-[11px] align-middle text-sm"><Cell col={c} row={row} /></td>
                                    ))}
                                    {hasActions && (
                                        <td className="border-b border-black/[.06] px-3.5 py-[11px] align-middle text-sm">
                                            <div className="flex justify-start gap-1.5">
                                                {meta.canEdit && (
                                                    <Link href={`${meta.base}/${row.id}/edit`} className={editBtn}><Pencil className="h-3.5 w-3.5" /> تعديل</Link>
                                                )}
                                                {row.can_refund && (
                                                    <button className={dangerBtn} onClick={() => refund(row.id)}><Undo2 className="h-3.5 w-3.5" /> استرجاع</button>
                                                )}
                                                {meta.canDelete && (
                                                    <button className={dangerBtn} onClick={() => remove(row.id)}><Trash2 className="h-3.5 w-3.5" /> حذف</button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {rows.data.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length + (hasActions ? 1 : 0)} className="align-middle">
                                        <div className="px-5 py-[60px] text-center text-muted">
                                            <FolderOpen className="mx-auto mb-3 h-10 w-10 opacity-50" />
                                            مفيش {meta.label} لسه.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {rows.last_page > 1 && (
                    <div className="flex flex-wrap justify-center gap-1.5 p-4">
                        {rows.links.map((link, i) => (
                            link.url
                                ? <Link key={i} href={link.url}
                                    className={cn('min-w-9 rounded-[9px] border border-black/[.06] bg-white px-2.5 py-[7px] text-center text-sm font-semibold text-navy transition hover:bg-beige',
                                        link.active && 'border-navy bg-navy text-white hover:bg-navy')}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                                : <span key={i} className="min-w-9 rounded-[9px] border border-black/[.06] bg-white px-2.5 py-[7px] text-center text-sm font-semibold text-navy opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
