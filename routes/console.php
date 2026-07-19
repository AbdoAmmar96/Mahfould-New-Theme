<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// محرك الإتاحة — تحرير الحجوزات المؤقّتة المنتهية (لازم كرون كل دقيقة في الإنتاج)
Schedule::command('holds:release-expired')->everyMinute()->withoutOverlapping();
