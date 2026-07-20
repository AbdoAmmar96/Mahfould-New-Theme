<?php

namespace App\Providers;

use App\Models\Review;
use App\Observers\ReviewObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // §13: تجميع تقييمات المزوّد يتحدّث تلقائياً عند أي تقييم
        Review::observe(ReviewObserver::class);

        $this->configureRateLimiters();
    }

    /**
     * V2-BLUEPRINT §19: rate-limit + حد holds على مسارات الحجز الحسّاسة.
     * ملاحظة: بمخزن database Laravel بيعتمد على الجدول cache — تأكد الجدول موجود.
     */
    private function configureRateLimiters(): void
    {
        // تسجيل دخول: 5 محاولات/دقيقة لكل IP+email
        RateLimiter::for('login', function (Request $request) {
            $key = strtolower((string) $request->input('email')) . '|' . $request->ip();
            return Limit::perMinute(5)->by($key)->response(fn () =>
                back()->withErrors(['email' => 'محاولات كثيرة — استنى دقيقة وحاول تاني.'])
            );
        });

        // تسجيل عميل جديد: 3 حسابات/ساعة/IP
        RateLimiter::for('register', fn (Request $r) => Limit::perHour(3)->by($r->ip()));

        // تسجيل مزوّد: 2 محاولة/ساعة/IP (يمنع spam accounts)
        RateLimiter::for('provider-register', fn (Request $r) => Limit::perHour(2)->by($r->ip()));

        // نسيت كلمة السر: 3 محاولات/15 دقيقة/email
        RateLimiter::for('password', fn (Request $r) =>
            Limit::perMinutes(15, 3)->by(strtolower((string) $r->input('email')) . '|' . $r->ip())
        );

        // إنشاء حجز: 10/دقيقة/user (أو IP لو Guest) — يمنع abuse
        RateLimiter::for('booking', fn (Request $r) =>
            Limit::perMinute(10)->by($r->user()?->id ?: $r->ip())
        );

        // تذاكر الدعم: 5 تذاكر/ساعة/user (يمنع spam)
        RateLimiter::for('support', fn (Request $r) => Limit::perHour(5)->by($r->user()?->id ?: $r->ip()));

        // مفضلة/تقييمات: 30/دقيقة/user
        RateLimiter::for('actions', fn (Request $r) => Limit::perMinute(30)->by($r->user()?->id ?: $r->ip()));

        // API عام (health/analytics endpoints): 60/دقيقة
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(60)->by($r->user()?->id ?: $r->ip()));
    }
}
