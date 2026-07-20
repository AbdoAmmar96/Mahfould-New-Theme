import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Users, Ticket, Wallet, Star, Building2, Headphones, TrendingUp } from 'lucide-react';
import {
    Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale,
    LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

// ألوان الهوية — متزامنة مع tailwind.config.js
const PALETTE = {
    coral: '#FC7660', coralDeep: '#EA4B3B', navy: '#363677', navyLight: '#4C4C90',
    makfol: '#1E7A52', vip: '#B58A2E', royal: '#6B4EA8', beige: '#E4DAC8',
    danger: '#D2402F',
};
const CHART_COLORS = [PALETTE.coral, PALETTE.navy, PALETTE.makfol, PALETTE.vip, PALETTE.royal, PALETTE.coralDeep, PALETTE.danger];

const RANGES = [
    { v: '7d', label: '7 أيام' },
    { v: '30d', label: '30 يوم' },
    { v: '90d', label: '90 يوم' },
    { v: '12m', label: '12 شهر' },
    { v: 'all', label: 'كل الوقت' },
];

export default function Analytics({ kpi, range: initialRange }) {
    const [range, setRange] = useState(initialRange || '30d');
    const [charts, setCharts] = useState({
        bookingsOverTime: null,
        bookingsByType: null,
        paymentMethods: null,
        topProviders: null,
        customersGrowth: null,
        supportTickets: null,
        heatmap: null,
    });

    const fetchJson = (url) => fetch(url).then(r => r.json());

    useEffect(() => {
        Promise.all([
            fetchJson(`/admin/analytics/bookings-over-time?range=${range}`),
            fetchJson('/admin/analytics/bookings-by-type'),
            fetchJson('/admin/analytics/payment-methods'),
            fetchJson('/admin/analytics/top-providers'),
            fetchJson('/admin/analytics/customers-growth'),
            fetchJson('/admin/analytics/support-tickets'),
            fetchJson('/admin/analytics/bookings-heatmap'),
        ]).then(([bot, bbt, pm, tp, cg, st, hm]) => setCharts({
            bookingsOverTime: bot, bookingsByType: bbt, paymentMethods: pm,
            topProviders: tp, customersGrowth: cg, supportTickets: st, heatmap: hm,
        }));
    }, [range]);

    return (
        <AdminLayout title="الإحصائيات" crumb="لوحة الأدمن › الإحصائيات">
            <Head title="الإحصائيات" />

            {/* Range Filter */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {RANGES.map(r => (
                        <button
                            key={r.v}
                            onClick={() => setRange(r.v)}
                            className={cn(
                                'rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors',
                                range === r.v ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-beige',
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="text-[12.5px] text-muted">آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</div>
            </div>

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <KpiCard icon={Users} label="عملاء" value={kpi.customers.total} delta={`+${kpi.customers.last_30d} آخر 30 يوم`} color="text-royal" />
                <KpiCard icon={Ticket} label="حجوزات" value={kpi.bookings.total} delta={`${kpi.bookings.confirmed} مؤكّد`} color="text-coral-deep" />
                <KpiCard icon={Wallet} label="إيرادات (ج.م)" value={money(kpi.revenue.total)} delta={`عمولة: ${money(kpi.revenue.commission)}`} color="text-makfol" />
                <KpiCard icon={Star} label="متوسط تقييم" value={kpi.quality.avg_rating.toFixed(1)} delta={`${kpi.quality.ratings_count} تقييم`} color="text-vip" />
                <KpiCard icon={Building2} label="مزوّدون" value={kpi.providers.verified} delta={`${kpi.providers.pending} في الانتظار`} color="text-navy" />
                <KpiCard icon={Headphones} label="تذاكر دعم" value={kpi.support.open_tickets} delta="مفتوحة الآن" color="text-danger" />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-5 lg:grid-cols-2">
                <ChartCard title="الحجوزات والإيرادات عبر الزمن" subtitle={`آخر ${RANGES.find(r => r.v === range)?.label}`}>
                    {charts.bookingsOverTime && (
                        <Line
                            data={{
                                labels: charts.bookingsOverTime.labels,
                                datasets: charts.bookingsOverTime.datasets.map((ds, i) => ({
                                    ...ds,
                                    borderColor: CHART_COLORS[i], backgroundColor: CHART_COLORS[i] + '20',
                                    fill: true, tension: 0.35, yAxisID: i === 1 ? 'y1' : 'y',
                                })),
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                scales: {
                                    y: { position: 'right', title: { display: true, text: 'حجوزات' } },
                                    y1: { position: 'left', title: { display: true, text: 'إيرادات' }, grid: { drawOnChartArea: false } },
                                },
                                plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } },
                            }}
                        />
                    )}
                </ChartCard>

                <ChartCard title="الحجوزات حسب نوع الخدمة" subtitle="التوزيع الحالي">
                    {charts.bookingsByType && (
                        <Bar
                            data={{
                                labels: charts.bookingsByType.labels,
                                datasets: charts.bookingsByType.datasets.map(ds => ({
                                    ...ds, backgroundColor: CHART_COLORS,
                                })),
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false, indexAxis: 'x',
                                plugins: { legend: { display: false } },
                            }}
                        />
                    )}
                </ChartCard>

                <ChartCard title="توزيع طرق الدفع" subtitle="الحجوزات حسب طريقة الدفع">
                    {charts.paymentMethods && (
                        <Doughnut
                            data={{
                                labels: charts.paymentMethods.labels,
                                datasets: [{
                                    ...charts.paymentMethods.datasets[0],
                                    backgroundColor: [PALETTE.coral, PALETTE.royal, PALETTE.makfol],
                                    borderWidth: 2, borderColor: '#fff',
                                }],
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } },
                            }}
                        />
                    )}
                </ChartCard>

                <ChartCard title="أعلى 10 مزوّدين بالإيرادات" subtitle="Top providers by revenue">
                    {charts.topProviders && (
                        <Bar
                            data={{
                                labels: charts.topProviders.labels,
                                datasets: charts.topProviders.datasets.map(ds => ({
                                    ...ds, backgroundColor: PALETTE.navy,
                                })),
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                                plugins: { legend: { display: false } },
                            }}
                        />
                    )}
                </ChartCard>

                <ChartCard title="نموّ العملاء الجدد" subtitle="آخر 12 شهر">
                    {charts.customersGrowth && (
                        <Line
                            data={{
                                labels: charts.customersGrowth.labels,
                                datasets: charts.customersGrowth.datasets.map(ds => ({
                                    ...ds,
                                    borderColor: PALETTE.royal, backgroundColor: PALETTE.royal + '20',
                                    fill: true, tension: 0.35,
                                })),
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                            }}
                        />
                    )}
                </ChartCard>

                <ChartCard title="تذاكر الدعم حسب النوع" subtitle="Distribution of tickets">
                    {charts.supportTickets && (
                        <Bar
                            data={{
                                labels: charts.supportTickets.labels,
                                datasets: charts.supportTickets.datasets.map(ds => ({
                                    ...ds, backgroundColor: CHART_COLORS,
                                })),
                            }}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                            }}
                        />
                    )}
                </ChartCard>
            </div>

            {/* D3 Heatmap */}
            <div className="mt-5">
                <ChartCard title="كثافة الحجوزات — يوم × ساعة" subtitle="Peak booking times (D3.js heatmap)">
                    {charts.heatmap && <BookingsHeatmap data={charts.heatmap.data} />}
                </ChartCard>
            </div>
        </AdminLayout>
    );
}

// ── KPI Card ──────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, delta, color }) {
    return (
        <div className="rounded-card border border-black/[.06] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-beige">
                    <Icon className={cn('h-4 w-4', color)} />
                </span>
                <span className="text-[12.5px] font-bold text-muted">{label}</span>
            </div>
            <div className="font-head text-2xl font-bold text-navy">{value}</div>
            <div className="mt-1 flex items-center gap-1 text-[11.5px] text-muted">
                <TrendingUp className="h-3 w-3 text-makfol" /> {delta}
            </div>
        </div>
    );
}

// ── Chart Card ────────────────────────────────────────
function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-card border border-black/[.06] bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="font-head text-base font-bold text-navy">{title}</h3>
                {subtitle && <p className="text-[12px] text-muted">{subtitle}</p>}
            </div>
            <div className="relative h-[280px]">{children}</div>
        </div>
    );
}

// ── D3 Heatmap ────────────────────────────────────────
function BookingsHeatmap({ data }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        el.innerHTML = '';

        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const hours = Array.from({ length: 24 }, (_, h) => h);

        const width = el.clientWidth;
        const height = 260;
        const margin = { top: 12, right: 12, bottom: 32, left: 70 };
        const cellW = (width - margin.left - margin.right) / hours.length;
        const cellH = (height - margin.top - margin.bottom) / days.length;

        const svg = d3.select(el).append('svg').attr('width', width).attr('height', height);

        const maxVal = d3.max(data, d => d.value) || 1;
        const color = d3.scaleSequential(d3.interpolateOranges).domain([0, maxVal]);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // خلايا الحرارة
        const lookup = {};
        data.forEach(d => { lookup[`${d.day}-${d.hour}`] = d.value; });

        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                const val = lookup[`${d}-${h}`] || 0;
                g.append('rect')
                    .attr('x', h * cellW).attr('y', d * cellH)
                    .attr('width', cellW - 1).attr('height', cellH - 1)
                    .attr('fill', val > 0 ? color(val) : '#f5f5f5')
                    .attr('rx', 2)
                    .append('title')
                    .text(`${days[d]} — ${h}:00 → ${val} حجز`);
            }
        }

        // labels اليوم
        g.selectAll('.day-label').data(days).enter()
            .append('text')
            .attr('x', -8).attr('y', (_, i) => i * cellH + cellH / 2 + 4)
            .attr('text-anchor', 'end')
            .attr('font-size', 11).attr('font-family', 'Cairo').attr('fill', '#363677')
            .text(d => d);

        // labels الساعة
        g.selectAll('.hour-label').data([0, 6, 12, 18, 23]).enter()
            .append('text')
            .attr('x', d => d * cellW + cellW / 2)
            .attr('y', 7 * cellH + 18)
            .attr('text-anchor', 'middle')
            .attr('font-size', 10).attr('font-family', 'Cairo').attr('fill', '#8A7C6A')
            .text(d => `${d}:00`);
    }, [data]);

    return <div ref={ref} className="w-full" />;
}

const money = (n) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n || 0);
