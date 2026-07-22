<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    protected $signature = 'webpush:vapid';

    protected $description = 'يولّد مفاتيح VAPID لإشعارات المتصفح (Web Push)';

    public function handle(): int
    {
        try {
            $keys = VAPID::createVapidKeys();
        } catch (\Throwable $e) {
            // على ويندوز غالباً PHP مش لاقي openssl.cnf — الرسالة الأصلية مبهمة
            $this->error('فشل توليد المفاتيح: ' . $e->getMessage());
            $this->newLine();
            $this->warn('لو انت على ويندوز، ده معناه إن PHP مش لاقي openssl.cnf. حدّده كده:');
            $this->line('  $env:OPENSSL_CONF = "<مسار PHP>\extras\ssl\openssl.cnf"');
            $this->line('  php artisan webpush:vapid');
            $this->newLine();
            $this->comment('على السيرفر (لينكس) المشكلة دي مبتحصلش.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('مفاتيح VAPID اتولّدت — حطّهم في .env:');
        $this->newLine();
        $this->line("VAPID_PUBLIC_KEY={$keys['publicKey']}");
        $this->line("VAPID_PRIVATE_KEY={$keys['privateKey']}");
        $this->line('VAPID_SUBJECT=' . config('app.url'));
        $this->newLine();
        $this->comment('المفتاح الخاص سرّي — متحطّهوش في git.');

        return self::SUCCESS;
    }
}
