import SiteLayout from '@/Layouts/SiteLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, User, ShieldCheck, FileText, IdCard, Info, Check } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input, Field } from '@/Components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Checkbox } from '@/Components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        provider_type: 'company',
        name: '', email: '', phone: '', password: '', password_confirmation: '',
        business_name: '', about: '',
        national_id: '', license_no: '', license_authority: '',
        terms_accepted: false,
    });

    const submit = (e) => { e.preventDefault(); post('/provider/register'); };
    const isIndividual = data.provider_type === 'individual';

    return (
        <SiteLayout>
            <Head title="تسجيل مزوّد خدمة" />
            <section className="py-10 md:py-16">
                <div className="mx-auto w-full max-w-[860px] px-5">
                    <div className="mb-8 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-royal/10 px-4 py-1.5 text-[13px] font-bold text-royal">
                            <Building2 className="h-3.5 w-3.5" /> بوابة الشركاء
                        </span>
                        <h1 className="mt-3 font-head text-3xl font-bold text-navy md:text-4xl">انضم كمزوّد خدمة لمحفول مكفول</h1>
                        <p className="mt-2 text-muted">قدّم رحلاتك، فنادقك، أو خدماتك لآلاف العملاء — بعد موافقة إدارتنا.</p>
                    </div>

                    <div className="mb-6 rounded-card border border-royal/25 bg-royal/[.04] p-4 text-[13px] leading-relaxed text-navy">
                        <div className="mb-1 flex items-center gap-2 font-bold text-royal"><Info className="h-4 w-4" /> ملاحظات مهمة قبل التسجيل</div>
                        <ul className="ms-6 list-disc space-y-1">
                            <li>حسابك يتفتح فوراً بعد التسجيل — تقدر تدخل لوحتك وتجهّز الخدمات مباشرة.</li>
                            <li>لكن الخدمات <b>لا تُنشر للعملاء إلا بعد مراجعة وموافقة الإدارة</b>.</li>
                            <li>الأفراد يجب رفع <b>"فيش وتشبيه"</b> (شهادة السجل الجنائي) بعد التسجيل قبل الموافقة.</li>
                            <li>الشركات تحتاج للرد على طلبات المستندات (سجل تجاري، بطاقة ضريبية، ترخيص سياحي).</li>
                        </ul>
                    </div>

                    <form onSubmit={submit} className="rounded-card border border-black/[.06] bg-white p-6 shadow-mk">
                        {/* نوع المزوّد */}
                        <div className="mb-6">
                            <div className="mb-3 font-head text-[17px] font-bold text-navy">نوع المزوّد</div>
                            <RadioGroup
                                value={data.provider_type}
                                onValueChange={(v) => setData('provider_type', v)}
                                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                            >
                                {[
                                    { key: 'company', label: 'شركة', Icon: Building2, hint: 'شركة سياحية / فندقية / تأجير' },
                                    { key: 'individual', label: 'فرد', Icon: User, hint: 'صاحب عربية / سائق توصيل / خدمة فردية' },
                                ].map((opt) => {
                                    const sel = data.provider_type === opt.key;
                                    return (
                                        <label key={opt.key} className={cn(
                                            'flex cursor-pointer items-start gap-3 rounded-input border-[1.5px] p-4 transition-colors hover:border-coral',
                                            sel ? 'border-coral bg-coral/[.06]' : 'border-black/[.08]',
                                        )}>
                                            <RadioGroupItem value={opt.key} className="mt-1" />
                                            <div>
                                                <div className="flex items-center gap-2 font-head font-bold text-navy">
                                                    <opt.Icon className="h-4 w-4 text-coral-deep" /> {opt.label}
                                                </div>
                                                <div className="text-[13px] text-muted">{opt.hint}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </RadioGroup>
                        </div>

                        <h3 className="mb-3 font-head text-[17px] font-bold text-navy">بيانات صاحب الحساب</h3>
                        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            <Field label="الاسم الكامل">
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)}
                                    className={cn(errors.name && 'border-danger ring-2 ring-danger/20')} />
                            </Field>
                            <Field label="رقم الموبايل">
                                <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="010xxxxxxxx"
                                    className={cn(errors.phone && 'border-danger ring-2 ring-danger/20')} />
                            </Field>
                            <Field label="البريد الإلكتروني">
                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                    className={cn(errors.email && 'border-danger ring-2 ring-danger/20')} />
                            </Field>
                            <Field label="كلمة المرور">
                                <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)}
                                    className={cn(errors.password && 'border-danger ring-2 ring-danger/20')} />
                            </Field>
                            <Field label="تأكيد كلمة المرور">
                                <Input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
                            </Field>
                        </div>

                        <h3 className="mb-3 font-head text-[17px] font-bold text-navy">بيانات الكيان</h3>
                        <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            <Field label={isIndividual ? 'الاسم التجاري / المستعار' : 'اسم الشركة'} className="sm:col-span-2">
                                <Input value={data.business_name} onChange={(e) => setData('business_name', e.target.value)}
                                    placeholder={isIndividual ? 'مثلاً: عربية سائق أحمد' : 'مثلاً: شركة نجوم السياحة'}
                                    className={cn(errors.business_name && 'border-danger ring-2 ring-danger/20')} />
                            </Field>

                            {isIndividual ? (
                                <Field label={<><IdCard className="mr-1 inline h-4 w-4" /> الرقم القومي</>}>
                                    <Input value={data.national_id} onChange={(e) => setData('national_id', e.target.value)} placeholder="14 رقم"
                                        className={cn(errors.national_id && 'border-danger ring-2 ring-danger/20')} />
                                </Field>
                            ) : (
                                <>
                                    <Field label={<><FileText className="mr-1 inline h-4 w-4" /> رقم الترخيص السياحي (اختياري الآن)</>}>
                                        <Input value={data.license_no} onChange={(e) => setData('license_no', e.target.value)} placeholder="مثلاً: ETAA-12345" />
                                    </Field>
                                    <Field label="جهة الترخيص">
                                        <Input value={data.license_authority} onChange={(e) => setData('license_authority', e.target.value)} placeholder="مثلاً: ETAA" />
                                    </Field>
                                </>
                            )}
                            <Field label="نبذة عن الكيان (اختياري)" className="sm:col-span-2">
                                <textarea rows={3} value={data.about} onChange={(e) => setData('about', e.target.value)}
                                    className="w-full rounded-input border border-black/10 bg-white p-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                                    placeholder="اكتب سطر أو اتنين يعرّف بيك أو بشركتك" />
                            </Field>
                        </div>

                        <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-sm">
                            <Checkbox
                                checked={data.terms_accepted}
                                onCheckedChange={(v) => setData('terms_accepted', !!v)}
                                className="mt-0.5"
                            />
                            <span className="text-muted">
                                أوافق على <Link href="/p/terms" className="font-bold text-coral-deep">شروط المزوّدين</Link>
                                {isIndividual && ' — ومُلزَم برفع فيش وتشبيه بعد التسجيل قبل الموافقة'}.
                            </span>
                        </label>

                        <Button type="submit" disabled={processing} size="lg" block>
                            <ShieldCheck className="h-4 w-4" />
                            {processing ? 'جاري إنشاء الحساب…' : 'إنشاء حساب مزوّد'}
                        </Button>

                        <p className="mt-4 text-center text-sm text-muted">
                            عندك حساب مزوّد بالفعل؟{' '}
                            <Link href="/vendor/login" className="font-bold text-coral-deep">دخول</Link>
                        </p>
                    </form>

                    <div className="mt-6 flex items-start gap-2 rounded-card bg-cream p-4 text-[13px] text-muted">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-makfol" />
                        <span>
                            محفول مكفول = منصة سياحة مصرية بضمان استرداد كامل — إنضمامك يزيد نطاق عملائك ويرفع مصداقية خدمتك.
                        </span>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
