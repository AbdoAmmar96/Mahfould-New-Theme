<?php

namespace App\Filament\Vendor\Widgets;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Tour;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class VendorStats extends BaseWidget
{
    protected function getStats(): array
    {
        $uid = Auth::id();
        $isAdmin = Auth::user()?->role === 'admin';

        $ownScope = fn (Builder $q) => $isAdmin ? $q : $q->where('user_id', $uid);

        $listings = $ownScope(Tour::query())->count()
            + $ownScope(Hotel::query())->count()
            + $ownScope(Car::query())->count()
            + $ownScope(Restaurant::query())->count();

        // حجوزات خدمات البائع
        $bookings = Booking::query()->when(! $isAdmin, fn (Builder $q) =>
            $q->whereHasMorph('bookable', [Tour::class, Hotel::class, Car::class, Restaurant::class],
                fn (Builder $qq) => $qq->where('user_id', $uid)));

        $totalBookings = (clone $bookings)->count();
        $paidBookings  = (clone $bookings)->where('payment_status', 'paid');
        $gross         = (clone $paidBookings)->sum('total');
        $commission    = (clone $paidBookings)->sum('commission_amount');
        $net           = max(0, $gross - $commission);

        return [
            Stat::make('خدماتي', $listings)->description('رحلات · فنادق · سيارات · مطاعم')->color('primary'),
            Stat::make('حجوزاتي', $totalBookings)->description('إجمالي الحجوزات')->color('info'),
            Stat::make('صافي أرباحك', number_format($net) . ' ج.م')
                ->description('بعد عمولة المنصة (' . number_format($commission) . ' ج.م)')->color('success'),
        ];
    }
}
