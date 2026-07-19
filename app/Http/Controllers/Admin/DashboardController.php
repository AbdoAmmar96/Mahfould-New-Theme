<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Tour;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                ['label' => 'الرحلات', 'value' => Tour::count(), 'icon' => '🌍', 'href' => '/admin/tours'],
                ['label' => 'الفنادق', 'value' => Hotel::count(), 'icon' => '🏨', 'href' => '/admin/hotels'],
                ['label' => 'المطاعم', 'value' => Restaurant::count(), 'icon' => '🍽️', 'href' => '/admin/restaurants'],
                ['label' => 'السيارات', 'value' => Car::count(), 'icon' => '🚗', 'href' => '/admin/cars'],
            ],
            'sales' => [
                'bookings' => Booking::count(),
                'pending' => Booking::where('status', 'pending')->count(),
                'revenue' => (float) Booking::where('payment_status', 'paid')->sum('total'),
                'commission' => (float) Booking::where('payment_status', 'paid')->sum('commission_amount'),
            ],
            'recent' => Booking::with('bookable')->latest()->take(8)->get()->map(fn (Booking $b) => [
                'id' => $b->id,
                'code' => $b->code,
                'customer_name' => $b->customer_name,
                'service' => $b->bookable?->title ?? '—',
                'total' => (float) $b->total,
                'status' => $b->status,
                'payment_status' => $b->payment_status,
                'date' => $b->created_at?->format('Y-m-d'),
            ]),
        ]);
    }
}
