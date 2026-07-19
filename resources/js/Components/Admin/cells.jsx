// محفول مكفول — مساعدات عرض خلايا الجداول للوحة التحكم

export function money(n) {
    return new Intl.NumberFormat('en-US').format(Math.round(n || 0));
}

// تسميات + ألوان الشارات (حالات + قيم معروفة)
const BADGES = {
    publish: ['منشور', 't-green'],
    draft: ['مسودة', 't-gray'],
    pending: ['قيد المراجعة', 't-amber'],
    confirmed: ['مؤكّد', 't-green'],
    processing: ['قيد المعالجة', 't-amber'],
    completed: ['مكتمل', 't-green'],
    cancelled: ['ملغي', 't-red'],
    unpaid: ['غير مدفوع', 't-amber'],
    paid: ['مدفوع', 't-green'],
    refunded: ['مسترجع', 't-gray'],
    automatic: ['أوتوماتيك', 't-navy'],
    manual: ['مانيوال', 't-navy'],
};

export function Badge({ value }) {
    if (value === null || value === undefined || value === '') return <span className="mkad-money-muted">—</span>;
    const [label, tone] = BADGES[value] || [value, 't-navy'];
    return <span className={`mkad-badge ${tone}`}>{label}</span>;
}

// يعرض خلية حسب نوع العمود
export function Cell({ col, row }) {
    const v = row[col.key];

    switch (col.type) {
        case 'image':
            return <img className="thumb" src={row.image_url} alt="" loading="lazy" />;
        case 'money':
            return <>{money(v)} <small className="mkad-money-muted">ج.م</small></>;
        case 'money-muted':
            return <span className="mkad-money-muted">{money(v)} ج.م</span>;
        case 'money-good':
            return <span className="mkad-money-good">{money(v)} ج.م</span>;
        case 'bool':
            return v ? <span className="mkad-bool-y">✓</span> : <span className="mkad-bool-n">✕</span>;
        case 'badge':
            return <Badge value={v} />;
        case 'stars':
            return <span title={`${v} نجوم`}>{'⭐'.repeat(Number(v) || 0)}</span>;
        case 'strong':
            return <span className="mkad-td-strong">{v ?? '—'}</span>;
        default:
            return <>{v === null || v === undefined || v === '' ? <span className="mkad-money-muted">—</span> : v}</>;
    }
}
