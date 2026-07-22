<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\Availability\HoldService;
use App\Services\BookingNotifier;
use App\Services\FawryService;
use App\Services\PaymobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        private PaymobService $paymob,
        private FawryService $fawry,
        private BookingNotifier $notifier,
        private HoldService $holds,
    ) {}

    /**
     * Redirect callback — العميل راجع من صفحة Paymob بعد الدفع.
     * نتحقق من الـ HMAC ونوجّهه لصفحة التأكيد.
     */
    public function callback(Request $request): RedirectResponse
    {
        $data = $request->query();
        $hmac = (string) $request->query('hmac', '');

        $success = filter_var($request->query('success'), FILTER_VALIDATE_BOOLEAN);
        $ref     = $request->query('merchant_order_id') ?: $request->query('special_reference');

        $booking = $ref ? Booking::where('code', $ref)->first() : null;

        if (! $booking) {
            return redirect()->route('home')->with('error', 'لم نتمكن من إيجاد الحجز.');
        }

        // ⚠️ أمان: ممنوع نغيّر حالة الدفع من هنا.
        //
        // ده redirect في متصفح العميل. حتى لو الـHMAC صحيح، مجموعة الحقول الموقّعة
        // في Paymob (شوف PaymobService::verifyHmac) **مافيهاش** merchant_order_id —
        // يعني توقيع صحيح من أي دفعة حقيقية يفضل صالح لو اتبدّل كود الحجز،
        // فأي حد يقدر يخلّي أي حجز «مدفوع» بتوقيع واحد اتلقّطه.
        //
        // المصدر الموثوق الوحيد هو webhook() — POST من سيرفر Paymob،
        // وبيقارن المبلغ بإجمالي الحجز قبل ما يأكّد.
        return redirect()->route('booking.confirmation', $booking->code);
    }

    /**
     * Webhook (server-to-server) — المصدر الموثوق لتأكيد الدفع.
     * Paymob بيبعت POST بكل تفاصيل الـ transaction.
     */
    public function webhook(Request $request): JsonResponse
    {
        $obj  = $request->input('obj', []);
        $hmac = (string) $request->query('hmac', '');

        // للـ webhook الحقول متداخلة — نجهّز نسخة مسطّحة للتحقق
        $flat = [
            'amount_cents'           => data_get($obj, 'amount_cents'),
            'created_at'             => data_get($obj, 'created_at'),
            'currency'               => data_get($obj, 'currency'),
            'error_occured'          => data_get($obj, 'error_occured'),
            'has_parent_transaction' => data_get($obj, 'has_parent_transaction'),
            'id'                     => data_get($obj, 'id'),
            'integration_id'         => data_get($obj, 'integration_id'),
            'is_3d_secure'           => data_get($obj, 'is_3d_secure'),
            'is_auth'                => data_get($obj, 'is_auth'),
            'is_capture'             => data_get($obj, 'is_capture'),
            'is_refunded'            => data_get($obj, 'is_refunded'),
            'is_standalone_payment'  => data_get($obj, 'is_standalone_payment'),
            'is_voided'              => data_get($obj, 'is_voided'),
            'order'                  => data_get($obj, 'order.id'),
            'owner'                  => data_get($obj, 'order.owner') ?? data_get($obj, 'owner'),
            'pending'                => data_get($obj, 'pending'),
            'source_data.pan'        => data_get($obj, 'source_data.pan'),
            'source_data.sub_type'   => data_get($obj, 'source_data.sub_type'),
            'source_data.type'       => data_get($obj, 'source_data.type'),
            'success'                => data_get($obj, 'success'),
        ];

        if (! $this->paymob->verifyHmac($flat, $hmac)) {
            Log::warning('Paymob webhook: HMAC غير صحيح', ['ref' => data_get($obj, 'order.merchant_order_id')]);
            return response()->json(['ok' => false], 400);
        }

        $ref     = data_get($obj, 'order.merchant_order_id');
        $success = filter_var(data_get($obj, 'success'), FILTER_VALIDATE_BOOLEAN);
        $booking = $ref ? Booking::where('code', $ref)->first() : null;

        // المبلغ المدفوع لازم يطابق إجمالي الحجز.
        // merchant_order_id مش ضمن الحقول اللي التوقيع بيغطّيها، فالمقارنة دي
        // هي اللي بتمنع إن دفعة صغيرة (أو توقيع متلقّط) تأكّد حجز بمبلغ تاني.
        if ($booking && $success) {
            $paidCents     = (int) data_get($obj, 'amount_cents');
            $expectedCents = (int) round((float) $booking->total * 100);

            if ($paidCents !== $expectedCents) {
                Log::critical('Paymob webhook: المبلغ لا يطابق الحجز', [
                    'code' => $booking->code, 'paid_cents' => $paidCents, 'expected_cents' => $expectedCents,
                ]);

                return response()->json(['ok' => false, 'reason' => 'amount_mismatch'], 400);
            }

            $booking->forceFill(['payment_gateway' => 'paymob', 'payment_ref' => (string) data_get($obj, 'id')])->saveQuietly();
            $this->markPaid($booking);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Fawry redirect callback — العميل راجع من صفحة Fawry.
     */
    public function fawryCallback(Request $request): RedirectResponse
    {
        $ref = $request->query('merchantRefNumber') ?: $request->query('merchantRefNum');
        $booking = $ref ? Booking::where('code', $ref)->first() : null;

        if (! $booking) {
            return redirect()->route('home')->with('error', 'لم نتمكن من إيجاد الحجز.');
        }

        // ⚠️ أمان: ده redirect من متصفح العميل — أي حد يقدر يزوّره.
        // ممنوع منعاً باتاً نغيّر حالة الدفع من هنا. المصدر الموثوق الوحيد هو
        // fawryWebhook() اللي بيتحقق من messageSignature.
        // (قبل كده كان بينادي markPaid() على طول: GET مزوّر = حجز مدفوع مجاناً.)
        return redirect()->route('booking.confirmation', $booking->code);
    }

    /**
     * Fawry Server Callback (v2) — المصدر الموثوق. موقّع بـ messageSignature.
     */
    public function fawryWebhook(Request $request): JsonResponse
    {
        $data = $request->all();

        if (! $this->fawry->verifyCallback($data)) {
            Log::warning('Fawry webhook: توقيع غير صحيح', ['ref' => $data['merchantRefNumber'] ?? null]);
            return response()->json(['ok' => false], 400);
        }

        $ref     = $data['merchantRefNumber'] ?? $data['merchantRefNum'] ?? null;
        $status  = $data['orderStatus'] ?? null;
        $booking = $ref ? Booking::where('code', $ref)->first() : null;

        if ($booking && $status === 'PAID') {
            $booking->forceFill(['payment_gateway' => 'fawry', 'payment_ref' => (string) ($data['fawryRefNumber'] ?? '')])->saveQuietly();
            $this->markPaid($booking);
        } elseif ($booking && in_array($status, ['FAILED', 'CANCELED', 'EXPIRED'], true)) {
            $booking->update(['payment_status' => 'unpaid', 'status' => 'pending']);
            $this->releaseHold($booking);
        }

        return response()->json(['ok' => true]);
    }

    private function markPaid(Booking $booking): void
    {
        // قفل ذرّي: الكولباك والـwebhook ممكن يوصلوا في نفس اللحظة.
        // فحص-ثم-كتابة عادي بيسيب نافذة الاتنين يعدّوا منها ويحجزوا المخزون مرتين
        // لنفس الحجز. الـUPDATE المشروط ده بيضمن إن واحد بس يكمّل.
        $claimed = Booking::where('id', $booking->id)
            ->where('payment_status', '!=', 'paid')
            ->update(['payment_status' => 'paid']);

        if ($claimed === 0) {
            return; // حد تاني خلّصها بالفعل
        }

        $booking->refresh();

        // ثبّت وحدات المخزون (لو الحجز المؤقّت ضاع بيحاول يعيد الحجز)
        $secured = $this->holds->confirmBooking($booking);

        if ($secured) {
            $booking->update([
                'payment_status' => 'paid',
                'status'         => 'confirmed',
                'amount_paid'    => $booking->total, // كان مابيتكتبش خالص → كل حجز مدفوع يبان إن عليه المبلغ كامل
            ]);
            $this->notifier->confirmed($booking);

            return;
        }

        // مدفوع لكن الإتاحة اختفت — يتصعّد يدويًا (استرداد/إعادة جدولة)
        $booking->update([
            'payment_status' => 'paid',
            'amount_paid' => $booking->total,
            'status' => 'processing',
            'notes' => trim(($booking->notes ? $booking->notes."\n" : '').'⚠️ تم الدفع لكن التواريخ لم تعد متاحة — مطلوب تدخّل يدوي.'),
        ]);
        Log::critical('حجز مدفوع بلا إتاحة', ['code' => $booking->code]);
    }

    /** يحرّر الحجز المؤقّت عند فشل الدفع */
    private function releaseHold(Booking $booking): void
    {
        if ($booking->hold_token) {
            $this->holds->release($booking->hold_token);
        }
    }
}
