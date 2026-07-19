# نشر محفول مكفول على سيرفر إنتاج

دليل مختصر لتشغيل المنصة على VPS (Ubuntu + Nginx + PHP-FPM 8.2+ + MySQL 8).
> المنصة **مش محتاجة Redis ولا queue worker ولا cron** في وضعها الحالي (الإيميل متزامن) — نشر بسيط.

---

## 1) المتطلبات على السيرفر
- PHP 8.2+ مع الإضافات: `pdo_mysql`, `mbstring`, `intl`, `gd`, `zip`, `bcmath`, `curl`.
- MySQL 8 (أو MariaDB 10.6+).
- Node 18+ و Composer (للبناء).
- Nginx + شهادة HTTPS (Let's Encrypt).

## 2) الكود والحزم
```bash
git clone <repo> /var/www/mahfol && cd /var/www/mahfol
composer install --no-dev --optimize-autoloader
npm ci && npm run build
```

## 3) ملف `.env` — القيم الحرجة
```env
APP_ENV=production
APP_DEBUG=false                     # مهم: لا تترك true في الإنتاج
APP_URL=https://your-domain.com     # ← حرج: منه يتبني رابط callback الدفع
APP_KEY=                            # ولّده بـ php artisan key:generate

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mahfol_makfol
DB_USERNAME=mahfol
DB_PASSWORD=********

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# البريد — لازم transport حقيقي عشان تأكيدات الحجز واسترجاع كلمة المرور تشتغل
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS="no-reply@your-domain.com"
MAIL_FROM_NAME="محفول مكفول"

# بوابة الدفع النشطة
PAYMENT_GATEWAY=paymob
PAYMOB_SECRET_KEY=...
PAYMOB_PUBLIC_KEY=...
PAYMOB_HMAC_SECRET=...
PAYMOB_INTEGRATION_IDS=...          # كارت,محفظة مفصولين بفاصلة
PAYMOB_API_KEY=...                  # للاسترجاع (refund) فقط

# أو Fawry
FAWRY_BASE_URL=https://www.atfawry.com   # ← مش staging في الإنتاج
FAWRY_MERCHANT_CODE=...
FAWRY_SECURITY_KEY=...

# واتساب (اختياري) — driver=log افتراضياً (بيسجّل بس)
WHATSAPP_DRIVER=cloud_api
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

## 4) التهيئة
```bash
php artisan key:generate
php artisan migrate --force            # أنشئ DB أولاً
php artisan db:seed --force            # اختياري — بيانات تجريبية (⚠️ غيّر الباسوردات بعدها)
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

> **⚠️ أمان:** السييدر بينشئ حسابات بباسورد `password` (admin@ · vendor@ · amr@). **غيّرها فورًا** أو ما تشغّلش السييدر في الإنتاج وأنشئ الأدمن يدويًا.

## 5) Nginx (مختصر)
- `root` على `/var/www/mahfol/public`.
- `try_files $uri /index.php?$query_string;` وتمرير `.php` لـ php-fpm.
- فعّل HTTPS (Certbot).

## 6) بعد النشر — تسجيل الـwebhooks
في لوحة Paymob/Fawry، سجّل روابط الإشعار:
- Paymob: `https://your-domain.com/payment/webhook` + redirection `…/payment/callback`
- Fawry: `https://your-domain.com/payment/fawry/webhook`

## 7) تشيك ليست الإطلاق
- [ ] `APP_DEBUG=false` و `APP_URL` بالدومين الصح (HTTPS).
- [ ] DB على MySQL + migrate تمّت.
- [ ] باسوردات الحسابات الافتراضية اتغيّرت.
- [ ] مفاتيح الدفع مضبوطة و`isConfigured()` بترجع true (جرّب حجز حقيقي).
- [ ] الـwebhooks مسجّلة في لوحة البوابة.
- [ ] `MAIL_MAILER` حقيقي (اختبر تأكيد حجز + استرجاع كلمة مرور).
- [ ] `npm run build` اتعمل والأصول موجودة في `public/build`.
- [ ] `storage:link` اتعمل والصور بتظهر.

## ملاحظات
- رسوم الخدمة (`service_fee`) وخصم مكفول (`makfol_discount`) والعمولة (`commission_rate`) كلها في جدول `settings` وقابلة للتعديل من لوحة الأدمن.
- لو حوّلت الإيميل لـ`->queue()` مستقبلاً، هتحتاج `php artisan queue:work` عبر supervisor + الجدول `jobs`.
