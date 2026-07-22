import SiteLayout from '@/Layouts/SiteLayout';
import { money } from '@/Components/UI';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Star, Calendar, Ticket, Heart, Crown, LogOut, ArrowLeft, MapPin, Headphones } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { MobileSection, MobileEmpty } from '@/Components/mobile/primitives';
import PushToggle from '@/Components/mobile/PushToggle';
import { useIsMobile } from '@/lib/useIsMobile';
import { cn } from '@/lib/utils';

export default function Dashboard({ bookings, stats }) {
    const { auth } = usePage().props;
    const isMobile = useIsMobile();
    const logout = (e) => { e.preventDefault(); router.post('/logout'); };

    if (isMobile) {
        return (
            <SiteLayout anim="fade">
                <Head title="حسابي" />

                {/* رأس الحساب — navy زي الهوم */}
                <div className="bg-navy px-4 pb-5 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-coral to-coral-deep font-head text-xl font-extrabold text-white">
                            {auth.user.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-head text-[18px] font-bold text-white">{auth.user.name}</p>
                            <p className="truncate text-[13px] text-white/70">{auth.user.email ?? auth.user.phone}</p>
                        </div>
                    </div>

                    {/* إحصائيات — 3 كروت */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {[
                            [stats.total, 'رحلة محجوزة'],
                            [stats.upcoming, 'رحلة قادمة'],
                            [money(stats.spent), 'ج.م إنفاق'],
                        ].map(([v, label], i) => (
                            <div key={i} className="rounded-card bg-white/10 px-2 py-3 text-center backdrop-blur">
                                <div className="font-head text-[19px] font-extrabold text-white">{v}</div>
                                <div className="text-[11px] font-semibold text-white/70">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* اختصارات سريعة */}
                <div className="grid grid-cols-4 gap-2 bg-white px-4 py-4">
                    {[
                        [Heart, 'المفضلة', '/wishlist'],
                        [MapPin, 'عناويني', '/account/addresses'],
                        [Headphones, 'الدعم', '/account/support'],
                        [Crown, 'صاحب السعادة', '/sahb-elsaada'],
                    ].map(([Icon, label, href]) => (
                        <Link key={href} href={href} className="mk-press flex flex-col items-center gap-1.5">
                            <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-beige">
                                <Icon className="h-[21px] w-[21px] text-navy" />
                            </span>
                            <span className="text-center text-[11px] font-bold leading-tight text-navy">{label}</span>
                        </Link>
                    ))}
                </div>

                <PushToggle />

                <MobileSection
                    title="حجوزاتي"
                    icon={Ticket}
                    action={<Link href="/tours" className="mk-press text-[12.5px] font-bold text-coral-deep">احجز جديد</Link>}
                >
                    {bookings.length === 0 ? (
                        <MobileEmpty text="لسه محجزتش أي رحلة." actionLabel="ابدأ دلوقتي" onAction={() => router.visit('/tours')} />
                    ) : (
                        <div className="space-y-2.5">
                            {bookings.map((b) => (
                                <Link key={b.code} href={`/booking/${b.code}`} className="mk-press flex gap-3 rounded-card border border-black/[.06] bg-white p-2.5">
                                    <img src={b.image_url} alt="" className="h-[70px] w-[70px] shrink-0 rounded-[10px] object-cover" />
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <h4 className="line-clamp-1 text-[14px] font-extrabold text-navy">{b.title}</h4>
                                        <p className="mt-0.5 text-[12px] text-muted">
                                            {b.start_date && <><Calendar className="inline h-3 w-3" /> {b.start_date} · </>}
                                            {b.guests} فرد
                                        </p>
                                        <p className="text-[11.5px] text-muted">{b.code}</p>
                                        <div className="mt-auto flex items-center justify-between pt-1">
                                            <span className={cn(
                                                'rounded-full px-2 py-0.5 text-[11px] font-extrabold',
                                                b.status === 'confirmed' ? 'bg-makfol/10 text-makfol' : 'bg-vip/10 text-vip',
                                            )}>
                                                {b.status_label}
                                            </span>
                                            <b className="font-head text-[15px] text-coral-deep">{money(b.total)} ج.م</b>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </MobileSection>

                <div className="bg-white px-4 pb-6">
                    <button type="button" onClick={logout}
                        className="mk-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-input bg-danger/10 text-[15px] font-extrabold text-danger">
                        <LogOut className="h-[18px] w-[18px]" /> تسجيل الخروج
                    </button>
                </div>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout anim="fade">
            <Head title="حسابي" />
            <section className="bg-gradient-to-br from-navy to-navy-light py-12 text-white">
                <div className="mx-auto w-full max-w-[1200px] px-5">
                    <div className="text-[13.5px] font-semibold text-white/70"><Link href="/" className="hover:text-white">الرئيسية</Link> › حسابي</div>
                    <h1 className="mt-1.5 font-head text-3xl font-bold text-white">حسابي</h1>
                </div>
            </section>

            <section className="pb-14 pt-[34px] md:pb-[72px]">
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
                                <Link href="/account" className="flex items-center gap-[11px] rounded-[10px] bg-navy px-3 py-[11px] text-[14.5px] font-bold text-white">
                                    <Ticket className="h-[18px] w-[18px]" /> حجوزاتي
                                </Link>
                                <Link href="/wishlist" className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-navy transition-colors hover:bg-beige">
                                    <Heart className="h-[18px] w-[18px]" /> المفضلة
                                </Link>
                                <Link href="/account/addresses" className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-navy transition-colors hover:bg-beige">
                                    <MapPin className="h-[18px] w-[18px]" /> عناويني
                                </Link>
                                <Link href="/account/support" className="flex items-center gap-[11px] rounded-[10px] px-3 py-[11px] text-[14.5px] font-bold text-navy transition-colors hover:bg-beige">
                                    <Headphones className="h-[18px] w-[18px]" /> الدعم الفني
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
                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-card border border-black/[.06] bg-white px-5 py-[18px]">
                                    <div className="font-head text-[28px] font-bold text-navy">{stats.total}</div>
                                    <div className="text-[13px] font-semibold text-muted">رحلة محجوزة</div>
                                </div>
                                <div className="rounded-card border border-black/[.06] bg-white px-5 py-[18px]">
                                    <div className="font-head text-[28px] font-bold text-navy">{stats.upcoming}</div>
                                    <div className="text-[13px] font-semibold text-muted">رحلة قادمة</div>
                                </div>
                                <div className="rounded-card border border-black/[.06] bg-white px-5 py-[18px]">
                                    <div className="font-head text-[28px] font-bold text-navy">{money(stats.spent)}</div>
                                    <div className="text-[13px] font-semibold text-muted">ج.م إجمالي الإنفاق</div>
                                </div>
                            </div>

                            <div className="mb-4 flex items-center justify-between gap-4">
                                <h3 className="m-0 font-head text-xl font-semibold text-navy">رحلاتك</h3>
                                <Button asChild variant="secondary"><Link href="/tours">احجز جديد +</Link></Button>
                            </div>

                            {bookings.length === 0 && (
                                <div className="p-[50px] text-center text-muted">
                                    لسه محجزتش أي رحلة. <Link href="/tours" className="inline-flex items-center gap-1 font-bold text-coral-deep">ابدأ دلوقتي <ArrowLeft className="h-4 w-4" /></Link>
                                </div>
                            )}

                            <div className="space-y-3">
                                {bookings.map((b) => (
                                    <Link key={b.code} href={`/booking/${b.code}`} className="grid grid-cols-[76px_1fr_auto] items-center gap-4 rounded-card border border-black/[.06] bg-white p-3.5 transition hover:border-coral/40 hover:shadow-sm">
                                        <img src={b.image_url} alt="" className="h-[66px] w-[76px] rounded-[10px] object-cover" />
                                        <div>
                                            <h4 className="mb-[3px] font-head text-base font-semibold text-navy">{b.title}</h4>
                                            <div className="flex flex-wrap items-center gap-1 text-[13px] font-semibold text-muted">
                                                {b.start_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.start_date} ·</span>}
                                                <span>{b.guests} فرد · {b.code}</span>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className={`inline-block rounded-full px-[11px] py-[5px] text-xs font-extrabold ${b.status === 'confirmed' ? 'bg-makfol/[.12] text-makfol' : 'bg-vip/[.14] text-vip'}`}>{b.status_label}</span>
                                            <div className="mt-1.5 font-extrabold text-coral-deep">{money(b.total)} ج.م</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
