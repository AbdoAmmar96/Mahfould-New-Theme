<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\ProviderRegisterController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Vendor;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\SahbController;
use App\Http\Controllers\TourController;
use Illuminate\Support\Facades\Route;

/** يسجّل مسارات CRUD لمورد (كلها أو جزء منها عبر $only) */
$crud = function (string $name, string $controller, array $only = ['index', 'create', 'store', 'edit', 'update', 'destroy']) {
    if (in_array('index', $only))   Route::get($name, [$controller, 'index'])->name("{$name}.index");
    if (in_array('create', $only))  Route::get("{$name}/create", [$controller, 'create'])->name("{$name}.create");
    if (in_array('store', $only))   Route::post($name, [$controller, 'store'])->name("{$name}.store");
    if (in_array('edit', $only))    Route::get("{$name}/{id}/edit", [$controller, 'edit'])->name("{$name}.edit");
    if (in_array('update', $only))  Route::put("{$name}/{id}", [$controller, 'update'])->name("{$name}.update");
    if (in_array('destroy', $only)) Route::delete("{$name}/{id}", [$controller, 'destroy'])->name("{$name}.destroy");
};

Route::get('/', [HomeController::class, 'index'])->name('home');

// الرحلات
Route::get('/tours', [TourController::class, 'index'])->name('tours.index');
Route::get('/tours/{tour:slug}', [TourController::class, 'show'])->name('tours.show');

// الفنادق
Route::get('/hotels', [HotelController::class, 'index'])->name('hotels.index');
Route::get('/hotels/{hotel:slug}', [HotelController::class, 'show'])->name('hotels.show');

// المطاعم
Route::get('/restaurants', [RestaurantController::class, 'index'])->name('restaurants.index');
Route::get('/restaurants/{restaurant:slug}', [RestaurantController::class, 'show'])->name('restaurants.show');

// صاحب السعادة
Route::get('/sahb-elsaada', [SahbController::class, 'index'])->name('sahb.index');

// صفحات المحتوى الثابت (شروط، خصوصية، من احنا...)
Route::get('/p/{page:slug}', [PageController::class, 'show'])->name('pages.show');

// السيارات
Route::get('/cars', [CarController::class, 'index'])->name('cars.index');
Route::get('/cars/{car:slug}', [CarController::class, 'show'])->name('cars.show');

// الباصات — V2 §10 (خطوط سير + رحلات مجدولة بمقاعد)
Route::get('/buses', [BusController::class, 'index'])->name('buses.index');
Route::get('/buses/routes/{route:slug}', [BusController::class, 'route'])->name('buses.route');

// تسجيل مزوّد (شركة/فرد) — V2 §1.1 (صفحة منفصلة تماماً عن تسجيل العملاء)
Route::get('/provider/register', [ProviderRegisterController::class, 'create'])->name('provider.register');
Route::post('/provider/register', [ProviderRegisterController::class, 'store']);

// إتاحة الفنادق (JSON) — لمنتقي التواريخ
Route::get('/availability/hotel/{hotel:slug}', [AvailabilityController::class, 'hotel'])->name('availability.hotel');

// الحجز
Route::get('/checkout/{type}/{id}', [BookingController::class, 'create'])->name('booking.create');
Route::post('/checkout', [BookingController::class, 'store'])->name('booking.store');
Route::get('/booking/{booking:code}', [BookingController::class, 'confirmation'])->name('booking.confirmation');

// دفع Paymob (callback من صفحة الدفع + webhook موثوق)
Route::match(['get', 'post'], '/payment/callback', [PaymentController::class, 'callback'])->name('payment.callback');
Route::post('/payment/webhook', [PaymentController::class, 'webhook'])->name('payment.webhook');

// دفع Fawry (callback + server callback موثوق)
Route::match(['get', 'post'], '/payment/fawry/callback', [PaymentController::class, 'fawryCallback'])->name('payment.fawry.callback');
Route::post('/payment/fawry/webhook', [PaymentController::class, 'fawryWebhook'])->name('payment.fawry.webhook');

// المصادقة
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    // استرجاع كلمة المرور
    Route::get('/forgot-password', [PasswordResetController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->name('password.update');
});

Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

// حساب المستخدم
Route::middleware('auth')->group(function () {
    Route::get('/account', [BookingController::class, 'account'])->name('account.index');
    Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store');
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
});

// ── لوحة الأدمن ──────────────────────────────────────────────
Route::prefix('admin')->name('admin.')->group(function () use ($crud) {
    Route::get('login', [Admin\AuthController::class, 'create'])->name('login');
    Route::post('login', [Admin\AuthController::class, 'store']);

    Route::middleware('role:admin')->group(function () use ($crud) {
        Route::post('logout', [Admin\AuthController::class, 'destroy'])->name('logout');
        Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');

        $crud('tours', Admin\TourController::class);
        $crud('hotels', Admin\HotelController::class);
        $crud('restaurants', Admin\RestaurantController::class);
        $crud('cars', Admin\CarController::class);
        $crud('locations', Admin\LocationController::class);
        $crud('sahb', Admin\SahbPackageController::class);
        $crud('pages', Admin\PageController::class);

        $crud('bookings', Admin\BookingController::class, ['index', 'edit', 'update', 'destroy']);
        Route::post('bookings/{id}/refund', [Admin\BookingController::class, 'refund'])->name('bookings.refund');

        // Phase D — لوحة الموافقات (§1.1, §15)
        Route::get('approvals', [Admin\ApprovalController::class, 'index'])->name('approvals.index');
        Route::post('approvals/providers/{company}/approve', [Admin\ApprovalController::class, 'approveProvider'])->name('approvals.provider.approve');
        Route::post('approvals/providers/{company}/reject', [Admin\ApprovalController::class, 'rejectProvider'])->name('approvals.provider.reject');
        Route::post('approvals/services/{type}/{id}/approve', [Admin\ApprovalController::class, 'approveService'])->name('approvals.service.approve');
        Route::post('approvals/services/{type}/{id}/reject', [Admin\ApprovalController::class, 'rejectService'])->name('approvals.service.reject');
        Route::post('approvals/documents/{doc}/approve', [Admin\ApprovalController::class, 'approveDocument'])->name('approvals.document.approve');
        Route::post('approvals/documents/{doc}/reject', [Admin\ApprovalController::class, 'rejectDocument'])->name('approvals.document.reject');
    });
});

// ── بوابة الشركاء (البائع) ───────────────────────────────────
Route::prefix('vendor')->name('vendor.')->group(function () use ($crud) {
    Route::get('login', [Admin\AuthController::class, 'create'])->name('login');
    Route::post('login', [Admin\AuthController::class, 'store']);

    Route::middleware('role:vendor,admin')->group(function () use ($crud) {
        Route::post('logout', [Admin\AuthController::class, 'destroy'])->name('logout');
        Route::get('/', [Vendor\DashboardController::class, 'index'])->name('dashboard');

        $crud('tours', Vendor\TourController::class);
        $crud('hotels', Vendor\HotelController::class);
        $crud('restaurants', Vendor\RestaurantController::class);
        $crud('cars', Vendor\CarController::class);

        $crud('bookings', Vendor\BookingController::class, ['index']);
    });
});
