import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { MapPin, Home, Building2, Palmtree, Plus, Trash2, Star, Ticket, Heart, Crown, LogOut } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';

const LABEL_ICONS = {
    'البيت': Home,
    'الشغل': Building2,
    'الساحل': Palmtree,
};

export default function Addresses({ addresses }) {
    const { auth } = usePage().props;
    const logout = (e) => { e.preventDefault(); router.post('/logout'); };
    const [editing, setEditing] = useState(null);

    const setDefault = (id) => router.post(`/account/addresses/${id}/default`, {}, { preserveScroll: true });
    const remove = (id) => {
        if (!confirm('احذف العنوان؟')) return;
        router.delete(`/account/addresses/${id}`, { preserveScroll: true });
    };

    return (
        <SiteLayout>
            <Head title="عناويني" />
            <section className="bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70">
                        <Link href="/" className="hover:text-white">الرئيسية</Link> ›{' '}
                        <Link href="/account" className="hover:text-white">حسابي</Link> › عناويني
                    </div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">عناويني</h1>
                </div>
            </section>

            <section className="pb-14 pt-[34px]">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[250px_1fr]">
                        <aside className="rounded-card border border-black/[.06] bg-white p-4 lg:sticky lg:top-[92px]">
                            <div className="mb-3 flex items-center gap-3 border-b border-black/[.06] px-2 pb-[18px] pt-2">
                                <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-deep font-head text-lg font-extrabold text-white">{auth.user.initials}</div>
                                <div>
                                    <b className="font-head">{auth.user.name}</b>
                                    <div className="flex items-center gap-1 text-[12.5px] text-muted">عضو <Star className="h-3 w-3 fill-vip text-vip" /></div>
                                </div>
                            </div>
                            <nav className="flex flex-col">
                                <Link href="/account" className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-navy transition-colors hover:bg-beige">
                                    <Ticket className="h-[18px] w-[18px]" /> حجوزاتي
                                </Link>
                                <Link href="/wishlist" className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-navy transition-colors hover:bg-beige">
                                    <Heart className="h-[18px] w-[18px]" /> المفضلة
                                </Link>
                                <Link href="/account/addresses" className="flex items-center gap-[11px] rounded-[10px] bg-navy px-3 py-[11px] text-[14.5px] font-bold text-white">
                                    <MapPin className="h-[18px] w-[18px]" /> عناويني
                                </Link>
                                <Link href="/sahb-elsaada" className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-navy transition-colors hover:bg-beige">
                                    <Crown className="h-[18px] w-[18px]" /> صاحب السعادة
                                </Link>
                                <a href="#" onClick={logout} className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-danger transition-colors hover:bg-beige">
                                    <LogOut className="h-[18px] w-[18px]" /> خروج
                                </a>
                            </nav>
                        </aside>

                        <div>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <h3 className="m-0 font-head text-xl font-semibold text-navy">
                                    عناوين محفوظة <span className="text-sm font-normal text-muted">({addresses.length})</span>
                                </h3>
                                <AddressDialog onOpen={() => setEditing(null)} editing={editing}>
                                    <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> عنوان جديد</Button>
                                </AddressDialog>
                            </div>

                            {addresses.length === 0 && (
                                <div className="rounded-card border border-dashed border-black/[.15] bg-beige/40 p-12 text-center">
                                    <MapPin className="mx-auto h-12 w-12 text-muted" />
                                    <p className="mt-3 text-muted">لسه محفظتش أي عنوان.</p>
                                    <p className="mt-1 text-[13px] text-muted">أضف البيت، الشغل، أو الساحل عشان نساعدك تحجز أسرع.</p>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                {addresses.map(addr => {
                                    const Icon = LABEL_ICONS[addr.label] || MapPin;
                                    return (
                                        <div key={addr.id} className={cn(
                                            'rounded-card border-[1.5px] bg-white p-4 transition-colors',
                                            addr.is_default ? 'border-coral shadow-sm' : 'border-black/[.06]',
                                        )}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/[.08] text-coral-deep">
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <div>
                                                        <b className="block font-head text-navy">{addr.label}</b>
                                                        {addr.is_default && <span className="text-[11px] font-bold text-coral-deep">افتراضي</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <AddressDialog onOpen={() => setEditing(addr)} editing={editing}>
                                                        <button className="rounded-md p-1.5 text-muted hover:bg-beige hover:text-navy" onClick={() => setEditing(addr)}>
                                                            تعديل
                                                        </button>
                                                    </AddressDialog>
                                                    <button
                                                        onClick={() => remove(addr.id)}
                                                        className="rounded-md p-1.5 text-danger hover:bg-danger/[.08]"
                                                        aria-label="حذف"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-navy">{addr.address}</p>
                                            {addr.city && <p className="text-[13px] text-muted">{addr.city}</p>}
                                            {addr.notes && <p className="mt-1 text-[12px] text-muted">{addr.notes}</p>}
                                            {!addr.is_default && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => setDefault(addr.id)}
                                                >
                                                    اجعله الافتراضي
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}

function AddressDialog({ children, editing }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        label: editing?.label || '',
        address: editing?.address || '',
        city: editing?.city || '',
        lat: editing?.lat || '',
        lng: editing?.lng || '',
        notes: editing?.notes || '',
        is_default: editing?.is_default || false,
    });

    const submit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => { setOpen(false); reset(); } };
        if (editing?.id) put(`/account/addresses/${editing.id}`, options);
        else post('/account/addresses', options);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editing?.id ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-3.5">
                    <Field label="التسمية">
                        <div className="grid grid-cols-3 gap-2">
                            {['البيت', 'الشغل', 'الساحل'].map(l => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => setData('label', l)}
                                    className={cn(
                                        'rounded-input border-[1.5px] p-2 text-sm font-bold transition-colors',
                                        data.label === l ? 'border-coral bg-coral/[.08] text-coral-deep' : 'border-black/[.08] text-navy hover:border-coral',
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <Input
                            className="mt-2"
                            placeholder="أو اكتب تسمية أخرى"
                            value={data.label}
                            onChange={e => setData('label', e.target.value)}
                        />
                    </Field>
                    <Field label="العنوان">
                        <Input value={data.address} onChange={e => setData('address', e.target.value)} placeholder="الشارع + الرقم + المنطقة" />
                    </Field>
                    <Field label="المدينة">
                        <Input value={data.city} onChange={e => setData('city', e.target.value)} placeholder="القاهرة / الغردقة / …" />
                    </Field>
                    <Field label="ملاحظات (اختياري)">
                        <Input value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="طابق 3 · شقة 12 · بجوار…" />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-navy">
                        <input
                            type="checkbox"
                            checked={data.is_default}
                            onChange={e => setData('is_default', e.target.checked)}
                            className="h-4 w-4 accent-coral"
                        />
                        اجعله العنوان الافتراضي
                    </label>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button>
                        <Button type="submit" disabled={processing || !data.label || !data.address}>
                            {editing?.id ? 'حفظ التعديل' : 'إضافة'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
