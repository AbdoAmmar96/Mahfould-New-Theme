<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * تشخيص إعداد بوابات الدفع — يقول بالظبط إيه الناقص وإيه الروابط اللي تتسجّل.
 * الاستعمال:  php artisan payments:check
 */
class PaymentsCheck extends Command
{
    protected $signature = 'payments:check';

    protected $description = 'فحص إعدادات Paymob / Fawry وعرض الروابط المطلوب تسجيلها';

    public function handle(): int
    {
        $ok = true;

        // ── APP_URL: حرج لأن روابط الكولباك بتتبني منه ──
        $appUrl = (string) config('app.url');
        $this->line('');
        $this->info('── الأساسيات ──');

        $isLocal = str_contains($appUrl, 'localhost') || str_contains($appUrl, '127.0.0.1');
        $isHttps = str_starts_with($appUrl, 'https://');

        $this->row('APP_URL', $appUrl ?: '(فارغ)', $appUrl !== '' && ! $isLocal && $isHttps,
            $appUrl === '' ? 'لازم يتحدّد' : ($isLocal ? 'محلي — لازم دومين حقيقي في الإنتاج' : (! $isHttps ? 'لازم HTTPS' : '')));
        if ($appUrl === '' || $isLocal || ! $isHttps) {
            $ok = false;
        }

        $this->row('APP_ENV', (string) config('app.env'), config('app.env') === 'production', 'production في الإنتاج');
        $this->row('APP_DEBUG', config('app.debug') ? 'true' : 'false', ! config('app.debug'), 'لازم false في الإنتاج');

        // ── Paymob ──
        $this->line('');
        $this->info('── Paymob ──');

        $keys = [
            'PAYMOB_SECRET_KEY'      => ['services.paymob.secret_key', 'sk_…  — إنشاء الـintention (إلزامي)'],
            'PAYMOB_PUBLIC_KEY'      => ['services.paymob.public_key', 'pk_…  — صفحة الدفع (إلزامي)'],
            'PAYMOB_INTEGRATION_IDS' => ['services.paymob.integration_ids', 'أرقام مفصولة بفاصلة: كارت,محفظة (إلزامي)'],
            'PAYMOB_HMAC_SECRET'     => ['services.paymob.hmac_secret', 'التحقق من صحة الكولباك (إلزامي أمنيًا)'],
            'PAYMOB_API_KEY'         => ['services.paymob.api_key', 'للاسترداد refund (اختياري)'],
        ];

        foreach ($keys as $env => [$path, $hint]) {
            $val = (string) config($path);
            $required = $env !== 'PAYMOB_API_KEY';
            $set = $val !== '';
            $this->row($env, $set ? $this->mask($val) : '(فارغ)', $set || ! $required, $hint);
            if ($required && ! $set) {
                $ok = false;
            }
        }

        $paymob = app(\App\Services\PaymobService::class);
        $this->line('');
        $this->row('حالة Paymob', $paymob->isConfigured() ? 'جاهزة' : 'غير مكتملة', $paymob->isConfigured());

        // ── Fawry ──
        $this->line('');
        $this->info('── Fawry (بديل) ──');
        $fawry = app(\App\Services\FawryService::class);
        $this->row('FAWRY_MERCHANT_CODE', config('services.fawry.merchant_code') ? 'مضبوط' : '(فارغ)', (bool) config('services.fawry.merchant_code'));
        $this->row('FAWRY_SECURITY_KEY', config('services.fawry.security_key') ? 'مضبوط' : '(فارغ)', (bool) config('services.fawry.security_key'));
        $this->row('البوابة النشطة', (string) config('services.payments.gateway'), true);

        // ── الروابط اللي تتسجّل في لوحة Paymob ──
        $this->line('');
        $this->info('── الروابط المطلوب تسجيلها في لوحة Paymob ──');
        $this->line('  Transaction processed callback : '.rtrim($appUrl, '/').'/payment/webhook');
        $this->line('  Transaction response callback  : '.rtrim($appUrl, '/').'/payment/callback');
        $this->line('');
        $this->comment('  ملاحظة: الـwebhook مستثنى من CSRF بالفعل (bootstrap/app.php).');

        // ── البريد (تأكيد الحجز) ──
        $this->line('');
        $this->info('── البريد ──');
        $mailer = (string) config('mail.default');
        $this->row('MAIL_MAILER', $mailer, ! in_array($mailer, ['log', 'array'], true), 'log/array يعني الإيميلات مش بتتبعت فعليًا');

        $this->line('');
        if ($ok && $paymob->isConfigured()) {
            $this->info('✅ الدفع جاهز للتشغيل.');

            return self::SUCCESS;
        }

        $this->error('⚠️ فيه نواقص فوق — راجع PAYMOB-SETUP.md');

        return self::FAILURE;
    }

    private function row(string $label, string $value, bool $ok, string $hint = ''): void
    {
        $mark = $ok ? '<fg=green>✔</>' : '<fg=red>✘</>';
        $this->line(sprintf('  %s %-24s %s%s', $mark, $label, $value, $hint !== '' ? "  <fg=gray>— {$hint}</>" : ''));
    }

    private function mask(string $v): string
    {
        return strlen($v) <= 8 ? str_repeat('•', strlen($v)) : substr($v, 0, 4).str_repeat('•', 6).substr($v, -3);
    }
}
