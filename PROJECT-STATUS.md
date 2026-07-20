# 📊 محفول مكفول — حالة المشروع الشاملة

> **آخر تحديث:** 2026-07-20 · **الحالة العامة:** الكود جاهز 100% للإطلاق · بانتظار عمليات النشر التجارية

---

## 🎯 الفهرس

1. [ما تم إنجازه بالتفصيل (7 مراحل)](#1-ما-تم-إنجازه-بالتفصيل)
2. [إحصائيات المشروع](#2-إحصائيات-المشروع)
3. [ما هو مطلوب للإطلاق (Operations)](#3-ما-هو-مطلوب-للإطلاق)
4. [ما لسّه فاضل في المخطط (Blueprint gaps)](#4-ما-لسّه-فاضل-في-المخطط)
5. [الخطوات التالية بالترتيب](#5-الخطوات-التالية-بالترتيب)

---

## 1. ما تم إنجازه بالتفصيل

### ✅ Phase A — أساس الواجهة (Shadcn UI Foundation)

**الهدف:** استبدال نظام `mk-*` القديم بمكونات Shadcn حديثة وأيقونات Lucide، على كل الصفحات.

**التنفيذ:**
- **14 مكون Shadcn** في `resources/js/Components/ui/`:
  - `button`, `label`, `separator`, `dialog`, `sheet`, `popover`, `select`
  - `checkbox`, `radio-group`, `dropdown-menu`, `avatar`, `skeleton`, `sonner`, `calendar`, `date-picker`
- استبدال **جميع الإيموجي** بأيقونات Lucide (~50+ استخدام)
- تحويل **Modal إلى Dialog** (وقف الأنماط القديمة)
- **Sonner Toaster** مربوط في SiteLayout + AdminLayout
- تنظيف `app.css` من **732 سطر → 68 سطر** (حذف كل `mk-*` القديمة)

---

### ✅ Phase B — محرك الحجز والدفع (Booking Engine)

#### B1: بيانات الحجز الأساسية
**الحقول الجديدة على `bookings`:**
- `booking_for` (self/other) — الحجز لنفسه أم لطرف آخر
- `beneficiary_name/national_id/age` — بيانات المستفيد للحجز لطرف آخر
- `payment_timing` (on_arrival | on_use | prepaid) — مصفوفة توقيت الدفع §5
- `amount_paid`, `cleaning_fee`, `security_deposit`, `security_deposit_status`
- `items_snapshot` (JSON) — لقطة السعر وقت الحجز
- `cancellation_policy_snapshot` + `cancellation_deadline` — سياسة إلغاء ثابتة وقت الحجز
- `cancelled_at`, `checked_in_at`, `no_show_at`, `forfeited_at`, `needs_review`

**الجداول الجديدة:**
- `age_pricing_tiers` — polymorphic (رضيع 0% / طفل 50% / بالغ 100%)
- `booking_guests` — عمر لكل فرد + tier_label + applied_price

**الخدمات (Services):**
- `AgePricingService` — يحسم شريحة كل فرد ويحسب المجموع
- `PaymentTimingService` — يطبّق مصفوفة الدفع (§5)
- `CancellationPolicyService` — snapshot السياسة وقت الحجز

#### B2: أنواع الغرف (Room Types)
**الجدول الجديد `room_types`:**
- `hotel_id`, `title`, `capacity_per_night`, `units_total`, `price_per_night`
- `sale_price_per_night`, `includes_breakfast`, `cancellation_policy_json`
- **Backfill migration** — كل فندق قديم اتحوّل ليه نوع غرفة افتراضي

**HasAvailability على RoomType:**
- `unit_type = 'room_type'` (بدل hotel)
- الحجز الفعلي بيمر بـRoomType (كل غرفة فعلية = `unit_index`)
- **الفندق دلوقتي أب — والغرفة هي وحدة الإتاحة الحقيقية**

---

### ✅ Phase C — الباصات والنقل (Transport Layer)

#### C1: نظام الباصات
**5 جداول:**
- `bus_stations` (name, city, lat, lng)
- `bus_routes` (from_station → to_station, duration_minutes, base_fare, provider_id)
- `bus_route_stations` (ترتيب المحطات على الخط)
- `bus_zones` (تسعير بالمناطق §10)
- `bus_trips` (رحلات مجدولة بمواعيد + سعة مقاعد)

**BusTrip كـHasAvailability** — العميل يحجز مقعد على رحلة محدّدة (`unit_type='bus_trip'`).

#### C2: خيارات النقل (§6)
- عمود `transport_mode` على `bookings`: `own_car` / `bus` / `rented_car`
- عمود `bus_trip_id` (nullable) — لو الاختيار "أحجز باص"
- عمود `transport_details` (JSON) — بيانات إضافية

#### C3: تصاريح دخول QR
**الجدول `entry_passes`:**
- `code` (EP-XXXX-XXXX-XXXX)
- `qr_payload` (JSON بتوقيع HMAC-SHA256)
- `valid_from`, `valid_until`, `status` (active/used/expired)
- `scanned_at`, `scanned_by`

**EntryPassService:** إصدار + verify + markUsed

**صفحة `/buses` عامة** — عرض كل الرحلات المجدولة

---

### ✅ Phase D — منصة المزوّدين (Providers Platform)

#### D1: بنية المزوّد
**الجدول `companies`:**
- `user_id`, `provider_type` (company/individual), `name`, `slug`, `logo`, `about`
- `phone`, `email`, `national_id`, `license_no`, `license_authority`
- `verification_status` (pending / verified / rejected / suspended)
- `is_first_party` (مكفول طرف أول)
- `provider_review_score`, `provider_review_count` — مجمّع من كل الخدمات
- `commission_rate_override`, `admin_notes`
- `approved_at`, `approved_by`

**الجدول `provider_documents`:**
- `doc_type`: commercial_register / tax_card / tourism_license / national_id / criminal_record (فيش وتشبيه) / other
- الأفراد يرفعون **فيش وتشبيه** إلزامي

#### D2: publish_state على كل الخدمات
**كل الخدمات (tours/hotels/restaurants/cars/sahb_packages) اتضاف عليها:**
- `provider_id` (nullable — NULL = طرف أول)
- `publish_state` (draft / pending_review / published / rejected)
- `submitted_at`, `reviewed_at`, `reviewed_by`, `rejection_reason`

**HasProvider trait:**
- `scopePublished()`, `scopePendingReview()`, `scopeDrafts()`, `scopeFirstParty()`

#### D3: تسجيل مزوّد + موافقة أدمن
- **`/provider/register`** — صفحة تسجيل منفصلة (تنشئ user role=vendor + company pending)
- **`/admin/approvals`** — لوحة موافقات مع 3 stat cards (pending providers / services / verified)
- Reject dialog مع سبب رفض
- 3 endpoints: approve/reject للـproviders والـservices والـdocuments

---

### ✅ Phase E — إكمال كتالوج الخدمات

#### E1: المطاعم (§9)
**حقول جديدة على `restaurants`:**
- `venue_type` (restaurant / cafe)
- `service_fee_inclusive`, `tax_inclusive` (بولين)
- `service_fee_pct`, `tax_pct` (نسبة الرسوم/الضريبة)
- `slot_minutes` (مدة الحجز الافتراضية)

**الجداول الجديدة:**
- `restaurant_tables` — ترابيزات فعلية (code, label, capacity, area)
- `restaurant_menu_sections` — أقسام المنيو (مقبلات/مشويات/…)
- `restaurant_menu_items` — عناصر المنيو (title, description, price, image, tags, is_signature)

**RestaurantTable كـHasAvailability:**
- `unit_type = 'restaurant_table'`, slot = HH:MM (وقت الحجز)
- كل ترابيزة = وحدة واحدة (`inventoryCount = 1`)

#### E2: الرحلات (§8)
**الجداول الجديدة:**
- `activities` — فعاليات اختيارية (add-ons بسعر)
- `tour_itineraries` — مخطط زمني يوم بيوم (day_number, title, description, highlights)

#### E3: العميل — عناوين متعددة (§12)
**الجدول `user_addresses`:**
- `label` (البيت / الشغل / الساحل / مخصص)
- `address`, `city`, `lat`, `lng`, `notes`
- `is_default` (auto-flip عند تعيين واحد جديد)

#### E4: توسعة الحجز
**حقول جديدة على `bookings`:**
- `restaurant_table_id` (FK)
- `start_time` (HH:MM للحجز الزمني)
- `addons_snapshot` (JSON — الفعاليات المختارة مع الأسعار)

#### E5: صفحات UI جديدة
- `Restaurants/Show.jsx` — تابات المنيو + اختيار ترابيزة بحسب السعة + slot picker
- `Tours/Show.jsx` — checkboxes للفعاليات (defaults ON) + مخطط زمني
- `Account/Addresses.jsx` — CRUD كامل بـDialog + أيقونات ذكية للـlabels

---

### ✅ Phase F — القيمة والتخصيص والدعم والتوصيل

#### F1: ValueScoreService (§12)
**"أفضل قيمة مقابل السعر"** داخل النوع الواحد فقط:
- **معادلة:** `(review×40% + guarantee×25% + activities×15% + price×20%)`
- أوزان قابلة للضبط من `settings`
- **Sort=value** في Tours Index
- **شارة "⭐ أفضل قيمة"** لـtop 20% داخل النوع

#### F2: PersonalizationService (§12)
- **haversine** حساب مسافة بدون API خارجي
- **`resolveUserLocation`** من geolocation لحظي أو عنوان محفوظ
- **`rankRestaurants`** بمعادلة مركّبة:
  `-distance + boost(history) + review_score×10`
- **history boost:** +30 لو قيّم المطعم عالي · +15 لو زاره قبل
- UI في Restaurants Index: زر "حدّد موقعي" + شارة "💫 ليك"

#### F3: نظام الدعم الفني (§15)
**جدولان:**
- `support_tickets` (code SP-YYYY-XXXXXX, subject, category, status, priority, assigned_to)
- `support_ticket_messages` (body, is_internal)

**واجهات العميل (`/account/support`):**
- قائمة تذاكر · فتح تذكرة · محادثة

**لوحة الدعم (`/support` — role=support|admin):**
- Dashboard بـ4 stats + 5 فلاتر (مفتوحة/غير مسندة/تذاكري/محلولة/الكل)
- ملاحظات داخلية (العميل ما يشوفهاش)
- إسناد تلقائي + تغيير حالة مع الرد

#### F4: تجميع تقييمات المزوّد (§13)
- **ProviderRatingService** — يحسب المتوسط الموزّن عبر كل خدمات المزوّد
- **ReviewObserver** — يحدّث `provider_review_score` تلقائياً عند أي تقييم
- **بروفايل عام `/providers/{slug}`** — لوجو + تقييم مجمّع + توزيع حسب النوع + كل الخدمات + آخر التقييمات

#### F5: خدمات التوصيل (§11)
**جدولان:**
- `delivery_services` — شركات + أفراد (base_fare, price_per_km, min_fare, service_radius_km, vehicle_type)
- `delivery_orders` — طلبات (pickup, dropoff, distance_km, estimated_fare, status)

**DeliveryController:**
- `index` — قائمة بترتيب "الأقرب لك"
- `estimate` — Live fare calculation
- `store` + `confirm` — إنشاء وتأكيد طلب

**UI:**
- `/delivery` — اختيار خدمة + حساب الأجرة الفوري + طلب
- صفحة تأكيد بـcode `DL-YYYY-XXXXXX`

---

### ✅ Phase G — لوحة إحصائيات الأدمن (§15.1)

**AnalyticsController بـ9 endpoints:**
- `/admin/analytics` — الصفحة
- `kpi`, `bookings-over-time`, `bookings-by-type`, `payment-methods`
- `top-providers`, `customers-growth`, `support-tickets`, `bookings-heatmap`

**UI (`Admin/Analytics/Index.jsx`):**
- **6 KPI Cards** (عملاء · حجوزات · إيرادات · تقييم · مزوّدون · تذاكر)
- **6 مخططات Chart.js**: Line (bookings/revenue) · Bar (by type) · Doughnut (payments) · Bar horizontal (top providers) · Line (customer growth) · Bar (support categories)
- **1 D3.js Heatmap** — كثافة الحجوزات (يوم × ساعة)
- **فلتر مدى زمني:** 7d / 30d / 90d / 12m / all
- بألوان الهوية (كورال/نيفي/مكفول/VIP)

---

### ✅ Waves الإنتاج (بعد Phase G)

#### Wave 1 — أمان المنصة
1. **ReleaseExpiredHolds cron** — `everyMinute()->withoutOverlapping()`
2. **8 rate limiters:**
   - `login` — 5/دقيقة/IP+email
   - `register` — 3/ساعة/IP
   - `provider-register` — 2/ساعة/IP
   - `password` — 3/15 دقيقة
   - `booking` — 10/دقيقة/user
   - `support` — 5/ساعة/user
   - `actions` (reviews/wishlist) — 30/دقيقة
   - `api` — 60/دقيقة
3. **Cache locks** — HoldService يستخدم `Cache::lock` (جاهز لـRedis production)

#### Wave 2 — عمليات المزوّد
1. **`/vendor/scanner`** — قارئ QR بواجهة كاملة (verify + markUsed + سجل آخر المسحوبين)
2. **`/vendor/earnings`** — Dashboard الأرباح (Chart.js شهري + جدول آخر الحجوزات + banking form)
3. **حقول بنكية على `companies`:**
   - `tax_id`, `bank_holder`, `bank_iban`, `bank_name`
   - `total_paid_out`, `total_pending_settlement`

#### Wave 3 — جودة البيانات + المراقبة
1. **LocationsSeeder** — **12 مدينة مصرية** بإحداثيات lat/lng حقيقية (شرم/غردقة/سيوة/أقصر/دهب/قاهرة/سخنة/إسكندرية/مطروح/سدر/طابا/أسوان)
2. **AgePricingSeeder** — شرائح رضيع/طفل/بالغ لكل الرحلات والباقات
3. **CatalogSeeder** — منيو حقيقي + ترابيزات + فعاليات + مخطط زمني للبيانات الافتراضية
4. **HealthController** — `/health` يفحص: DB · Cache · Holds engine · Storage — بيرجع 503 لو حاجة مكسورة
5. **`php artisan test:e2e`** — smoke test شامل بـ**9 اختبارات** كلها passing

#### Wave 4 — وثائق الإنتاج
1. **`.env.production.example`** — قالب كامل بكل المفاتيح (Paymob/Fawry/SMTP/Redis/MySQL/S3/Sentry)
2. **`LAUNCH.md`** — Checklist خطوة بخطوة (البنية + الحسابات + النشر + Nginx + الفحص النهائي + الإطلاق التدريجي + Disaster recovery)

---

### ✅ الشعار والتخصيصات النهائية
- **Favicon** — `logo-t.png` في التبويب (32x32 + 192x192 + Apple touch + theme-color #363677)
- **Footer logo** — `logo_white_transparent.png` (48px، وقت الرفع كملف عادي)
- **RTL polish** — صفحة الـcheckout: بطاقات النقل بالأيقونة على اليمين + النص من اليمين + payment methods بدون radio circles

---

## 2. إحصائيات المشروع

| المكوّن | العدد |
|---|---|
| **Migrations** | 27 migration |
| **Models** | 30+ model |
| **Controllers (Web)** | 18 controller (شامل Admin/Vendor/Support) |
| **Services** | 10+ service (Booking/Availability/Payments/Personalization/ValueScore/ProviderRating) |
| **Traits** | 4 traits (Bookable, HasAvailability, HasProvider, Concerns/*) |
| **صفحات Inertia (JSX)** | 40+ صفحة |
| **مكونات UI** | 14 Shadcn primitive + 20+ مركّبة |
| **Routes** | 90+ endpoint (public + admin + vendor + support) |
| **Rate limiters** | 8 |
| **E2E tests passing** | 9/9 ✅ |
| **Health checks** | 5 (app/db/cache/holds/storage) |
| **Cron jobs** | ReleaseExpiredHolds كل دقيقة |
| **Chart.js charts** | 6 + 1 D3 heatmap |

---

## 3. ما هو مطلوب للإطلاق

### 🟡 عمليات (Non-Code) — 10-14 يوم

#### يوم 1-2: البنية التحتية
- [ ] **VPS** — Ubuntu 22.04، 4GB RAM+ (Hetzner/DigitalOcean/AWS)
- [ ] **Domain** — `mahfolmakfol.com` + DNS
- [ ] **SSL** — Let's Encrypt أو Cloudflare
- [ ] تنصيب PHP 8.3 + extensions + Composer + Node 20 + npm
- [ ] **MySQL 8.0** (لا MariaDB — §0)
- [ ] **Redis 7+** (للـcache locks — إلزامي)
- [ ] Nginx + PHP-FPM + Supervisor

#### يوم 3-7: الحسابات التجارية (يمكن يمشوا بالتوازي)
- [ ] **Paymob** — تسجيل تجاري + استلام مفاتيح (`API_KEY`, `INTEGRATION_ID_CARD/WALLET`, `IFRAME_ID`, `HMAC_SECRET`) · 3-5 يوم موافقة
- [ ] **Fawry** (اختياري) — نفس المسار
- [ ] **SMTP** — اشتراك Postmark ($15/شهر) أو SendGrid (100/يوم مجاناً)
- [ ] **Sentry** — حساب مجاني (5k events/شهر)
- [ ] **UptimeRobot** أو **BetterStack** — مراقبة `/health`

#### يوم 8: النشر
- [ ] Clone repo + `cp .env.production.example .env` + ملء المفاتيح
- [ ] `composer install --no-dev` + `npm ci && npm run build`
- [ ] `php artisan migrate --force` + `db:seed --class=LocationsSeeder,PagesSeeder`
- [ ] إعداد Nginx (config في [LAUNCH.md](LAUNCH.md))
- [ ] إعداد supervisor للـqueue worker
- [ ] إعداد cron `* * * * * php artisan schedule:run`
- [ ] تشغيل `php artisan test:e2e` — لازم 9/9 pass
- [ ] فحص `/health` — لازم كله green

#### يوم 9-14: المحتوى الحقيقي (يعتمد على فريقك التشغيلي)
- [ ] **10 فنادق حقيقية** (لوجو + صور + أسعار + سياسة إلغاء)
- [ ] **10 رحلات** بمخطط زمني + فعاليات
- [ ] **15 مطعم** بترابيزات + منيو + رسوم/ضريبة
- [ ] **5 عربيات إيجار** لكل مدينة كبيرة
- [ ] **3 خطوط باص** بمحطات ومناطق
- [ ] **5 مزوّدين توصيل** موقعين تعاقد
- [ ] **صور رسمية** لكل الخدمات (720x480+ WebP)
- [ ] **1-3 مزوّدين beta** لاختبار flow الموافقات

---

## 4. ما لسّه فاضل في المخطط

### 🟠 أشياء البلوبرنت ذكرها ولم يتم كودها بعد

هي حاجات nice-to-have، **مش blocker** للإطلاق، لكن الأفضل تُنفّذ في Sprint 2 بعد الإطلاق.

#### 4.1 إدارة موظفي الدعم من الأدمن (§1 · §15)
> **البلوبرنت:** "الدعم الفني … الأدمن فقط ينشئ الحساب"

**الفاضل:** صفحة في الأدمن لإضافة/إدارة موظفي الدعم (Users CRUD مع role=support).

**تقدير الوقت:** 2-3 ساعات.

#### 4.2 التخصيص للفنادق والرحلات (§12)
> **الحالي:** المطاعم فقط عندها Personalization كامل (proximity + history boost).

**الفاضل:** توسيع `rankRestaurants` لـ`rankHotels` و`rankTours` — نفس المعادلة.

**تقدير الوقت:** 3-4 ساعات.

#### 4.3 no-show automation (§7)
> **البلوبرنت:** "no-show → يُصادَر كامل المبلغ المدفوع مسبقًا"

**الحالي:** الحقول موجودة (`no_show_at`, `forfeited_at`) والـservice `CancellationPolicyService` موجود.

**الفاضل:** cron job `HandleNoShows` — يشغّل بعد نهاية تاريخ الحجز بـ24 ساعة ولو مفيش `checked_in_at` → mark no-show + forfeit.

**تقدير الوقت:** 2 ساعات.

#### 4.4 موثوقية العميل (§7)
> **البلوبرنت:** "قد يُطلب دفع مسبق من متكرري التخلّف"

**الفاضل:**
- عمود `reliability_score` على `users` (يتراوح 0-100)
- ينقص كل no-show
- لو نزل عن حد معين → `PaymentTimingService` يفرض prepaid حتى لو self

**تقدير الوقت:** 3 ساعات.

#### 4.5 تسويات الأدمن (§15)
> **البلوبرنت:** "التسويات" في مهام الأدمن.

**الحالي:** المزوّد يشوف أرباحه في `/vendor/earnings`. لكن الأدمن ما بيقدرش يعمل settlement run فعلي.

**الفاضل:**
- صفحة `/admin/settlements` — قائمة المزوّدين مع pending amounts
- زر "Mark as paid" — بيحدّث `total_paid_out` و`total_pending_settlement`
- Export CSV لبيانات التحويلات البنكية

**تقدير الوقت:** 4-6 ساعات.

#### 4.6 التقارير القابلة للتصدير (§15)
> **البلوبرنت:** "التقارير" في مهام الأدمن.

**الحالي:** `/admin/analytics` بيعرض charts. لكن مافيش export.

**الفاضل:**
- Export CSV/Excel لأي مخطط من الـanalytics
- تقرير مالي شهري (revenue + commission + settlement due) قابل للطباعة
- تقرير جودة (avg rating, complaints breakdown)

**تقدير الوقت:** 4-5 ساعات.

#### 4.7 خريطة مصر (Choropleth) (§15.1)
> **البلوبرنت:** "Choropleth بسيط لخريطة مصر بتوزيع الحجوزات حسب المحافظة"

**الحالي:** Heatmap يوم/ساعة موجود بـD3.

**الفاضل:** خريطة مصر SVG + توزيع الحجوزات على المحافظات.

**تقدير الوقت:** 3-4 ساعات (يحتاج SVG map للمحافظات).

#### 4.8 SEO + Sitemap
> **البلوبرنت:** لم يذكرها صراحةً لكن مطلوبة للإطلاق التسويقي.

**الفاضل:**
- Meta tags ديناميكية لكل صفحة (og:image, og:description)
- `/sitemap.xml` تلقائي من كل الخدمات المنشورة
- `robots.txt` (الأساسي موجود)
- Schema.org structured data للفنادق/الرحلات

**تقدير الوقت:** 4 ساعات.

#### 4.9 Multi-language (اختياري)
> **البلوبرنت:** لم يذكرها.

**الفاضل:** إنجليزي (السائحين الأجانب) — Laravel localization + مبدّل لغة.

**تقدير الوقت:** يوم كامل — لكن مؤجل للإطلاق الأول (المصريين المستهدفين).

---

### 🔴 حاجات production لسه لم يتم setup لأنها تحتاج بنية خارجية

هي مش gaps في الكود — الكود جاهز يستخدمها. بس محتاجة تفعيل.

| المكوّن | ليه | الحل |
|---|---|---|
| **MySQL Production** | dev محلي على SQLite | migrate DB لـMySQL 8 عند deploy |
| **Redis Cache/Queue** | dev على DB driver | تفعيل Redis وتغيير `.env` |
| **Paymob keys** | dev بـmock | تسجيل تجاري + مفاتيح live |
| **SMTP** | dev بـlog driver | Postmark/SendGrid |
| **Sentry** | لا يوجد | حساب + `SENTRY_LARAVEL_DSN` |
| **S3 (اختياري)** | dev على local disk | لو الصور كتير: S3 + Cloudfront |
| **Backup automation** | لا يوجد | script `mysqldump` + upload يومي |

**تقدير الوقت:** كله في LAUNCH.md — يوم واحد devops.

---

## 5. الخطوات التالية بالترتيب

### Sprint 1 (Week 1) — الإطلاق التقني
اتبع [LAUNCH.md](LAUNCH.md) خطوة بخطوة:
1. Setup البنية (يومان)
2. تفعيل الحسابات (3-5 أيام موازية)
3. Deploy (نصف يوم)
4. E2E test + `/health` verification (نصف يوم)

### Sprint 2 (Week 2) — Soft Launch
- 50 عميل beta بدعوة
- 3 مزوّدين أولّين
- مراقبة 24/7
- تصحيح أي مشاكل تظهر

### Sprint 3 (Week 3) — Public Launch
- إعلانات محدودة (شرم/الغردقة)
- Cap 500 حجز/يوم
- Sentry alerts على أي spike

### Sprint 4 (Week 4) — Full Public + Backlog
- Cap مفتوح
- إعلانات كاملة
- **البدء في تنفيذ §4.1 → §4.6** من الـblueprint gaps بالتوازي

### Post-Launch (شهر 2-3)
- إضافة الـblueprint gaps (settlements, no-show automation, reliability, reports)
- SEO + Sitemap لتحسين الترتيب
- خريطة المحافظات
- تقييم إضافة الإنجليزي حسب المستخدمين

---

## 📎 ملفات مرجعية

- **[V2-BLUEPRINT.md](V2-BLUEPRINT.md)** — مصدر الحقيقة للمخطط
- **[LAUNCH.md](LAUNCH.md)** — دليل النشر التفصيلي
- **[.env.production.example](.env.production.example)** — قالب متغيرات البيئة
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — ⚠️ ملغى (v1)
- **[README.md](README.md)** — نظرة عامة سريعة

---

**الخلاصة:** المشروع تقنياً **مكتمل ومختبَر**. الإطلاق للسوق يعتمد فقط على تفعيل الحسابات التجارية وتوفير المحتوى الحقيقي. الـblueprint gaps المتبقية nice-to-have، تُنفَّذ في Sprint 2+ بعد الإطلاق بلا أي مشكلة.
