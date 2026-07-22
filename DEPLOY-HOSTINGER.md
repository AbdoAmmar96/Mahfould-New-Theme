# رفع محفول مكفول على Hostinger (استضافة مشتركة)

> **السيرفر:** `93.127.204.68` · بورت `65002` · يوزر `u700918732`
> **الحزمة:** `dist/mahfol-makfol-*.tar.gz` — فيها `vendor/` و`public/build/` جاهزين، فمش محتاج composer ولا npm على السيرفر.

> ⚠️ **متستخدمش `.env.production.example`** — ده مبني على Redis واللي مش موجود على الاستضافة المشتركة، وهيدي **500 على كل طلب**. استخدم القالب اللي في الخطوة 6 تحت.

---

## 1) قبل SSH — من لوحة hPanel

| الإعداد | المكان | القيمة |
|---------|--------|--------|
| نسخة PHP | Advanced → PHP Configuration | **8.2 أو أعلى** (المشروع بيرفض أقل) |
| إضافات PHP | نفس الصفحة | `pdo_mysql` · `mbstring` · `openssl` · `gd` · `bcmath` · `fileinfo` · `zip` |
| قاعدة بيانات | Databases → MySQL | اعمل واحدة واحفظ: الاسم واليوزر والباسورد |
| الدومين | Domains | متأكد إنه شغّال وعليه **SSL** |

> اسم قاعدة البيانات واليوزر على Hostinger بيبقى ببادئة زي `u700918732_mahfol`. سجّلهم بالظبط.

---

## 2) ارفع الحزمة

من جهازك:

```bash
cd "/media/abdo-ammar/D8C2434DC2432F56/BSN projects/mahfol-makfol"
scp -P 65002 dist/mahfol-makfol-*.tar.gz u700918732@93.127.204.68:~/
```

## 3) ادخل السيرفر

```bash
ssh -p 65002 u700918732@93.127.204.68
```

**أول حاجة — أكّد نسخة PHP:**

```bash
php -v          # لازم 8.2+
ls ~/domains    # اعرف اسم مجلد الدومين بالظبط
```

لو `php -v` طلع أقل من 8.2، غيّرها من hPanel الأول وارجع.

---

## 4) فُكّ الحزمة ورتّب الملفات

**ليه الترتيب ده:** لارافيل بيخلي `public/` بس هي المكشوفة للنت. باقي المشروع — وفيه `.env` بكلمات سر الدفع وقاعدة البيانات — **لازم يبقى برّه `public_html`**. لو حطيت المشروع كله جوّه `public_html` يبقى أي حد يفتح `دومينك/.env` ويشوف مفاتيحك.

```bash
# 4.1 فُك واعمل اسم ثابت
cd ~
tar -xzf mahfol-makfol-*.tar.gz
mv mahfol-makfol-*/ ~/mahfol-app
rm mahfol-makfol-*.tar.gz

# 4.2 حدّد الـdocroot (غيّر اسم الدومين لبتاعك)
DOMAIN=example.com
DOCROOT=~/domains/$DOMAIN/public_html

# 4.3 شوف اللي جوّاه قبل ما تمسح أي حاجة
ls -la $DOCROOT

# 4.4 انقل محتوى public/ للـdocroot  (النقطة في الآخر بتنقل المخفي زي .htaccess)
cp -a ~/mahfol-app/public/. $DOCROOT/
rm -rf ~/mahfol-app/public
```

> `cp -a …/public/.` — النقطة دي **مش غلطة مطبعية**. من غيرها `.htaccess` مش هيتنقل، ومن غير `.htaccess` كل الروابط غير الرئيسية هتدي **404**.

---

## 5) وصّل الـdocroot بالتطبيق

`index.php` بيدوّر على التطبيق في `../` — وده بقى غلط بعد ما فصلنا المجلدين. استبدله:

```bash
cat > $DOCROOT/index.php <<'PHP'
<?php

use Illuminate\Http\Request;

// مسار التطبيق — برّه public_html عشان .env مايكونش مكشوف على النت
$APP = '/home/u700918732/mahfol-app';

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = $APP.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $APP.'/vendor/autoload.php';

$app = require_once $APP.'/bootstrap/app.php';

// ⚠️ السطر ده مش زيادة — من غيره الموقع كله 500.
// لارافيل بيحسب public_path() من مجلد التطبيق، وإحنا شيلنا public من هناك،
// فمش هيلاقي public/build/manifest.json ويرمي "Vite manifest not found".
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
PHP
```

**اربط مجلد الرفعات** (`storage:link` مش هيشتغل صح مع الترتيب ده، فاعمله يدوي):

```bash
ln -s /home/u700918732/mahfol-app/storage/app/public $DOCROOT/storage
```

---

## 6) ملف `.env`

```bash
cd ~/mahfol-app
nano .env
```

الصق ده وغيّر القيم المعلّمة:

```env
APP_NAME="محفول مكفول"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=Africa/Cairo
APP_URL=https://example.com        # ← دومينك بالظبط، بـhttps، من غير / في الآخر
APP_LOCALE=ar
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u700918732_xxxxx       # ← من hPanel
DB_USERNAME=u700918732_xxxxx       # ← من hPanel
DB_PASSWORD=                       # ← من hPanel

# ⚠️ database مش file — محرك الإتاحة بيعتمد على أقفال ذرّية،
#    و driver=file مش ذرّي يعني ممكن يحصل حجز مزدوج.
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=no-reply@example.com # ← إيميل تعمله من hPanel
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@example.com"
MAIL_FROM_NAME="${APP_NAME}"

PAYMENT_GATEWAY=paymob
PAYMOB_BASE_URL=https://accept.paymob.com
PAYMOB_SECRET_KEY=
PAYMOB_PUBLIC_KEY=
PAYMOB_HMAC_SECRET=
PAYMOB_INTEGRATION_IDS=
PAYMOB_API_KEY=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT="${APP_URL}"
```

> `APP_URL` غلط = **الدفع كله بايظ** — منه بتتبنى روابط الكولباك اللي Paymob بيرجّع عليها.

---

## 7) شغّل التطبيق

```bash
cd ~/mahfol-app

php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --force        # ⚠️ اقرا التحذير تحت قبل ما تنفّذه

chmod -R 775 storage bootstrap/cache

php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### ⚠️ تحذير أمني على `db:seed`

البذور بتعمل **3 حسابات كلها بباسورد `password`** — واحد منهم **أدمن**. لو سبتهم على موقع منشور، أي حد يدخل لوحة التحكم.

البذور برضه بتحط بيانات تجريبية (رحلات وفنادق ومطاعم) — بس **كمان** بتحط إعدادات المنصة الأساسية (نسبة العمولة، رسوم الخدمة، خصم مكفول، الوجهات) واللي **من غيرها الموقع مش هيشتغل**.

فشغّل البذور، وبعدها **على طول** غيّر الباسوردات:

```bash
php artisan tinker --execute="
\$u = App\Models\User::where('email','admin@mahfolmakfol.com')->first();
\$u->password = Illuminate\Support\Facades\Hash::make('باسورد-قوي-جديد-هنا');
\$u->save();
App\Models\User::whereIn('email',['amr@example.com','vendor@mahfolmakfol.com'])->update(['is_active'=>false]);
echo 'تم';
"
```

بعد ما تحط بياناتك الحقيقية، امسح التجريبية من لوحة الأدمن.

---

## 8) الكرون — **مش اختياري**

محرك الإتاحة بيحجز الوحدة مؤقتًا لمدة 30 دقيقة أثناء الدفع. المهمة المجدولة هي اللي بتفكّ الحجوزات اللي اتلغت. **لو الكرون مش شغّال، المخزون بيتقفل للأبد** وعملاؤك يشوفوا «غير متاح» على غرف فاضية.

hPanel → **Advanced → Cron Jobs** → كل دقيقة:

```
cd /home/u700918732/mahfol-app && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

> لو `/usr/bin/php` مش النسخة 8.2+، استخدم المسار الكامل اللي بيطلع من `which php` وانت داخل SSH.

اختبرها يدوي الأول:

```bash
php artisan holds:release-expired
```

---

## 9) اتأكد إن كل حاجة سليمة

```bash
php artisan payments:check     # يقوللك الناقص في إعداد الدفع بالظبط
```

ومن المتصفح:

| الفحص | المتوقّع |
|-------|----------|
| `https://دومينك/` | الصفحة الرئيسية |
| `https://دومينك/tours` | قائمة الرحلات (يثبت إن `.htaccess` شغّال) |
| `https://دومينك/.env` | **403 أو 404** — لو نزّل الملف فالترتيب غلط، ارجع للخطوة 4 |
| `https://دومينك/manifest.webmanifest` | JSON |
| افتح من موبايل | واجهة التطبيق + يعرض «تثبيت» |
| أيقونة التبويب | لوغو `d.png` |

---

## 10) بعد ما يشتغل

- **سجّل روابط الدفع** في لوحة Paymob (التفاصيل في [PAYMOB-SETUP.md](PAYMOB-SETUP.md)):
  - `https://دومينك/payment/webhook` ← Transaction **processed**
  - `https://دومينك/payment/callback` ← Transaction **response**
- **إشعارات المتصفح** (اختياري): `php artisan webpush:vapid` وحط المفتاحين في `.env`.
- **اعمل حجز حقيقي بمبلغ صغير** وتأكد إن الحالة بقت `paid` + `confirmed` في `/admin/bookings`.

---

## تحديث لاحق

```bash
# من جهازك
./build-deploy.sh
scp -P 65002 dist/mahfol-makfol-*.tar.gz u700918732@93.127.204.68:~/

# على السيرفر
cd ~
tar -xzf mahfol-makfol-*.tar.gz
cp ~/mahfol-app/.env /tmp/env.bak          # احفظ الإعدادات
NEW=$(ls -d mahfol-makfol-*/ | tail -1)
cp -a $NEW/public/. ~/domains/example.com/public_html/
rm -rf $NEW/public
mv ~/mahfol-app ~/mahfol-app.old && mv $NEW ~/mahfol-app
cp /tmp/env.bak ~/mahfol-app/.env
ln -sfn /home/u700918732/mahfol-app/storage/app/public ~/domains/example.com/public_html/storage
cd ~/mahfol-app && php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

> `index.php` بتاع الـdocroot هيتكتب فوقه بنسخة لارافيل الافتراضية (اللي من غير `usePublicPath`) — **أعد خطوة 5** بعد كل تحديث، وإلا الموقع هيقع بـ500.
> اتأكد إن كل حاجة تمام قبل ما تمسح `~/mahfol-app.old`.
