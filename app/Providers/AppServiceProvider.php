<?php

namespace App\Providers;

use App\Models\Review;
use App\Observers\ReviewObserver;
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
    }
}
