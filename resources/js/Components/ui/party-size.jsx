import * as React from 'react';
import { Select } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

const MORE = '__more__';

// صياغة عربية سليمة للعدد (3–10 جمع، 11+ مفرد)
function countLabel(n, singular, plural) {
    if (n >= 3 && n <= 10) return `${n} ${plural}`;
    return `${n} ${singular}`;
}

/**
 * حقل عدد الأفراد/المسافرين مع خيار "أكثر" لإدخال عدد مخصّص.
 * - لو العميل عايز عدد أكبر من أكبر خيار، يختار "أكثر من X" فيظهر حقل رقم.
 * - الرقم بيتحسب في السعر، وبحد أقصى `max` (افتراضي 20).
 *
 * props:
 *   value        القيمة الحالية (number | '')
 *   onChange     (n:number|'') => void   — مصدر واحد للحقيقة (رقم فقط)
 *   options      [{ value, label }]      — الخيارات الجاهزة
 *   max          الحد الأقصى (افتراضي 20)
 *   singular/plural  اسم الوحدة للـ label الجانبي (فرد/أفراد، ليلة/ليالي…)
 *   moreLabel    نص خيار "أكثر" (افتراضي: أكثر من {أكبر خيار})
 *   placeholder  نص الخيار الفارغ (اختياري)
 */
export function PartySizeField({
    value,
    onChange,
    options,
    max = 20,
    singular = 'فرد',
    plural = 'أفراد',
    moreLabel,
    placeholder,
    className,
    selectClassName,
}) {
    const maxPreset = React.useMemo(() => {
        const nums = options.map((o) => Number(o.value)).filter((n) => !Number.isNaN(n));
        return nums.length ? Math.max(...nums) : 0;
    }, [options]);
    const floor = maxPreset + 1; // أقل عدد مخصّص

    const numeric = value === '' || value == null ? null : Number(value);
    const externalCustom = numeric != null && numeric > maxPreset;

    const [custom, setCustom] = React.useState(externalCustom);
    // draft = النص المعروض في حقل الرقم (يسمح بالكتابة/المسح بسلاسة)
    const [draft, setDraft] = React.useState(externalCustom ? String(numeric) : '');

    // مزامنة قيمة قادمة من الخارج (مثلاً prefill في صفحة الدفع)
    React.useEffect(() => {
        if (externalCustom && !custom) {
            setCustom(true);
            setDraft(String(numeric));
        }
    }, [externalCustom, custom, numeric]);

    const selectValue = custom ? MORE : numeric == null ? '' : String(numeric);

    const onSelect = (e) => {
        const v = e.target.value;
        if (v === MORE) {
            setCustom(true);
            setDraft(String(Math.min(max, floor)));
            onChange(Math.min(max, floor));
        } else {
            setCustom(false);
            setDraft('');
            onChange(v === '' ? '' : Number(v));
        }
    };

    const onNum = (e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw === '') return; // سيبه فاضي مؤقتًا، والسعر يفضل على آخر قيمة صحيحة
        let n = parseInt(raw, 10);
        if (Number.isNaN(n)) return;
        if (n > max) { n = max; setDraft(String(max)); }
        if (n >= 1) onChange(n);
    };

    // عند مغادرة الحقل: تثبيت قيمة صحيحة ضمن [أكبر خيار + 1، الحد الأقصى]
    const onBlur = () => {
        let n = parseInt(draft, 10);
        if (Number.isNaN(n) || n < floor) n = Math.min(max, floor);
        if (n > max) n = max;
        setDraft(String(n));
        onChange(n);
    };

    const draftNum = parseInt(draft, 10);

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <Select value={selectValue} onChange={onSelect} className={selectClassName}>
                {placeholder && <option value="" disabled hidden>{placeholder}</option>}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                <option value={MORE}>{moreLabel || `أكثر من ${maxPreset}…`}</option>
            </Select>

            {custom && (
                <div className="flex items-center gap-2.5 rounded-input border border-coral/30 bg-coral/[.05] px-3 py-2 duration-200 animate-in fade-in slide-in-from-top-1">
                    <input
                        type="number"
                        inputMode="numeric"
                        min={floor}
                        max={max}
                        value={draft}
                        onChange={onNum}
                        onBlur={onBlur}
                        aria-label="عدد مخصّص"
                        className="h-9 w-[68px] rounded-md border border-black/10 bg-white text-center text-sm font-bold text-navy outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                    />
                    <span className="text-[13px] font-semibold text-muted">
                        {!Number.isNaN(draftNum) ? countLabel(draftNum, singular, plural) : ''}
                        <span className="text-muted/70"> · الحد الأقصى {max}</span>
                    </span>
                </div>
            )}
        </div>
    );
}
