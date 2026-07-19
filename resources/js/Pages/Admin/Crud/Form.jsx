// محفول مكفول — فورم عام لإضافة/تعديل أي مورد (مبني من schema)
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';

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
        <div className="mkad-tags">
            {value.map((tag, i) => (
                <span key={i} className="tag">{tag}<button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button></span>
            ))}
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
                onBlur={add} placeholder="اكتب واضغط Enter" />
        </div>
    );
}

function Field({ field, value, error, setData }) {
    const { name, type, label, required, prefix, placeholder, rows, options, disabled, full } = field;
    const set = (v) => setData(name, v);

    let control;
    if (type === 'textarea') {
        control = <textarea className="mkad-textarea" rows={rows || 3} value={value} placeholder={placeholder}
            onChange={(e) => set(e.target.value)} disabled={disabled} />;
    } else if (type === 'select') {
        control = (
            <select className="mkad-input" value={value} onChange={(e) => set(e.target.value)} disabled={disabled}>
                <option value="">— اختر —</option>
                {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
        );
    } else if (type === 'toggle') {
        return (
            <div className={`mkad-field ${full ? 'full' : ''}`}>
                <label className="mkad-toggle">
                    <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} />
                    <span className="track" /><span className="tlabel">{label}</span>
                </label>
            </div>
        );
    } else if (type === 'tags') {
        control = <TagsInput value={value || []} onChange={set} />;
    } else {
        const input = <input className={`mkad-input ${error ? 'is-error' : ''}`}
            type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
            value={value} placeholder={placeholder} disabled={disabled}
            onChange={(e) => set(e.target.value)} />;
        control = prefix
            ? <div className="mkad-prefixed"><span className="pfx">{prefix}</span>{input}</div>
            : input;
    }

    return (
        <div className={`mkad-field ${full ? 'full' : ''}`}>
            <label>{label} {required && <span className="req">*</span>}</label>
            {control}
            {error && <span className="mkad-err">{error}</span>}
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
            <form className="mkad-form" onSubmit={submit}>
                {sections.map((section, i) => (
                    <div key={i} className="mkad-section">
                        <h3>{section.title}</h3>
                        <div className="mkad-grid">
                            {section.fields.map((field) => (
                                <Field key={field.name} field={field}
                                    value={data[field.name]} error={errors[field.name]} setData={setData} />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="mkad-form-actions">
                    <button type="submit" disabled={processing} className="mk-btn mk-btn-primary mk-btn-lg">
                        {processing ? 'جاري الحفظ…' : (editing ? 'حفظ التعديلات' : `إضافة ${meta.singular}`)}
                    </button>
                    <Link href={meta.base} className="mk-btn mk-btn-secondary mk-btn-lg">إلغاء</Link>
                </div>
            </form>
        </AdminLayout>
    );
}
