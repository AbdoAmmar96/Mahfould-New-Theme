// محفول مكفول — قالب صفحة القوائم في وضع الموبايل
// الفلاتر في شيت (مش sidebar) والترتيب في شيت — زي كل تطبيقات الحجز.
import { useState } from 'react';
import {
    MobileFilterBar, MobileSheet, MobileOptionList, MobileEmpty, MobilePager, MobileCTA,
} from './primitives';

export default function MobileListing({
    q, onQ, searchPlaceholder,
    count, countLabel,
    activeCount = 0, onClear,
    filters,
    sort, onSort, sortOptions = [],
    items = [], renderItem,
    paginator,
    emptyText = 'مفيش نتائج مطابقة.',
    children,
}) {
    const [sheet, setSheet] = useState(null); // 'filters' | 'sort' | null
    const sortLabel = sortOptions.find((o) => o.value === sort)?.label;

    return (
        <div className="lg:hidden">
            <MobileFilterBar
                q={q}
                onQ={onQ}
                placeholder={searchPlaceholder}
                activeCount={activeCount}
                onOpenFilters={filters ? () => setSheet('filters') : undefined}
                sortLabel={sortLabel}
                onOpenSort={sortOptions.length ? () => setSheet('sort') : undefined}
            />

            {children}

            <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-[13px] font-bold text-navy">
                    <b className="text-coral-deep">{count}</b> {countLabel}
                </p>
                {activeCount > 0 && (
                    <button type="button" onClick={onClear} className="mk-press text-[12.5px] font-bold text-coral-deep">
                        مسح الفلاتر
                    </button>
                )}
            </div>

            {items.length > 0 ? (
                <div>{items.map(renderItem)}</div>
            ) : (
                <MobileEmpty text={emptyText} actionLabel={activeCount > 0 ? 'مسح كل الفلاتر' : undefined} onAction={onClear} />
            )}

            <MobilePager paginator={paginator} />

            {/* مساحة تحت — عشان آخر كارت ميتغطّاش بشريط التبويب */}
            <div className="h-4" />

            {filters && (
                <MobileSheet
                    open={sheet === 'filters'}
                    onOpenChange={(o) => !o && setSheet(null)}
                    title="فلترة النتائج"
                    footer={
                        <div className="flex gap-2.5">
                            {activeCount > 0 && (
                                <div className="w-[38%]">
                                    <MobileCTA variant="secondary" onClick={() => { setSheet(null); onClear(); }}>مسح</MobileCTA>
                                </div>
                            )}
                            <div className="flex-1">
                                <MobileCTA onClick={() => setSheet(null)}>
                                    عرض {count} نتيجة
                                </MobileCTA>
                            </div>
                        </div>
                    }
                >
                    {filters}
                </MobileSheet>
            )}

            {sortOptions.length > 0 && (
                <MobileSheet open={sheet === 'sort'} onOpenChange={(o) => !o && setSheet(null)} title="ترتيب حسب">
                    <MobileOptionList
                        options={sortOptions}
                        value={sort}
                        onChange={(v) => { onSort(v); setSheet(null); }}
                    />
                </MobileSheet>
            )}
        </div>
    );
}
