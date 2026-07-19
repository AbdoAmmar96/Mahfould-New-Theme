// محفول مكفول — فورم عام لإضافة/تعديل أي مورد (مبني من schema)
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input, Select } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

// يبني القيم الابتدائية من الحقول + السجل (للتعديل)
function initialValues(sections, record) {
    const values = {};
    sections.forEach((s) => s.fields.forEach((f) => {
        const cur = record ? record[f.name] : undefined;
        if (f.type === 'toggle') values[f.name] = cur ?? false;
        else if (f.type === 'tags') values[f.name] = cur ?? [];
        else values[f.name] = cur ?? '';
    }));
    return values;
}

function TagsInput({ value, onChange }) {
    const [draft, setDraft] = useState('');
    const add = () => { const v = draft.trim(); if (v && !value.includes(v)) onChange([...value, v]); setDraft(''); };
    return (
        <div className="flex flex-wrap gap-[7px] rounded-input border border-black/10 bg-cream p-2">
            {value.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-[13px] text-white">
                    {tag}
                    <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-white/75 transition-colors hover:text-white">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </span>
            ))}
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
                onBlur={add} placeholder="اكتب واضغط Enter"
                className="min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm text-navy outline-none placeholder:text-muted/70" />
        </div>
    );
}

function Field({ field, value, error, setData }) {
    const { name, type, label, required, prefix, placeholder, rows, options, disabled, full } = field;
    const set = (v) => setData(name, v);

    let control;
    if (type === 'textarea') {
        control = (
            <textarea rows={rows || 3} value={value} placeholder={placeholder}
                onChange={(e) => set(e.target.value)} disabled={disabled}
                className={cn(
                    'w-full rounded-input border border-black/10 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-muted/70 focus:border-coral focus:ring-2 focus:ring-coral/20 disabled:opacity-50',
                    error && 'border-danger',
                )} />
        );
    } else if (type === 'select') {
        control = (
            <Select value={value} onChange={(e) => set(e.target.value)} disabled={disabled}>
                <option value="">— اختر —</option>
                {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </Select>
        );
    } else if (type === 'toggle') {
        return (
            <div className={cn('flex flex-col gap-1.5', full && 'col-span-full')}>
                <label className="flex cursor-pointer select-none items-center gap-2.5">
                    <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} className="peer sr-only" />
                    <span className="relative h-[25px] w-11 flex-none rounded-full bg-[#D8CFC0] transition-colors after:absolute after:start-[3px] after:top-[3px] after:h-[19px] after:w-[19px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,.2)] after:transition-transform peer-checked:bg-makfol peer-checked:after:-translate-x-[19px]" />
                    <span className="text-sm font-semibold text-navy">{label}</span>
                </label>
            </div>
        );
    } else if (type === 'tags') {
        control = <TagsInput value={value || []} onChange={set} />;
    } else {
        const input = (
            <Input
                type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                value={value} placeholder={placeholder} disabled={disabled}
                onChange={(e) => set(e.target.value)}
                className={cn(prefix && 'ps-[42px]', error && 'border-danger')} />
        );
        control = prefix
            ? (
                <div className="relative">
                    <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">{prefix}</span>
                    {input}
                </div>
            )
            : input;
    }

    return (
        <div className={cn('flex flex-col gap-1.5', full && 'col-span-full')}>
            <label className="text-[13.5px] font-bold text-navy">{label} {required && <span className="text-danger">*</span>}</label>
            {control}
            {error && <span className="text-[12.5px] text-danger">{error}</span>}
        </div>
    );
}

export default function CrudForm({ meta, sections, record }) {
    const editing = !!record;
    const form = useForm(initialValues(sections, record));
    const { data, setData, errors, processing } = form;

    const submit = (e) => {
        e.preventDefault();
        if (editing) form.put(`${meta.base}/${record.id}`);
        else form.post(meta.base);
    };

    const heading = editing ? `تعديل ${meta.singular}` : `إضافة ${meta.singular}`;

    return (
        <AdminLayout title={heading} crumb={meta.label}>
            <Head title={heading} />
            <form className="max-w-[920px]" onSubmit={submit}>
                {sections.map((section, i) => (
                    <div key={i} className="mb-[18px] rounded-card border border-black/[.06] bg-white px-[22px] py-5 shadow-mk">
                        <h3 className="mb-4 font-head text-[17px] font-bold text-navy">{section.title}</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {section.fields.map((field) => (
                                <Field key={field.name} field={field}
                                    value={data[field.name]} error={errors[field.name]} setData={setData} />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="mt-1 flex gap-2.5">
                    <Button type="submit" size="lg" disabled={processing}>
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {processing ? 'جاري الحفظ…' : (editing ? 'حفظ التعديلات' : `إضافة ${meta.singular}`)}
                    </Button>
                    <Button asChild variant="secondary" size="lg"><Link href={meta.base}>إلغاء</Link></Button>
                </div>
            </form>
        </AdminLayout>
    );
}
