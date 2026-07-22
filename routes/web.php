<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\ProviderProfileController;
use App\Http\Controllers\ProviderRegisterController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Vendor;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\SahbController;
use App\Http\Controllers\Support;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\TourController;
use App\Http\Controllers\UserAddressController;
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

// صفحة «مفيش نت» — بيخزّنها الـservice worker ويعرضها لما الشبكة تقع
Route::view('/offline', 'offline')->name('offline');

// Health check تفصيلي (§Production monitoring) — يستهلكه uptime monitor
Route::get('/health', \App\Http\Controllers\HealthController::class)->middleware('throttle:api')->name('health');

// الرحلات
Route::get('/tours', [TourController::class, 'index'])->name('tours.index');
Route::get('/tours/{tour:slug}', [TourController::class, 'show'])->name('tours.show');
// أقسام التفاصيل — كل قسم صفحة لوحده بدل ما يتكدّسوا في صفحة واحدة
Route::get('/tours/{tour:slug}/included', [TourController::class, 'included'])->name('tours.included');
Route::get('/tours/{tour:slug}/activities', [TourController::class, 'activities'])->name('tours.activities');
Route::get('/tours/{tour:slug}/reviews', [TourController::class, 'reviews'])->name('tours.reviews');
Route::get('/tours/{tour:slug}/schedule', [TourController::class, 'schedule'])->name('tours.schedule');
Route::get('/tours/{tour:slug}/schedule/print', [TourController::class, 'schedulePrint'])->name('tours.schedule.print');

// الفنادق
Route::get('/hotels', [HotelController::class, 'index'])->name('hotels.index');
Route::get('/hotels/{hotel:slug}/rooms', [HotelController::class, 'rooms'])->name('hotels.rooms');
Route::get('/hotels/{hotel:slug}/amenities', [HotelController::class, 'amenities'])->name('hotels.amenities');
Route::get('/hotels/{hotel:slug}/reviews', [HotelController::class, 'reviews'])->name('hotels.reviews');
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

// التوصيل — V2 §11 (منصة وسيط، تسعير بالكيلومتر) — rate-limit
Route::get('/delivery', [DeliveryController::class, 'index'])->name('delivery.index');
Route::post('/delivery/estimate', [DeliveryController::class, 'estimate'])->name('delivery.estimate')->middleware('throttle:api');
Route::post('/delivery/order', [DeliveryController::class, 'store'])->name('delivery.store')->middleware('throttle:booking');
Route::get('/delivery/confirm/{code}', [DeliveryController::class, 'confirm'])->name('delivery.confirm');

// تسجيل مزوّد (شركة/فرد) — V2 §1.1 (صفحة منفصلة تماماً عن تسجيل العملاء)
Route::get('/provider/register', [ProviderRegisterController::class, 'create'])->name('provider.register');
Route::post('/provider/register', [ProviderRegisterController::class, 'store'])->middleware('throttle:provider-register');

// بروفايل عام للمزوّد — V2 §3 (لوجو + كل التقييمات المجمّعة)
Route::get('/providers/{slug}', [ProviderProfileController::class, 'show'])->name('providers.show');

// إتاحة الفنادق (JSON) — لمنتقي التواريخ
Route::get('/availability/hotel/{hotel:slug}', [AvailabilityController::class, 'hotel'])->name('availability.hotel');

// الحجز — §19: rate-limit + auth إلزامي (لازم يسجّل قبل الحجز)
Route::middleware('auth')->group(function () {
    Route::get('/checkout/{type}/{id}', [BookingController::class, 'create'])->name('booking.create');
    Route::post('/checkout', [BookingController::class, 'store'])->name('booking.store')->middleware('throttle:booking');
});
// صفحة التأكيد فيها بيانات العميل + كود دخول QR → auth + ملكية (الفحص في المتحكّم) + throttle
Route::get('/booking/{booking:code}', [BookingController::class, 'confirmation'])
    ->middleware(['auth', 'throttle:api'])
    ->name('booking.confirmation');

// دفع Paymob (callback من صفحة الدفع + webhook موثوق)
Route::match(['get', 'post'], '/payment/callback', [PaymentController::class, 'callback'])->name('payment.callback');
Route::post('/payment/webhook', [PaymentController::class, 'webhook'])->name('payment.webhook');

// دفع Fawry (callback + server callback موثوق)
Route::match(['get', 'post'], '/payment/fawry/callback', [PaymentController::class, 'fawryCallback'])->name('payment.fawry.callback');
Route::post('/payment/fawry/webhook', [PaymentController::class, 'fawryWebhook'])->name('payment.fawry.webhook');

// المصادقة — §19: rate-limit إلزامي
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:login');
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:register');

    // استرجاع كلمة المرور
    Route::get('/forgot-password', [PasswordResetController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'store'])->name('password.email')->middleware('throttle:password');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->name('password.update')->middleware('throttle:password');
});

Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

// حساب المستخدم
Route::middleware('auth')->group(function () {
    Route::get('/account', [BookingController::class, 'account'])->name('account.index');

    // اشتراك إشعارات المتصفح (Web Push)
    Route::post('/push/subscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'store'])
        ->name('push.subscribe')->middleware('throttle:actions');
    Route::post('/push/unsubscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'destroy'])
        ->name('push.unsubscribe')->middleware('throttle:actions');
    Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store')->middleware('throttle:actions');
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle')->middleware('throttle:actions');
    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');

    // Phase E — عناوين متعدّدة للعميل (§12)
    Route::get('/account/addresses', [UserAddressController::class, 'index'])->name('account.addresses.index');
    Route::post('/account/addresses', [UserAddressController::class, 'store'])->name('account.addresses.store');
    Route::put('/account/addresses/{address}', [UserAddressController::class, 'update'])->name('account.addresses.update');
    Route::delete('/account/addresses/{address}', [UserAddressController::class, 'destroy'])->name('account.addresses.destroy');
    Route::post('/account/addresses/{address}/default', [UserAddressController::class, 'setDefault'])->name('account.addresses.default');

    // Phase F — تذاكر دعم فني للعميل (§15) — rate-limit للـstore/reply
    Route::get('/account/support', [SupportTicketController::class, 'index'])->name('account.support.index');
    Route::get('/account/support/create', [SupportTicketController::class, 'create'])->name('account.support.create');
    Route::post('/account/support', [SupportTicketController::class, 'store'])->name('account.support.store')->middleware('throttle:support');
    Route::get('/account/support/{code}', [SupportTicketController::class, 'show'])->name('account.support.show');
    Route::post('/account/support/{code}/reply', [SupportTicketController::class, 'reply'])->name('account.support.reply')->middleware('throttle:actions');
});

// ── لوحة الدعم الفني (§15) ─────────────────────────────
Route::prefix('support')->name('support.')->middleware('role:support,admin')->group(function () {
    Route::get('/', [Support\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/tickets/{code}', [Support\DashboardController::class, 'show'])->name('tickets.show');
    Route::post('/tickets/{code}/reply', [Support\DashboardController::class, 'reply'])->name('tickets.reply');
    Route::post('/tickets/{code}/assign', [Support\DashboardController::class, 'assign'])->name('tickets.assign');
});

// ── لوحة الأدمن ──────────────────────────────────────────────
Route::prefix('admin')->name('admin.')->group(function () use ($crud) {
    Route::get('login', [Admin\AuthController::class, 'create'])->name('login');
    Route::post('login', [Admin\AuthController::class, 'store'])->middleware('throttle:login');

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

        // Phase G — لوحة الإحصائيات (§15.1) — Chart.js + D3.js
        Route::get('analytics', [Admin\AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('analytics/kpi', fn () => response()->json(app(Admin\AnalyticsController::class)->kpi()))->name('analytics.kpi');
        Route::get('analytics/bookings-over-time', [Admin\AnalyticsController::class, 'bookingsOverTime'])->name('analytics.bookings_over_time');
        Route::get('analytics/bookings-by-type', [Admin\AnalyticsController::class, 'bookingsByType'])->name('analytics.bookings_by_type');
        Route::get('analytics/payment-methods', [Admin\AnalyticsController::class, 'paymentMethodsDistribution'])->name('analytics.payment_methods');
        Route::get('analytics/top-providers', [Admin\AnalyticsController::class, 'topProviders'])->name('analytics.top_providers');
        Route::get('analytics/customers-growth', [Admin\AnalyticsController::class, 'customersGrowth'])->name('analytics.customers_growth');
        Route::get('analytics/support-tickets', [Admin\AnalyticsController::class, 'supportTicketsByCategory'])->name('analytics.support_tickets');
        Route::get('analytics/bookings-heatmap', [Admin\AnalyticsController::class, 'bookingsHeatmap'])->name('analytics.bookings_heatmap');

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
    Route::post('login', [Admin\AuthController::class, 'store'])->middleware('throttle:login');

    Route::middleware('role:vendor,admin')->group(function () use ($crud) {
        Route::post('logout', [Admin\AuthController::class, 'destroy'])->name('logout');
        Route::get('/', [Vendor\DashboardController::class, 'index'])->name('dashboard');

        $crud('tours', Vendor\TourController::class);
        $crud('hotels', Vendor\HotelController::class);
        $crud('restaurants', Vendor\RestaurantController::class);
        $crud('cars', Vendor\CarController::class);

        $crud('bookings', Vendor\BookingController::class, ['index']);

        // §15: قارئ QR للمنشأة + الأرباح والتسويات
        Route::get('scanner', [Vendor\ScannerController::class, 'index'])->name('scanner.index');
        Route::post('scanner/verify', [Vendor\ScannerController::class, 'verify'])->name('scanner.verify');
        Route::post('scanner/{code}/mark-used', [Vendor\ScannerController::class, 'markUsed'])->name('scanner.mark_used');

        Route::get('earnings', [Vendor\EarningsController::class, 'index'])->name('earnings.index');
        Route::put('earnings/banking', [Vendor\EarningsController::class, 'updateBanking'])->name('earnings.banking');
    });
});
