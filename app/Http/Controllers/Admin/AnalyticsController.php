<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Company;
use App\Models\DeliveryOrder;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\Bookables;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * V2-BLUEPRINT §15.1 — لوحة إحصائيات الأدمن.
 * كل الرسوم Chart.js عدا الـHeatmap/الخريطة (D3.js).
 * API-first: كل endpoint يرجّع JSON صافي عشان يتحدّث بلا refresh.
 */
class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Analytics/Index', [
            'kpi' => $this->kpi(),
            'range' => $request->query('range', '30d'),
        ]);
    }

    /** KPI cards — الملخّص السريع */
    public function kpi(): array
    {
        $now = now();
        $lastMonth = $now->copy()->subMonth();

        $customersTotal   = User::where('role', 'customer')->count();
        $customersLast    = User::where('role', 'customer')->where('created_at', '>=', $lastMonth)->count();

        $bookingsTotal    = Booking::count();
        $bookingsPending  = Booking::where('status', 'pending')->count();
        $bookingsConfirmed = Booking::where('status', 'confirmed')->count();

        // معيار واحد للإيراد المحقَّق: مدفوع **وغير ملغي**.
        // (بند 18) قبل كده الصفحة دي كانت بتجمع العمولة من غير أي فلتر بينما
        // /admin بيفلتر بـpaid — فالصفحتين كانوا بيعرضوا رقمين مختلفين لنفس الجدول.
        $earned = fn () => Booking::where('payment_status', 'paid')->where('status', '!=', 'cancelled');

        $revenue          = (float) $earned()->sum('total');
        $revenueMonth     = (float) $earned()->where('created_at', '>=', $lastMonth)->sum('total');
        $commission       = (float) $earned()->sum('commission_amount');

        // متوسط تقييم المنصة
        $avgRating        = (float) DB::table('reviews')->where('approved', true)->avg('rating') ?? 0;
        $ratingsCount     = (int) DB::table('reviews')->where('approved', true)->count();

        // مزوّدون + خدمات
        $providers        = Company::where('verification_status', 'verified')->count();
        $providersPending = Company::where('verification_status', 'pending')->count();

        // تذاكر دعم مفتوحة
        $ticketsOpen      = SupportTicket::open()->count();

        return [
            'customers' => [
                'total' => $customersTotal,
                'last_30d' => $customersLast,
                'growth_pct' => $customersTotal > 0 ? round(($customersLast / max(1, $customersTotal)) * 100, 1) : 0,
            ],
            'bookings' => [
                'total' => $bookingsTotal,
                'pending' => $bookingsPending,
                'confirmed' => $bookingsConfirmed,
                'last_30d' => Booking::where('created_at', '>=', $lastMonth)->count(),
            ],
            'revenue' => [
                'total' => round($revenue, 2),
                'last_30d' => round($revenueMonth, 2),
                'commission' => round($commission, 2),
            ],
            'quality' => [
                'avg_rating' => round($avgRating, 2),
                'ratings_count' => $ratingsCount,
            ],
            'providers' => [
                'verified' => $providers,
                'pending' => $providersPending,
            ],
            'support' => [
                'open_tickets' => $ticketsOpen,
            ],
        ];
    }

    /** Line chart — الحجوزات والإيرادات عبر الزمن */
    public function bookingsOverTime(Request $request): JsonResponse
    {
        [$from, $to, $format] = $this->resolveRange($request);

        $rows = Booking::query()
            ->selectRaw($this->dateBucket('created_at', $format).' as bucket, COUNT(*) as bookings, SUM(total) as revenue')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<=', $to)
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return response()->json([
            'labels' => $rows->pluck('bucket'),
            'datasets' => [
                ['label' => 'الحجوزات', 'data' => $rows->pluck('bookings')],
                ['label' => 'الإيرادات (ج.م)', 'data' => $rows->pluck('revenue')],
            ],
        ]);
    }

    /** Bar chart — الحجوزات لكل نوع خدمة */
    public function bookingsByType(): JsonResponse
    {
        $labels = [];
        $data = [];
        foreach (Bookables::MAP as $type => $class) {
            $count = Booking::where('bookable_type', $class)->count();
            if ($count === 0 && $type !== 'restaurant') continue;
            $labels[] = $this->typeLabel($type);
            $data[] = $count;
        }

        return response()->json([
            'labels' => $labels,
            'datasets' => [['label' => 'حجوزات', 'data' => $data]],
        ]);
    }

    /** Doughnut chart — توزيع طرق الدفع */
    public function paymentMethodsDistribution(): JsonResponse
    {
        $rows = Booking::query()
            ->selectRaw('payment_method, COUNT(*) as cnt')
            ->groupBy('payment_method')
            ->get();

        $labels = $rows->map(fn ($r) => match ($r->payment_method) {
            'card' => 'بطاقة',
            'wallet' => 'محفظة',
            'on_arrival' => 'عند الوصول',
            default => $r->payment_method,
        });

        return response()->json([
            'labels' => $labels,
            'datasets' => [['data' => $rows->pluck('cnt')]],
        ]);
    }

    /** Bar chart أفقي — أعلى 10 مزوّدين بالإيرادات */
    public function topProviders(): JsonResponse
    {
        // نجمع الإيرادات لكل مزوّد عبر كل خدماته
        $providers = Company::query()->where('verification_status', 'verified')->get();
        $rows = $providers->map(function ($p) {
            $revenue = 0;
            foreach (Bookables::MAP as $type => $class) {
                if (!method_exists($class, 'scopePublished')) continue;
                if (!in_array('provider_id', (new $class)->getFillable())) continue;
                $revenue += (float) Booking::query()
                    ->where('bookable_type', $class)
                    ->whereIn('bookable_id', $class::where('provider_id', $p->id)->pluck('id'))
                    ->sum('total');
            }
            return ['name' => $p->name, 'revenue' => round($revenue, 2)];
        })->sortByDesc('revenue')->take(10)->values();

        return response()->json([
            'labels' => $rows->pluck('name'),
            'datasets' => [['label' => 'إيرادات (ج.م)', 'data' => $rows->pluck('revenue')]],
        ]);
    }

    /** Line chart — نموّ العملاء الجدد شهرياً */
    public function customersGrowth(): JsonResponse
    {
        $rows = User::query()
            ->where('role', 'customer')
            ->selectRaw($this->dateBucket('created_at', '%Y-%m').' as bucket, COUNT(*) as cnt')
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();

        return response()->json([
            'labels' => $rows->pluck('bucket'),
            'datasets' => [['label' => 'عملاء جدد', 'data' => $rows->pluck('cnt')]],
        ]);
    }

    /** Bar chart — تذاكر دعم بحسب النوع */
    public function supportTicketsByCategory(): JsonResponse
    {
        $rows = SupportTicket::query()
            ->selectRaw('category, COUNT(*) as cnt')
            ->groupBy('category')
            ->get();

        $labels = $rows->map(fn ($r) => match ($r->category) {
            'booking' => 'حجز',
            'payment' => 'دفع',
            'refund' => 'استرداد',
            'complaint' => 'شكوى',
            'general' => 'استفسار',
            default => $r->category,
        });

        return response()->json([
            'labels' => $labels,
            'datasets' => [['label' => 'تذاكر', 'data' => $rows->pluck('cnt')]],
        ]);
    }

    /** D3 Heatmap — كثافة الحجوزات يوم × ساعة */
    public function bookingsHeatmap(): JsonResponse
    {
        // يوم الأسبوع (0=الأحد) × الساعة (0..23)
        $rows = Booking::query()
            ->selectRaw($this->dowExpr('created_at').' as dow, '.$this->hourExpr('created_at').' as hour, COUNT(*) as cnt')
            ->groupBy('dow', 'hour')
            ->get();

        $data = [];
        foreach ($rows as $r) {
            $data[] = ['day' => (int) $r->dow, 'hour' => (int) $r->hour, 'value' => (int) $r->cnt];
        }
        return response()->json(['data' => $data]);
    }

    // ── Helpers ─────────────────────────────────────────

    private function resolveRange(Request $request): array
    {
        $range = $request->query('range', '30d');
        [$from, $format] = match ($range) {
            '7d'    => [now()->subDays(7)->startOfDay(),   '%Y-%m-%d'],
            '30d'   => [now()->subDays(30)->startOfDay(),  '%Y-%m-%d'],
            '90d'   => [now()->subDays(90)->startOfDay(),  '%Y-%W'],   // أسبوعي
            '12m'   => [now()->subMonths(12)->startOfMonth(), '%Y-%m'],
            'all'   => [now()->subYears(3),                '%Y-%m'],
            default => [now()->subDays(30)->startOfDay(),  '%Y-%m-%d'],
        };
        return [$from, now(), $format];
    }

    /**
     * تجميع زمني محمول بين المحرّكات.
     *
     * strftime() دالة SQLite. الإنتاج MariaDB فكانت بترمي
     * «FUNCTION strftime does not exist» وتوقّع 3 نقاط تحليلات →
     * وصفحة /admin/analytics كلها كانت بتفضل فاضية (Promise.all بلا catch).
     */
    private function dateBucket(string $column, string $format): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "strftime('{$format}', {$column})";
        }

        // MySQL/MariaDB: %W في strftime = رقم الأسبوع، لكن في DATE_FORMAT = اسم اليوم
        $mysqlFormat = $format === '%Y-%W' ? '%x-%v' : $format;

        return "DATE_FORMAT({$column}, '{$mysqlFormat}')";
    }

    /** رقم يوم الأسبوع (0=الأحد) محمول بين المحرّكات */
    private function dowExpr(string $column): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "CAST(strftime('%w', {$column}) as INTEGER)"
            : "(DAYOFWEEK({$column}) - 1)";
    }

    /** الساعة (0..23) محمولة بين المحرّكات */
    private function hourExpr(string $column): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "CAST(strftime('%H', {$column}) as INTEGER)"
            : "HOUR({$column})";
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'tour' => 'رحلات',
            'hotel' => 'فنادق',
            'restaurant' => 'مطاعم',
            'restaurant_table' => 'ترابيزات',
            'car' => 'عربيات',
            'sahb' => 'باقات صاحب السعادة',
            'bus_trip' => 'باصات',
            default => $type,
        };
    }
}
