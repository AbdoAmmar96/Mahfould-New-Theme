// محفول مكفول — جدول عام لأي مورد في اللوحة (يعرض meta + columns + rows)
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Cell } from '../../../Components/Admin/cells';

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
                <Link href={`${meta.base}/create`} className="mk-btn mk-btn-primary">+ إضافة {meta.singular}</Link>
            )}
        >
            <Head title={meta.label} />

            <div className="mkad-panel">
                <div className="mkad-toolbar">
                    <form onSubmit={submitSearch} className="grow">
                        <input className="mkad-search" placeholder={`ابحث في ${meta.label}…`}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </form>
                    {filters.map((f) => (
                        <select key={f.name} className="mkad-select" value={query[f.name] || ''}
                            onChange={(e) => applyFilter({ [f.name]: e.target.value || undefined })}>
                            <option value="">{f.label}: الكل</option>
                            {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                    ))}
                </div>

                <div className="mkad-table-wrap">
                    <table className="mkad-table">
                        <thead>
                            <tr>
                                {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                                {hasActions && <th>إجراءات</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.data.map((row) => (
                                <tr key={row.id}>
                                    {columns.map((c) => <td key={c.key}><Cell col={c} row={row} /></td>)}
                                    {hasActions && (
                                        <td>
                                            <div className="mkad-row-actions">
                                                {meta.canEdit && (
                                                    <Link href={`${meta.base}/${row.id}/edit`} className="mkad-iconbtn">تعديل</Link>
                                                )}
                                                {row.can_refund && (
                                                    <button className="mkad-iconbtn danger" onClick={() => refund(row.id)}>استرجاع</button>
                                                )}
                                                {meta.canDelete && (
                                                    <button className="mkad-iconbtn danger" onClick={() => remove(row.id)}>حذف</button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {rows.data.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length + (hasActions ? 1 : 0)}>
                                        <div className="mkad-empty"><div className="big">🗂️</div>مفيش {meta.label} لسه.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {rows.last_page > 1 && (
                    <div className="mkad-pager">
                        {rows.links.map((link, i) => (
                            link.url
                                ? <Link key={i} href={link.url} className={link.active ? 'is-active' : ''}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                                : <span key={i} className="disabled" dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
