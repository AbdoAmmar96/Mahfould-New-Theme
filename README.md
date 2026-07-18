# محفول مكفول — منصة حجوزات السياحة

منصة سياحة مصرية (رحلات · فنادق · مطاعم · صاحب السعادة) — مبنية من الصفر، ملكك 100%، من غير أي سكربت مقرصن.

**الستاك:** Laravel 11 · Inertia · React 18 · Vite · Tailwind · Filament v3
**اللغة:** عربي RTL كامل

---

## التشغيل (خطوة بخطوة)

المشروع ده هيكل جاهز — لسه محتاج تسطّب الحزم (أنا معملتش `composer install` علشان دي محتاجة تتعمل عندك).

```bash
# 1) الحزم
composer install
npm install

# 2) الإعدادات
cp .env.example .env
php artisan key:generate

# 3) اظبط قاعدة البيانات في .env (DB_DATABASE=mahfol_makfol) واعمل الداتابيز
#    ثم:
php artisan migrate --seed

# 4) اربط مجلد التخزين (علشان الصور المرفوعة)
php artisan storage:link

# 5) شغّل
npm run dev        # في تيرمنال
php artisan serve  # في تيرمنال تاني
```

افتح: **http://localhost:8000**
لوحة التحكم: **http://localhost:8000/admin**

### الدخول
| | الإيميل | الباسورد | يفتح |
|---|---|---|---|
| **أدمن** | `admin@mahfolmakfol.com` | `password` | `/admin` |
| **بائع/شريك** | `vendor@mahfolmakfol.com` | `password` | `/vendor` |
| **عميل** | `amr@example.com` | `password` | الموقع |

> بتشتغل بـ Laravel Herd؟ حط المشروع في مجلد Herd، شغّل `npm run dev`، وافتح `http://mahfol-makfol.test`. متنساش `composer install`.

---

## اللي شغّال دلوقتي (Phase 1)

### الواجهة (React + Inertia)
- ✅ الرئيسية — هيرو + بحث + وجهات + عروض + خدمات + صاحب السعادة
- ✅ الرحلات — قائمة بفلتر (وجهة/سعر/ترتيب) + Pagination حقيقي
- ✅ تفاصيل الرحلة — جاليري + برنامج + صندوق حجز بحساب سعر حي + تقييمات
- ✅ الفنادق — قائمة + تفاصيل + حجز بالليلة + تقييمات
- ✅ المطاعم — قائمة + تفاصيل + حجز ترابيزة + تقييمات
- ✅ السيارات — قائمة (فلتر ناقل الحركة) + تفاصيل + حجز باليوم + تقييمات
- ✅ صاحب السعادة — الباكدجات
- ✅ الحجز — Checkout (3 خطوات + دفع) → يتسجّل فعلاً في الداتابيز → دفع Paymob → تأكيد بـ QR
- ✅ المفضلة — زر قلب بيتحفظ + صفحة مخصّصة
- ✅ تسجيل دخول / حساب جديد (يقبل موبايل أو إيميل)
- ✅ حسابي — إحصائيات + كل حجوزاتك

### الباك إند
- ✅ 12 جدول يغطوا المنصة كلها (users, locations, tours, hotels, restaurants, sahb_packages, bookings, reviews, wishlists, amenities, settings)
- ✅ حجز polymorphic — أي خدمة `bookable` في جدول واحد
- ✅ Seeder بمحتوى عربي واقعي جاهز
- ✅ لوحة Filament كاملة: الرحلات · الفنادق · المطاعم · الوجهات · الحجوزات · صاحب السعادة (بفلاتر و badges)
- ✅ **دفع Paymob حقيقي** (Intention API v1 + Unified Checkout) — كارت ومحفظة، مع تحقق HMAC وwebhook

---

## ⚙️ ضبط الدفع

المنصة بتدعم **بوابتين** — اختار النشطة بـ `PAYMENT_GATEWAY=paymob` أو `fawry` في `.env`.
لو المختارة مش مضبوطة، النظام بيجرّب التانية تلقائياً.

### Paymob (Intention API v1 + Unified Checkout)
```env
PAYMENT_GATEWAY=paymob
PAYMOB_SECRET_KEY=sk_...
PAYMOB_PUBLIC_KEY=pk_...
PAYMOB_HMAC_SECRET=...
PAYMOB_INTEGRATION_IDS=123456,789012
```
Callbacks في لوحة Paymob:
- Response (redirect): `https://yourdomain.com/payment/callback`
- Processed (webhook): `https://yourdomain.com/payment/webhook`

### Fawry (Express Checkout)
```env
PAYMENT_GATEWAY=fawry
FAWRY_BASE_URL=https://atfawry.fawrystaging.com   # للإنتاج: https://www.atfawry.com
FAWRY_MERCHANT_CODE=...
FAWRY_SECURITY_KEY=...
```
Server Callback (v2) في لوحة Fawry: `https://yourdomain.com/payment/fawry/webhook`

**إزاي بيشتغل:** الحجز يتعمل (pending) → التحويل لصفحة البوابة → بعد الدفع callback + webhook موقّع (HMAC لـ Paymob / SHA-256 لـ Fawry) → تأكيد الحجز + **إشعار العميل**.

> "دفع عند الوصول" شغّال من غير أي مفاتيح. لو مفيش بوابة مضبوطة، الحجز بيتسجّل "في انتظار الدفع".

---

## 🔔 الإشعارات (واتساب + إيميل)

أول ما الحجز يتأكّد (دفع ناجح أو "عند الوصول") العميل بياخد:

**إيميل** — تصميم عربي RTL كامل (`resources/views/emails/booking-confirmed.blade.php`).

**واتساب** — 3 أوضاع (`WHATSAPP_DRIVER`):
```env
WHATSAPP_DRIVER=webhook          # log | webhook | cloud_api
WHATSAPP_WEBHOOK_URL=https://...  # يبعت الحجز لنظام الأتمتة بتاعك
WHATSAPP_WEBHOOK_TOKEN=...
# أو Cloud API الرسمي:
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_TEMPLATE=booking_confirmation
```
- **webhook** → يبعت payload الحجز لـ endpoint عندك (مثالي لأتمتة واتساب بتاعتك — تستقبله وتبعت بأدواتك)
- **cloud_api** → WhatsApp Cloud API الرسمي (template معتمد بـ 4 متغيرات: الاسم، رقم الحجز، الباقة، الإجمالي)
- **log** → يسجّل بس (الافتراضي)

الأرقام بتتظبط تلقائياً لصيغة E.164 المصرية (20xxxxxxxxxx). أي فشل في الإشعار **مش بيأثر** على الحجز.

> الإيميل بيتبعت sync. للإنتاج فعّل `QUEUE_CONNECTION` وخلّي `BookingConfirmedMail implements ShouldQueue`.

---

## 🤝 لوحة البائعين (`/vendor`)

panel منفصل للشركاء — كل بائع يشوف **بس** بتاعه (scoped بـ `user_id`):
- يدير **رحلاته · فنادقه · سياراته · مطاعمه** (نفس فورم الأدمن، بس متقفّل على ملكيته — أي سجل جديد بيترتبط بيه تلقائياً)
- يشوف **حجوزاته** (read-only) مع عمود **صافيك** = الإجمالي − عمولة المنصة
- Dashboard فيه إحصائيات: خدماتي · حجوزاتي · صافي أرباحي

الأدمن يقدر يدخل لوحة البائعين ويشوف الكل. الصلاحية في `User::canAccessPanel()` (panel-aware).

**العمولة:** نسبة المنصة في `settings` (`commission_rate`, افتراضي 15%). بتتحسب وقت الحجز وتتخزن في `bookings.commission_amount`، فأي تغيير في النسبة مبيأثرش على حجوزات قديمة.

---

## ↩️ الاسترجاع (Refund)

في لوحة الأدمن → الحجوزات → زر **استرجاع** (بيظهر بس للمدفوع). بينده الـ refund API بتاع البوابة اللي اتدفع بيها (Paymob أو Fawry) حسب `payment_gateway` المخزّن، وبيحدّث الحالة لـ `refunded`.

- بنخزّن `payment_ref` (مرجع البوابة) وقت نجاح الدفع — ده اللازم للـ refund
- **Paymob refund** يحتاج `PAYMOB_API_KEY` كمان (عشان الـ auth token):
```env
PAYMOB_API_KEY=...
```
- **Fawry refund** بيشتغل بالـ merchant code + security key الموجودين

---

## الهيكل

```
app/
  Models/            # 11 موديل + Concerns/Bookable trait
  Http/Controllers/  # Home, Tour, Hotel, Restaurant, Sahb, Booking, Auth
  Http/Middleware/   # HandleInertiaRequests (يشارك auth + settings)
  Filament/Resources/# Tour, Location, Booking, SahbPackage
database/
  migrations/        # 12 migration
  seeders/           # DatabaseSeeder (بيانات جاهزة)
  factories/         # TourFactory
resources/
  css/app.css        # Tailwind + design tokens بتاعتك
  js/
    Components/UI.jsx # مكتبة مكوّنات (Btn, Badge, ServiceCard, ListingCard…)
    Layouts/          # SiteLayout (هيدر + فوتر)
    Pages/            # كل الصفحات
routes/web.php
```

كل الألوان والخطوط بتاعتك متعرّفة في `tailwind.config.js` و `resources/css/app.css` — استعملها كـ utility classes (مثلاً `text-coral`, `bg-navy`) أو الكلاسات الجاهزة (`.mk-btn`, `.mk-card`).

---

## خريطة الطريق (اللي بعد كده)

### ✅ تم
- الدفع الحقيقي — **بوابتين**: Paymob + Fawry، مع تبديل من `.env`
- **إشعارات** تأكيد الحجز: إيميل عربي + واتساب
- **لوحة البائعين** (`/vendor`) — خدمات + حجوزات + أرباح، scoped لكل بائع
- **الاسترجاع** (refund) من لوحة الأدمن عبر البوابتين
- **العمولة** — نسبة منصة محسوبة ومخزّنة لكل حجز
- الأدمن: 7 Resources · السيارات · التقييمات · المفضلة

### الخطوة الجاية (اختياري)
- إشعار للبائع عند حجز جديد على خدمته
- تقارير/تسويات دورية للبائعين (payouts)
- **SaaS multi-tenancy** لو حبيت تأجّر المنصة نفسها (زي فكرة Bana)
- تطبيق موبايل (نفس الـ API عبر Inertia أو API منفصل)

### Phase 4 — البائعين (Vendors)
- لوحة Filament منفصلة للبائع (panel تاني) يدير رحلاته وحجوزاته
- عمولة المنصة على كل حجز

### Phase 5 — SaaS
- multi-tenancy لو حبيت تأجّر المنصة لشركات سياحة تانية (زي فكرة Bana بتاعتك)

---

## ملاحظات
- الصور دلوقتي placeholder من `picsum.photos` — استبدلها برفع صور حقيقي من لوحة الأدمن (FileUpload جاهز في كل Resource).
- الأسعار: رسوم الخدمة (200) وخصم مكفول (400) قيم ثابتة في `BookingController` — انقلها لجدول `settings` لو حبيت تتحكم فيها من الأدمن.
- المشروع اتعمله lint كامل (56 ملف PHP + 16 ملف JSX) — كله نضيف.
