<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Tour;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $uid = $user->id;

        $ownScope = fn (Builder $q) => $isAdmin ? $q : $q->where('user_id', $uid);

        $services = $ownScope(Tour::query())->count()
            + $ownScope(Hotel::query())->count()
            + $ownScope(Car::query())->count()
            + $ownScope(Restaurant::query())->count();

        $bookingsQuery = fn () => Booking::query()->when(! $isAdmin, fn (Builder $q) => $q->whereHasMorph(
            'bookable',
            [Tour::class, Hotel::class, Car::class, Restaurant::class],
            fn (Builder $b) => $b->where('user_id', $uid)
        ));

        $bookings = $bookingsQuery()->count();
        $paid = $bookingsQuery()->where('payment_status', 'paid');
        $gross = (float) $paid->sum('total');
        $commission = (float) $bookingsQuery()->where('payment_status', 'paid')->sum('commission_amount');
        $net = max(0, $gross - $commission);

        return Inertia::render('Vendor/Dashboard', [
            'stats' => [
                ['label' => 'خدماتي', 'value' => $services, 'note' => 'رحلات · فنادق · سيارات · مطاعم', 'tone' => 'primary'],
                ['label' => 'حجوزاتي', 'value' => $bookings, 'note' => 'إجمالي الحجوزات', 'tone' => 'info'],
                ['label' => 'صافي أرباحك', 'value' => $net, 'money' => true, 'note' => "بعد عمولة المنصة ({$commission} ج.م)", 'tone' => 'good'],
            ],
        ]);
    }
}
