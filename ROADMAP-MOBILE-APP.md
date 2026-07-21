# خارطة طريق المشروع + وضع الموبايل + الأبليكشن
### منصة «محفول مكفول» — الوثيقة المرجعية للإطلاق
**التاريخ:** 21 يوليو 2026 · **الفرع:** `main` · **آخر كوميت:** `0d9a7a8 — sprint 1 in fix bugs`
**المرجع التقني:** `V2-BLUEPRINT.md` · `ARCHITECTURE.md` · `PROJECT-STATUS.md` · `DEPLOY.md` · `LAUNCH.md`

---

## 1. الملخص التنفيذي

### 1.1 الوضع بصراحة

المشروع **مش «جاهز 100%»** زي ما `PROJECT-STATUS.md` بيقول. الحقيقة أدق من كده وأكثر تفاؤلًا في جزء وأكثر قتامة في جزء تاني:

**اللي فعلًا قوي ومتفوّق على المتوقع:**
- **محرك الإتاحة** (`app/Services/Availability/`) — تصميم صناعي محترم: صف لكل وحدة فيزيائية/تاريخ/فترة، عمود مولّد `active_flag` داخل unique index، وثلاث طبقات حماية (`Cache::lock` + transaction + unique index)، وعليه الاختبار الوحيد في المشروع (`tests/Feature/AvailabilityEngineTest.php`). ده أقوى أصل تقني عندك.
- **الواجهة** — 39 صفحة React، معظمها **كاملة فعليًا مش هياكل**. التحويل لـ Shadcn + Tailwind + lucide تمّ بالكامل. صفحات زي `Tours/Show.jsx` و`Hotels/Show.jsx` و`Restaurants/Show.jsx` و`Booking/Checkout.jsx` فيها منطق حقيقي (add-ons تفاعلية، إتاحة حيّة، اختيار ترابيزة، شرائح عمرية).
- **طبقة الخدمات في PHP** — ~9,000 سطر منطق تجاري حقيقي: تسعير الأعمار، توقيت الدفع، سياسة الإلغاء، تصاريح الدخول، تقييم المزوّد، أفضل قيمة، التخصيص الجغرافي.

**اللي مكسور فعليًا:**
- **ثلث الجداول «جداول بلا منطق ولا واجهة»** — الباصات (5 جداول، صفر صف، صفر CRUD)، التوصيل (صفر صف، صفر واجهة إدارة)، الشركات/المزوّدين (صفر صف)، المستندات (صفر مسار رفع)، الـ amenities (ميتة تمامًا).
- **دورة الموافقة على المزوّدين مقطوعة من الجذر.** `publish_state` افتراضيه `published`، ومفيش أي سطر في المشروع بيحطّه `pending_review`. يعني أي خدمة مزوّد **بتتنشر فورًا للعملاء بدون مراجعة** — عكس `V2-BLUEPRINT.md §1.1` بالحرف.
- **منظومة المزوّدين كلها مبنية على أساس مش موصول.** `provider_id` مش بيتكتب من أي كونترولر (`Vendor/VendorScoped.php:28` بيحطّ `user_id` بس)، فالأرباح صفر دايمًا، والبروفايل العام فاضي، وشارة «طرف أول» بتظهر غلط على خدمات الطرف التالت.
- **الفنادق والمطاعم الجديدة غير قابلة للحجز إطلاقًا.** مفيش CRUD لأنواع الغرف ولا الترابيزات ولا المنيو — البيانات الموجودة كلها من الـ seeders. أي فندق يتضاف من اللوحة = صفر أنواع غرف = العميل يدوس «احجز» ويطلع 404.
- **العربيات مكشوفة للحجز المزدوج** — مش مستخدمة `HasAvailability`، والفرع بتاعها في `BookingController::store` بيحسب السعر بدون أي `reserve`.
- **صفحتان بتضربا 500 وقت التشغيل**: `Buses/Route.jsx` و`Vendor/Earnings/NoCompany.jsx` — الكونترولر بيعمل لهم `Inertia::render` والملفات **مش موجودة**.
- **`POST /admin/login` و`POST /vendor/login` بدون أي throttle** — brute-force مفتوح على لوحة التحكم.
- **migration واحدة هتفشّل النشر الأول على MySQL**: `2026_07_20_000170` فيها `->after('slot')` على جدول `bookings` اللي مالوش عمود اسمه `slot`.
- **الموبايل عمليًا غير موجود** — `SiteLayout.jsx` فيه `<nav class="hidden lg:flex">`، يعني على الموبايل مفيش أي تنقّل خالص. بس لوجو + زرّين ارتفاعهم ~32px.

### 1.2 الطريق للإطلاق — الحكم

المشروع **مش على بُعد أيام من الإطلاق، هو على بُعد 6–9 أسابيع لفريق من 1–2 مطور** للوصول لإطلاق تجريبي محدود (soft launch) بخدمات مختارة، و**10–14 أسبوع** لإطلاق كامل بكل الأنظمة.

الطريق الأقصر والأعقل مش «نكمّل كل حاجة»، لأ:

> **قلّص نطاق الإطلاق الأول.** أطلق بـ **الرحلات + الفنادق + المطاعم + صاحب السعادة** فقط. أخفِ **الباصات والتوصيل** من التنقّل تمامًا (feature flag) لحد ما يبقى ليهم واجهة إدارة حقيقية. ده بيشيل من الطريق أضخم بندين مجهودًا (L + L) وبيخلّي الإطلاق ممكن في 6 أسابيع بدل 12.

بعدها الترتيب الصارم:
1. **أسبوع 0 (3–4 أيام):** إصلاحات لا تحتمل التأجيل — الـ migration، الصفحتين الناقصتين، throttle على لوحات الدخول، حماية الماسح، توحيد `status`/`publish_state`، حماية `/booking/{code}`.
2. **أسبوعان:** لوحات الإدخال المفقودة (أنواع الغرف، الترابيزات، المنيو، الإعدادات، المستخدمين) — من غيرها المنصة **مش قابلة للتشغيل** حرفيًا.
3. **أسبوع:** إصلاح منظومة المزوّد (`provider_id` + دورة `pending_review` + رفع المستندات) + إتاحة العربيات + الإلغاء.
4. **أسبوعان:** وضع الموبايل (القشرة + الإدخال + الأداء) — ده اللي هيدّي 80% من إحساس «الأبليكشن» وهو أعلى ROI في الوثيقة كلها.
5. **بالتوازي من اليوم الأول:** فتح حسابات المطورين (Apple/Google) — الانتظار الإداري وحده 2–3 أسابيع.
6. **بعد الاستقرار:** PWA كامل → تطبيق Capacitor → متجرين.

---

## 2. حالة المشروع الحالية

### 2.1 جدول الأنظمة

| النظام | الحالة | الملاحظة |
|---|---|---|
| **محرك الإتاحة** | 🟢 منفّذ | أقوى جزء في المشروع. `booking_items` + generated column + unique index + `Cache::lock` + transaction. عليه اختبار فعلي. **لكن**: العربيات خارجه تمامًا، و`HoldService::confirmBooking` بترجع `false` ومحدش بيتعامل معاها. |
| **الرحلات (Tours)** | 🟢 منفّذ | موديل + كونترولر عام + admin/vendor CRUD + 3 صفحات (Index/Show/Schedule) + itinerary + activities + ValueScore. **الناقص**: مفيش CRUD للفعاليات ولا برنامج الأيام — بيانات seed فقط. |
| **الفنادق (Hotels)** | 🟡 جزئي | الحجز شغّال عبر `RoomType` بإتاحة حيّة. **الكسر**: صفر CRUD لأنواع الغرف → أي فندق جديد = غير قابل للحجز (404). وتسعير الشرائح العمرية **متجاهَل تمامًا** في فرع الفنادق (`BookingController::store` بيحسب `unit × nights × units` ويتجاهل `$ageSubtotal`). |
| **المطاعم (Restaurants)** | 🟡 جزئي | ترابيزات كوحدات إتاحة بـ slots + منيو بأقسام. **الكسر**: صفر CRUD للترابيزات والمنيو. و`RestaurantController::show` بيحسب الترابيزات المحجوزة **لليوم كله بدون فلترة بالـ slot** → ترابيزة محجوزة الساعة 12 تبان محجوزة طول اليوم. |
| **السيارات (Cars)** | 🔴 مكسور | جدول + موديل + صفحات + CRUD موجودين، **لكن مفيش أي طبقة إتاحة**. `Car.php` مش مستخدمة `HasAvailability`، وفرع العربيات في الـ checkout بيقع في `else` الأخير بدون `reserve`. **نفس العربية تتأجّر لعشر عملاء في نفس اليوم.** ومفيش مسار geolocation المذكور في §6. |
| **الباصات (Buses)** | 🔴 هيكل فاضي | 5 جداول + 4 موديلات + كونترولر + صفحة Index — و**كل الجداول صفر صف**. صفر CRUD، صفر seeder. `Buses/Route.jsx` **غير موجودة** رغم وجود الراوت → 500. `BusZone::fareFor()` (جوهر تسعير §10) مكتوبة ومش مستدعاة. مفيش اختيار مقعد. |
| **صاحب السعادة (Sahb)** | 🟡 جزئي | باقات جاهزة + prepaid إلزامي + admin CRUD. **الناقص**: §8 و§18 بيطلبوا **بنّاء ذاتي فوري** — اللي متنفّذ هو النموذج القديم (كروت باقات ثابتة). ومفيش صفحة تفاصيل للباقة. |
| **الدعم (Support)** | 🟡 جزئي | تذاكر بكود تلقائي + لوحة عميل + لوحة دعم (رد/إسناد/ملاحظات داخلية). **الكسر القاتل**: دور `support` **مش قادر يسجّل دخول من أي مكان** — `EnsureRole` بيوجّهه لـ `/admin/login` و`Admin/AuthController` بيسمح بـ `['admin']` بس. ومفيش أي مسار لإنشاء مستخدم بدور support. اللوحة **غير قابلة للاستخدام عمليًا**. |
| **التوصيل (Delivery)** | 🔴 هيكل فاضي | تسعير بالكيلومتر + تقدير أجرة + صفحتين شغّالين، لكن الجدولين **صفر صف** ومفيش أي واجهة إنشاء/إدارة. `index` بيقرأ `published()` بينما الـ migration بتحطّ default `draft` → حتى الإدخال اليدوي مش هيظهر. و`POST /delivery/order` **بدون `auth`** → طلبات مجهولة بأسماء وتليفونات. |
| **المزوّدون (Providers)** | 🔴 مكسور | تسجيل منفصل + لوحة موافقات + بروفايل عام + أرباح — كلهم موجودين وكلهم **بيرجعوا فاضي**. `companies` صفر صف، `provider_id` مش بيتكتب أبدًا، مفيش مسار رفع مستندات (فالمزوّد الفرد **مستحيل يتوافق عليه**)، ومفيش قسم مراجعة مستندات في صفحة الموافقات رغم وجود الـ endpoints. |
| **لوحة الأدمن** | 🟡 جزئي | CRUD لـ 7 موارد + حجوزات + موافقات + 8 endpoints تحليلات + Charts + Heatmap. **الناقص**: صفحة إعدادات (رسوم/ضرائب/أوزان)، إدارة مستخدمين، إدارة مزوّدين معتمدين، إدارة باصات، إدارة الكيانات الفرعية (غرف/ترابيزات/منيو/فعاليات/شرائح عمرية)، مراجعة تقييمات، تصدير CSV، تسويات. |
| **الدفع (Payments)** | 🟡 جزئي | Paymob + Fawry خلف واجهة `PaymentGateway` مع `PaymentManager`، وwebhooks بتحقق HMAC ومستثناة من CSRF. **الكسر**: مسارا `callback` مسجّلين `match(['get','post'])` لكن **مش ضمن استثناءات CSRF** → أي POST من البوابة = 419. و`amount_paid` عمود ميت (دايمًا 0) فـ `getOutstandingAttribute` بترجع الإجمالي كامل. ومفيش إلغاء ولا استرداد محسوب بالسياسة. |
| **الإتاحة كواجهة** | 🟡 جزئي | `GET /availability/hotel/{slug}` شغّال ومربوط بـ `useAvailability`. **الناقص**: مفيش تقويم/إدارة مخزون في لوحة المزوّد (§15)، ومفيش blackout dates، والـ endpoint **مكشوف بدون throttle** وبيرجّع نافذة 180 يوم. |

### 2.2 مؤشرات صحّة عامة

| المؤشر | القيمة | الحكم |
|---|---|---|
| Migrations | 37 | المخطط أنضج من الدومين |
| موديلات | 36 + 3 traits | ~ثلثهم بلا منطق ولا واجهة |
| خدمات (PHP) | 14 | جودة عالية، تغطية اختبارات شبه صفر |
| كونترولرز | 46 | البنية سليمة، فيه فجوات نطاق كاملة |
| مسارات مسجّلة | 161 | 78 محمي بـ `role:admin`، 26 بـ `role:vendor,admin`، 4 بـ `role:support,admin` |
| صفحات React | 39 | معظمها كامل فعليًا |
| ملفات اختبار | **1** | `tests/Feature/AvailabilityEngineTest.php` — لا غير. `tests/Unit/` فاضي. |
| Factories | **0** | الموديلات بتستخدم `HasFactory` ومفيش `database/factories` |
| صفحات Inertia مفقودة بيتعمل لها render | **2** | 500 مؤكد وقت التشغيل |
| أعمدة ميتة على `bookings` | 10 | `cleaning_fee`, `security_deposit`, `amount_paid`, `checked_in_at`, `no_show_at`, `forfeited_at`, `needs_review`, `cancelled_at`, `transport_details`, `security_deposit_status` |

---

## 3. اللي فاضل للإطلاق

> **مفتاح الجهد:** `S` = ≤ يوم · `M` = 2–4 أيام · `L` = 1–2 أسبوع · `XL` = 2+ أسابيع
> التقديرات لفريق **1–2 مطور** بدوام كامل.

### 3.1 🔴 بلوكرات — لا إطلاق قبلها

#### أ. تعطُّل مؤكد وقت التشغيل

| # | البند | الملف/الدليل | الجهد |
|---|---|---|---|
| 1 | `->after('slot')` على جدول `bookings` اللي مالوش عمود `slot` — **الـ migrate هيقف في نص التنفيذ على MySQL** ويسيب DB نص متكوّنة | `database/migrations/2026_07_20_000170_create_transport_and_entry_passes.php` → غيّرها لـ `after('nights')` أو شيل `after()` | **S** (ساعة) |
| 2 | صفحة `Buses/Route.jsx` غير موجودة والكونترولر بيعمل لها render | `app/Http/Controllers/BusController.php:62` ↔ `resources/js/Pages/Buses/` | **S** |
| 3 | صفحة `Vendor/Earnings/NoCompany.jsx` غير موجودة — وده **المسار الافتراضي** لأن مفيش أي seeder بينشئ Company | `app/Http/Controllers/Vendor/EarningsController.php:25` | **S** |
| 4 | مسارا `payment/callback` و`payment/fawry/callback` مش ضمن استثناءات CSRF رغم قبولهم POST → **419 من البوابة** | `routes/web.php:96,100` ↔ `bootstrap/app.php` | **S** |
| 5 | مفيش صفحات أخطاء Inertia (404/403/500) — كل `abort()` بيطلع صفحة لارافل الافتراضية بالإنجليزي خارج الـ RTL | `app/Http/Middleware/EnsureRole.php:28,32` | **S** |

#### ب. ثغرات أمنية وخصوصية

| # | البند | الملف/الدليل | الجهد |
|---|---|---|---|
| 6 | `POST /admin/login` و`POST /vendor/login` **بدون `throttle` وبدون `guest`** — brute-force مفتوح على لوحة التحكم | `routes/web.php:151-152, 193-194` | **S** |
| 7 | `GET /booking/{code}` **مكشوف بلا `auth` وبلا throttle**، وكود الحجز 6 أرقام عشوائية بس (مليون احتمال) — والصفحة بترجّع اسم العميل والمستفيد **وكود الـ QR للدخول** | `routes/web.php:93` + `app/Models/Booking.php:64` + `BookingController.php:448-476` | **M** |
| 8 | نفس المشكلة في `GET /delivery/confirm/{code}` — اسم المستلم وتليفونه وعنوان الاستلام والتسليم | `routes/web.php:76` + `DeliveryController.php:134-155` | **S** |
| 9 | `ScannerController` **مش مقصور على منشآت المزوّد** — أي حساب vendor يقدر يمسح ويستهلك تصريح دخول خاص بمنشأة تانية ويشوف أسماء عملائها | `app/Http/Controllers/Vendor/ScannerController.php` | **S** |
| 10 | `POST /delivery/order` بدون `auth` → طلبات مجهولة بأسماء وتليفونات بدون ربط بحساب | `routes/web.php:75` + `DeliveryController.php:124` | **S** |
| 11 | limiter الدخول بيبني المفتاح من `email` بينما الفورم بيبعت `login`، ورسالة التجاوز بترجع تحت `errors.email` والصفحة بتقرأ `errors.login` → **المستخدم اللي يتخطّى الحد يشوف فورم بيفشل بصمت** | `AppServiceProvider.php:35,37` ↔ `Auth/LoginController.php:22` ↔ `Auth/Login.jsx:72-75` | **S** |
| 12 | الـ QR بيتولّد عند طرف ثالث (`api.qrserver.com`) والـ payload فيه HMAC بيتبعت لسيرفر أجنبي — نقطة فشل خارجية في مسار دخول العميل + تسريب | `app/Models/EntryPass.php:38-41` — ثبّت `endroid/qr-code` وولّد محليًا | **S** |

#### ج. تناقضات بيانات تكسر المنطق

| # | البند | الملف/الدليل | الجهد |
|---|---|---|---|
| 13 | **ازدواجية `status` / `publish_state`** — القوائم بتفلتر بـ `published()` والتفاصيل بـ `status !== 'publish'`. خدمة مرفوضة (`publish_state='rejected'` + `status='publish'`) **صفحتها هتفتح عادي لأي حد عنده الرابط وقابلة للحجز**. لازم مصدر حقيقة واحد + backfill | `HasProvider.php:31-34` ↔ `TourController.php:167`, `HotelController.php:73`, `CarController.php:76`, `RestaurantController.php:85`, `AvailabilityController` | **M** |
| 14 | **العربيات بدون طبقة إتاحة** = حجز مزدوج مؤكد أول ما الموقع يشتغل | `app/Models/Car.php:529` + `BookingController.php:~294` — ضيف `HasAvailability` + فرع `reserve` | **M** |
| 15 | `restaurant_table` مسجَّل كنوع قابل للحجز مباشرة في `Bookables::MAP` → `/checkout/restaurant_table/{id}` مسار صالح ينشئ حجز بلا مطعم ولا سعر ولا وقت | `app/Support/Bookables.php:20-28` — شيله من الـ MAP | **S** |
| 16 | الترابيزات المحجوزة بتتحسب **لليوم كله بدون فلترة بالـ slot** → الواجهة بتقلّل المبيعات وبتناقض المحرك | `RestaurantController.php:~104` | **S** |
| 17 | `HoldService::confirmBooking` بترجع `false` لو الإتاحة اختفت بعد دفع ناجح — **ومحدش بيتعامل مع الـ false دي**. عميل ممكن يدفع ويطلع بلا غرفة | `app/Services/Availability/HoldService.php` ↔ `PaymentController` | **M** |
| 18 | `CACHE_STORE=file` (ديفولت لارافل) بيخلي طبقة القفل الأولى **وهمية** — لازم فحص وقت التشغيل يمنع الإقلاع بـ store مش ذرّي | `HoldService.php` + `HealthController` | **S** |

#### د. نطاقات بدون واجهة إدخال — المنصة مش قابلة للتشغيل بدونها

| # | البند | لماذا بلوكر | الجهد |
|---|---|---|---|
| 19 | **CRUD أنواع الغرف (`RoomType`)** | `BookingController.php:51` بيعمل `abort 404` لو الفندق ملوش أنواع غرف نشطة. أي فندق جديد من اللوحة = **غير قابل للحجز نهائيًا**. الموجود كله من `backfill` الـ migration و`DatabaseSeeder.php:133` | **L** |
| 20 | **CRUD ترابيزات المطاعم + أقسام/أصناف المنيو** | نفس المشكلة: مطعم جديد = بلا ترابيزات = «اختَر ترابيزة متاحة أولاً» = مستحيل يتحجز | **L** |
| 21 | **صفحة إعدادات الأدمن** (`/admin/settings`) | `Setting::get` بتتقري في `BookingController.php:98-99,300-303` و`HandleInertiaRequests.php:37-39` — الرسوم والضرايب وأوزان «أفضل قيمة» **مش قابلة للتعديل إلا بـ tinker**. وفيه رسوم خدمة hardcoded = 200 في 4 صفحات على الأقل | **M** |
| 22 | **إدارة المستخدمين + إنشاء موظفي الدعم** | §1/§15/§17 بينصّوا إن الأدمن فقط ينشئ حسابات الدعم. مفيش `/admin/users` ولا seeder — **لوحة `/support` كاملة وغير قابلة للاستخدام** | **M** |
| 23 | **إصلاح دخول دور `support`** | `EnsureRole` بيوجّه لـ `admin.login` و`Admin/AuthController` بيسمح بـ `['admin']` بس | **S** |
| 24 | **رفع مستندات المزوّد (`ProviderDocument`)** + قسم مراجعتها في صفحة الموافقات | `ApprovalController.php:66-73` بيرفض `approveProvider` بدون «فيش وتشبيه» معتمد، ومفيش أي مسار رفع → **المزوّد الفرد مستحيل يتوثّق**. وصفحة الموافقات بتعرض عدّاد بس بدون جدول ولا أزرار رغم وجود الـ endpoints | **M** |
| 25 | **دورة `draft → pending_review → published`** — الـ default لازم يبقى `draft`، وزر «إرسال للمراجعة» في لوحة المزوّد، و`publish_state` في فورم الأدمن | `migration 2026_07_20_000150:34` — دلوقتي **خدمة المزوّد بتتنشر فورًا بدون مراجعة**، وطابور الموافقات فاضي للأبد | **M** |
| 26 | **كتابة `provider_id` (company_id) على الخدمات** | `VendorScoped::beforeSave:28` بيحطّ `user_id` بس، بينما `EarningsController:33` و`ProviderProfileController:33,58` و`AnalyticsController::topProviders:166` بيستعلموا بـ `provider_id` → **أرباح صفر دايمًا، بروفايل فاضي، وشارة «طرف أول» غلط على خدمات الطرف التالت** | **M** |
| 27 | **مسار إلغاء الحجز** (`POST /booking/{code}/cancel`) مع تطبيق نسب الاسترداد | `CancellationPolicyService::refundPercentAt` مكتوبة ومش مستدعاة، والسياسة معروضة للعميل بس **غير قابلة للتنفيذ** | **M** |
| 28 | **عرض تصريح الدخول QR في حساب العميل** | §18: «الـ QR يُرسَل للعميل ويظهر في بروفايله». دلوقتي بيظهر مرة واحدة في صفحة التأكيد بس — لو قفلها **مش هيلاقيه تاني** | **S** |
| 29 | **إخفاء الباصات والتوصيل من التنقّل** (feature flag) لحد ما يبقى ليهم واجهة إدارة | بديل أرخص بكتير من بناء CRUD كامل ليهم قبل الإطلاق | **S** |

**إجمالي البلوكرات: ~5–6 أسابيع لمطور واحد · 3–4 أسابيع لمطورين.**

---

### 3.2 🟡 مهم — يتعمل في أول 4–8 أسابيع بعد الإطلاق

| # | البند | الملف/السياق | الجهد |
|---|---|---|---|
| 30 | **CRUD الباصات كامل** (محطات/خطوط/مناطق/رحلات) + `BusZone::fareFor()` مربوطة فعليًا + اختيار مقعد | 5 جداول صفر صف + تسعير §10 معطّل | **XL** |
| 31 | **إنشاء وإدارة خدمات التوصيل** + لوحة متابعة الطلبات للمزوّد/السائق | الطلب بيتخلق ويقف عند `pending` بدون أي مسار تحديث | **L** |
| 32 | **تسعير الشرائح العمرية في الفنادق** — دلوقتي رضيع وطفل وبالغ بنفس السعر | `BookingController::store` فرع pooled ~254 بيتجاهل `$ageSubtotal` | **S** |
| 33 | **تفعيل الأعمدة الميتة على `bookings`** — `amount_paid` (كل تقرير مالي دلوقتي بيقرأ أصفار)، `checked_in_at`، `no_show_at`، تأمين ورسوم نظافة | 10 أعمدة اتعملها migration ومتقريتش | **L** |
| 34 | **CRUD الفعاليات وبرنامج الأيام** — الفعاليات بتدخل التسعير فعليًا (`addons_snapshot`) والمزوّد مش قادر يضيف فعالية على رحلته | `Activity` + `TourItinerary` | **M** |
| 35 | **تقويم الإتاحة وإدارة المخزون في لوحة المزوّد** + blackout dates | §15 صراحةً | **L** |
| 36 | **إدارة المزوّدين المعتمدين** — تعليق (`suspended` مذكورة في §1.1 ومفيش مسار يوصلها)، تعديل نسبة العمولة، رفع لوجو | | **M** |
| 37 | **`EnsureRole` يتحقق من `verification_status`** — المزوّد `pending`/`rejected` عنده دلوقتي وصول كامل لكل CRUD في `/vendor` | | **S** |
| 38 | **تعديل بروفايل العميل + تغيير كلمة المرور** | `/account` فيه حجوزات ومفضلة وعناوين وتذاكر بس | **S** |
| 39 | **مراجعة التقييمات في الأدمن** — `ReviewController.php:33` بينشر أي تقييم فورًا `'approved' => true` بدون أي مسار حذف | | **S** |
| 40 | **factories + اختبارات لطبقة الدومين** — كل منطق التسعير والأموال بدون أي تغطية | `AgePricingService`, `PaymentTimingService`, `CancellationPolicyService`, `EntryPassService` | **L** |
| 41 | **استبدال fallbacks الصور الخارجية** (`loremflickr` / `picsum` / `ui-avatars`) في 10+ موديلات + الصورة الحيّة في `Home.jsx` | نقطة فشل خارجية على كل صفحات المنصة | **M** |
| 42 | **throttle على `/availability/hotel/{slug}`** و8 endpoints التحليلات | نافذة 180 يوم مكشوفة = تسريب مخزون + سطح DoS رخيص | **S** |
| 43 | **UI لإدارة `age_pricing_tiers`** | §4 بيقول كل خدمة ليها شرائحها، الواقع 0%/50%/100% ثابتة | **M** |
| 44 | **مسح QR بكاميرا الموبايل من اللوحة** | النصيحة الحالية في `Vendor/Scanner/Index.jsx:157` حرفيًا: «استخدم أي تطبيق قارئ QR ثم انسخ الكود والصقه هنا» — UX كارثي لموظف استقبال | **M** (ويوم واحد لو Capacitor) |
| 45 | **صفحة حذف الحساب** + راوت `DELETE /account` | إلزامي لمتاجر التطبيقات (Apple 5.1.1(v) + Google Play Data Deletion) — **رفض مضمون بدونها** | **M** |
| 46 | **sitemap + robots + صفحات أخطاء مبرندة** | | **S** |

---

### 3.3 🟢 نمو — بعد الاستقرار

| # | البند | الجهد |
|---|---|---|
| 47 | **بنّاء «صاحب السعادة» الذاتي الفوري** (§8/§18) — اللي متنفّذ هو النموذج القديم (باقات جاهزة) | **XL** |
| 48 | **مسار «أحجز عربية» بـ geolocation** (§6 خيار 3: haversine بلا API خارجي) — الميزة موجودة في المطاعم والتوصيل وغايبة عن العربيات | **L** |
| 49 | **بحث موحّد ومقارنة** (§12) — دلوقتي البحث موزّع كـ `?q=` على كل قائمة لوحدها | **L** |
| 50 | **ردّ المزوّد على التقييمات** (§15) | **M** |
| 51 | **تصدير CSV/Excel + تقارير + تسويات** (§15/§15.1) | **M** |
| 52 | **إحياء `amenities`** (جدول ميت تمامًا: 0 صف، مفيش seeder، مفيش CRUD) | **M** |
| 53 | **صفحة تفاصيل لباقات صاحب السعادة** | **S** |
| 54 | **PWA كامل + إشعارات Push** | **L** |
| 55 | **تطبيق Capacitor + نشر المتجرين** | **XL** |
| 56 | **ترقية Inertia v2** (Deferred / WhenVisible / prefetch) | **L** |

---

## 4. خطة وضع الموبايل (شبه الأبليكشن)

> **الهدف:** إن المستخدم يفتح `mahfolmakfol.com` من تليفونه ويحس إنه فتح أبليكشن، مش موقع.
> **الحقيقة الحاكمة:** الأولويات 4.1–4.4 (القشرة + الانتقالات + الإدخال + الأداء) هي اللي بتدّي **80% من الإحساس**. الـ PWA والـ Push مهمين لكنهم **مش** اللي بيخلّي الموقع يحسّ كأبليكشن.

### 4.0 التشخيص — الموبايل حاليًا مش موجود فعليًا

| الملاحظة | الدليل |
|---|---|
| صفر تنقّل على الموبايل | `resources/js/Layouts/SiteLayout.jsx` — الـ `<nav>` عليها `hidden lg:flex` والشريط العلوي `hidden md:block`. اللي فاضل: لوجو + زرّين `size="sm"` (~32px، أقل من حد اللمس 44px) |
| الهيدر طويل جدًا | `h-[74px]` ثابت على كل المقاسات |
| كل صفحة بتعيد بناء القشرة | كل صفحة من الـ 39 بتستورد `SiteLayout` وتلفّ نفسها بيه → أي tab bar هيتعمل mount/unmount في كل تنقّل → **مستحيل تعمل انتقال ناعم** |
| iOS بيعمل zoom إجباري عند الـ focus | `Components/ui/input.jsx` بـ `text-sm` (14px) — أي حقل < 16px بيجبر iOS على zoom مش بيرجع منه |
| مفيش safe-area | مفيش `viewport-fit=cover` في `resources/views/app.blade.php` |
| مكوّنات جاهزة ومهملة | `Components/ui/sheet.jsx` (صفر استخدام) · `skeleton.jsx` (صفر استخدام) · `date-picker.jsx` + `calendar.jsx` (صفر استخدام) |
| مفيش أي أيقونة مربعة في المشروع | `public/assets/img/logo.png` أبعاده **251×65** (wordmark) وبيتعلن في `app.blade.php` كـ `sizes="192x192"` و`apple-touch-icon` — غلط تقني وهيمنع الـ installability |
| الخطوط أثقل بند على 3G | `app.blade.php` بيحمّل Cairo (5 أوزان) + El Messiri (3 أوزان) من Google Fonts = طرف ثالث + DNS + TLS + ~8 ملفات woff2 عربية |

---

### 4.1 المرحلة أ — القشرة (Shell)

#### خطوة 1 · تحويل `SiteLayout` لـ Persistent Layout ⚠️ شرط مسبق لكل حاجة تانية
**الملف:** `resources/js/app.jsx`

```jsx
import SiteLayout from '@/Layouts/SiteLayout';

resolve: async (name) => {
    const mod = await resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx'));
    const Page = mod.default;
    const isPanel = /^(Admin|Vendor|Support)\//.test(name);
    if (!isPanel && Page.layout === undefined) {
        Page.layout = (page) => <SiteLayout>{page}</SiteLayout>;
    }
    return mod;
},
```

بعدها: شيل `import SiteLayout` وفكّ اللفّة `<SiteLayout active="...">…</SiteLayout>` من الـ **~28 صفحة عامة** (`Home.jsx`, `Tours/*`, `Hotels/*`, `Restaurants/*`, `Cars/*`, `Buses/*`, `Delivery/*`, `Sahb/*`, `Account/*`, `Auth/*`, `Booking/*`, `Providers/Show.jsx`, `Provider/Register.jsx`, `Page.jsx`). صفحات `Admin/*` و`Vendor/*` و`Support/*` تفضل على `AdminLayout` زي ما هي.

في `SiteLayout.jsx` شيل الـ prop `active` واشتقّه من الـ URL:
```js
const path = usePage().url.split('?')[0];
const isActive = path === n.href || (n.href !== '/' && path.startsWith(n.href));
```

**التحقق:** `php artisan app:smoke-test-e2e` (`app/Console/Commands/SmokeTestE2E.php`) + مرور يدوي على كل راوت في `routes/web.php`.
**الجهد:** 3–4 ساعات · **يتعمل في فرع منفصل**

#### خطوة 2 · safe-area + منع الـ zoom + أساسيات اللمس

**`resources/views/app.blade.php`:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="محفول مكفول">
```
وغيّر `theme-color` من `#363677` لـ `#FFFFFF` — الهيدر `bg-white/95`، والـ navy هيبان كشريط غريب فوقه في وضع standalone.

**`tailwind.config.js` → `theme.extend.spacing`:**
```js
'safe-b': 'env(safe-area-inset-bottom)',
'safe-t': 'env(safe-area-inset-top)',
'tabbar': 'calc(64px + env(safe-area-inset-bottom))',
```

**`resources/css/app.css`:**
```css
html { -webkit-text-size-adjust: 100%; }
body { overscroll-behavior-y: contain; }
button, a, [role=button] { touch-action: manipulation; }
@media (max-width: 767px) { input, select, textarea { font-size: 16px !important; } }
@media (hover: none) { .group:hover { transform: none; } }
```
وفي `ui/card.jsx` و`ui/button.jsx` لفّ الـ hover: `hover:-translate-y-1` → `[@media(hover:hover)]:hover:-translate-y-1`.

**الجهد:** 1–1.5 ساعة · **مستقلة — بالتوازي مع خطوة 1**

#### خطوة 3 · شريط التبويب السفلي (Bottom Tabs)
**ملف جديد:** `resources/js/Components/mobile/BottomTabBar.jsx` — يتركّب مرة واحدة جوّه `SiteLayout.jsx`.

**التبويبات الخمسة:** الرئيسية `/` · الرحلات `/tours` · الفنادق `/hotels` · حجوزاتي `/account` · المزيد (يفتح sheet)

```jsx
<nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-black/[.07] bg-white/95 pb-safe-b backdrop-blur lg:hidden">
  {/* كل تبويب: min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold */}
</nav>
```

- الأيقونات من `lucide-react` (`Plane`, `BedDouble`, `Ticket`, `Menu`) — Vite بيقسّمها لـ chunks منفصلة.
- **النشط:** `text-coral-deep` + مؤشر علوي `absolute inset-x-6 top-0 h-0.5 rounded-full bg-gradient-to-r from-coral to-coral-deep` (نفس نمط الـ `after:` الموجود في `SiteLayout`).
- لو `!auth?.user` → «حجوزاتي» توجّه لـ `/login`.
- **إخفاء التاب بار** على `/checkout/*` و`/payment/*` (وضع تركيز) وعلى `/admin|/vendor|/support`.
- **Badge للحجوزات النشطة** — في `app/Http/Middleware/HandleInertiaRequests.php@share`:
```php
'nav' => [
    'active_bookings' => fn () => $request->user()
        ? $request->user()->bookings()->whereIn('status', ['confirmed','pending'])->count() : 0,
],
```
- في `SiteLayout.jsx`: `<main className="pb-tabbar lg:pb-0">`.

**الجهد:** 3–4 ساعات · **التبعية:** 1 + 2

#### خطوة 4 · سلوك الهيدر على الموبايل
**الملف:** `resources/js/Layouts/SiteLayout.jsx`

1. **الارتفاع:** `h-[74px]` → `h-14 lg:h-[74px]`.
2. **إخفاء عند النزول / إظهار عند الطلوع** — hook جديد `Components/mobile/useHideOnScroll.js`: يبدأ بعد 80px، threshold 8px لمنع الرفرفة، `transition-transform duration-200 -translate-y-full`. **يتعطّل لما يكون في sheet مفتوح** (Radix بيحطّ `data-scroll-locked` على الـ body).
3. **زر رجوع سياقي — إجباري مش اختياري.** في iOS standalone **مفيش إيماءة رجوع من حافة الشاشة**. لو `path !== '/'` اعرض `<ChevronRight/>` (في RTL الرجوع لليمين) بـ `h-11 w-11` ينادي `window.history.back()`.
4. **عنوان الصفحة** بدل اللوجو الكبير على الصفحات الداخلية.
5. **زرّي دخول/سجّل** → زر أيقونة واحد `h-11 w-11` (`<User/>`) على الموبايل.
6. **الفوتر:** `hidden lg:block` وانقل روابط `FOOTER` جوّه sheet «المزيد» — **مع إبقاء روابط الشروط/الخصوصية/الاسترداد ظاهرة فوق التاب بار** (متطلب قانوني وبوابات الدفع بتراجعه).

**الجهد:** 3 ساعات · **التبعية:** 1 + 3

#### خطوة 5 · Sheet «المزيد» + إحياء `sheet.jsx`
**الملف:** `resources/js/Components/ui/sheet.jsx` (موجود، صفر استخدام)

- في `sheetVariants` variant `bottom`: `rounded-t-section max-h-[85vh] overflow-y-auto pb-safe-b`.
- زر الإغلاق `h-9 w-9` → `h-11 w-11`.
- **مقبض سحب (drag handle):** `<div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-sandline" />` مع `onTouchStart/Move/End`: `translateY` مع الإصبع، ولو تجاوز 80px أو السرعة > 0.5px/ms → قفل. (Radix Dialog مش بيدعم swipe-to-dismiss أصلًا.)

**ملف جديد:** `resources/js/Components/mobile/MoreSheet.jsx` — الخدمات الباقية من `NAV` (مطاعم، سيارات، باصات*، توصيل*، صاحب السعادة) بصفوف `min-h-[52px]`، روابط `FOOTER` كـ accordions، «سجّل كمقدم خدمة» و«دخول شريك»، تسجيل خروج، وزر «ثبّت التطبيق».
*(الباصات والتوصيل مخفيين بالـ feature flag لحد ما يجهزوا — بند 29.)*

**الجهد:** 2–3 ساعات · **التبعية:** 3

---

### 4.2 المرحلة ب — الإحساس (الانتقالات والإيماءات)

#### خطوة 6 · انتقالات صفحات شبه أصلية
`tailwindcss-animate` **مثبّت بالفعل** في `tailwind.config.js` ومستخدم في `Home.jsx` و`party-size.jsx`.

في `SiteLayout.jsx`:
```jsx
const path = usePage().url.split('?')[0];
<main key={path} className="animate-in fade-in-0 slide-in-from-left-3 duration-200 ease-out lg:animate-none">
```
**في RTL:** التقدّم للأمام = دخول من اليسار، الرجوع = من اليمين. hook صغير يمسك الاتجاه: `router.on('before')` = forward، `popstate` = back.

**شريط التقدّم** (آخر `resources/js/app.jsx`): اللون الحالي `#F5764E` **مش من الباليتة** — الـ coral الحقيقي `#FC7660` و`coral-deep` `#EA4B3B`. غيّره لـ `#EA4B3B` + `delay: 150` (يمنع الومضة في التنقلات السريعة) + `showSpinner: false`.

**استعادة الـ scroll:** فلاتر القوائم بتستخدم `preserveState: true, replace: true` بس (`Tours/Index.jsx:29`) — **ضيف `preserveScroll: true`**.

**View Transitions API:** Inertia v1 مش بيدّي hook حوالين تبديل الـ DOM — سيبه للـ CSS. لو محتاجه فعليًا، ده أحد أسباب الترقية لـ Inertia v2.

**الجهد:** 2–3 ساعات

#### خطوة 7 · Skeletons ومؤشرات تحميل
`resources/js/Components/ui/skeleton.jsx` موجود ومهمل.

1. hook `Components/mobile/useNavigating.js` على `router.on('start'|'finish')`.
2. `Components/mobile/skeletons.jsx` فيه `ServiceCardSkeleton` **يطابق أبعاد `ui/card.jsx` بالظبط** (`CardMedia` بـ `aspect-[4/3]` و`CardBody` بـ `p-4`) → صفر CLS.
3. استخدمه في `Tours/Index.jsx`, `Hotels/Index.jsx`, `Cars/Index.jsx`, `Restaurants/Index.jsx` — دلوقتي الفلاتر بـ `preserveState` فالمستخدم بيشوف **نتايج قديمة بدون أي مؤشر**.
4. **مكسب أداء مجاني:** حوّل الفلاتر لـ partial reloads:
```js
router.get('/tours', {...}, { only: ['tours'], preserveState: true, preserveScroll: true, replace: true })
```
ده بيوفّر إعادة إرسال `locations` + `filters` + الـ shared props (`wishlist` فيها DB query) في **كل نقرة فلتر**.

**الجهد:** 4–5 ساعات

#### خطوة 8 · Bottom sheets بدل المودالات
**التكلفة شبه صفر** لأن `Components/Modal.jsx` مستخدم في 3 صفحات بس.

**(أ) `Components/Modal.jsx`** — خليه responsive بنفس الـ API الخارجي (`open onClose icon title subtitle`) → **صفر تعديل** في `Home.jsx` و`Account/Addresses.jsx` و`Admin/Approvals/Index.jsx`:
```jsx
const isDesktop = useMediaQuery('(min-width: 768px)');
return isDesktop ? <Dialog>…</Dialog>
  : <Sheet><SheetContent side="bottom" className="rounded-t-section max-h-[85vh] overflow-y-auto pb-safe-b">…</SheetContent></Sheet>;
```

**(ب) فلاتر القوائم** — `Tours/Index.jsx` فيه `<aside class="… lg:sticky lg:top-[92px]">` بيتكدّس فوق النتايج على الموبايل (المستخدم لازم يعدّي فلتر طويل قبل أول رحلة):
- الـ `<aside>` تبقى `hidden lg:block`.
- شريط ثابت فوق التاب بار: `fixed inset-x-0 bottom-tabbar z-40 flex gap-2 border-t bg-white/95 p-3 backdrop-blur lg:hidden` فيه «فلترة (٣)» و«ترتيب».
- نفس المحتوى جوّه `<Sheet side="bottom">` مع زر «عرض ٢٤ نتيجة» ثابت أسفل.
- كرّر في `Hotels/Index.jsx`, `Cars/Index.jsx`, `Restaurants/Index.jsx`.

**(ج) ويدجت الحجز في صفحات التفاصيل** (`Tours/Show.jsx`, `Hotels/Show.jsx`, `Cars/Show.jsx`, `Restaurants/Show.jsx`): شريط CTA ثابت (السعر + «احجز») يفتح sheet فيه التاريخ/العدد/الغرفة.

**(د) `Booking/Checkout.jsx`** (500+ سطر): أخفِ التاب بار، شريط سفلي ثابت بالإجمالي + «تأكيد الحجز»، والضغط على الإجمالي يفتح sheet بتفاصيل السعر.

**الجهد:** 6–8 ساعات

#### خطوة 9 · سحب للتحديث (Pull to Refresh)
**ملف جديد:** `Components/mobile/PullToRefresh.jsx` يلفّ `<main>`.

- يشتغل بس لما `window.scrollY === 0` و`e.touches.length === 1`.
- مطاطية `Math.pow(delta, 0.85)`، سقف 120px، عتبة 70px.
- عند الإفلات: `router.reload({ preserveScroll: false, onFinish: reset })`.

**فخّ حقيقي:** iOS 16+ في وضع standalone عنده PTR أصلي **مش بيتعطّل** بـ `overscroll-behavior` → تحديث مزدوج. الحل:
```js
const iosStandalone = /iP(hone|ad|od)/.test(navigator.userAgent)
  && window.matchMedia('(display-mode: standalone)').matches;
```
**وعطّله كمان** لما يكون في sheet مفتوح أو المستخدم جوّه `Checkout.jsx` (تحديث في نص الحجز = كارثة).

**الجهد:** 3–4 ساعات

#### خطوة 10 · تمرير أفقي للكروت (Snap Carousels)
**ملف جديد:** `Components/mobile/SnapRow.jsx`
```jsx
<div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
```
كل ابن: `w-[78vw] max-w-[300px] shrink-0 snap-start md:w-auto`. الـ `-mx-5 px-5` بيخلي الكروت تنزف لحافة الشاشة (إحساس أصلي) مع الحفاظ على padding الـ `Wrap`.

**التطبيق:** `Home.jsx` (الوجهات، عروض مكفولة، فنادق مختارة، مطاعم، سيارات، آراء، باقات سعادة) + `Providers/Show.jsx` + `Sahb/Index.jsx`.

**فخاخ RTL (حاسمة):**
- مع `dir=rtl` الـ `overflow-x` بيبدأ من اليمين تلقائيًا — صفر كود.
- **متحسبش `scrollLeft` بإيدك** — Chrome/Firefox بيرجّعوا قيمة سالبة في RTL، Safari بيرجّع موجبة عكسية. استخدم `el.scrollBy({ left: ±width, behavior:'smooth' })` أو `child.scrollIntoView({ inline:'start', block:'nearest' })`.
- حافظ على `aspect-[4/3]` في `CardMedia` → صفر CLS.
- مؤشر نقاط بـ `IntersectionObserver` على الأبناء، مش بحساب scroll.

**الجهد:** 3–4 ساعات

---

### 4.3 المرحلة ج — الإدخال وأحجام اللمس

#### خطوة 11 · منتقيات ولوحة مفاتيح مناسبة

**(أ) `Components/ui/input.jsx`:** `h-11` → `h-12 md:h-11` و`text-sm` → `text-base md:text-sm` (بجانب قاعدة `!important` في خطوة 2 كحزام أمان).

**(ب) التواريخ — سيب `type="date"` الأصلي** (منتقي iOS/Android أسرع وأدق للّمس من أي مكتبة)، بس:
- `dir="ltr"` + `className="text-start"` على كل حقول التاريخ (iOS Safari بيرندر `type=date` بـ LTR جوّه حاوية RTL والـ placeholder بيتزحلق).
- `min` **ناقصة** في: `Home.jsx:140`, `Buses/Index.jsx:61`, `Cars/Show.jsx:103`, `Restaurants/Show.jsx:159`, `Tours/Show.jsx:222` → استخدم `ymd(new Date())` من `resources/js/lib/useAvailability.js` (الـ helper موجود ومستخدم في `Checkout.jsx`).

**(ج) مدى التواريخ للفنادق** — `Components/ui/date-picker.jsx` فيه `DateRangePicker` **ميت** بـ `numberOfMonths={2}` جوّه Popover → مستحيل يشتغل على 360px. أحييه: `numberOfMonths={isDesktop ? 2 : 1}`، رندره جوّه `<Sheet side="bottom">` على الموبايل، ولوّن الأيام المحجوزة من `useAvailability(url)` (الـ hook موجود والـ endpoint موجود: `GET /availability/hotel/{slug}`). **استورده بـ `React.lazy`** — `react-day-picker` + `date-fns` مش داخلين الباندل حاليًا وده مكسب أداء لازم تحافظ عليه.

**(د) الأعداد** — مكوّن جديد `Components/ui/stepper.jsx`: (−) [قيمة] (+) بأزرار `h-11 w-11` مع long-press repeat. في `Components/ui/party-size.jsx` استخدمه على الموبايل بدل الـ `<select>` + حقل `h-9 w-[68px]` (سطر 109–115). سيب الـ select على الديسكتوب.

**(هـ) لوحة المفاتيح الرقمية — تعديلات محدّدة:**

| الملف | الحقل | التعديل |
|---|---|---|
| `Booking/Checkout.jsx` | `customer_phone` | `type="tel" inputMode="tel" autoComplete="tel"` |
| | `customer_email` | `type="email" inputMode="email" autoComplete="email"` |
| | `customer_name` | `autoComplete="name"` |
| | `customer_national_id` | `inputMode="numeric" pattern="[0-9]*" maxLength={14}` |
| | حقول العمر (197, 489) | `inputMode="numeric"` |
| `Tours/Index.jsx:104,110` | فلتر السعر | `inputMode="numeric"` — والأفضل range slider جوّه sheet |
| `Delivery/Index.jsx:197,202` | lat/lng | `inputMode="decimal"` + زر «استخدم موقعي الحالي» |

**الجهد:** 5–6 ساعات

#### خطوة 12 · تدقيق أحجام اللمس (44px+)

| الملف | الحالي | التعديل |
|---|---|---|
| `ui/button.jsx` | `size.sm` ~32px | `min-h-11 md:min-h-0` |
| `ui/button.jsx` | `size.icon` = `h-10 w-10` | `h-11 w-11` |
| `ui/service-card.jsx` | زر المفضلة `h-9 w-9` | سيب الدايرة 36px ووسّع الـ hit area: `p-1` + `after:absolute after:-inset-1` |
| `ui/sheet.jsx` + `ui/dialog.jsx` | زر الإغلاق `h-9 w-9` | `h-11 w-11` |
| `Tours/Index.jsx:~85` | `<label class="… py-1">` + checkbox `h-[16px]` | `py-3` + `h-5 w-5` (ونفس الشيء في Hotels/Cars/Restaurants) |
| `Tours/Index.jsx` | زر «مسح» `text-[12px]` | `p-2 -m-2` (يوسّع اللمس بدون إزاحة ليّاوت) |
| `SiteLayout.jsx` | روابط الفوتر `py-1.5` | `py-3 lg:py-1.5` |
| `ui/tabs.jsx` | `TabsTrigger` = `px-4 py-2.5` | `py-3` |
| `ui/sonner.jsx` | `position="top-center"` | `bottom-center` على الموبايل مع `offset` فوق التاب بار |

> ⚠️ **كل التعديلات لازم تكون مشروطة بـ `md:`** — وإلا هتتضخّم واجهات الأدمن (`AdminLayout` + `admin.css` فيه جداول كثيفة) وشبكات الكروت على الشاشات الكبيرة.

**التحقق:** Chrome DevTools → Lighthouse → Accessibility → «Tap targets are sized appropriately».
**الجهد:** 2–3 ساعات

---

### 4.4 المرحلة د — الأداء على شبكات ضعيفة (أكبر مكسب مفرد)

#### خطوة 13 · الخطوط
`app.blade.php` بيحمّل من Google Fonts: **Cairo ×5 أوزان + El Messiri ×3 أوزان**. الخط العربي أثقل من اللاتيني بمراحل.

1. حمّلهم subset على `arabic` + `latin` (google-webfonts-helper أو `npx @fontsource/cairo`).
2. قلّل لـ **Cairo 400/700/900 + El Messiri 600/700** (راجع `font-head` في `tailwind.config.js`).
3. `public/assets/fonts/` + `@font-face` بـ `font-display: swap` في `resources/css/app.css`.
4. **احذف الـ 3 tags** (`preconnect` ×2 + `<link href=fonts.googleapis...>`).
5. `<link rel="preload" as="font" type="font/woff2" crossorigin>` للوجهين الحرجين بس.

**المكسب المتوقع على 3G: −300ms إلى −800ms على LCP.** وبونص: بقوا same-origin فالـ SW يقدر يعملهم precache.

#### خطوة 14 · الصور
- `Home.jsx` فيه `https://loremflickr.com/1600/520/...` لبوستر صاحب السعادة — **اعتماد خارجي حيّ في الإنتاج**. استبدله بـ WebP محلي.
- `decoding="async"` جنب كل `loading="lazy"` (7 ملفات: `Components/UI.jsx`, `Components/Admin/cells.jsx`, `ui/service-card.jsx`, `Home.jsx` ×3, `Account/Wishlist.jsx`, `Restaurants/Index.jsx`, `Sahb/Index.jsx`).
- **صورة الـ LCP** (أول كارت وجهة في `Home.jsx`) → `fetchpriority="high"` و**بدون** `loading="lazy"`.
- `srcset` + WebP: accessor في `Tour`/`Hotel`/`Car`/`Restaurant` يرجّع 3 مقاسات (400/800/1200). على شاشة 360px والكارت `w-[78vw]` المطلوب ~640px — بعت الأصل كامل = هدر ×4.
- حافظ على `aspect-[4/3]` في `ui/card.jsx` → صفر CLS.

#### خطوة 15 · الحزم والـ payload
الحالة أحسن من المتوقع: Vite بيعمل code-split لكل صفحة تلقائيًا، `lucide-react` بيتشجّر لأيقونة/chunk، و`chart.js`+`d3` محصورين في `Admin/Analytics/Index.jsx` و`Vendor/Earnings/Index.jsx`.

**اللي فاضل** — في `vite.config.js`:
```js
build: {
  rollupOptions: { output: { manualChunks(id) {
    if (!id.includes('node_modules')) return;
    if (/react|react-dom|@inertiajs/.test(id)) return 'vendor-core';
    if (id.includes('@radix-ui')) return 'vendor-radix';
    if (/chart\.js|react-chartjs-2|\/d3-?/.test(id)) return 'vendor-charts';
  }}},
  target: 'es2018',
}
```
- **خلّي الـ entry نحيف:** `MoreSheet` و`InstallPrompt` و`PullToRefresh` بـ `React.lazy`.
- **payload الـ Inertia:** `HandleInertiaRequests@share` بيبعت `wishlist` (مع DB query + map) في **كل رد** → `Inertia::lazy()` أو cache للـ request.
- **قِس:** `npx vite build && ls -S public/build/assets/*.js | head -10`. **الهدف: entry + vendor-core < 150KB gzip.**

#### خطوة 16 · الشبكة
`Cache-Control: public, max-age=31536000, immutable` لـ `/build/assets/*` في nginx (الأسماء مبصومة أصلًا) — حدّث `DEPLOY.md`. الـ middleware `AddLinkHeadersForPreloadedAssets` مسجّل أصلًا في `bootstrap/app.php`.

**إجمالي المرحلة د:** 8–11 ساعة

---

### 4.5 المرحلة هـ — PWA

#### خطوة 17 · الأيقونات (مفيش أيقونة مربعة في المشروع أصلًا)
`logo.png` و`logo-t.png` = **251×65**. `logo-footer.png` = 954×286 (أبيض، أعلى دقة → المصدر). `ImageMagick` متاح على الجهاز:

```bash
mkdir -p public/assets/pwa
convert -size 512x512 xc:'#363677' \
  \( public/assets/img/logo-footer.png -resize 400x \) \
  -gravity center -composite public/assets/pwa/icon-512.png
convert public/assets/pwa/icon-512.png -resize 192x192 public/assets/pwa/icon-192.png
# maskable: اللوجو أصغر — منطقة آمنة 80% (أندرويد بيقصّ الحواف)
convert -size 512x512 xc:'#363677' \
  \( public/assets/img/logo-footer.png -resize 300x \) \
  -gravity center -composite public/assets/pwa/maskable-512.png
# apple-touch-icon: 180x180 بدون شفافية (iOS بيحط خلفية سودا مكان الشفاف)
convert public/assets/pwa/icon-512.png -resize 180x180 \
  -background '#363677' -alpha remove -alpha off public/assets/pwa/apple-touch-icon.png
# badge للإشعارات (أندرويد بيعرضها monochrome)
convert public/assets/img/logo-t.png -resize 96x96 -background none -gravity center \
  -extent 96x96 -colorspace gray -threshold 60% public/assets/pwa/badge-96.png
```
ثم استبدل الـ 4 سطور `<link rel="icon">`/`apple-touch-icon` في `app.blade.php`. راجع الـ maskable على maskable.app/editor.

**الجهد:** 1 ساعة

#### خطوة 18 · `public/manifest.webmanifest`
```json
{
  "id": "/",
  "name": "محفول مكفول — رحلتك محفولة مكفولة",
  "short_name": "محفول مكفول",
  "description": "رحلات، فنادق، مطاعم، سيارات وتوصيل بسعر مكفول",
  "lang": "ar", "dir": "rtl",
  "start_url": "/?source=pwa", "scope": "/",
  "display": "standalone", "display_override": ["standalone","minimal-ui"],
  "orientation": "portrait",
  "background_color": "#FBF7F0",
  "theme_color": "#FFFFFF",
  "icons": [
    {"src":"/assets/pwa/icon-192.png","sizes":"192x192","type":"image/png"},
    {"src":"/assets/pwa/icon-512.png","sizes":"512x512","type":"image/png"},
    {"src":"/assets/pwa/maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
  ],
  "shortcuts": [
    {"name":"حجوزاتي","url":"/account"},
    {"name":"الرحلات","url":"/tours"},
    {"name":"الفنادق","url":"/hotels"}
  ],
  "categories": ["travel","lifestyle"]
}
```
**MIME:** nginx مش بيعرف `.webmanifest` افتراضيًا → `types { application/manifest+json webmanifest; }` (أو سمّيه `manifest.json` وتتفادى الموضوع).

**شاشة البداية:**
- **أندرويد/Chrome:** بيولّدها تلقائيًا من `name` + `background_color` + الأيقونة 512 — صفر شغل.
- **iOS:** بيتجاهل `background_color`. من iOS 15+ بيولّد شاشة من `apple-touch-icon` + خلفية بيضا لو `apple-mobile-web-app-capable=yes` موجودة. **التوصية: اكتفِ بالمولّد تلقائيًا** — الـ `apple-touch-startup-image` محتاج ~12 سطر لكل مقاس آيفون والصيانة مؤلمة مع كل موديل جديد، والـ ROI ضعيف.

**التحقق:** DevTools → Application → Manifest → لازم يظهر «Installable».
**الجهد:** 1.5–2 ساعة

#### خطوة 19 · Service Worker (`public/sw.js` مكتوب بإيد)

> **ليه مش `vite-plugin-pwa`:** `laravel-vite-plugin` بيخرج على `public/build/` → الـ SW هيتولد هناك و`scope` هيبقى `/build/` مش `/`. الالتفاف حواليه أوسخ من كتابة ~150 سطر.

| المورد | الاستراتيجية | الكاش |
|---|---|---|
| `/build/assets/*` (مبصوم) | CacheFirst | `mk-static-{BUILD}` |
| خطوط `/assets/fonts/*` | CacheFirst سنة | `mk-fonts` |
| صور (`/storage/*`, `/assets/img/*`) | CacheFirst + سقف 60 LRU | `mk-img` |
| تنقّلات HTML | NetworkFirst timeout 3s → كاش → `/offline.html` | `mk-pages` |
| ردود Inertia (`X-Inertia: true`) | NetworkFirst → كاش | `mk-inertia` |
| POST · `/checkout` · `/payment/*` · `/login` · `/admin` · `/vendor` · `/support` | **Network only — ممنوع الكاش** | — |

**3 فخاخ بالاسم:**
1. **`Vary: X-Inertia`** — رد Inertia بيبقى JSON لنفس الـ URL بتاع الـ HTML. لو خزّنتهم بنفس المفتاح، أول تحميل offline هيرجّع JSON لطلب document → **شاشة بيضا**. الحل: مفتاح مختلف صراحةً (`new Request(url + '#inertia')`).
2. **إصدار الأصول بعد الديبلوي** — `HandleInertiaRequests::version()` بيرجّع hash الـ Vite manifest؛ HTML مكاشّ قديم بيشاور على أصول اتمسحت → شاشة بيضا. الحل: `scripts/stamp-sw.mjs` يقرأ `public/build/manifest.json`، يحسب hash، يكتبه في `const BUILD = '...'` جوّه `sw.js`، ويحقن قائمة precache. وفي `package.json`: `"build": "vite build && node scripts/stamp-sw.mjs"`. وفي `activate` امسح أي كاش مش بينتهي بالـ BUILD الحالي.
3. **كاش الـ SW نفسه** — `location = /sw.js { add_header Cache-Control "no-cache"; }` في nginx. (`public/.htaccess` عنده `RewriteCond %{REQUEST_FILENAME} !-f` فالملف بيتخدم كملف حقيقي — مفيش تعديل rewrite.)

**`public/offline.html`** — HTML مستقل تمامًا (مش Inertia — مفيش SSR فالـ Inertia مش هترندر بدون JSON)، RTL، ألوان inline (`#FBF7F0` / `#363677` / `#EA4B3B`)، «مفيش نت دلوقتي»، زر «حاول تاني»، وقائمة الصفحات المحفوظة من `caches.open('mk-pages').keys()`.

**الصفحات اللي تستاهل offline بالأولوية:**
1. `/booking/{code}` — **الأهم**: فيها كود الدخول/QR والعميل محتاجها عند بوابة الفندق من غير شبكة (بعد ما الـ QR يتولّد محليًا — بند 12).
2. `/account`
3. `/p/*` (الصفحات الثابتة)

**التسجيل** (آخر `app.jsx`):
```js
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
```
شرط `PROD` **إجباري** — من غيره الـ SW هيسمّم `npm run dev`.

**تسجيل الخروج:** بعد النجاح ابعت `navigator.serviceWorker.controller?.postMessage({type:'CLEAR_PRIVATE'})` والـ SW يمسح `mk-pages` + `mk-inertia` — **إجباري على تليفون مشترك**.

**الجهد:** 8–12 ساعة

#### خطوة 20 · التحديثات والتثبيت

**(أ) إشعار التحديث** — `Components/mobile/useSwUpdate.js`:
```js
reg.addEventListener('updatefound', () => {
  const nw = reg.installing;
  nw.addEventListener('statechange', () => {
    if (nw.state === 'installed' && navigator.serviceWorker.controller) {
      toast('فيه نسخة جديدة من التطبيق', {
        duration: Infinity,
        action: { label: 'حدّث', onClick: () => nw.postMessage({ type: 'SKIP_WAITING' }) },
      });
    }
  });
});
navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
```
`sonner` جاهز و`<Toaster/>` مركّب في `SiteLayout`.
في `sw.js`: `skipWaiting()` **بس عند استقبال الرسالة** — لو تلقائي هتقطع مستخدم في نص `Checkout.jsx`.
فحص دوري: `reg.update()` عند `visibilitychange` + كل 60 دقيقة.

**(ب) بانر التثبيت** — `Components/mobile/InstallPrompt.jsx`:
- **أندرويد/Chrome/Edge:** امسك `beforeinstallprompt`، `preventDefault()`، واعرض بانر **فوق التاب بار** بعد ما المستخدم يتصفّح صفحتين (`sessionStorage`).
- **iOS مفيهاش `beforeinstallprompt` خالص** → اكتشف `/iP(hone|ad|od)/.test(ua) && !navigator.standalone` واعرض sheet مصوّر: «اضغط زر المشاركة ⬆️ ← إضافة إلى الشاشة الرئيسية».
- **مهم جدًا:** على iOS التثبيت شغّال من **Safari بس**. نسبة كبيرة من الترافيك المصري بتيجي من in-app browsers (فيسبوك/إنستجرام/مسنجر) — اكتشفهم واعرض «افتح في Safari الأول» بدل بانر مش هيعمل حاجة.
- تبريد الرفض: `localStorage['mk_a2hs_dismissed']` 14 يوم. و`appinstalled` → امسح البانر نهائيًا.
- زر «ثبّت التطبيق» دايم جوّه `MoreSheet`.

**الجهد:** 3–4 ساعات

---

### 4.6 المرحلة و — الإشعارات (Web Push)

**Backend:**
1. `composer require minishlink/web-push`
2. migration `push_subscriptions`: `user_id` (FK nullable index) · `endpoint` (text) · **`endpoint_hash` (char 64, unique)** — الـ endpoint بيعدّي 191 حرف فمينفعش يتفهرس مباشرة في MySQL utf8mb4 · `p256dh` · `auth` · `user_agent` · `last_used_at`.
3. `App\Models\PushSubscription` + `User::pushSubscriptions()`.
4. `App\Services\WebPushService` **على نفس نمط `app/Services/WhatsAppService.php`** — driver قابل للتبديل: `PUSH_DRIVER=log` محليًا و`vapid` في الإنتاج. أضف `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` في `.env` + `.env.production.example` + `config/services.php`.
5. **نقطة الدمج:** `app/Services/BookingNotifier.php@confirmed()` — قناة ثالثة جنب الإيميل والواتساب، **بنفس انضباط الـ try/catch** (فشل Push ممنوع يكسر الحجز).
6. مسارات جوّه `Route::middleware('auth')`:
```php
Route::post('/push/subscribe', [PushController::class,'store'])->middleware('throttle:actions');
Route::delete('/push/unsubscribe', [PushController::class,'destroy'])->middleware('throttle:actions');
```
(الـ limiter `actions` معرّف أصلًا في `AppServiceProvider`.)
7. **نظافة إجبارية:** رد `404`/`410` من خدمة الدفع → امسح الصف فورًا.
8. `HandleInertiaRequests@share`: `'push' => ['vapid' => config('services.webpush.public_key')]`.
9. ⚠️ **الطابور:** كل إرسال = طلب HTTP حاجز لكل اشتراك. `QUEUE_CONNECTION=database` موجود في `.env` لكن `DEPLOY.md` **بيقول صراحةً «المنصة مش محتاجة queue worker»** — الجملة دي هتبقى غلط. لازم `queue:work` كـ systemd unit + تحديث `DEPLOY.md`.

**Frontend:** `Components/mobile/usePush.js` + زر «فعّل إشعارات الحجز» في `Account/Dashboard.jsx`.
⚠️ **`Notification.requestPermission()` لازم من إيماءة مستخدم حقيقية** — عند التحميل كروم بيعاقب الموقع و iOS بيرمي `NotAllowedError`.

في `sw.js`: handler `push` → `showNotification(title, { body, icon:'/assets/pwa/icon-192.png', badge:'/assets/pwa/badge-96.png', dir:'rtl', lang:'ar', tag, renotify:true, data:{url} })`، وhandler `notificationclick` → دوّر على client مفتوح و`focus()`، وإلا `clients.openWindow(url)`.

**حدود iOS — اذكرها لصاحب المشروع صراحةً:**

| القيد | الأثر |
|---|---|
| iOS/iPadOS **16.4+** فقط | شريحة كبيرة من الأجهزة القديمة خارج التغطية |
| **بيشتغل فقط لو الموقع متثبّت على الشاشة الرئيسية** | تبويب Safari عادي = **صفر إشعارات** |
| الإذن لازم من إيماءة مباشرة | وإلا exception |
| مفيش silent/background push ولا `actions` | إشعارات بسيطة بس |
| `badge` في الإشعار متجاهَل | بادج الأيقونة محتاج `navigator.setAppBadge()` |
| **iOS بيمسح تخزين الـ PWA بعد ~7 أيام خمول** | الاشتراك بيموت وكاش الأوفلاين بيروح → لازم إعادة اشتراك تلقائية عند كل فتح |

**الخلاصة العملية:** `WhatsAppService` يفضل **القناة الأساسية** للمستخدم المصري؛ الـ Push إضافة قوية لأندرويد + iOS المثبَّت، **مش بديل**.

**الجهد:** 10–14 ساعة

---

### 4.7 جدول ملخص لخطة الموبايل

| المرحلة | الخطوات | الجهد | الأثر على «إحساس الأبليكشن» |
|---|---|---|---|
| أ · القشرة | 1–5 | ~12 ساعة | ⭐⭐⭐⭐⭐ |
| ب · الإحساس | 6–10 | ~20 ساعة | ⭐⭐⭐⭐⭐ |
| ج · الإدخال واللمس | 11–12 | ~8 ساعات | ⭐⭐⭐⭐ |
| د · الأداء | 13–16 | ~10 ساعات | ⭐⭐⭐⭐ |
| هـ · PWA | 17–20 | ~16 ساعة | ⭐⭐⭐ |
| و · Push | — | ~12 ساعة | ⭐⭐ |
| **الإجمالي** | | **~78 ساعة ≈ 2.5–3 أسابيع لمطور واحد** | |

---

## 5. مشروع الأبليكشن الجوال

### 5.1 المقارنة الكاملة بين الخيارات

#### الحقائق الحاكمة من الكود (مش من العموميات)

| الحقيقة | الدليل | الأثر على القرار |
|---|---|---|
| **مفيش أي طبقة API** | `composer.json` مفيهوش `laravel/sanctum` ولا passport ولا jwt. **مفيش `routes/api.php` أصلًا.** الـ 161 راوت كلها في `routes/web.php` بترجّع `Inertia::render` وبتعتمد على session cookie (`config/session.php` → `same_site=lax`, driver=database) | RN/Flutter لازم يبنوا API كامل من الصفر **قبل أول شاشة** = 3–4 أسابيع |
| **8,049 سطر JSX ملهاش قيمة إعادة استخدام في RN/Flutter** | 6,252 سطر Pages + 1,431 سطر Components. الـ 15 مكوّن في `Components/ui/` كلهم **Radix (DOM-only)**. الـ theme المخصص (`rounded-card`, `bg-beige/40`, `text-royal`) لازم يتعاد. `chart.js`+`d3` في `Admin/Analytics/Index.jsx` ملهمش مقابل | RN = **إعادة كتابة 100%** للواجهة · Capacitor = **0%** |
| **المنطق التجاري كله في PHP على السيرفر** | ~9,050 سطر في `app/Services/**` (Availability, Booking, Payments, Personalization, ValueScore, ProviderRating) | الميزة الكبرى المعتادة لـ RN (monorepo مشترك) **غير موجودة هنا** |
| **الدفع عند الوصول أساسي** | `BookingController.php:148` بيقبل `['card','wallet','on_arrival']` و`:403` بيأكّد فورًا لو `on_arrival`. `Checkout.jsx:67` بيختار `on_arrival` افتراضيًا للحجز الجماعي | الغالبية العظمى من المعاملات **مش بتلمس بوابة دفع داخل التطبيق أصلًا** |
| **صفر بنية Push حاليًا** | `BookingNotifier` بيبعت إيميل + واتساب بس. مفيش FCM، مفيش جدول device tokens | تكلفة الـ Push **واحدة في كل الخيارات** → مش عامل تفاضل |
| **الخرائط: العبء أخف مما تتصور** | مفيش أي مكتبة خرائط في `package.json`. الموقع بيتستخدم في مكانين بـ `navigator.geolocation`: `Delivery/Index.jsx:36` و`Restaurants/Index.jsx:23`، والحساب haversine على السيرفر (`DeliveryController.php:26-29`) | مفيش background location → **بيوفّر Google Play Location Permissions Declaration** كاملة |
| **أكبر فجوة أصلية حقيقية: ماسح QR** | `V2-BLUEPRINT.md:227,316` بيقولوا «مسح QR الدخول **بكاميرا الموبايل**». الواقع في `Vendor/Scanner/Index.jsx` **إدخال يدوي بالكيبورد**، والنصيحة في السطر ~157: «انسخ الكود والصقه هنا» | Capacitor بيحلّها في **يوم واحد** فوق نفس الـ endpoint الموجود `POST /vendor/scanner/verify` |
| **RTL** | `app.blade.php:2` فيه `dir="rtl"` والواجهة كلها على `ms-*/me-*/ps-*/pe-*` | Capacitor: شغّال كما هو · RN: `I18nManager.forceRTL` + restart إجباري + باجات مزمنة |

#### جدول المقارنة

| المعيار | **Capacitor (remote-URL)** | React Native / Expo | Flutter | PWA فقط |
|---|---|---|---|---|
| إعادة استخدام الكود | **100%** (JSX + PHP + راوتس) | ~0% للواجهة | 0% + لغة جديدة | 100% |
| يحتاج API/Sanctum؟ | **لأ** (session cookie في WebView على نفس الأصل) | **آه — 3–4 أسابيع** | **آه — 3–4 أسابيع** | لأ |
| كاميرا QR أصلية | ✅ يوم واحد (`@capacitor-mlkit/barcode-scanning`) | ✅ | ✅ | ⚠️ `BarcodeDetector` في Chrome فقط |
| Push على iOS | ✅ APNs حقيقية | ✅ | ✅ | ⚠️ 16.4+ وللمثبَّت فقط |
| RTL عربي | ✅ كما هو | ⚠️ مصدر باجات مزمن | 🟡 أنضج من RN | ✅ |
| تحديث بدون مراجعة متجر | ✅ `npm run build` + deploy | ❌ (إلا CodePush جزئيًا) | ❌ | ✅ |
| حضور في المتجرين | ✅ | ✅ | ✅ | ❌ |
| أداء الرسوم الثقيلة | 🟡 أقل من الأصلي | ✅ | ✅ | 🟡 |
| صيانة لفريق 1–2 | ✅ قاعدة واحدة | ❌ مزدوجة للأبد (+40% لكل ميزة) | ❌ مزدوجة | ✅ |
| **الزمن للإصدار الأول** | **5–7 أسابيع** | 12–16 أسبوع | 14–20 أسبوع | 3–5 أيام |

---

### 5.2 التوصية المبرَّرة

> ## ✅ **Capacitor (وضع remote-URL) فوق الويب الحالي — تطبيق واحد role-aware، أندرويد أولًا ثم iOS — مسبوقًا بأسبوع «PWA hardening» وسدّ ثغرات سياسات المتجرين.**

**التفاصيل:**
- **تطبيق واحد** (مش اتنين). الراوتنج الموجود في `routes/web.php` + middleware `EnsureRole` هو اللي بيقرر يشوف المستخدم واجهة عميل ولا لوحة `/vendor` — الكود ده موجود ومختبر، مش هنكرره.
- **6 قدرات أصلية إلزامية** (مش اختيارية — هي مبرّر وجود التطبيق أمام Apple Guideline 4.2): كاميرا QR · Push · Geolocation · Browser للدفع · Share · Splash/StatusBar.
- **PWA يتبني بالتوازي** (نفس manifest + service worker) — مش خيار بديل، ده جزء من نفس الشغل وبيخدم مستخدمي الويب.
- **ما نبنيش REST API ولا Sanctum** — مفيش داعي في المسار ده.

**ليه مش RN/Flutter:** مفيش API + إعادة كتابة 100% للواجهة + «مشاركة المنطق» وهم (المنطق كله PHP) + RTL مؤلم + صيانة مزدوجة للأبد. حرق 3–4 شهور في إعادة كتابة النهارده معناه **تجميد تطوير المنتج بالكامل** وقت ما المفروض تكتسب أول 50 منشأة.

**ليه مش PWA فقط:** صفر حضور في المتجرين = صفر اكتشاف عضوي + فقدان إشارة ثقة. ودي ضربة في قلب النموذج: اسم المنصة «محفول مكفول» ورسايل `resources/js/data/trust.jsx` كلها مبنية على **الضمان والثقة** — لمنصة سياحة داخلية جديدة، وجود التطبيق في المتجر بذاته أداة تسويقية.

**متى يتغيّر القرار؟** لو ظهرت متطلبات: تتبّع سائق real-time في الخلفية، خرائط تفاعلية ثقيلة، أو أداء 60fps في قوائم آلاف العناصر — ساعتها **تطبيق سائق منفصل بـ React Native** يتبني **بجانب** الـ Capacitor، مش بدلًا منه.

---

### 5.3 معمارية الـ API

#### 5.3.1 في المسار الموصى به (Capacitor) — أنت مش محتاج API

الـ WebView بيحمّل `https://mahfolmakfol.com` على **نفس الأصل**، فالـ session cookie شغّال زي المتصفح بالظبط. اللي محتاجه بس:

```env
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax          # كافي — نفس الأصل الحقيقي
SESSION_LIFETIME=43200          # 30 يوم — عشان المزوّد ميعملش login كل يوم على الماسح
```

والـ endpoints الجديدة الوحيدة (كلها في `routes/web.php` جوّه `middleware('auth')`، مش في API منفصل):

| Endpoint | الغرض |
|---|---|
| `POST /devices/register` | تسجيل FCM token (`device_tokens`) |
| `DELETE /devices/{token}` | إلغاء التسجيل عند الخروج |
| `GET /app/min-version` | حاجز إصدار — التطبيق يعرض «حدّث التطبيق» لو أقدم |
| `DELETE /account` | حذف الحساب (**إلزامي للمتجرين**) |

**ملاحظة:** `POST /vendor/scanner/verify` (`ScannerController.php:44-56`) **بيقبل `payload` JSON كامل أصلًا** — فماسح الكاميرا هيحقن الناتج فيه مباشرة **بدون أي تعديل سيرفر**.

#### 5.3.2 لو اخترت المسار الأصلي (RN/Flutter) — أو احتجت API عام لاحقًا

هذا هو التصميم الكامل، لكن **افهم كلفته: 3–4 أسابيع قبل أول شاشة موبايل**.

**أ. المصادقة — Sanctum**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```
- استخدم **API tokens** (مش SPA cookie mode) — الموبايل على أصل مختلف.
- `User` → `HasApiTokens`.
- **Abilities حسب الدور** (مطابقة لـ `EnsureRole`): `customer:*` · `vendor:*` · `support:*` · `admin:*`.
- انتهاء صلاحية: `config/sanctum.php` → `expiration = 43200` (30 يوم) + refresh عند كل استخدام.
- Rate limiters إعادة استخدام اللي في `AppServiceProvider.php:31-65` (`login`, `register`, `booking`, `support`, `actions`, `api`).

**ب. `routes/api.php` — الـ endpoints المطلوبة**

| المجموعة | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/login` · `register` · `forgot` · `reset` · `logout` · `GET /api/auth/me` |
| **الكتالوج** | `GET /api/tours` · `/tours/{slug}` · `/hotels` · `/hotels/{slug}` · `/restaurants` · `/restaurants/{slug}` · `/cars` · `/cars/{slug}` · `/sahb` · `/buses/routes` · `/delivery/services` — كلهم بنفس الفلاتر والـ sort الموجودين في الكونترولرز |
| **الإتاحة** ⭐ | `GET /api/availability/{type}/{slug}?from&to` — **يعيد استخدام `AvailabilityService` بالحرف** (شوف 5.3.3) |
| **الحجز** | `POST /api/holds` (يستدعي `HoldService::hold`) · `DELETE /api/holds/{token}` · `POST /api/bookings` (نفس منطق `BookingController::store`) · `GET /api/bookings` · `GET /api/bookings/{code}` · `POST /api/bookings/{code}/cancel` |
| **التسعير** | `POST /api/quote` — يرجّع breakdown من `AgePricingService` + `PaymentTimingService` + `CancellationPolicyService` قبل الالتزام |
| **الدفع** | `POST /api/payments/init` (يرجّع `checkout_url` من `PaymentManager`) — **الـ webhooks تفضل في `web.php` كما هي، مصدر الحقيقة الوحيد** |
| **الحساب** | `GET/PUT /api/account` · `DELETE /api/account` · `GET/POST/PUT/DELETE /api/addresses` · `GET/POST /api/wishlist` · `GET/POST /api/reviews` |
| **الدعم** | `GET/POST /api/support/tickets` · `GET /api/support/tickets/{code}` · `POST /api/support/tickets/{code}/reply` |
| **المزوّد** | `GET /api/vendor/bookings` · `GET /api/vendor/earnings` · `POST /api/vendor/scanner/verify` · `POST /api/vendor/scanner/mark-used` · `GET/POST /api/vendor/services/*` |
| **الأجهزة** | `POST /api/devices` · `DELETE /api/devices/{token}` |

**ج. طبقة التمثيل**
`app/Http/Resources/` — `TourResource`, `HotelResource`, `RoomTypeResource`, `BookingResource`, `EntryPassResource`… **مع `Bookables::MAP`** (`app/Support/Bookables.php`) كمصدر حقيقة واحد للأنواع، بالظبط زي ما هو مستخدم دلوقتي في الـ checkout والتقييم والمفضلة.

**د. إعادة استخدام محرك الإتاحة — القاعدة الحاكمة**

> ⚠️ **ممنوع منعًا باتًا إعادة تنفيذ منطق الإتاحة في الموبايل أو في كونترولر API جديد.**

المحرك في `app/Services/Availability/` مبني صح: `Cache::lock` + transaction + unique index على generated column. أي مسار تاني **هيتخطّى واحدة من الطبقات دي وهيسبّب حجز مزدوج**.

الشكل الصحيح:
```
API Controller  →  AvailabilityService::window()   (قراءة)
API Controller  →  HoldService::hold()             (حجز مؤقت)
API Controller  →  HoldService::confirmBooking()   (تأكيد)
```
بالظبط زي ما `AvailabilityController` و`BookingController` بيعملوا دلوقتي. الكونترولر بتاع الـ API **مجرد غلاف JSON** حول نفس الخدمات.

**نقاط إضافية إلزامية:**
- `holds:release-expired` (`routes/console.php:12`) بيشتغل كل دقيقة — الموبايل لازم يعرض **عدّاد تنازلي للـ hold** ويتعامل مع انتهاءه بأمان.
- **لازم تصلّح أولًا** أن `HoldService::confirmBooking` بترجع `false` ومحدش بيتعامل معاها (بند 17) — في الموبايل ده هيبقى «دفعت وملقيتش غرفة» بدون أي تفسير.
- **لازم تصلّح أولًا** إتاحة العربيات (بند 14) — وإلا الـ API هيصدّر نفس الثغرة.

**التقدير:** بناء طبقة API كاملة = **3–4 أسابيع** + جولة اختبارات كاملة (وتغطية الاختبارات دلوقتي ملف واحد بس).

---

### 5.4 الإشعارات (في مسار التطبيق)

| البند | التفاصيل |
|---|---|
| **الجدول** | `device_tokens`: `user_id`, `token` (unique), `platform` (ios/android/web), `last_seen_at` |
| **الخدمة** | `app/Services/PushService.php` عبر **FCM HTTP v1** (Service Account JSON — الـ legacy key اتوقف) |
| **الدمج** | `app/Services/BookingNotifier.php@confirmed()` جنب الإيميل والواتساب، بنفس نمط try/catch عشان فشل الإشعار ميكسرش الحجز |
| **الأحداث** | تأكيد الحجز · تذكير قبل الوصول بـ24 ساعة · تحديث حالة الدفع من `PaymentController@webhook` · ردّ الدعم من `SupportTicketController@reply` · (للمزوّد) حجز جديد |
| **الواجهة** | `@capacitor/push-notifications` + شاشة تفضيلات في `Account/Dashboard.jsx` |
| **سياسة الإذن** | على iOS **اطلب الإذن بعد أول حجز ناجح مش عند أول فتح** — بيرفع معدل القبول للضِعف |
| **الطابور** | لازم `queue:work` كـ systemd unit — و`DEPLOY.md` محتاج تحديث (بيقول حاليًا إن مفيش حاجة لـ queue worker) |

**الجهد:** 3 أيام

---

### 5.5 QR والكاميرا — أعلى قيمة أصلية في المشروع

**المشكلة الحالية:** `resources/js/Pages/Vendor/Scanner/Index.jsx` = حقل نصي + نصيحة حرفية للمزوّد: «استخدم أي تطبيق قارئ QR على الموبايل، ثم انسخ الكود والصقه هنا». **UX كارثي لموظف استقبال فندق.**

**الحل (يوم ونص):**
1. `npm i @capacitor-mlkit/barcode-scanning`
2. في `Vendor/Scanner/Index.jsx`: زر «افتح الكاميرا» يظهر فقط لما `Capacitor.isNativePlatform()`، يستدعي `BarcodeScanner.scan()` ويحقن الناتج مباشرة في دالة `verify()` الموجودة.
3. **صفر تعديل سيرفر** — `ScannerController@verify:44-56` بيقبل `payload` كامل ويستخرج الكود منه.
4. سيب الإدخال اليدوي كـ fallback للويب.
5. `NSCameraUsageDescription` بالعربي («لمسح تصريح دخول العميل») + `android.permission.CAMERA`.
6. **اهتزاز Haptics + صوت عند نجاح المسح** — ده اللي بيخلي موظف الاستقبال يستخدمه فعلًا.

**متطلب مسبق (بند 12):** توليد الـ QR محليًا. `app/Models/EntryPass.php:38-41` حاليًا بيبني رابط `api.qrserver.com` والـ payload الموقّع (فيه HMAC + booking_code) بيتبعت لسيرفر أجنبي في كل رندر. ثبّت `endroid/qr-code` وحوّل `getQrImageUrlAttribute` لـ `data:image/png;base64` محلي (أو راوت `GET /entry-pass/{code}/qr.png` محمي). نفس التعديل في `Booking/Confirmation.jsx:21`.
**المكسب المزدوج:** تصريح الدخول يشتغل offline (حرج — العميل واصل الفندق والشبكة ضعيفة) + تشيل «مشاركة بيانات مع طرف ثالث» من نموذج App Privacy وData Safety.

**قدرات أصلية إضافية:**
- **Geolocation** (`@capacitor/geolocation`): استبدل الاستدعاءين في `Delivery/Index.jsx:36-37` و`Restaurants/Index.jsx:23-25` بغلاف موحّد `resources/js/lib/geo.js`. أضف `ACCESS_FINE_LOCATION` فقط — **لا تضف `ACCESS_BACKGROUND_LOCATION` إطلاقًا** (بيفرض Location Permissions Declaration في Play Console مع فيديو ومراجعة إضافية بأسابيع، ومحدش محتاجه هنا). نصف يوم.
- **Share** (`@capacitor/share`) على `Tours/Show.jsx` و`Hotels/Show.jsx`.
- **Haptics** على تأكيد الحجز والمسح.

---

### 5.6 زر الرجوع العتادي في أندرويد

**المشكلة:** في Capacitor، زر الرجوع العتادي/الإيمائي في أندرويد **بيخرج من التطبيق** افتراضيًا بدل ما يرجع في تاريخ الـWebView. المستخدم بيدوس رجوع من صفحة تفاصيل فندق فيتقفل عليه التطبيق كله.

**الحل — سلّم أولويات صريح:**

```ts
import { App } from '@capacitor/app';

App.addListener('backButton', ({ canGoBack }) => {
  // 1) في sheet/dialog مفتوح؟ اقفله وبس
  if (document.querySelector('[data-state="open"][role="dialog"]')) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    return;
  }
  // 2) في drawer/filter sheet مفتوح؟ نفس الشيء (نفس السيليكتور بيغطّيه — Radix)
  // 3) في Checkout ونص إدخال؟ اعرض تأكيد قبل الخروج من الصفحة
  if (location.pathname.startsWith('/checkout')) {
    confirmLeaveCheckout(); // sheet: "متأكد إنك عايز تسيب الحجز؟ الوحدة محجوزة لك لـ X دقيقة"
    return;
  }
  // 4) فيه تاريخ؟ ارجع
  if (canGoBack && location.pathname !== '/') { window.history.back(); return; }
  // 5) على الصفحة الرئيسية → double-tap للخروج
  if (Date.now() - lastBackPress < 2000) { App.exitApp(); }
  else { lastBackPress = Date.now(); toast('اضغط رجوع تاني للخروج'); }
});
```

**نقاط لازم تتاخد بالها:**
- الـlistener ده **لازم يتسجّل مرة واحدة** في `app.jsx` بعد التأكد من `Capacitor.isNativePlatform()` — لو اتسجّل في component بيتعمل remount، هيتراكم.
- **متعملش `preventDefault` على كل حاجة** — لو الـWebView جوّه iframe الدفع، سيب السلوك الافتراضي.
- **اختبره على إيماءة الرجوع (gesture navigation)** مش زرار التنقّل التقليدي بس — السلوك مختلف على أندرويد 10+.
- في iOS: مفيش زر عتادي، بس **مفيش برضه إيماءة رجوع من الحافة في وضع standalone** — عشان كده زر الرجوع في الهيدر (§4.1 خطوة 4 بند 3) **إجباري مش اختياري**.

**الجهد:** 4 ساعات

---

### 5.7 الروابط العميقة (Deep Links / App Links / Universal Links)

#### أ. الملفات المطلوبة على السيرفر

| الملف | المسار | الشروط الحرجة |
|---|---|---|
| **Apple** | `public/.well-known/apple-app-site-association` | **بدون امتداد `.json`** · `Content-Type: application/json` · **بدون أي redirect** · **بدون auth** · HTTPS مباشر · حجم < 128KB |
| **Android** | `public/.well-known/assetlinks.json` | `Content-Type: application/json` · فيه SHA-256 fingerprint بتاع **مفتاح Play App Signing** (مش مفتاح الرفع!) |

```json
// apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.mahfolmakfol.app",
      "paths": ["/booking/*", "/tours/*", "/hotels/*", "/restaurants/*",
                "/cars/*", "/account*", "/p/*", "NOT /admin/*", "NOT /vendor/*", "*"]
    }]
  }
}
```

```json
// assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mahfolmakfol.app",
    "sha256_cert_fingerprints": ["<من Play Console → App signing>"]
  }
}]
```

⚠️ **فخّ nginx:** لازم استثناء صريح لـ`/.well-known/` من أي rewrite أو auth. وفي Laravel، الملفات دي في `public/` بتتخدم كملفات حقيقية (`RewriteCond %{REQUEST_FILENAME} !-f`) فمفيش مشكلة — **بس تأكّد إن مفيش middleware عام بيعترضها**.

⚠️ **fingerprint بتاع Play App Signing:** لو حطّيت fingerprint مفتاح الرفع بدل مفتاح التوقيع النهائي، الـApp Links **مش هتشتغل في الإنتاج** وهتشتغل في الاختبار المحلي — أشهر غلط.

#### ب. التسجيل في التطبيق

```ts
// capacitor.config.ts
server: {
  hostname: 'mahfolmakfol.com',
  androidScheme: 'https',
  allowNavigation: ['mahfolmakfol.com', '*.paymob.com', '*.fawry.com', 'atfawry.fawrystaging.com'],
}
```

```ts
// app.jsx
App.addListener('appUrlOpen', ({ url }) => {
  const path = new URL(url).pathname + new URL(url).search;
  // اقفل الـBrowser لو كان مفتوح (رجوع من الدفع)
  Browser.close().catch(() => {});
  router.visit(path);
});
```

#### ج. حالات الاستخدام الثلاثة

| الحالة | الرابط | السلوك |
|---|---|---|
| **رجوع من الدفع** | `https://mahfolmakfol.com/payment/callback?...` → redirect لـ`/booking/{code}` | يقفل الـBrowser ويفتح صفحة التأكيد **جوّه التطبيق**. شوف §5.8 |
| **مشاركة رحلة** | `https://mahfolmakfol.com/tours/{slug}` | لو التطبيق مثبّت → يفتح فيه. وإلا → المتصفح |
| **رابط إشعار** | `data.url` في الـpush payload | `notificationclick` → `clients.openWindow` (ويب) أو `router.visit` (أصلي) |

**custom scheme كاحتياطي:** سجّل `mahfol://` كـfallback للحالات اللي الـUniversal Links بتفشل فيها (بعض in-app browsers). **بس متعتمدش عليه أساسًا** — Apple بتفضّل Universal Links وبعض المتصفحات بتحجب الـschemes.

**الاختبار:**
- Android: `adb shell am start -a android.intent.action.VIEW -d "https://mahfolmakfol.com/tours/xxx"`
- iOS: تحقق من AASA بـ `https://app-site-association.cdn-apple.com/a/v1/mahfolmakfol.com`
- **اختبر من واتساب وفيسبوك تحديدًا** — دول اللي هيتشارك فيهم الروابط فعليًا في مصر.

**الجهد:** يوم واحد (نصفه debugging لملفات الـwell-known)

---

### 5.8 مسار الدفع داخل التطبيق

#### أ. لماذا هذا صعب

`BookingController.php:428` بيعمل `Inertia::location($checkoutUrl)` لصفحة Paymob. في المتصفح ده شغّال عادي. في التطبيق فيه **ثلاث مشاكل متراكبة**:

1. **صفحات 3-D Secure البنكية بتكسر داخل WebView** — بتستخدم popups و`window.open` و redirects متعددة بين نطاقات مختلفة (البنك، الشبكة، البوابة). WebView افتراضي مش بيتعامل معاها كويس.
2. **لو فتحتها في `@capacitor/browser`** (SFSafariViewController على iOS / Custom Tabs على أندرويد): الـ**session cookie مختلفة عن الـWebView**. صفحة الـcallback بترجع للمتصفح النظامي، والمستخدم بيلاقي نفسه في Safari مش في التطبيق.
3. **الـcallback نفسه مكسور أصلًا** (بند 3 — 419 على POST). لازم يتصلّح قبل أي كلام عن التطبيق.

#### ب. المخطط الموصى به

```
 [التطبيق / WebView]
        │  المستخدم دوس "ادفع"
        ▼
 POST /checkout ──► إنشاء Booking + Hold + طلب checkout_url من PaymentManager
        │
        ▼
 الرد فيه checkout_url  ──► الواجهة تكتشف isNativePlatform()
        │
        ├─── native: Browser.open({ url: checkoutUrl, presentationStyle: 'popover' })
        │        │
        │        ▼
        │   [SFSafariViewController / Chrome Custom Tab]
        │        │  3-D Secure + إدخال البطاقة
        │        ▼
        │   البوابة تعمل redirect لـ redirection_url =
        │   https://mahfolmakfol.com/payment/callback?...
        │        │
        │        ▼
        │   السيرفر يتحقق من HMAC ويعمل redirect 302 لـ
        │   https://mahfolmakfol.com/booking/{code}
        │        │
        │        ▼
        │   Universal Link / App Link يمسك الرابط ده
        │        │
        │        ▼
        │   appUrlOpen listener → Browser.close() + router.visit('/booking/{code}')
        │
        └─── web: Inertia::location(checkoutUrl)  ← السلوك الحالي بلا تغيير
                 │
                 ▼
            نفس مسار الـcallback

 [بالتوازي — المصدر الموثوق دايمًا]
 البوابة ──► POST /payment/webhook ──► verifyHmac ──► markPaid() ──► confirmBooking()
```

#### ج. القواعد الحاكمة

| القاعدة | التفصيل |
|---|---|
| **الـwebhook هو مصدر الحقيقة الوحيد** | **لا تلمس `PaymentController@webhook`.** الـcallback مجرد تجربة مستخدم؛ لو التطبيق اتقفل أو الشبكة قطعت، الـwebhook بيأكّد الحجز بره. ده مطبّق صح حاليًا (`markPaid` idempotent — بيرجع فورًا لو `payment_status === 'paid'`) |
| **صفحة التأكيد لازم تتحمّل التأخير** | الـwebhook ممكن يوصل قبل أو بعد الـcallback. `Booking/Confirmation.jsx` لازم تعرض حالة «جارٍ تأكيد الدفع…» مع polling كل 3 ثواني لمدة 60 ثانية، وبعدين رسالة «هنبعتلك تأكيد أول ما يتم» |
| **`allowNavigation` محصورة** | `capacitor.config.ts` → نطاقك + Paymob + Fawry **بس**. أي نطاق تاني يتفتح في المتصفح الخارجي (`@capacitor/browser`) مش جوّه الـWebView |
| **الحالة الحرجة: المستخدم قفل الـBrowser** | لازم `HoldService` يفضّل ماسك الحجز لحد انتهاء المهلة. عند رجوع التطبيق للمقدمة (`App.addListener('appStateChange')`) → استعلم عن حالة الحجز (`GET /booking/{code}` بـpartial reload) واعرض النتيجة |
| **الحالة الحرجة: دفع نجح والتطبيق اتقفل** | الـwebhook بيأكّد + إشعار push «تم تأكيد حجزك» + الحجز بيظهر في `/account`. **ده السبب الأول لأهمية الـPush في التطبيق** |
| **متخزّنش أي بيانات بطاقة** | صفر PCI scope — كل حاجة عند البوابة. **متعملش autofill ولا تخزين مؤقت لأي حقل في صفحة الدفع** |
| **اختبر على بيئة الـtest بتاعة البوابة أولًا** | Paymob وFawry عندهم بيئات staging — نفّذ 10 سيناريوهات على الأقل: نجاح، فشل، إلغاء المستخدم، 3DS فشل، timeout، إغلاق التطبيق في النص، شبكة قطعت بعد الدفع، webhook وصل قبل الـcallback، webhook وصل مرتين (idempotency)، مبلغ مختلف |

#### د. البديل لو الـUniversal Links فشلت

لو ملفات الـwell-known مش راضية تشتغل (وده بيحصل)، البديل:
- الـ`redirection_url` تروح لصفحة وسيطة `/payment/return/{code}` فيها JS بيحاول يفتح `mahfol://booking/{code}` (custom scheme) وبعد 1.5 ثانية لو فشل بيعرض «ارجع للتطبيق» مع الحالة.
- **أو** (الأبسط والأضمن): سيب الـBrowser مفتوح على صفحة تأكيد بسيطة، والتطبيق يعمل polling عند `appStateChange → active`. أقل أناقة، أكتر متانة.

**الجهد:** 2–3 أيام (شامل الاختبار على بيئة البوابة)

---

### 5.9 مخاطر مسار remote-URL والتخفيف

| الخطر | الأثر | التخفيف الإلزامي |
|---|---|---|
| **ديبلوي سيّئ أو انقطاع سيرفر** | التطبيق **مبريَّك على كل الأجهزة فورًا** — مفيش rollback عبر المتجر، مفيش نسخة محلية تشتغل | **(أ) shell محلي احتياطي:** بدل remote-URL نقي، اعمل bundle محلي فيه `index.html` + أصول الويب الأساسية. التطبيق يحاول يحمّل الـremote الأول؛ لو فشل (timeout 8s أو 5xx) يعرض الـshell المحلي مع رسالة «فيه مشكلة مؤقتة — جارٍ إعادة المحاولة». **(ب)** `/app/min-version` كـkill-switch كمان: لو رجّع `{"maintenance": true, "message": "..."}` التطبيق يعرض شاشة صيانة عربية مهذّبة بدل شاشة بيضا |
| **تغيير في الويب بيكسر التطبيق بصمت** | تعديل CSS أو JS ممكن يشتغل في المتصفح ويكسر في WebView (نسخة أقدم) | **(أ)** حدّ أدنى معلن لـChrome WebView (تحقق من `navigator.userAgent` وحذّر). **(ب)** اختبار WebView في CI (Playwright بـuser agent مخصص). **(ج)** طرح تدريجي: `staged rollout 20%` في Play + مراقبة Crashlytics 48 ساعة قبل 100% |
| **الأداء داخل WebView أقل من المتصفح** | خصوصًا على أجهزة أندرويد اقتصادية | نفس تحسينات §4.4 بتخدم الحالتين. **وقِس داخل WebView تحديدًا** مش في Chrome بس |
| **الشهادة أو الدومين اتغيّر** | التطبيق مش هيوصل | تجديد SSL تلقائي + مراقبة انتهاء الشهادة + **متغيّرش الدومين أبدًا بعد النشر** |
| **Apple شافت إنه ويب** | رفض 4.2 | §5.10 |
| **بيانات المستخدم في WebView cache** | على جهاز مشترك | `CLEAR_PRIVATE` عند تسجيل الخروج + `WebView.clearCache()` الأصلي كمان |

**الفرق في الشكل عن النسخة 1:** التوصية بقت **«Capacitor بـshell محلي احتياطي»** مش **«Capacitor remote-URL نقي»**. التكلفة الإضافية ~يوم عمل، والفايدة إن التطبيق مايبقاش نقطة فشل واحدة.

---

### 5.10 سياسات المتاجر — الحكم النهائي وخطة الرفض

#### أ. الجدول

| السياسة | الحكم | السبب والتفصيل |
|---|---|---|
| **In-App Purchase / رسوم آبل 30%** | ❌ **لا تنطبق** | كل ما في المشروع **خدمات فيزيائية تُستهلك خارج التطبيق** (إقامة فندقية، رحلة، وجبة، تأجير سيارة، توصيل). مُعفاة صراحةً تحت Apple 3.1.3(e)/3.1.1 — زي Booking.com وأوبر. **مفيش أي سلعة رقمية** في `Booking` ولا `SahbPackage` ولا `DeliveryOrder`. ⚠️ **حافظ على ده:** لو ضفت لاحقًا اشتراك مميّز أو «نقاط» رقمية، السياسة بتتغيّر فورًا |
| **Guideline 4.2 (رفض «مجرد غلاف لموقع»)** | ⚠️ **خطر عالٍ — ده النموذج الكلاسيكي للرفض** | *(النسخة 1 كانت متفائلة أكتر من اللازم هنا.)* شوف الخطة الكاملة تحت |
| **حذف الحساب** (Apple 5.1.1(v) + Google Play Data Deletion) | 🔴 **رفض مضمون بدونها** | مفيش راوت `account.destroy` في `routes/web.php` — فيه `account.addresses.destroy` بس. لازم: `DELETE /account` + زر في `Account/Dashboard.jsx` بتأكيد كلمة مرور + **صفحة ويب عامة** لطلب الحذف (Google بيطلب URL خارجي — استخدم جدول `pages` عبر `/p/{slug}`) + **سياسة احتفاظ واضحة** (الحجوزات المالية بتتحفظ لمتطلبات محاسبية — اذكرها صراحةً وعمل anonymization بدل حذف كامل) |
| **App Privacy «nutrition labels»** | إلزامي | صرّح: الاسم، الهاتف، الإيميل، الموقع، سجل الشراء، معرّف المستخدم — كلها **مرتبطة بالهوية**. ⚠️ **متأثر مباشرة ببند 15:** لو الـQR لسه عند `api.qrserver.com`، لازم تصرّح «مشاركة بيانات مع طرف ثالث» — سبب إضافي لتوليده محليًا |
| **`PrivacyInfo.xcprivacy`** | إلزامي منذ مايو 2024 | أسباب استخدام الـRequired Reason APIs (UserDefaults, File timestamp, System boot time…). Capacitor بيوفّره للـplugins الأساسية — **راجع أي plugin طرف ثالث** ودمج الملفات |
| **Google Play Data Safety** | إلزامي | مطابق حرفيًا لسلوك التطبيق (بما فيه إعلان صلاحية الكاميرا والموقع). عدم التطابق = تعليق التطبيق |
| **Trader status (DSA الأوروبي)** | حسب السوق | لو هتوزّع في أوروبا لازم بيانات تاجر مُتحقّقة وإلا التطبيق يتشال من متاجر الاتحاد. **لو مصر/الخليج بس — استثنِ أوروبا صراحةً من قائمة الدول** |
| **تصنيف عمري** | إلزامي | 4+ / Everyone. **بس** لو فيه محتوى مطاعم بكحوليات في المنيو → 17+ على iOS. راجع `restaurant_menu_items` |
| **Google Play: حساب فردي جديد** | ⚠️ يضيف أسابيع | **20 مختبِر في closed testing لمدة 14 يوم متصل** قبل السماح بالنشر. حساب المؤسسة معفي — **سبب قوي لفتح حساب مؤسسة** |

#### ب. Guideline 4.2 — الخطة الكاملة

**الواقع:** تطبيق بيحمّل موقع في WebView هو **أشهر سبب رفض في App Store**. وجود قدرات أصلية بيقلّل الاحتمال، بس **مش بيلغيه**.

**طبقة الدفاع الأولى — القدرات الأصلية (كلها إلزامية قبل التقديم):**

| القدرة | الحالة المطلوبة | البند |
|---|---|---|
| ماسح QR بالكاميرا | شغّال ومُظهَر في لقطات الشاشة | §5.5 |
| Push notifications | شغّال مع تفضيلات في الحساب | §5.4 |
| Geolocation | شغّال في المطاعم والتوصيل | §5.5 |
| رفع صور من الكاميرا | شغّال في مستندات المزوّد والتقييمات | §5.5 |
| زر الرجوع العتادي | سلوك أصلي كامل | §5.6 |
| Deep Links | شغّالة من واتساب | §5.7 |
| Share أصلي | شغّال في صفحات التفاصيل | §5.5 |
| Haptics | على التأكيد والمسح | §5.5 |
| Bottom tab bar + pull-to-refresh + offline | من §4 | §4.1–§4.5 |
| تصريح دخول يشتغل بلا نت | من §4.5 + بند 15 | §4.5 |

**طبقة الدفاع الثانية — ملاحظات المراجعة (Review Notes):**
اكتبها بالإنجليزي وبوضوح:
- حساب عميل تجريبي بحجز مؤكد فيه **EntryPass نشط**.
- **حساب مزوّد تجريبي** مع تعليمات: «Log in as vendor → open Scanner → tap 'Open Camera' → scan the QR shown in the customer account». **حطّ صورة QR جاهزة في الملاحظات** عشان المراجع يقدر يمسحها من شاشة تانية.
- شرح إن التطبيق أداة تشغيلية للمزوّدين مش كتالوج فقط.
- فيديو قصير (30 ثانية) لمسار المسح.

**طبقة الدفاع الثالثة — خطة الرفض (لو حصل):**

| المحاولة | الإجراء |
|---|---|
| **رفض 1** | ردّ مكتوب موضّح للقدرات الأصلية + فيديو + تأكيد إن المراجع يجرّب حساب المزوّد. **معدل النجاح في الرد المكتوب معقول لو القدرات موجودة فعلًا** |
| **رفض 2** | **تحويل 3–4 شاشات لمحلية أصلية** (React داخل Capacitor بس بأصول محلية مش remote): (أ) شاشة الماسح بالكامل؛ (ب) شاشة «حجوزاتي» بتصريح دخول offline؛ (ج) شاشة الإشعارات/التفضيلات؛ (د) onboarding أصلي. تكلفة: **5–7 أيام** |
| **رفض 3** | **أندرويد فقط + PWA على iOS.** أعلنها قرارًا مؤقتًا، وأعد التقييم بعد 6 شهور لما يكون فيه إيراد يبرّر RN |

**الجدول الزمني يفترض جولة رفض واحدة على الأقل — احسبها في الخطة مش كمفاجأة.**

---

### 5.11 هندسة الإصدار والتوقيع

#### أ. ترقيم الإصدارات

| المنصة | الحقل | القاعدة |
|---|---|---|
| **مشترك** | `version` في `package.json` | SemVer: `1.0.0` — المصدر الوحيد |
| **Android** | `versionName` | = `version` بالحرف |
| **Android** | `versionCode` | **عدد صحيح متزايد أبدًا** — استخدم `YYMMDDNN` (مثال: `26072101`) أو رقم بناء CI. **متنقّصهوش أبدًا** وإلا Play بيرفض |
| **iOS** | `CFBundleShortVersionString` | = `version` |
| **iOS** | `CFBundleVersion` (build) | متزايد داخل نفس الإصدار: `1.0.0 (1)`, `(2)`… **رفع نفس الرقم مرتين = رفض فوري** |
| **الويب** | `BUILD` في `sw.js` | hash الـVite manifest (§4.5 فخّ 3) |

**السكربت:** `scripts/bump-version.mjs` يقرأ `package.json` ويكتب في `android/app/build.gradle` و`ios/App/App/Info.plist` — **يدوي واحد بيغلط، السكربت لأ**.

#### ب. التوقيع — أندرويد

```bash
keytool -genkeypair -v -keystore mahfol-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias mahfol-upload
```

| البند | التفصيل |
|---|---|
| **Play App Signing** | ✅ **فعّله إجباريًا.** Google بيحتفظ بمفتاح التوقيع النهائي، وإنت بتوقّع بمفتاح رفع قابل للاستبدال |
| ⚠️ **حفظ الـkeystore** | خزّن الـ`.jks` + كلمات السر في **مدير أسرار** (1Password / Bitwarden / AWS Secrets Manager) **+ نسخة offline مشفّرة**. **ضياع مفتاح الرفع مع تعطيل Play App Signing = مش هتقدر تحدّث التطبيق أبدًا وهتضطر تنشر تطبيق جديد وتخسر كل المستخدمين والتقييمات** |
| **targetSdk** | **36** — إنت في يوليو 2026، والحد الإلزامي للتطبيقات الجديدة بقى 36 من أغسطس 2026. استهدفه مباشرة |
| **minSdk** | 26 (Android 8.0) |
| **16 KB page size** | Capacitor 7 داعم — **راجع أي plugin ناتيف** (barcode-scanning بالذات) |
| **صيغة الرفع** | **AAB** (`.aab`) مش APK |
| **الأذونات** | `INTERNET` · `CAMERA` · `ACCESS_FINE_LOCATION` · `POST_NOTIFICATIONS` (Android 13+) · `READ_MEDIA_IMAGES`. **ولا شيء غير كده** — كل إذن إضافي = سؤال في Data Safety |

#### ج. التوقيع — iOS

| البند | التفصيل |
|---|---|
| **الشهادات** | Apple Distribution certificate + App Store provisioning profile |
| **Bundle ID** | `com.mahfolmakfol.app` — **ثابت للأبد** |
| **`ITSAppUsesNonExemptEncryption`** | `false` في `Info.plist` (بتستخدم HTTPS القياسي بس) — **إغفالها بتوقف كل رفع وبتطلب سؤال يدوي في كل build** |
| **Capabilities** | Push Notifications · Associated Domains (`applinks:mahfolmakfol.com`) |
| **أوصاف الأذونات بالعربي** | `NSCameraUsageDescription` = «لمسح تصريح دخول العميل وتصوير مستندات التوثيق» · `NSLocationWhenInUseUsageDescription` = «لعرض المطاعم وخدمات التوصيل القريبة منك» · `NSPhotoLibraryUsageDescription` = «لرفع صور خدماتك ومستنداتك». **وصف ناقص أو إنجليزي عام = سبب رفض شائع** |
| **deployment target** | iOS 15.0 |

#### د. أيقونات وشاشة البداية الأصلية

⚠️ **دي غير أيقونات الـPWA في §4.5 خطوة 17.**

| الأصل | المقاس | ملاحظات |
|---|---|---|
| **App Store icon** | 1024×1024 PNG | **بدون شفافية، بدون حواف دائرية** (النظام بيعملها)، بدون نص صغير |
| **iOS app icons** | يتولّدوا من الـ1024 بـ`@capacitor/assets` | `npx @capacitor/assets generate` |
| **Android adaptive icon** | طبقتين: `foreground` (432×432 مع منطقة آمنة 264×264) + `background` (لون `#363677`) | **الـwordmark 251×65 مش صالح** — محتاج رمز مربّع. لو مفيش رمز، اعمل حرف «م» أو رمز بسيط من هوية العلامة |
| **Splash screen** | 2732×2732 (المركز فيه اللوجو) + لون خلفية `#FBF7F0` | `@capacitor/splash-screen` بيقصّها لكل المقاسات |
| **Notification icon (Android)** | 96×96 monochrome شفاف | أندرويد بيعرضها silhouette — أي ألوان هتتحوّل لأبيض |

> **ملاحظة تصميمية مهمة:** المشروع **مفيهوش رمز مربّع أصلًا** (بس wordmark 251×65). **ده بند تصميم لازم يتحل قبل التطبيق ومش هيتحل بـImageMagick** — محتاج مصمّم يعمل رمز/monogram. احسبه في الخطة (نصف يوم مصمّم).

#### هـ. سلسلة البناء (CI)

| الخيار | التكلفة | ملاحظات |
|---|---|---|
| **ماك محلي + Xcode** | 0 لو متاح | الأسرع للتطوير |
| **Codemagic** | خطة مجانية 500 دقيقة/شهر ثم ~$28/شهر | الأنسب لـCapacitor — قوالب جاهزة |
| **EAS Build** | ~$29/شهر | مصمّم لـExpo بس بيشتغل مع Capacitor |
| **GitHub Actions + macos runner** | ~$0.08/دقيقة | أرخص للاستخدام القليل، إعداد أطول |

**المطلوب في الـpipeline:**
```
npm ci → npm run build → npx cap sync
      → android: ./gradlew bundleRelease → توقيع → رفع لـPlay (internal track)
      → ios: xcodebuild archive → export → altool/notarytool → رفع لـTestFlight
```

**الجهد:** 2–3 أيام (شامل الأيقونات والتوقيع والـCI)

---

### 5.12 checklist التقديم للمتجرين

#### أ. الأصول التسويقية

| الأصل | Google Play | App Store |
|---|---|---|
| **لقطات الشاشة** | 2–8 لقطة، 16:9 أو 9:16، ≥1080px | **إلزامي 6.9"** (1320×2868) و**6.5"** (1242×2688). iPad لو داعم |
| **اللغة** | **بالعربي** (والإنجليزي اختياري كلغة ثانية) | نفس الشيء |
| **صورة الغلاف** | Feature graphic 1024×500 | — |
| **أيقونة المتجر** | 512×512 | 1024×1024 |
| **فيديو ترويجي** | اختياري (YouTube) | اختياري (App Preview 15–30 ثانية) |

**محتوى اللقطات المقترح (6 لقطات):** (1) الرئيسية بالوجهات · (2) قائمة الفنادق بالفلاتر · (3) صفحة تفاصيل رحلة · (4) الحجز والتأكيد بالسعر المكفول · (5) **تصريح الدخول QR** (الميزة المميزة) · (6) **شاشة الماسح للمزوّد** (إثبات القدرة الأصلية لمراجع Apple).

⚠️ **لازم من أجهزة حقيقية أو محاكي بالمقاس الصحيح** — لقطات مقصوصة أو مقاسة غلط = رفض.

#### ب. النصوص

| الحقل | Google Play | App Store |
|---|---|---|
| اسم التطبيق | 30 حرف | 30 حرف — «محفول مكفول» |
| العنوان الفرعي | Short description 80 حرف | Subtitle 30 حرف — «رحلتك محفولة مكفولة» |
| الوصف الكامل | 4000 حرف | 4000 حرف |
| الكلمات المفتاحية | (مدمجة في الوصف) | 100 حرف — **بالعربي والإنجليزي** |
| ملاحظات الإصدار | إلزامي | إلزامي |

#### ج. الامتثال — الجدول النهائي

| البند | Google Play | App Store | الحالة الحالية |
|---|---|---|---|
| **سياسة خصوصية على URL عام** | ✅ إلزامي | ✅ إلزامي | 🟡 موجودة في `pages` — **محتاجة مراجعة قانونية** |
| **شروط الاستخدام** | مستحسن | مستحسن | 🟡 نفس الشيء |
| **صفحة/آلية حذف الحساب** | ✅ إلزامي (+ URL خارجي) | ✅ إلزامي (داخل التطبيق) | 🔴 **مش موجودة — بند 54** |
| **App Privacy / Data Safety** | ✅ | ✅ | 🔴 مش معبّى · **متأثر ببند 15** |
| **`PrivacyInfo.xcprivacy`** | — | ✅ | 🔴 مش موجود |
| **Export Compliance** | — | ✅ (`ITSAppUsesNonExemptEncryption=false`) | 🔴 مش موجود |
| **تصنيف عمري (IARC)** | ✅ استبيان | ✅ استبيان | 🔴 مش معبّى |
| **حساب تجريبي للمراجعة** | ✅ | ✅ | 🔴 **محتاج حساب عميل + حساب مزوّد بـEntryPass نشط** — ومفيش أي حجز في الـDB أصلًا (بند 1) |
| **معلومات جهة الاتصال** | ✅ (العنوان بيظهر علنًا) | ✅ | 🟡 |
| **الدول المستهدفة** | مصر (+الخليج) — **استبعد أوروبا** | نفس الشيء | 🔴 |

**الجهد:** 2–3 أيام (معظمه كتابة ولقطات، مش كود)

---

### 5.13 الحسابات والتكاليف

#### أ. التكاليف المباشرة

| البند | التكلفة | التكرار | ملاحظات |
|---|---|---|---|
| **Apple Developer Program** | **$99** | سنويًا | لو بشركة → **D-U-N-S Number** من Dun & Bradstreet (مجاني، 5–14 يوم عمل) + سجل تجاري + الاسم القانوني مطابق حرفيًا. لو باسم فرد → التطبيق ينشر **باسمك الشخصي** — ضرر مباشر لعلامة اسمها «محفول مكفول» |
| **Google Play Developer** | **$25** | مرة واحدة | حساب المؤسسة محتاج D-U-N-S + تحقق هوية/عنوان (**العنوان بيظهر علنًا**). ⚠️ **حساب شخصي جديد ملزم بـclosed testing: 20 مختبِر × 14 يوم متصل** |
| **Firebase (FCM)** | **مجاني** | — | Spark plan كافي تمامًا |
| **VAPID (Web Push)** | **مجاني** | — | مفاتيح مولّدة محليًا |
| **سحابة بناء iOS** (لو مفيش ماك) | **$0–30** | شهريًا | Codemagic مجاني لحد 500 دقيقة/شهر — كافي لتطبيق واحد |
| **مصمّم لرمز مربّع + أيقونات** | **$50–200** | مرة واحدة | لأن المشروع مفيهوش رمز مربّع (§5.11 د) |
| **مراجعة قانونية للسياسات** | **$100–400** | مرة واحدة | خصوصية + شروط + استرداد |
| **Sentry / تتبّع أخطاء** | **$0–26** | شهريًا | الخطة المجانية (5k أحداث/شهر) كافية في البداية |
| **Uptime monitoring** | **$0–10** | شهريًا | UptimeRobot مجاني |

**الإجمالي السنة الأولى:** **~$300 – $1,000** (حسب سحابة البناء والمصمّم والمراجعة القانونية).
**الإجمالي المتكرر سنويًا بعد كده:** **~$100 – $500**.

#### ب. التكاليف غير المباشرة (الأهم)

| البند | التقدير |
|---|---|
| **وقت التطوير** (§5.14) | 4–5 أسابيع مطور |
| **صيانة سنوية** | targetSdk سنويًا + تحديثات Capacitor الأمنية + جولات مراجعة = **~يوم/شهر** |
| **دعم مستخدمي التطبيق** | تذاكر إضافية، تقييمات في المتجر لازم يتردّ عليها |

#### ج. تجهيزات على السيرفر (Laravel)

| البند | الملف |
|---|---|
| `SESSION_SECURE_COOKIE=true` · `SESSION_SAME_SITE=lax` · `SESSION_LIFETIME` (مع تحفّظات §5.3.1) | `.env` الإنتاج |
| **Universal Links / App Links** — `public/.well-known/apple-app-site-association` (بدون امتداد، `Content-Type: application/json`) و`public/.well-known/assetlinks.json`، مرخّصين في nginx **بدون auth ولا redirect** | `DEPLOY.md` + §5.7 |
| `is_native` في `HandleInertiaRequests::share()` مقروءة من User-Agent مخصص (`MahfolApp/1.0`) — عشان الواجهة تخفي فوتر SEO وbanner التثبيت وتظهر عناصر أصلية | `app/Http/Middleware/HandleInertiaRequests.php` |
| حصر التنقّل في WebView على نطاقك + Paymob/Fawry فقط | `capacitor.config.ts` → `server.allowNavigation` |
| `GET /app/min-version` (+ kill-switch للصيانة) و`DELETE /account` و`POST /devices/register` | `routes/web.php` |

---

### 5.14 الجدول الزمني لمشروع التطبيق

#### أ. المتطلبات المسبقة (خارج حساب الأسابيع)

| المتطلب | الحالة |
|---|---|
| §3 (البلوكرات) مكتملة والمنصة قابلة للتشغيل | 🔴 |
| **§4 كاملة** (~113 ساعة = 3.5–4 أسابيع) | 🔴 |
| بند 3 (CSRF على callbacks) — الدفع شغّال أصلًا | 🔴 |
| بند 10 + بند 15 (حماية الحجز + QR محلي) | 🔴 |
| بند 54 (حذف الحساب) | 🔴 |
| بوابة دفع منتجة ومختبَرة | 🔴 |
| رمز مربّع من مصمّم | 🔴 |

#### ب. أسابيع المشروع

| المرحلة | زمن الشغل | زمن الانتظار (متوازي) |
|---|---|---|
| فتح الحسابات + D-U-N-S | يوم | **2–3 أسابيع** |
| بناء هيكل Capacitor + `capacitor.config.ts` + الـshell الاحتياطي | 3 أيام | — |
| كاميرا QR + Haptics (§5.5) | 1.5 يوم | — |
| Push + FCM + جدول الأجهزة (§5.4) | 3 أيام | — |
| Geolocation + رفع صور من الكاميرا + Share (§5.5) | 2 أيام | — |
| زر الرجوع العتادي + StatusBar + Splash (§5.6) | يوم | — |
| Deep Links + ملفات well-known (§5.7) | يوم | — |
| **مسار الدفع داخل التطبيق + اختباره (§5.8)** | **2–3 أيام** | — |
| الأيقونات الأصلية + التوقيع + CI (§5.11) | 2–3 أيام | — |
| ملفات المتجر والامتثال (§5.12) | 2–3 أيام | — |
| اختبار على مصفوفة الأجهزة (§4.9) | 2 أيام | — |
| **إجمالي الشغل** | **~21–24 يوم عمل ≈ 4.5–5 أسابيع** | |
| **نشر أندرويد** | يوم | **3–14 يوم مراجعة** (+14 يوم closed testing لو حساب شخصي) |
| **نشر iOS** | يوم | **2–7 أيام** — **احسب جولة رفض واحدة على الأقل** (+5–7 أيام لو احتاج تحويل شاشات لمحلية) |

#### ج. الرقم الواحد الموحّد

> **مشروع التطبيق = 4.5–5 أسابيع شغل + 3–5 أسابيع انتظار (متوازي جزئيًا).**
> **من الصفر شاملًا §4: 8–9 أسابيع.**
> **ودي تبدأ بعد إنجاز §3 (البلوكرات) — يعني الأسبوع 11+ من بداية المشروع في سيناريو مطورين.**

*(النسخة 1 كان فيها ثلاث أرقام متناقضة: XL في بند النمو، 5–7 أسابيع في §5.1، و«بعد الاستقرار» بلا رقم في §1.2. الرقم اللي فوق هو الوحيد المعتمد.)*

#### د. الترتيب

**أندرويد أولًا** (مصر سوق أندرويد بفارق ساحق + مراجعة أسرع + مفيش 4.2) → Internal testing (فوري) → Closed testing → Production بـ**staged rollout 20% لمدة 48 ساعة** مع مراقبة Crashlytics ثم 100%.
**iOS بعده:** TestFlight داخلي (فوري) → TestFlight خارجي (~24 ساعة مراجعة) → App Store.

#### هـ. ما بعد الإطلاق

- **الميزة التشغيلية الكبرى:** أي تعديل في `resources/js` أو `app/` بينزل فورًا بـ`npm run build` + deploy **من غير مراجعة متجر**. ⚠️ **وده كمان أكبر مخاطرة** (§5.9) — التزم بـstaging + smoke test قبل كل deploy.
- **حاجز إصدار:** `GET /app/min-version` يرجّع أقل نسخة أصلية مدعومة + flag صيانة، والتطبيق يعرض «حدّث التطبيق» أو شاشة صيانة — عشان تقدر تغيّر عقود الـpayload بأمان.
- **بُعد `platform`** في كل حدث Analytics (§4.10) للمقارنة بين التطبيق والويب.
- **راقب:** Crashlytics · معدل قبول إذن الإشعارات · معدل إتمام الحجز من التطبيق مقابل الويب · تقييمات المتجر (ردّ خلال 48 ساعة).
- **تحديث الغلاف الأصلي كل 3–4 شهور بس** (targetSdk سنويًا + تحديثات Capacitor الأمنية). **~يوم/شهر صيانة.**

---

## 6. التسلسل التنفيذي

> الأرقام لفريق **مطورين اثنين**. العمود «متوازي» بيقول إيه اللي ينفع يمشي في نفس الوقت. أرقام البنود بتشاور على §3.

### المرحلة 0 · وقف النزيف (أسبوع 1)

| البند | # | المخرج |
|---|---|---|
| 🔥 **إضافة `payment/callback` و`payment/fawry/callback` لاستثناءات CSRF** | 3 | **صفر 419 من البوابات — الإيراد الإلكتروني بيشتغل** |
| نسخة احتياطية + بيئة staging حقيقية على **MySQL** | 36 | فحص قبل أي migrate على الإنتاج |
| إصلاح migration `000170` + `migrate:fresh` على MySQL نضيفة للتأكد | 4 | سلسلة migrations بتعدّي على MySQL |
| تركيب cron (`schedule:run`) + `queue:work` + **تصحيح `DEPLOY.md:4`** | 5 | الـholds بتتفرّج · المخزون مابينزفش |
| إنشاء `Buses/Route.jsx` و`Vendor/Earnings/NoCompany.jsx` | 6, 7 | صفر 500 على الراوتس المسجّلة |
| صفحات أخطاء Inertia مبرندة RTL (404/403/419/500/503) | 8 | تجربة خطأ عربية |
| `throttle:login` + `guest` على `admin.login.store` و`vendor.login.store` | 9 | لوحة التحكم محميّة من brute-force |
| إصلاح limiter الدخول (`login` بدل `email` + `errors.login`) | 14 | رسالة تجاوز الحد بتظهر فعلًا |
| حماية `/booking/{code}` (signed URL/auth + كود أطول) و`/delivery/confirm/{code}` | 10, 11 | صفر تسريب بيانات عملاء |
| حصر `ScannerController` على منشآت المزوّد | 12 | صفر مسح متبادل بين المنشآت |
| `auth` على `POST /delivery/order` | 13 | صفر طلبات مجهولة |
| توليد QR محليًا (`endroid/qr-code`) | 15 | صفر اعتماد خارجي في مسار الدخول · **يفتح §4.5 و§5.5** |
| **إغلاق الباصات والتوصيل على مستوى الراوت** + `noindex` | 33 | صفر صفحات فاضية أو مكسورة للعميل |
| فصل `ProductionSeeder` + تنظيف الـ20 صف اليتيم | 2, 22 | seeding إنتاج آمن · مخزون نضيف |
| فحص `CACHE_STORE` ذرّي عند الإقلاع + في `/up` | 21 | القفل الأول حقيقي مش وهمي |

**معيار «خلاص»:** `php artisan migrate:fresh --seed=ProductionSeeder` بينجح على MySQL · كل راوت في `route:list` بيرد 200/302/403/404 مش 500 · مفيش endpoint بيرجّع PII بدون auth · دفعة اختبارية بالبطاقة بتوصل لصفحة تأكيد بدون 419 · `app:smoke-test-e2e` أخضر · `crontab -l` فيه `schedule:run`.
**التبعيات:** لا شيء.
**متوازي:** ✅ كل البنود مستقلة تقريبًا · **وابدأ فتح حسابات Apple/Google + KYC بوابة الدفع + حساب واتساب أعمال هنا** (§1.3).
**المدة:** 5–7 أيام.

---

### المرحلة 1 · إثبات أن المنتج يعمل + شبكة الأمان (أسبوع 2)

| البند | # | المخرج |
|---|---|---|
| **تنفيذ رحلة حجز end-to-end لكل نوع خدمة × كل توقيت دفع × كل حالة فشل** | 1 | **أول حجز حقيقي في تاريخ المشروع** + قائمة الأعطال المكتشفة |
| بناء `database/factories` لكل الموديلات الأساسية | 35 | أساس أي اختبار |
| اختبارات لـ`AgePricingService` + `PaymentTimingService` + `CancellationPolicyService` | 35 | التسعير محمي قبل ما نلمسه |
| اختبار تزامن (concurrency) لكل نوع إتاحة | 35 | المخزون محمي قبل ما نلمسه |
| Sentry + uptime على `/up` + **تنبيه على `Log::critical`** | 34 | صفر أعطال صامتة |

**معيار «خلاص»:** حجز مؤكد + `entry_pass` مولّد + QR ظاهر + الماسح قرأه ووسمه مستخدَم — **لكل نوع خدمة** · `php artisan test` بيعدّي بأكتر من 20 اختبار · تنبيه بيوصل فعليًا لما `Log::critical` يتكتب.
**التبعيات:** المرحلة 0.
**متوازي:** ✅ (المطور أ: التحقق E2E) ‖ (المطور ب: factories + اختبارات + مراقبة).
**المدة:** 5–6 أيام.

> ⚠️ **بوابة قرار:** لو المرحلة دي كشفت أكتر من 10 أعطال جوهرية، **أعد تقدير كل الجدول الزمني قبل ما تكمل**. ده الغرض منها.

---

### المرحلة 2 · جعل المنصة قابلة للتشغيل (أسابيع 3–5)

| البند | # | المخرج |
|---|---|---|
| **توحيد `status`/`publish_state`** بخطة الحسم الكاملة (مصدر حقيقة = `publish_state` · backfill آمن · الصفوف المتضاربة → `draft`) | 16 | صفر ثقوب نشر |
| CRUD أنواع الغرف (`RoomType`) — أدمن + مزوّد | 23 | فندق جديد قابل للحجز من اللوحة |
| CRUD ترابيزات المطاعم + أقسام/أصناف المنيو | 24 | مطعم جديد قابل للحجز من اللوحة |
| صفحة `/admin/settings` (رسوم/ضرائب/عمولة/أوزان أفضل قيمة) + شيل الـhardcoded 200 | 25 | صفر تعديل بـtinker |
| `/admin/users` + إنشاء موظف دعم | 26 | إمكانية إنشاء حسابات |
| إصلاح دخول دور `support` + **لينك `/support` في `AdminLayout`** | 27 | لوحة الدعم قابلة للاستخدام فعلًا |
| إتاحة العربيات (`HasAvailability` + فرع `reserve` + اختبار تزامن) | 17 | صفر حجز مزدوج على أي نوع |
| إصلاح فلترة الترابيزات بالـslot | 19 | الواجهة بتطابق المحرك |
| شيل `restaurant_table` من `Bookables::MAP` | 18 | صفر حجوزات يتيمة |
| **تصعيد «مدفوع بلا إتاحة»** (تنبيه فوري + `needs_review` + فلتر `processing` + رسالة للعميل) | 20 | صفر «دفعت وملقيتش غرفة» صامتة |

**معيار «خلاص»:** أدمن يقدر ينشئ فندق + أنواع غرف + مطعم + ترابيزات + منيو **من اللوحة بالكامل**، وعميل يقدر يحجزهم من الصفر لتأكيد الحجز · موظف دعم بيسجّل دخول من لينك في اللوحة ويشوف تذكرة · سيناريو حجز عربية متزامن مرتين بيفشل الثاني · اختبار `publish_state` بيعدّي.
**التبعيات:** المرحلة 1. **بند 16 يسبق المرحلة 3.**
**متوازي:** ✅ (المطور أ: CRUD الغرف + الترابيزات) ‖ (المطور ب: 16 + 17 + 20 + الإعدادات والمستخدمين). **بس بند 16 بيقفل ملفات كتير — نسّق.**
**المدة:** 12–15 يوم.

---

### المرحلة 3 · منظومة المزوّد والدورة التجارية (أسابيع 6–7)

| البند | # | المخرج |
|---|---|---|
| كتابة `provider_id` من `VendorScoped` + backfill للبيانات القائمة | 30 | الأرباح والبروفايل و«أعلى المزوّدين» بترجّع بيانات حقيقية · شارة «طرف أول» صحيحة |
| default `publish_state='draft'` + زر «إرسال للمراجعة» في لوحة المزوّد + `publish_state` في فورم الأدمن | 29 | دورة draft→pending_review→published شغّالة |
| مسار رفع مستندات المزوّد + قسم مراجعتها في صفحة الموافقات | 28 | المزوّد الفرد قابل للتوثيق |
| مسار إلغاء الحجز للعميل + **تطبيق `refundPercentAt` على الاسترداد الإداري كمان** | 31 | سياسة الإلغاء قابلة للتنفيذ في الاتجاهين |
| عرض تصريح الدخول QR في `Account/Dashboard.jsx` | 32 | العميل بيلاقي تصريحه في أي وقت |
| `EnsureRole` يتحقق من `verification_status` | 44 | المزوّد `pending` مش بينشر |

**معيار «خلاص»:** مزوّد جديد يسجّل → يرفع مستنداته → الأدمن يراجع ويوافق → المزوّد يضيف خدمة (draft) → يرسلها للمراجعة → الأدمن ينشرها → تظهر للعميل → العميل يحجز → المزوّد يشوف الحجز والأرباح. **الدورة كاملة بدون tinker.**
**التبعيات:** بند 16 من المرحلة 2.
**متوازي:** 🟡 محدود — 29 و30 على نفس الملفات.
**المدة:** 8–10 أيام.

---

### المرحلة 4 · الجاهزية التشغيلية والإطلاق التجريبي (أسبوع 8)

| البند | المخرج |
|---|---|
| **checklist ما قبل النشر كامل** (§7) | صفر إعداد ناقص |
| خطة إدخال البيانات + إدخال أول 10–15 منشأة (§8) | محتوى حقيقي للإطلاق |
| مراقبة كاملة + تنبيهات + لوحة صحة (§9) | رؤية تشغيلية |
| `sitemap` + `robots` + Open Graph + صفحات ثابتة مراجَعة قانونيًا | جاهزية SEO وقانونية |
| **soft launch مغلق** — 20–50 مستخدم مدعو | حجوزات حقيقية بفلوس حقيقية |
| **جولة قياس أساس** (Lighthouse + Web Vitals + معدل إتمام الحجز على الموبايل) | baseline لـ§4 |

**معيار «خلاص»:** 10 حجوزات حقيقية مدفوعة من مستخدمين حقيقيين بدون تدخّل يدوي · صفر `Log::critical` غير معالَج · باقي بيانات القياس مسجّلة.
**المدة:** 5–7 أيام.

---

### المرحلة 5 · وضع الموبايل (أسابيع 9–12)

| المرحلة الفرعية | المخرج |
|---|---|
| §4.10 (القياس) — **يتعمل الأول** | إثبات الأثر ممكن |
| §4.1 القشرة (خطوات 1–5) | تنقّل حقيقي على الموبايل |
| §4.2 الإحساس (خطوات 6–10) | انتقالات وsheets وsnap وPTR |
| §4.3 الإدخال واللمس (11–12) | فورمات قابلة للاستخدام بإصبع |
| §4.7 a11y (خطوة 21) | Lighthouse a11y ≥ 95 |
| §4.8 الحالات الحدّية | عدّاد hold + فشل الشبكة + idempotency key |
| §4.4 الأداء (13–16) | LCP ≤ 2.5s |
| §4.9 التحقق على الأجهزة | مصفوفة الأجهزة خضراء |

**معيار «خلاص»:** المؤشرات الأربعة في §4.10 اتحسّنت قياسًا للأساس · Lighthouse Mobile ≥ 80 و a11y ≥ 95 · حجز كامل من موبايل حقيقي بيد واحدة.
**المدة:** 15–18 يوم.

---

### المرحلة 6 · PWA ثم التطبيق (أسابيع 13+)

| المرحلة الفرعية | التبعية | المدة |
|---|---|---|
| §4.5 PWA (خطوات 17–20) | بند 10 + بند 15 | 3–4 أيام |
| §4.6 Web Push | PWA + `queue:work` | 2–3 أيام |
| بند 54 (حذف الحساب) + رمز مربّع من مصمّم | — | 3 أيام |
| §5 مشروع Capacitor كامل | كل اللي فوق | **4.5–5 أسابيع** |
| مراجعة المتجرين | — | 1–4 أسابيع انتظار |

---

## 7. فحص ما قبل النشر (Go-Live Checklist)

### أ. متغيرات البيئة

| المتغير | القيمة المطلوبة | لو غلط |
|---|---|---|
| `APP_ENV` | `production` | debug مفتوح |
| **`APP_DEBUG`** | **`false`** | 🔴 **تسريب كامل للـstack traces ومسارات الملفات ومتغيرات البيئة على صفحة الخطأ** |
| `APP_KEY` | مولّد ومحفوظ | كل الجلسات والبيانات المشفّرة تضيع لو اتغيّر |
| `APP_URL` | `https://mahfolmakfol.com` | روابط الإيميل والـcallback غلط |
| **`CACHE_STORE`** | `redis` أو `memcached` أو `database` — **مش `file`** | 🔴 طبقة القفل الأولى في محرك الإتاحة وهمية (بند 21) |
| `SESSION_DRIVER` | `database` أو `redis` | جلسات ضايعة عند إعادة التشغيل |
| `SESSION_SECURE_COOKIE` | `true` | الكوكي بيتبعت على HTTP |
| `SESSION_SAME_SITE` | `lax` | callbacks الدفع تكسر لو `strict` |
| `QUEUE_CONNECTION` | `database` (أو `redis`) **+ worker شغّال** | الإشعارات مابتتبعتش |
| `LOG_CHANNEL` / `LOG_LEVEL` | `stack` / `warning` أو `error` | القرص يمتلئ بلوجات debug |
| `MAIL_*` | بيانات SMTP حقيقية + `MAIL_FROM_ADDRESS` على الدومين | إيميلات التأكيد مش بتوصل أو بتروح spam |
| `PAYMOB_*` / `FAWRY_*` | **مفاتيح الإنتاج** مش الـtest + HMAC secret | 🔴 المدفوعات مش شغالة أو بتتقبل بدون تحقق |
| `WHATSAPP_*` | توكن حساب أعمال معتمد + قوالب معتمدة | القناة الأساسية للمستخدم المصري ميتة |
| `VAPID_*` (لاحقًا) | مفاتيح مولّدة | Push مش شغّال |
| `SENTRY_DSN` | DSN الإنتاج | صفر رؤية للأخطاء |

### ب. البنية التحتية

| البند | التحقق |
|---|---|
| **HTTPS + HSTS** | `Strict-Transport-Security: max-age=31536000; includeSubDomains` · شهادة بتتجدد تلقائيًا + تنبيه قبل الانتهاء بـ14 يوم |
| **`php artisan storage:link`** | صور الخدمات المرفوعة بتظهر |
| **صلاحيات `storage/` و`bootstrap/cache/`** | 775 و owner صحيح — وإلا 500 صامت |
| **`php artisan config:cache` + `route:cache` + `view:cache` + `event:cache`** | جزء من سكربت الديبلوي |
| **`composer install --no-dev --optimize-autoloader`** | حزم التطوير مش على الإنتاج |
| **`npm run build`** (+ `stamp-sw.mjs` لاحقًا) | أصول مبنية ومبصومة |
| **cron: `* * * * * php artisan schedule:run`** | 🔴 بند 5 — بدونه المخزون بينزف |
| **`queue:work` كـsystemd unit** بـ`Restart=always` | إشعارات وطوابير شغالة |
| **`Cache-Control` على `/build/assets/*`** | `public, max-age=31536000, immutable` |
| **رؤوس أمان** | `X-Content-Type-Options: nosniff` · `X-Frame-Options: SAMEORIGIN` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy` |
| **حدود الرفع** | `upload_max_filesize` / `post_max_size` كافية لمستندات المزوّد (≥ 10MB) |
| **نسخ احتياطي آلي** | dump يومي للـDB + `storage/app/public` · **اختبار استعادة فعلي مرة واحدة على الأقل** |
| **firewall + fail2ban** | حماية طبقة السيرفر |

### ج. البيانات

| البند | التحقق |
|---|---|
| `ProductionSeeder` اتشغّل (`AgePricingSeeder` + `LocationsSeeder` + `PagesSeeder` + `Settings`) | 🔴 بند 2 |
| `DatabaseSeeder` (بيانات الديمو) **ما اتشغّلش** | صفر مستخدمين بكلمة سر `password` · صفر إشغال وهمي |
| **صفر مستخدم بكلمة سر افتراضية** | استعلام تحقق يدوي |
| حساب أدمن حقيقي بكلمة سر قوية + 2FA (لو متاح) | — |
| الصفحات الثابتة (خصوصية/شروط/استرداد/حذف حساب) منشورة ومراجَعة | — |
| الإعدادات (`commission_rate`, `service_fee`, `makfol_discount`) بقيم حقيقية | مش قيم الـseeder |
| صفر صف يتيم في `booking_items` | استعلام: `select count(*) from booking_items where booking_id is null and state='booked'` |

### د. التحقق الوظيفي النهائي (smoke test يدوي)

1. تسجيل مستخدم جديد → إيميل ترحيب وصل.
2. حجز فندق بـ`on_arrival` → تأكيد فوري + إيميل + واتساب.
3. حجز رحلة بـ`prepaid` بالبطاقة → صفحة الدفع → نجاح → **صفحة تأكيد بدون 419** → إيميل.
4. حجز بدفع فاشل → الـhold اتفرّج → الوحدة رجعت متاحة.
5. تصريح دخول → QR ظاهر → الماسح قرأه ووسمه.
6. مزوّد بيسجّل → يرفع مستند → أدمن يوافق → يضيف خدمة → يرسلها للمراجعة → أدمن ينشرها.
7. تذكرة دعم → موظف دعم يرد → العميل شاف الرد.
8. إلغاء حجز → نسبة الاسترداد اتحسبت صح.
9. `/up` بيرجّع أخضر وكل الفحوصات ناجحة.
10. تنبيه Sentry بيوصل لما تعمل خطأ متعمّد.

---

## 8. خطة إدخال البيانات (Content Ops)

### أ. حجم الشغل الحقيقي

| النوع | الكيانات لكل منشأة | وقت الإدخال التقديري |
|---|---|---|
| **فندق** | بيانات أساسية + 3–6 أنواع غرف + 5–15 صورة + مرافق + سياسة إلغاء + شرائح عمرية | **45–75 دقيقة** |
| **مطعم** | بيانات + 8–20 ترابيزة + 4–8 أقسام منيو + 20–60 صنف + صور | **60–120 دقيقة** |
| **رحلة** | بيانات + برنامج يومي (3–7 أيام) + 3–8 فعاليات + صور + سياسة | **45–90 دقيقة** |
| **سيارة** | بيانات + صور + شروط | **15–25 دقيقة** |
| **باقة سعادة** | بيانات + مكوّنات + صور | **20–30 دقيقة** |

**حساب 50 منشأة موزّعة (15 فندق · 15 مطعم · 12 رحلة · 5 عربيات · 3 باقات):**
`15×60 + 15×90 + 12×70 + 5×20 + 3×25` = **~48 ساعة إدخال صافي** ≈ **8–10 أيام عمل لشخص متفرّغ**، مش شامل: جمع المحتوى من المنشأة، تصوير/تجهيز الصور، المراجعة والتصحيح.

**مع الجمع والتجهيز: 15–20 يوم عمل لشخص واحد.**

### ب. من يعمل هذا

| النموذج | المزايا | العيوب |
|---|---|---|
| **الفريق يدخّل نيابة عن المنشآت** (موصى به للـ50 الأولى) | جودة موحّدة · سرعة · المنشأة مش محتاجة تتعلّم اللوحة | 15–20 يوم عمل · مش قابل للتوسّع |
| **المنشأة تدخّل بنفسها** | قابل للتوسّع | تدريب + جودة متفاوتة + بطء + **بيتطلب لوحة مزوّد ناضجة جدًا** |
| **هجين** (موصى به بعد الـ50) | الفريق يدخّل الأساسي والمنشأة تكمّل وتحدّث | يحتاج §3 بند 29 (دورة المراجعة) شغّالة |

**القرار الموصى به:** الفريق يدخّل أول 20 منشأة قبل الإطلاق التجريبي، ثم هجين.

### ج. أدوات تسرّع الشغل (استثمار يستحق)

| الأداة | الجهد | الوفر |
|---|---|---|
| **استيراد CSV** لأنواع الغرف والترابيزات وأصناف المنيو | **M** (2–3 أيام) | يقلّل وقت المطعم من 90 لـ25 دقيقة |
| **نسخ منشأة** («انسخ هذا الفندق كقالب») | **S** | مفيد للسلاسل |
| **رفع صور بالجملة** مع سحب وإفلات + ضغط تلقائي | **M** | يوفّر ثلث الوقت |
| **قوالب جاهزة** لسياسات الإلغاء والشرائح العمرية | **S** | يمنع الأخطاء |

### د. جدول زمني للمحتوى

| المرحلة | المستهدف | التوقيت |
|---|---|---|
| قبل الإطلاق التجريبي | **10–15 منشأة** عالية الجودة في 2–3 وجهات | المرحلة 4 (أسبوع 8) — 5 أيام |
| أول شهر بعد الإطلاق | 30–40 منشأة | بالتوازي مع المرحلة 5 |
| الشهر الثالث | 50–80 منشأة | هجين |

⚠️ **قاعدة:** **متطلقش بأقل من 10 منشآت لكل عمودية في وجهة واحدة على الأقل.** كتالوج فاضي بيقتل الثقة أسرع من أي باج.

---

## 9. المراقبة والتشغيل

### أ. الطبقات الأربع

| الطبقة | الأداة | التنبيه |
|---|---|---|
| **التوافر** | UptimeRobot / BetterStack على `/up` كل دقيقة | SMS + واتساب فورًا |
| **الأخطاء** | Sentry (PHP + JS) | إيميل فوري على `error` جديد · **إشعار فوري على `critical`** |
| **الأعمال** | استعلامات مجدولة | تنبيه لو: صفر حجوزات في 6 ساعات (وقت الذروة) · معدل فشل دفع > 20% · حجز في `processing` أكتر من 15 دقيقة |
| **البنية** | مساحة القرص · الذاكرة · حالة `queue:work` · حالة cron | تنبيه عند 80% قرص |

### ب. `HealthController` — وسّعه

الكونترولر موجود ومكتمل. أضف له الفحوصات دي عشان `/up` يبقى معبّر:

```php
'cache_store_atomic' => in_array(config('cache.default'), ['redis','memcached','database']),
'queue_worker_alive' => Cache::get('queue:heartbeat') > now()->subMinutes(5),  // job مجدول بيكتب heartbeat
'scheduler_alive'    => Cache::get('scheduler:heartbeat') > now()->subMinutes(3),
'payment_gateway'    => (bool) config('services.paymob.api_key'),
'storage_writable'   => is_writable(storage_path('app/public')),
'orphan_holds'       => BookingItem::whereNull('booking_id')->where('state','booked')->count() === 0,
'pending_reviews'    => Company::where('verification_status','pending')->count(),  // معلوماتي
```

### ج. اللوجات

- `LOG_LEVEL=warning` في الإنتاج · daily channel مع `days=14`.
- **logrotate** على `storage/logs/` — القرص بيمتلئ بصمت وبعدين كل حاجة بتقع.
- **متسجّلش PII في اللوجات** — راجع كل `Log::info` في مسار الحجز والدفع.

### د. مؤشرات تشغيلية أسبوعية

| المؤشر | المصدر |
|---|---|
| عدد الحجوزات · قيمتها · متوسط قيمة الحجز | `AnalyticsController` (جاهز) |
| معدل نجاح الدفع لكل بوابة | `bookings.payment_gateway` + `payment_status` |
| عدد الحجوزات في `processing` (مدفوعة بلا إتاحة) | **يجب أن يكون صفر** |
| عدد الـholds المنتهية غير المحرّرة | **يجب أن يكون صفر** (لو مش صفر، الـcron واقف) |
| متوسط زمن الرد على تذاكر الدعم | `support_tickets` |
| عدد المزوّدين في طابور المراجعة | `companies.verification_status` |

---

## 10. سجل المخاطر

| # | الخطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|---|
| R1 | **KYC بوابة الدفع يتأخر عن جدول التطوير** | متوسط | 🔴 **مفيش إطلاق** | ابدأه في اليوم الأول (§1.3) · جهّز البدائل (Paymob + Fawry بالتوازي) · احتفظ بـ`on_arrival` كمسار كامل يعمل بلا بوابة |
| R2 | **بند 1 (التحقق E2E) يكشف أعطالًا جوهرية أكتر من المتوقع** | **مرتفع** | 🔴 الجدول ينزاح 2–4 أسابيع | البوابة القرارية بعد المرحلة 1 · buffer 25% معلن أصلًا |
| R3 | **`migrate` على الإنتاج يفشل أو يفسد بيانات** | متوسط | 🔴 توقّف | نسخة احتياطية إجبارية · staging على MySQL بنفس النسخة · إجراء rollback موثّق (بند 36) |
| R4 | **backfill بند 16 ينشر خدمات مرفوضة أو يخفي خدمات صالحة** | متوسط | 🟠 ثقة العملاء والمزوّدين | الصفوف المتضاربة → `draft` (الأمان أولًا) · تقرير قبل/بعد بالأعداد · مراجعة يدوية للحالات المتضاربة |
| R5 | **Apple ترفض تحت 4.2** | **مرتفع** | 🟠 تأخير 2–6 أسابيع أو iOS بره | §5.10 خطة الثلاث محاولات · أندرويد أولًا فيبقى فيه تطبيق شغّال |
| R6 | **ديبلوي سيّئ يبريّك التطبيق على كل الأجهزة** (remote-URL) | متوسط | 🔴 كل مستخدمي التطبيق | shell محلي احتياطي + kill-switch (§5.9) · staging + smoke test إجباري |
| R7 | **مطور واحد بدل اتنين** | متوسط | 🟠 الجدول يتضاعف تقريبًا | الأرقام معلنة للحالتين (§3.3) · قائمة التقليص جاهزة |
| R8 | **ضياع keystore أندرويد** | منخفض | 🔴 **فقدان التطبيق نهائيًا** | Play App Signing + مدير أسرار + نسخة offline مشفّرة (§5.11) |
| R9 | **حساب Google Play شخصي → 14 يوم closed testing** | متوسط | 🟠 تأخير أسبوعين | افتح حساب مؤسسة من البداية |
| R10 | **إدخال المحتوى يتأخر فيطلع الموقع فاضي** | متوسط | 🟠 ضربة ثقة | §8 — شخص متفرّغ + 15 منشأة قبل الإطلاق كحد أدنى |
| R11 | **`amount_paid` صفر فكل تقرير مالي غلط** | **مؤكد حاليًا** | 🟠 قرارات مبنية على أصفار | بند 40 (§3.4) — نقله لأول شهر بعد الإطلاق · لا تبنِ أي تسوية مالية قبله |
| R12 | **الاعتماد على `loremflickr`/`picsum` ينقطع** | متوسط | 🟠 كل الصور تختفي | بند 50 · **ارفعه للمرحلة 4** لو هتطلق بمحتوى ناقص الصور |
| R13 | **زحف نطاق** (إضافة ميزات أثناء التنفيذ) | **مرتفع** | 🔴 الجدول ينهار | تجميد نطاق معلن حتى الإطلاق التجريبي · كل طلب جديد يروح لـ§3.4 أو §3.5 |
| R14 | **الاختبارات تُهمَل تحت ضغط الوقت** | **مرتفع** | 🔴 أعطال في مسارات الفلوس | بند 35 في المرحلة 1 **قبل** أي تعديل على المخزون — مش بعده |

---

## 11. مؤشرات النجاح

### أ. مؤشرات الإطلاق (المرحلة 4)

| المؤشر | الهدف |
|---|---|
| حجوزات حقيقية مدفوعة بدون تدخّل يدوي | ≥ 10 |
| معدل نجاح الدفع الإلكتروني | ≥ 90% |
| حجوزات في حالة `processing` (مدفوع بلا إتاحة) | **0** |
| holds منتهية غير محرّرة | **0** |
| أخطاء 500 في 48 ساعة | 0 |
| منشآت منشورة بمحتوى كامل | ≥ 15 |
| زمن الرد على تذكرة دعم | ≤ 4 ساعات |

### ب. مؤشرات الموبايل (المرحلة 5) — شوف §4.10

| المؤشر | الهدف |
|---|---|
| معدل إتمام الحجز على الموبايل | +30% نسبي عن الأساس |
| Lighthouse Performance (Mobile) | ≥ 80 |
| Lighthouse Accessibility | ≥ 95 |
| LCP p75 ميداني | ≤ 2.5s |
| معدل الارتداد من القوائم على الموبايل | −20% نسبي |

### ج. مؤشرات التطبيق (المرحلة 6)

| المؤشر | الهدف |
|---|---|
| قبول في المتجرين | أندرويد خلال 14 يوم · iOS خلال 30 يوم (بحد أقصى جولتَي رفض) |
| معدل خلوّ من الأعطال (Crash-free) | ≥ 99.5% |
| معدل قبول إذن الإشعارات | ≥ 50% أندرويد · ≥ 35% iOS |
| نسبة الحجوزات من التطبيق بعد 3 شهور | ≥ 25% |
| استخدام ماسح QR من المزوّدين | ≥ 70% من تصاريح الدخول تُمسح بالكاميرا مش يدوي |

---

## 12. ملحق — الافتراضات غير المسنودة والادعاءات المحتاجة تحقّق

> **الغرض:** كل جملة في الوثيقة إمّا مسنودة بدليل من الكود/الـDB، أو مذكورة هنا كافتراض. مفيش منطقة رمادية.

| # | الادعاء | حالته | كيف يُتحقّق منه |
|---|---|---|---|
| A1 | «39 صفحة React، معظمها كاملة فعليًا مش هياكل» | **قراءة يدوية — مش تدقيق رسمي.** التدقيقات المرفقة غطّت نموذج البيانات والكونترولرز والمسارات، **مش اكتمال الواجهة** | تدقيق واجهة منفصل: لكل صفحة، هل فيها منطق أم placeholder؟ هل مربوطة ببيانات حقيقية؟ |
| A2 | «الغالبية العظمى من المعاملات `on_arrival`» | **افتراض** مبني على أن `Checkout.jsx:67` بيختاره افتراضيًا للحجز الجماعي. `bookings` = **0 صف** فمفيش أي دليل سلوكي | قِسه بعد أول 100 حجز حقيقي. **قرار مسار الدفع في التطبيق (§5.8) يتأثر بده** |
| A3 | «نسبة كبيرة من الترافيك المصري من in-app browsers» | **افتراض معقول بلا مصدر**، والموقع لسه ما اتنشرش | سجّل `document.referrer` + UA في أول شهر · لو أقل من 15%، قلّل استثمار §4.5 خطوة 20 |
| A4 | «طلب إذن الإشعارات بعد أول حجز بيرفع القبول للضِعف» | **رقم بلا مصدر.** الممارسة نفسها سليمة ومنطقية، الرقم لأ | A/B test بعد الإطلاق · أو ببساطة نفّذ الممارسة بلا وعد رقمي |
| A5 | «وجود التطبيق في المتجر بذاته أداة تسويقية للثقة» | **افتراض تسويقي معقول** لسوق السياحة الداخلية | قِس: نسبة تحويل مستخدمي التطبيق مقابل الويب بعد 3 شهور |
| A6 | «−300ms إلى −800ms على LCP من تحسين الخطوط» | **اتشال — كان بلا baseline** | قِس LCP قبل وبعد على WebPageTest 3G |
| A7 | «Capacitor يوفّر 100% إعادة استخدام» | **صحيح بشرط إنجاز §4.1–§4.4** — بدونها التطبيق موقع ديسكتوب مضغوط | معيار: التطبيق يعدّي مصفوفة أجهزة §4.9 |
| A8 | «Apple 3.1.3(e) تعفي الخدمات الفيزيائية من IAP» | **صحيح ومعمول به** (Booking.com, Uber) — بس **يتغيّر فورًا لو ضفت أي سلعة رقمية** | راجع السياسة عند كل إضافة منتج |
| A9 | «مطور واحد يخلّص بلوكر S في يوم» | **افتراض معايرة.** يعتمد على معرفة الشخص بالكود | عاير بعد أول أسبوع: كم بند S خلص فعليًا؟ اضبط باقي الجدول بالنسبة |
| A10 | «التوازي بين مطورين بكفاءة 65%» | **افتراض هندسي قياسي** | قِس من الأسبوع الثاني |
| A11 | «الـ~9,050 سطر خدمات جودة عالية» | **مُعدَّل في §2.4** — 8 موصولة، 3 جزئية، 3 ميتة/فاضية | مراجعة كود مستقلة لو مطلوب |
| A12 | «مصر سوق أندرويد بفارق ساحق» | **صحيح عمومًا** بس بلا رقم محدد هنا | راجع StatCounter لمصر قبل توزيع الجهد بين المنصتين |

---

## 13. الخلاصة في عشرة أسطر

1. **المنصة مش «جاهزة 100%»** — مسار الحجز **ما اتنفّذش ولا مرة** (`bookings` = 0 صف).
2. **أخطر بند وأرخصه:** الـcallbacks خارج استثناءات CSRF → **كل دفعة بطاقة 419**. الإصلاح ساعة، والأثر كل الإيراد الإلكتروني.
3. **المخزون بينزف بصمت** لأن `DEPLOY.md` بيقول «مش محتاجين cron» بينما `holds:release-expired` مجدول كل دقيقة.
4. **الأرقام الصادقة:** 36 بلوكر = 46–93 يوم عمل = **10–12 أسبوع لمطورين · 17–19 أسبوع لمطور واحد**. الرقم القديم (6 أسابيع) كان غلط رياضيًا.
5. **قلّص النطاق:** أطلق بالرحلات + الفنادق + المطاعم + السيارات + صاحب السعادة. أقفل الباصات والتوصيل **على مستوى الراوت** مش القائمة.
6. **من غير CRUD أنواع الغرف والترابيزات، المنصة مش قابلة للتشغيل حرفيًا** — أي فندق أو مطعم جديد = 404 عند «احجز».
7. **`HoldService::confirmBooking` شغّالة ومتعامَل معاها** (تصحيح على النسخة الأولى) — الناقص إشعار لبني آدم مش لوج.
8. **وضع الموبايل = ~113 ساعة ≈ 3.5–4 أسابيع** وأعلى ROI في الوثيقة — **بس بعد لوحات الإدخال**، مش قبلها.
9. **Capacitor هو القرار الصحيح** (تطبيق واحد، صفر API، 4.5–5 أسابيع) — بـ**shell محلي احتياطي** وخطة صريحة لرفض Apple 4.2.
10. **ابدأ النهارده:** KYC بوابة الدفع (3–6 أسابيع انتظار) · حسابات Apple/Google · واتساب أعمال · النسخ الاحتياطي وstaging على MySQL. **دي مسارات انتظار، مش مسارات شغل.**
