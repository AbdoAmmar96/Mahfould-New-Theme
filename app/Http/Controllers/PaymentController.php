<?php

namespace App\Http\Controllers;

use App\Models\Booking;
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

        // نتحقق من التوقيع — لو فشل نعتبرها غير مؤكّدة
        $valid = $this->paymob->verifyHmac($data, $hmac);

        if ($valid && $success) {
            $booking->forceFill(['payment_gateway' => 'paymob', 'payment_ref' => (string) $request->query('id')])->saveQuietly();
            $this->markPaid($booking);
        } elseif ($valid && ! $success) {
            $booking->update(['payment_status' => 'unpaid', 'status' => 'pending']);
        }

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

        if ($booking && $success) {
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

        // الحالة النهائية بتتأكّد من الـ webhook الموثوق — هنا بس نوجّه للتأكيد
        $status = $request->query('orderStatus');
        if ($status === 'PAID') {
            $this->markPaid($booking);
        }

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
        }

        return response()->json(['ok' => true]);
    }

    private function markPaid(Booking $booking): void
    {
        if ($booking->payment_status === 'paid') {
            return; // idempotent
        }
        $booking->update(['payment_status' => 'paid', 'status' => 'confirmed']);

        // إشعار العميل (إيميل + واتساب)
        $this->notifier->confirmed($booking);
    }
}
