<?php

namespace App\Http\Controllers;

use App\Models\BookingItem;
use App\Services\Availability\HoldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Health/status endpoint للمراقبة الإنتاجية.
 * GET /health → 200 لو كل شيء تمام، 503 لو حاجة مكسورة.
 */
class HealthController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $checks = [
            'app' => ['status' => 'ok', 'version' => config('app.env')],
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'holds_engine' => $this->checkHoldsEngine(),
            'storage' => $this->checkStorage(),
        ];

        $allOk = collect($checks)->every(fn ($c) => ($c['status'] ?? '') === 'ok');
        $status = $allOk ? 200 : 503;

        return response()->json([
            'status' => $allOk ? 'ok' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $status);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            $bookingCount = DB::table('bookings')->count();
            return ['status' => 'ok', 'driver' => config('database.default'), 'bookings' => $bookingCount];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'error' => $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            $key = 'health:' . now()->timestamp;
            Cache::put($key, 'ok', 10);
            $ok = Cache::get($key) === 'ok';
            Cache::forget($key);
            return $ok ? ['status' => 'ok', 'driver' => config('cache.default')] : ['status' => 'fail', 'error' => 'cache write/read mismatch'];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'error' => $e->getMessage()];
        }
    }

    private function checkHoldsEngine(): array
    {
        try {
            // نتأكد إن الجدول موجود ومتاح
            $activeHolds = BookingItem::query()
                ->where('state', 'held')
                ->count();
            $expiredHolds = BookingItem::query()
                ->where('state', 'held')
                ->where('expires_at', '<', now())
                ->count();

            $degraded = $expiredHolds > 100; // لو أكتر من 100 hold منتهي معلّق → cron واقف

            return [
                'status' => $degraded ? 'degraded' : 'ok',
                'active_holds' => $activeHolds,
                'expired_holds_pending_release' => $expiredHolds,
                'hold_ttl_minutes' => HoldService::HOLD_TTL_MINUTES,
                'warning' => $degraded ? 'ReleaseExpiredHolds command may be stuck — check the scheduler.' : null,
            ];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'error' => $e->getMessage()];
        }
    }

    private function checkStorage(): array
    {
        try {
            $writable = is_writable(storage_path('app'));
            return $writable ? ['status' => 'ok', 'path' => storage_path('app')] : ['status' => 'fail', 'error' => 'storage/app is not writable'];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'error' => $e->getMessage()];
        }
    }
}
