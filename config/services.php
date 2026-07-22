<?php

return [
    // ── Paymob (Intention API v1 + Unified Checkout) ──
    'paymob' => [
        'base_url'        => env('PAYMOB_BASE_URL', 'https://accept.paymob.com'),
        'secret_key'      => env('PAYMOB_SECRET_KEY'),        // sk_...  (لإنشاء الـ intention)
        'api_key'         => env('PAYMOB_API_KEY'),           // للـ refund (auth token)
        'public_key'      => env('PAYMOB_PUBLIC_KEY'),        // pk_...  (لصفحة الـ checkout)
        'hmac_secret'     => env('PAYMOB_HMAC_SECRET'),       // للتحقق من الـ callback
        'integration_ids' => env('PAYMOB_INTEGRATION_IDS'),  // "12345,67890" (كارت,محفظة)
    ],

    // ── WhatsApp (إشعارات تأكيد الحجز) ──
    'whatsapp' => [
        'driver'          => env('WHATSAPP_DRIVER', 'log'),  // log | webhook | cloud_api
        'webhook_url'     => env('WHATSAPP_WEBHOOK_URL'),      // لنظام الأتمتة بتاعك
        'webhook_token'   => env('WHATSAPP_WEBHOOK_TOKEN'),
        'token'           => env('WHATSAPP_TOKEN'),            // Cloud API bearer token
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'template'        => env('WHATSAPP_TEMPLATE', 'booking_confirmation'),
        'template_lang'   => env('WHATSAPP_TEMPLATE_LANG', 'ar'),
    ],

    // ── Fawry (Express Checkout) ──
    'fawry' => [
        'base_url'      => env('FAWRY_BASE_URL', 'https://atfawry.fawrystaging.com'),
        'merchant_code' => env('FAWRY_MERCHANT_CODE'),
        'security_key'  => env('FAWRY_SECURITY_KEY'),
    ],

    // البوابة النشطة للدفع بالكارت/المحفظة
    'payments' => [
        'gateway' => env('PAYMENT_GATEWAY', 'paymob'), // paymob | fawry
    ],

    // إشعارات المتصفح (Web Push / VAPID)
    // ولّد المفاتيح بـ: php artisan webpush:vapid
    'webpush' => [
        'public_key'  => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        'subject'     => env('VAPID_SUBJECT', env('APP_URL', 'https://mahfolmakfol.com')),
    ],
];
