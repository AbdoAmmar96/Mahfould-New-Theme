<?php

namespace App\Http\Controllers;

use App\Exceptions\SlotUnavailableException;
use App\Models\Activity;
use App\Models\Booking;
use App\Models\BookingGuest;
use App\Models\Concerns\HasAvailability;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use App\Models\RoomType;
use App\Models\Setting;
use App\Services\Availability\HoldService;
use App\Services\Booking\AgePricingService;
use App\Services\Booking\CancellationPolicyService;
use App\Services\Booking\EntryPassService;
use App\Services\Booking\PaymentTimingService;
use App\Services\BookingNotifier;
use App\Services\Payments\PaymentManager;
use App\Support\Bookables;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BookingController extends Controller
{
    /**
     * الخدمة لازم تكون منشورة عشان تتحجز.
     *
     * Bookables::resolve() مجرد find() — من غير الفحص ده كان أي حد يبعت
     * /checkout/tour/{id} لخدمة draft أو مرفوضة أو تحت المراجعة ويحجزها بالـID.
     */
    private function abortIfNotPublished(Model $model): void
    {
        if (method_exists($model, 'isPublished')) {
            abort_unless($model->isPublished(), 404);
        }
        abort_if(($model->status ?? 'publish') !== 'publish', 404);
    }

    /** الفعاليات المختارة بأسعارها — نفس الاستعلام اللي store() بيسعّر بيه */
    private function addonsFor(string $type, Model $model, array $activityIds): array
    {
        if ($type !== 'tour' || empty($activityIds)) {
            return [];
        }

        return Activity::where('tour_id', $model->id)
            ->where('is_active', true)
            ->whereIn('id', $activityIds)
            ->get(['id', 'title', 'price'])
            ->map(fn ($a) => ['id' => $a->id, 'title' => $a->title, 'price' => (float) $a->price])
            ->values()
            ->all();
    }

    public function create(Request $request, string $type, int $id, AgePricingService $agePricing, PaymentTimingService $paymentTiming): Response
    {
        $model = Bookables::resolve($type, $id);
        abort_unless($model !== null, 404);
        $this->abortIfNotPublished($model);

        // §7: للفنادق، لازم يُختار نوع غرفة قبل الحجز
        $roomType = null;
        if ($type === 'hotel') {
            $roomTypeId = (int) $request->query('room_type_id', 0);
            if ($roomTypeId) {
                $roomType = RoomType::where('hotel_id', $model->id)->where('is_active', true)->find($roomTypeId);
            }
            // Fallback: أول نوع نشط (لتوافق مع الحجوزات القديمة اللي مبتحدّدش نوع)
            if (! $roomType) {
                $roomType = $model->activeRoomTypes()->first();
            }
            // لو الفندق ملوش أي نوع (حالة نادرة بعد Backfill)، رجّع 404
            abort_if($roomType === null, 404, 'الفندق لا يحتوي على أنواع غرف متاحة.');
        }

        // احسب السعر والمخزون من مصدر الحقيقة الصحيح
        $price = $roomType
            ? (float) $roomType->effective_price
            : (float) ($model->sale_price ?? $model->price ?? 0);
        $inventory = $roomType
            ? $roomType->inventoryCount()
            : ($this->isPooled($model) ? $model->inventoryCount() : null);
        $isGuaranteed = (bool) ($model->is_guaranteed ?? false);
        // الفنادق pooled عبر room_type، والعربيات pooled عبر أسطولها (units_total)
        $pooled = $type === 'hotel' || $this->isPooled($model);

        return Inertia::render('Booking/Checkout', [
            'item' => [
                'type' => $type,
                'id' => $model->id,
                'title' => $model->title,
                'image_url' => $model->image_url,
                'price' => $price,
                'pooled' => $pooled,
                'units_total' => $inventory,
                'unit' => match ($type) {
                    'hotel' => 'الليلة', 'car' => 'اليوم', default => 'الفرد'
                },
                // معلومات نوع الغرفة (فنادق فقط)
                'room_type' => $roomType ? [
                    'id' => $roomType->id,
                    'title' => $roomType->title,
                    'capacity' => $roomType->capacity_per_night,
                    'includes_breakfast' => $roomType->includes_breakfast,
                    'price' => (float) $roomType->price_per_night,
                    'sale_price' => $roomType->sale_price_per_night ? (float) $roomType->sale_price_per_night : null,
                ] : null,
            ],
            'prefill' => [
                'start_date' => $request->query('start_date'),
                'start_time' => $request->query('start_time'),
                'guests' => (int) $request->query('guests', 2),
                'nights' => max(1, (int) $request->query('nights', 1)),
                'units' => max(1, (int) $request->query('units', 1)),
                'slot' => $request->query('slot'),
                'room_type_id' => $roomType?->id,
                'restaurant_table_id' => $request->query('restaurant_table_id') ? (int) $request->query('restaurant_table_id') : null,
                'activity_ids' => array_map('intval', (array) $request->query('activity_ids', [])),
            ],
            // الفعاليات بتفاصيل أسعارها — الواجهة كانت بتستلم الـIDs بس،
            // فالسيرفر يحسبها في الإجمالي والشاشة ما تعرضهاش خالص:
            // العميل يوافق على 2800 والحجز يتسجّل 3400.
            'addons' => $this->addonsFor($type, $model, array_map('intval', (array) $request->query('activity_ids', []))),
            'pricing' => [
                'fee' => (float) Setting::get('service_fee', 200),
                'discount' => $isGuaranteed ? (float) Setting::get('makfol_discount', 400) : 0,
                'is_guaranteed' => $isGuaranteed,
                'age_tiers' => $agePricing->tiersFor($model)->values(),
                'payment' => [
                    'default_timing_self' => $paymentTiming->resolve($type, 'self'),
                    'timing_other' => $paymentTiming->resolve($type, 'other'),
                    'requires_prepay_other' => $paymentTiming->requiresPrepay($type, 'other'),
                    'requires_prepay_self' => $paymentTiming->requiresPrepay($type, 'self'),
                ],
            ],
        ]);
    }

    public function store(
        Request $request,
        PaymentManager $payments,
        BookingNotifier $notifier,
        HoldService $holds,
        AgePricingService $agePricing,
        PaymentTimingService $paymentTiming,
        CancellationPolicyService $cancellation,
        EntryPassService $entryPasses,
    ): SymfonyResponse {
        $data = $request->validate([
            'type' => ['required', Rule::in(Bookables::types())],
            'id' => ['required', 'integer'],
            'room_type_id' => ['nullable', 'integer', 'exists:room_types,id'],
            'restaurant_table_id' => ['nullable', 'integer', 'exists:restaurant_tables,id'],
            'start_date' => ['nullable', 'date'],
            // فترة معتمدة بالظبط — مش أي "H:i". regex لوحده كان بيسمح بـ19:15
            // فيبقى فترة مختلفة عن 19:00 وياخد نفس الترابيزة في نفس الجلسة.
            'start_time' => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'activity_ids' => ['nullable', 'array', 'max:20'],
            'activity_ids.*' => ['integer', 'exists:activities,id'],
            'guests' => ['required', 'integer', 'min:1', 'max:50'],
            'nights' => ['nullable', 'integer', 'min:1', 'max:60'],
            'units' => ['nullable', 'integer', 'min:1', 'max:20'],
            'slot' => ['nullable', 'string', 'max:8'],
            'guests_ages' => ['nullable', 'array', 'max:50'],
            'guests_ages.*' => ['integer', 'min:0', 'max:120'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_national_id' => ['nullable', 'string', 'max:20'],
            'booking_for' => ['required', Rule::in(['self', 'other'])],
            'beneficiary_name' => ['required_if:booking_for,other', 'nullable', 'string', 'max:120'],
            'beneficiary_national_id' => ['required_if:booking_for,other', 'nullable', 'string', 'max:20'],
            'beneficiary_age' => ['required_if:booking_for,other', 'nullable', 'integer', 'min:0', 'max:120'],
            // Phase C §6: طريقة الوصول للفنادق/الرحلات (اختياري)
            'transport_mode' => ['nullable', Rule::in(['own_car', 'bus', 'rented_car'])],
            'bus_trip_id' => ['nullable', 'integer', 'exists:bus_trips,id'],
            'payment_method' => ['required', Rule::in(['card', 'wallet', 'on_arrival'])],
        ]);

        $model = Bookables::resolve($data['type'], $data['id']);
        abort_unless($model !== null, 404);
        $this->abortIfNotPublished($model);

        // §7: للفنادق نستخدم RoomType كـ"وحدة الإتاحة" بدل الفندق نفسه
        $roomType = null;
        if ($data['type'] === 'hotel') {
            $roomType = $this->resolveRoomType($model, $data['room_type_id'] ?? null);
            if (! $roomType) {
                return back()->withInput()->with('error', 'الفندق لا يحتوي على أنواع غرف متاحة للحجز.');
            }
        }

        // §9: للمطاعم نستخدم RestaurantTable كوحدة إتاحة بـslot زمني
        $restaurantTable = null;
        if ($data['type'] === 'restaurant') {
            $restaurantTable = $this->resolveRestaurantTable($model, $data['restaurant_table_id'] ?? null);
            if (! $restaurantTable) {
                return back()->withInput()->with('error', 'اختَر ترابيزة متاحة أولاً.');
            }
            if (empty($data['start_time'])) {
                return back()->withInput()->with('error', 'اختَر وقت الحجز (الفترة).');
            }
            // لازم فترة من فترات المطعم المعتمدة.
            // الـslot جزء من هوية الوحدة في محرك الإتاحة، فأي وقت حر (19:15)
            // كان بيعمل «فترة» جديدة تاخد نفس الترابيزة في نفس الجلسة.
            if (! in_array($data['start_time'], $model->bookingSlots(), true)) {
                return back()->withInput()->with('error', 'الفترة المختارة غير متاحة — اختَر من الفترات المعروضة.');
            }
        }

        // السعر يجيء من RoomType (فنادق) أو الموديل نفسه (باقي الأنواع)
        $unit = $roomType
            ? (float) $roomType->effective_price
            : (float) ($model->sale_price ?? $model->price ?? 0);
        $guests = (int) $data['guests'];
        $ages = $this->normalizeAges($data['guests_ages'] ?? [], $guests);
        $bookingFor = $data['booking_for'];
        $pooled = $data['type'] === 'hotel' || $this->isPooled($model);

        // §5: احسم توقيت الدفع
        $timing = $paymentTiming->resolve(
            $data['type'],
            $bookingFor,
            clientPrepaidChoice: in_array($data['payment_method'], ['card', 'wallet'], true),
        );

        // §5: طريقة الدفع لازم تتوافق مع التوقيت — لطرف آخر مثلاً on_arrival ممنوعة
        if (! $paymentTiming->isMethodCompatible($timing, $data['payment_method'])) {
            return back()->withInput()->with('error', 'الحجز لطرف آخر يستلزم الدفع الكامل المسبق (كارت أو محفظة).');
        }

        // §4: احسب سعر الأفراد حسب الشرائح العمرية (إذا تم إدخال أعمار)
        $agePricingRows = [];
        $ageSubtotal = 0.0;
        if (count($ages) > 0) {
            $result = $agePricing->computeGuests($model, $unit, $ages);
            $agePricingRows = $result['guests'];
            $ageSubtotal = (float) $result['subtotal'];
        }

        // §8: فعاليات اختيارية على الرحلة (add-ons) — تُضرب في عدد الأفراد
        $addonsSnapshot = [];
        $addonsSubtotal = 0.0;
        if ($data['type'] === 'tour' && ! empty($data['activity_ids'])) {
            $activities = Activity::where('tour_id', $model->id)
                ->where('is_active', true)
                ->whereIn('id', $data['activity_ids'])
                ->get();
            foreach ($activities as $act) {
                $line = (float) $act->price * $guests;
                $addonsSubtotal += $line;
                $addonsSnapshot[] = [
                    'activity_id' => $act->id,
                    'title' => $act->title,
                    'unit_price' => (float) $act->price,
                    'quantity' => $guests,
                    'line_total' => $line,
                ];
            }
        }

        // القيم الافتراضية (أنواع بلا مخزون)
        $units = 1;
        $nights = null;
        $endDate = null;
        $holdToken = null;

        if ($pooled) {
            // فندق (ليالي×غرف) أو عربية (أيام×عربيات) — الاتنين بيمرّوا بمحرك الإتاحة
            $isCar = $data['type'] === 'car';
            $startDate = $data['start_date'] ?? null;
            if (! $startDate) {
                return back()->withInput()->with('error', $isCar ? 'اختَر تاريخ الاستلام أولاً.' : 'اختَر تاريخ الوصول أولاً.');
            }
            if (Carbon::parse($startDate)->startOfDay()->lt(now()->startOfDay())) {
                return back()->withInput()->with('error', 'لا يمكن الحجز في تاريخ ماضٍ.');
            }

            // للعربيات: "nights" = عدد الأيام (نقبل guests كاحتياطي للروابط القديمة)
            $nights = max(1, (int) ($data['nights'] ?? ($isCar ? $guests : 1)));
            $units  = max(1, (int) ($data['units'] ?? 1));
            $endDate = Carbon::parse($startDate)->addDays($nights)->toDateString();
            // التسعير: سعر الوحدة × المدة × عدد الوحدات (شرائح العمر مش بتنطبق على غرف/عربيات)
            $subtotal = $unit * $nights * $units;

            $dates = [];
            for ($i = 0; $i < $nights; $i++) {
                $dates[] = Carbon::parse($startDate)->addDays($i)->toDateString();
            }

            // §7 §14: الحجز يمرّ عبر RoomType (وحدة الإتاحة الحقيقية للفنادق)
            $availabilityUnit = $roomType ?? $model;

            try {
                $res = $holds->reserve(
                    $availabilityUnit->availabilityType(),
                    $availabilityUnit->getKey(),
                    $availabilityUnit->inventoryCount(),
                    $dates,
                    $availabilityUnit->defaultSlot(),
                    $units,
                    HoldService::HOLD_TTL_MINUTES,
                );
                $holdToken = $res['hold_token'];
            } catch (SlotUnavailableException $e) {
                return back()->with('error', $e->getMessage());
            }
        } elseif ($restaurantTable) {
            // §9: حجز ترابيزة على slot زمني — الوحدة = ترابيزة واحدة، الفترة = الوقت
            $startDate = $data['start_date'] ?? now()->toDateString();
            if (Carbon::parse($startDate)->startOfDay()->lt(now()->startOfDay())) {
                return back()->with('error', 'لا يمكن الحجز في تاريخ ماضٍ.');
            }
            // في المطاعم السعر بيتحسب من المنيو المسبق (لو محددة) لسه، أو صفر (لأن الدفع في المطعم)
            $subtotal = 0.0;
            try {
                $res = $holds->reserve(
                    $restaurantTable->availabilityType(),
                    $restaurantTable->getKey(),
                    1,                                 // ترابيزة واحدة
                    [$startDate],
                    $data['start_time'],               // الوقت هو الـslot
                    1,
                    HoldService::HOLD_TTL_MINUTES,
                );
                $holdToken = $res['hold_token'];
            } catch (SlotUnavailableException $e) {
                return back()->with('error', $e->getMessage());
            }
        } else {
            // خدمات بلا مخزون (رحلات/عربيات/…): استخدم الشرائح العمرية لو مُدخلة، وإلا guests × unit
            $subtotal = $ageSubtotal > 0 ? $ageSubtotal : ($unit * $guests);
        }

        // §8: ضم add-ons للـsubtotal
        $subtotal += $addonsSubtotal;

        $fee = (float) Setting::get('service_fee', 200);
        $discount = $model->is_guaranteed ? (float) Setting::get('makfol_discount', 400) : 0;
        $total = max(0, $subtotal + $fee - $discount);
        $rate = (float) Setting::get('commission_rate', 15);
        $commission = round($total * $rate / 100, 2);

        // §7: snapshots (سعر + سياسة إلغاء) — snapshot لنوع الغرفة أيضاً لو موجود
        $itemsSnapshot = [
            'unit_price' => $unit,
            'guests' => $guests,
            'nights' => $nights,
            'units' => $units,
            'subtotal' => $subtotal,
            'service_fee' => $fee,
            'discount' => $discount,
            'total' => $total,
            'is_guaranteed' => (bool) ($model->is_guaranteed ?? false),
            'age_pricing_applied' => $agePricingRows,
            'room_type' => $roomType ? [
                'id' => $roomType->id,
                'title' => $roomType->title,
                'capacity_per_night' => $roomType->capacity_per_night,
                'includes_breakfast' => $roomType->includes_breakfast,
                'price_per_night_snapshot' => $unit,
            ] : null,
        ];
        $policySnapshot = $cancellation->snapshot($model);
        $serviceDate = $data['start_date'] ? Carbon::parse($data['start_date']) : null;
        $deadline = $cancellation->freeCancellationDeadline($serviceDate);

        $isPrepay = in_array($timing, [PaymentTimingService::PREPAID], true)
            || in_array($data['payment_method'], ['card', 'wallet'], true);

        $booking = DB::transaction(function () use (
            $request, $data, $holdToken, $model, $roomType, $restaurantTable, $endDate, $guests, $units, $nights,
            $subtotal, $fee, $discount, $total, $commission, $timing, $isPrepay,
            $itemsSnapshot, $policySnapshot, $deadline, $bookingFor, $agePricingRows, $ages,
            $addonsSnapshot
        ) {
            $booking = Booking::create([
                'user_id' => $request->user()?->id,
                'hold_token' => $holdToken,
                'bookable_type' => Bookables::classFor($data['type']),
                'bookable_id' => $model->id,
                'room_type_id' => $roomType?->id,
                'restaurant_table_id' => $restaurantTable?->id,
                'start_date' => $data['start_date'] ?? null,
                'start_time' => $data['start_time'] ?? null,
                'end_date' => $endDate,
                'guests' => $guests,
                'units' => $units,
                'nights' => $nights,
                'subtotal' => $subtotal,
                'service_fee' => $fee,
                'discount' => $discount,
                'total' => $total,
                'commission_amount' => $commission,
                'status' => $data['payment_method'] === 'on_arrival' ? 'confirmed' : 'pending',
                'payment_method' => $data['payment_method'],
                'payment_status' => 'unpaid',
                'payment_timing' => $timing,
                'payment_gateway' => null, // يُملأ لاحقاً لو تم توليد checkout URL
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_national_id' => $data['customer_national_id'] ?? null,
                'booking_for' => $bookingFor,
                'beneficiary_name' => $bookingFor === 'other' ? $data['beneficiary_name'] : null,
                'beneficiary_national_id' => $bookingFor === 'other' ? $data['beneficiary_national_id'] : null,
                'beneficiary_age' => $bookingFor === 'other' ? $data['beneficiary_age'] : null,
                'items_snapshot' => $itemsSnapshot,
                'addons_snapshot' => $addonsSnapshot ?: null,
                'cancellation_policy_snapshot' => $policySnapshot,
                'cancellation_deadline' => $deadline,
                // Phase C: النقل (للفنادق/الرحلات)
                'transport_mode' => in_array($data['type'], ['hotel', 'tour'], true) ? ($data['transport_mode'] ?? null) : null,
                'bus_trip_id' => ($data['transport_mode'] ?? null) === 'bus' ? ($data['bus_trip_id'] ?? null) : null,
                'notes' => ! empty($data['slot']) ? "الوقت المطلوب: {$data['slot']}" : null,
            ]);

            // أفراد الحجز — سطر لكل فرد بعمره وشريحته
            foreach ($ages as $i => $age) {
                $row = $agePricingRows[$i] ?? ['tier_label' => null, 'applied_price' => null];
                BookingGuest::create([
                    'booking_id' => $booking->id,
                    'age' => $age,
                    'is_primary' => $i === 0,
                    // الاسم/الرقم القومي للرئيسي فقط (V2 §4)
                    'name' => $i === 0
                        ? ($bookingFor === 'other' ? ($data['beneficiary_name'] ?? null) : $data['customer_name'])
                        : null,
                    'national_id' => $i === 0
                        ? ($bookingFor === 'other' ? ($data['beneficiary_national_id'] ?? null) : ($data['customer_national_id'] ?? null))
                        : null,
                    'tier_label' => $row['tier_label'] ?? null,
                    'applied_price' => $row['applied_price'] ?? null,
                ]);
            }

            return $booking;
        });

        // ── دفع عند الوصول/الاستخدام: نثبّت المخزون ونؤكّد على طول ──
        if ($data['payment_method'] === 'on_arrival') {
            if ($holdToken) {
                $holds->convert($holdToken, $booking->id);
            }
            // §6: إصدار QR entry_pass لمن جاي بعربيته
            if ($booking->transport_mode === 'own_car') {
                $entryPasses->issueForBooking($booking);
            }
            $notifier->confirmed($booking);

            $msg = match ($timing) {
                PaymentTimingService::ON_ARRIVAL => 'تم تأكيد حجزك — الدفع عند الوصول.',
                PaymentTimingService::ON_USE     => 'تم تأكيد حجزك — الدفع عند الاستخدام.',
                default                          => 'تم تأكيد حجزك.',
            };
            return redirect()
                ->route('booking.confirmation', $booking->code)
                ->with('success', $msg);
        }

        // ── دفع مسبق (كارت/محفظة): تحويل لبوابة الدفع ──
        if ($payments->hasConfigured()) {
            try {
                $booking->forceFill(['payment_gateway' => $payments->active()->name()])->save();
                $checkoutUrl = $payments->active()->checkoutUrl($booking);
                return Inertia::location($checkoutUrl);
            } catch (\Throwable $e) {
                report($e);
                return redirect()
                    ->route('booking.confirmation', $booking->code)
                    ->with('error', 'تعذّر فتح صفحة الدفع دلوقتي — حجزك محفوظ كـ "في انتظار الدفع".');
            }
        }

        return redirect()
            ->route('booking.confirmation', $booking->code)
            ->with('error', 'بوابة الدفع لم تُضبط بعد — الحجز محفوظ كـ "في انتظار الدفع".');
    }

    public function confirmation(Request $request, Booking $booking): Response
    {
        // ⚠️ الصفحة دي بتعرض بيانات العميل وكود دخول الـQR.
        // الكود بصيغة MM-YYYY-NNNNNN — قابل للتخمين، فلازم ملكية مش «معرفة الكود».
        // (قبل كده كان المسار مفتوح للكل: لوب على مليون رقم = كل حجوزات المنصة.)
        $user = $request->user();
        abort_unless(
            $user && ($booking->user_id === $user->id || in_array($user->role, ['admin', 'support'], true)),
            403,
        );

        $booking->load('bookable', 'guestsList', 'entryPasses', 'roomType');
        $entryPass = $booking->entryPasses->firstWhere('status', 'active');

        return Inertia::render('Booking/Confirmation', [
            'booking' => [
                'code' => $booking->code,
                'type' => Bookables::typeFor($booking->bookable_type),
                'title' => $booking->bookable?->title ?? '—',
                'location' => $booking->bookable?->location?->name ?? '',
                'start_date' => optional($booking->start_date)->format('Y-m-d'),
                'end_date' => optional($booking->end_date)->format('Y-m-d'),
                'guests' => $booking->guests,
                'units' => $booking->units,
                'nights' => $booking->nights,
                'total' => (float) $booking->total,
                'status' => $booking->status,
                'status_label' => $booking->status_label,
                'payment_method' => $booking->payment_method,
                'payment_timing' => $booking->payment_timing,
                'booking_for' => $booking->booking_for,
                'beneficiary_name' => $booking->beneficiary_name,
                'guests_ages' => $booking->guestsList->pluck('age')->all(),
                'room_type' => $booking->roomType ? [
                    'title' => $booking->roomType->title,
                    'includes_breakfast' => $booking->roomType->includes_breakfast,
                ] : null,
                'transport_mode' => $booking->transport_mode,
                'entry_pass' => $entryPass ? [
                    'code' => $entryPass->code,
                    'qr_image_url' => $entryPass->qr_image_url,
                    'valid_from' => optional($entryPass->valid_from)->format('Y-m-d'),
                    'valid_until' => optional($entryPass->valid_until)->format('Y-m-d'),
                ] : null,
            ],
        ]);
    }

    /** موديل قابل للحجز بمخزون (فندق الآن) — يستخدم trait HasAvailability */
    private function isPooled(Model $model): bool
    {
        return in_array(HasAvailability::class, class_uses_recursive($model), true);
    }

    /** يحسم نوع الغرفة المطلوب (fallback على الأول النشط لو مش محدّد) */
    private function resolveRoomType(Hotel $hotel, ?int $roomTypeId): ?RoomType
    {
        if ($roomTypeId) {
            return RoomType::where('hotel_id', $hotel->id)
                ->where('is_active', true)
                ->find($roomTypeId);
        }
        return $hotel->activeRoomTypes()->first();
    }

    /** يحسم الترابيزة المطلوبة (fallback على أول نشطة لو مش محدّدة — نادراً) */
    private function resolveRestaurantTable(Restaurant $restaurant, ?int $tableId): ?RestaurantTable
    {
        if ($tableId) {
            return RestaurantTable::where('restaurant_id', $restaurant->id)
                ->where('is_active', true)
                ->find($tableId);
        }
        return $restaurant->activeTables()->first();
    }

    /** يضبط قائمة الأعمار مع عدد الأفراد (لو الأعمار ناقصة نكمّل ببالغ افتراضي = 30) */
    private function normalizeAges(array $rawAges, int $guests): array
    {
        $ages = array_values(array_map(fn ($a) => max(0, min(120, (int) $a)), $rawAges));
        if (count($ages) === 0) {
            return []; // بدون شرائح — التسعير بـ guests × unit
        }
        // padding بأعمار البالغين لو ناقص
        while (count($ages) < $guests) {
            $ages[] = 30;
        }
        return array_slice($ages, 0, $guests);
    }

    public function account(Request $request): Response
    {
        $bookings = $request->user()->bookings()
            ->with('bookable')
            ->latest()
            ->get()
            ->map(fn ($b) => [
                'code' => $b->code,
                'title' => $b->bookable?->title ?? '—',
                'image_url' => $b->bookable?->image_url ?? '',
                'start_date' => optional($b->start_date)->format('Y-m-d'),
                'guests' => $b->guests,
                'total' => (float) $b->total,
                'status' => $b->status,
                'status_label' => $b->status_label,
                'payment_timing' => $b->payment_timing,
                'booking_for' => $b->booking_for,
            ]);

        return Inertia::render('Account/Dashboard', [
            'bookings' => $bookings,
            'stats' => [
                'total' => $bookings->count(),
                'upcoming' => $bookings->where('status', 'confirmed')->count(),
                'spent' => (float) $request->user()->bookings()->where('payment_status', 'paid')->sum('total'),
            ],
        ]);
    }
}
