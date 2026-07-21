# ربط Paymob — دليل التشغيل خطوة بخطوة

> **الكود جاهز 100% ومختبر.** مفيش سطر واحد محتاج يتكتب — الناقص **المفاتيح والإعدادات** بس.
> للتأكد من أي حاجة في أي وقت: `php artisan payments:check`

---

## 0. تحقّق سريع

```bash
php artisan payments:check
```

بيقولك بالظبط: إيه المفاتيح الناقصة · إيه الروابط اللي تسجّلها في لوحة Paymob · وهل البريد شغّال.

---

## 1. اللي محتاجه من Paymob

ادخل [accept.paymob.com](https://accept.paymob.com) → **Settings → Account Info**

| المفتاح | مكانه في اللوحة | إلزامي؟ | بيستخدم في إيه |
|---------|------------------|---------|-----------------|
| `PAYMOB_SECRET_KEY` | Settings → Account Info → **Secret Key** (`sk_...`) | ✅ | إنشاء الـ intention |
| `PAYMOB_PUBLIC_KEY` | نفس الصفحة → **Public Key** (`pk_...`) | ✅ | فتح صفحة الدفع الموحّدة |
| `PAYMOB_INTEGRATION_IDS` | Developers → **Payment Integrations** → عمود ID | ✅ | تحديد وسائل الدفع |
| `PAYMOB_HMAC_SECRET` | Settings → Account Info → **HMAC** | ✅ | التحقق من صحة الكولباك |
| `PAYMOB_API_KEY` | Settings → Account Info → **API Key** | ⬜ اختياري | الاسترداد (refund) من لوحة الأدمن |

> **`PAYMOB_INTEGRATION_IDS`**: أرقام مفصولة بفاصلة بالترتيب — **الكارت الأول، المحفظة التانية**.
> مثال: `PAYMOB_INTEGRATION_IDS=4538219,4538220`

> ⚠️ **`PAYMOB_HMAC_SECRET` مش رفاهية.** من غيره أي حد يقدر يبعت طلب مزيّف لـ`/payment/callback` ويخلّي حجز غير مدفوع يتحوّل لـ«مؤكّد». الكود بيتحقق من التوقيع فعلاً — بس لازم المفتاح يكون صح.

---

## 2. املا `.env`

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com        # ← حرج: منه بتتبنى روابط الكولباك

PAYMENT_GATEWAY=paymob

PAYMOB_BASE_URL=https://accept.paymob.com
PAYMOB_SECRET_KEY=sk_live_xxxxxxxx
PAYMOB_PUBLIC_KEY=pk_live_xxxxxxxx
PAYMOB_HMAC_SECRET=xxxxxxxx
PAYMOB_INTEGRATION_IDS=4538219,4538220
PAYMOB_API_KEY=                        # للاسترداد
```

بعد أي تعديل:

```bash
php artisan config:clear && php artisan config:cache
```

> **`APP_URL` غلط = الدفع كله بايظ.** لو ساب `localhost`، Paymob هيحاول يرجّع العميل لعنوان مش موجود على النت.

---

## 3. سجّل الروابط في لوحة Paymob

**Developers → Payment Integrations** → افتح كل integration وحط:

| الحقل في لوحة Paymob | الرابط |
|----------------------|--------|
| **Transaction processed callback** (server-to-server) | `https://your-domain.com/payment/webhook` |
| **Transaction response callback** (رجوع العميل) | `https://your-domain.com/payment/callback` |

- **processed** = المصدر الموثوق اللي بيأكّد الدفع فعليًا (POST من سيرفر Paymob).
- **response** = بيرجّع العميل لصفحة التأكيد بعد ما يخلّص.

> ✅ `/payment/webhook` **مستثنى من CSRF بالفعل** في [bootstrap/app.php](bootstrap/app.php) — مش محتاج تعمل حاجة.

---

## 4. اختبر قبل ما تشغّل حقيقي

1. اشتغل على **مفاتيح الـTest** أولاً (`sk_test_` / `pk_test_`).
2. `php artisan payments:check` → لازم كله ✔.
3. اعمل حجز بـ**بطاقة ائتمان** من الموقع.
4. لازم يحوّلك لصفحة Paymob → ادفع ببطاقة الاختبار.
5. **الفحص الحقيقي:** بعد الدفع افتح الحجز في `/admin/bookings` ولازم تلاقي:
   - `payment_status = paid`
   - `status = confirmed`
   - `payment_ref` فيه رقم معاملة Paymob
6. لو فضل `pending` → الـwebhook مش واصل. راجع:
   - الرابط مسجّل صح في اللوحة؟
   - الدومين شغّال HTTPS ومفتوح من برّه؟
   - `storage/logs/laravel.log` — الكود بيسجّل `Paymob webhook: HMAC غير صحيح` لو التوقيع غلط.

---

## 5. التحويل للإنتاج

- [ ] بدّل مفاتيح الـtest بمفاتيح **live**
- [ ] `APP_ENV=production` · `APP_DEBUG=false`
- [ ] `APP_URL` بالدومين الحقيقي + HTTPS
- [ ] حدّث روابط الكولباك في لوحة Paymob للدومين الحقيقي
- [ ] `php artisan config:cache && php artisan route:cache`
- [ ] اعمل حجز حقيقي بمبلغ صغير وتأكد من وصول الفلوس
- [ ] فعّل **البريد** (`MAIL_MAILER`) وإلا تأكيدات الحجز مش هتوصل للعملاء

---

## 6. الاسترداد (Refund)

بيشتغل من لوحة الأدمن (`/admin/bookings` → زر الاسترداد) — بس **محتاج `PAYMOB_API_KEY`** بالإضافة للمفاتيح التانية.

---

## 7. لو حبيت Fawry بدل Paymob

الكود بيدعم الاتنين. غيّر:

```env
PAYMENT_GATEWAY=fawry
FAWRY_BASE_URL=https://www.atfawry.com     # الإنتاج (الافتراضي staging)
FAWRY_MERCHANT_CODE=xxxx
FAWRY_SECURITY_KEY=xxxx
```

روابط Fawry: `/payment/fawry/callback` و `/payment/fawry/webhook` (الاتنين مستثنيين من CSRF).

---

## ملخص الملفات المعنيّة

| الملف | دوره |
|------|------|
| [app/Services/PaymobService.php](app/Services/PaymobService.php) | إنشاء الـintention + التحقق من HMAC + الاسترداد |
| [app/Services/Payments/PaymentManager.php](app/Services/Payments/PaymentManager.php) | يختار البوابة النشطة |
| [app/Http/Controllers/PaymentController.php](app/Http/Controllers/PaymentController.php) | الكولباك والـwebhook + تثبيت المخزون عند الدفع |
| [config/services.php](config/services.php) | قراءة المفاتيح |
| [app/Console/Commands/PaymentsCheck.php](app/Console/Commands/PaymentsCheck.php) | أمر التشخيص |
