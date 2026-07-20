# 🚀 محفول مكفول — Launch Checklist

خطوات الإطلاق للسوق المصري — من "الكود جاهز" إلى "المنصة شغالة على `mahfolmakfol.com`".

---

## 📋 الجاهزية الحالية

| المكوّن | الحالة |
|---|---|
| ✅ الوظائف كاملة (Phase A→G) | 100% كود منفّذ ومختبر |
| ✅ E2E tests | 9/9 passing (`php artisan test:e2e`) |
| ✅ Health check | `/health` يرجع JSON مفصّل |
| ✅ Rate limiting | 8 limiters على كل المسارات الحسّاسة |
| ✅ Availability engine | 3 طبقات، اختُبر ضد overbooking |
| ✅ Cron ReleaseExpiredHolds | مربوط `everyMinute()->withoutOverlapping()` |
| ✅ QR scanner | جاهز في `/vendor/scanner` |
| ✅ Vendor earnings + banking | جاهز في `/vendor/earnings` |
| ✅ Admin analytics (Chart.js + D3) | جاهز في `/admin/analytics` |
| ✅ Support system (عميل + دعم) | جاهز |
| ⚠️ MySQL + Redis production | **يحتاج devops** |
| ⚠️ Payment gateway keys | **يحتاج تفعيل تجاري** |
| ⚠️ SMTP credentials | **يحتاج اشتراك** |
| ⚠️ Domain + SSL + Server | **يحتاج شراء + DNS** |
| ⚠️ Real content (فنادق حقيقية) | **يحتاج فريق مبيعات** |

---

## 🎯 Pre-Launch Checklist (خطوة بخطوة)

### 1️⃣ البنية التحتية (يوم واحد devops)

- [ ] **VPS**: 2 CPU / 4GB RAM على الأقل (DigitalOcean/Hetzner) — Ubuntu 22.04
- [ ] **Domain**: شراء `mahfolmakfol.com` + إعداد DNS
- [ ] **SSL**: Let's Encrypt عبر certbot أو Cloudflare Free
- [ ] **PHP 8.3** + extensions: `bcmath`, `intl`, `mbstring`, `pdo_mysql`, `redis`, `zip`, `gd`, `curl`, `openssl`
- [ ] **MySQL 8.0** (لا MariaDB — راجع §0 من BLUEPRINT)
- [ ] **Redis 7+** (للـcache locks — إلزامي للتزامن العالي)
- [ ] **Nginx** + PHP-FPM
- [ ] **Node.js 20** + npm (لبناء الأصول)
- [ ] **Supervisor** (لتشغيل queue workers)

### 2️⃣ الحسابات التجارية (يومان — parallel)

- [ ] **Paymob**: تسجيل تجاري → استلام `API_KEY`, `INTEGRATION_ID_CARD`, `INTEGRATION_ID_WALLET`, `IFRAME_ID`, `HMAC_SECRET`
  - رابط: https://accept.paymob.com/portal2/en/register
  - المستندات المطلوبة: سجل تجاري + بطاقة ضريبية + IBAN
- [ ] **Fawry** (اختياري): مسار مماثل عبر Fawry Business Portal
- [ ] **البريد**: اختر أحد الاتنين:
  - Postmark (سريع + رخيص للتحققات) — $15/شهر لأول 10k رسالة
  - SendGrid — 100 رسالة يومياً مجاناً
- [ ] **Sentry** (لتتبع الأخطاء): مجاني حتى 5k event/شهر — https://sentry.io

### 3️⃣ نشر الكود (30 دقيقة)

```bash
# على السيرفر
cd /var/www
git clone <repo> mahfolmakfol
cd mahfolmakfol

# البيئة
cp .env.production.example .env
nano .env                              # املأ كل القيم
php artisan key:generate

# التبعيات
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# قاعدة البيانات
php artisan migrate --force
php artisan db:seed --class=LocationsSeeder    # المدن بإحداثيات فعلية
php artisan db:seed --class=PagesSeeder        # صفحات المحتوى الثابت
# ❌ لا تشغّل DatabaseSeeder الكامل — يحتوي على بيانات تجريبية
# ✅ بدلاً منه: أضف الفنادق/المطاعم الحقيقية من لوحة الأدمن

# الأصول
php artisan storage:link
php artisan optimize                   # config + routes + views cache

# الصلاحيات
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### 4️⃣ إعداد الـScheduler + Queue

```bash
# 1) Cron — سطر واحد
sudo crontab -e -u www-data
# أضف:
* * * * * cd /var/www/mahfolmakfol && php artisan schedule:run >> /dev/null 2>&1

# 2) Supervisor للـqueue worker
sudo nano /etc/supervisor/conf.d/mahfol-worker.conf
```

محتوى ملف supervisor:
```ini
[program:mahfol-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/mahfolmakfol/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/mahfolmakfol/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start mahfol-worker:*
```

### 5️⃣ إعداد Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name mahfolmakfol.com www.mahfolmakfol.com;

    root /var/www/mahfolmakfol/public;
    index index.php;

    ssl_certificate /etc/letsencrypt/live/mahfolmakfol.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mahfolmakfol.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Rate limit على مستوى Nginx كطبقة دفاع إضافية
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    location /login { limit_req zone=login burst=5 nodelay; try_files $uri $uri/ /index.php?$query_string; }
}

server {
    listen 80;
    server_name mahfolmakfol.com www.mahfolmakfol.com;
    return 301 https://$server_name$request_uri;
}
```

### 6️⃣ الفحوصات النهائية

بعد النشر، شغّل قبل ما تعلن الإطلاق:

```bash
# 1. E2E test — لازم يعدّي كله
php artisan test:e2e

# 2. Health endpoint
curl https://mahfolmakfol.com/health | jq

# 3. تأكد إن الـscheduler شغّال
tail -f storage/logs/laravel.log
# لازم تشوف "ReleaseExpiredHolds" كل دقيقة

# 4. اختبار حجز حقيقي بمبلغ 1 جنيه (Paymob test mode)
# ثم بمبلغ حقيقي بعد تأكيد التدفّق

# 5. تحقق من الـSSL
curl -I https://mahfolmakfol.com | head
# لازم: HTTP/2 200 + Strict-Transport-Security
```

### 7️⃣ المحتوى (يحتاج فريق تشغيلي)

- [ ] **10 فنادق حقيقية** (بلوجو + صور + أسعار حقيقية)
- [ ] **10 رحلات** (شرم/الغردقة/سيوة/الأقصر) بمخطط زمني كامل
- [ ] **15 مطعم** (القاهرة/الإسكندرية) بترابيزات + منيو حقيقي
- [ ] **5 عربيات إيجار** لكل مدينة رئيسية
- [ ] **3 خطوط باص** (القاهرة↔ساحل شمالي، القاهرة↔الغردقة، القاهرة↔أسوان)
- [ ] **5 مزوّدين توصيل** موقّعين تعاقد
- [ ] **صور رسمية** لكل الخدمات (720x480 على الأقل، WebP مضغوطة)

### 8️⃣ الإطلاق التدريجي (Soft Launch → Public)

**Week 1 — Soft Launch:**
- 50 عميل beta بدعوة خاصة
- 3 مزوّدين أول
- مراقبة `/health` كل 5 دقايق
- Sentry + logs مفتوحة على الشاشة

**Week 2 — Limited Public:**
- افتح للجمهور مع cap أقصى 500 حجز/يوم (via feature flag)
- إعلانات محدودة (Facebook/Instagram) على شرم + الغردقة فقط

**Week 3 — Full Launch:**
- Cap مفتوح
- إعلانات كاملة
- PR (صحف + مؤثرين محليين)

---

## 🔥 Post-Launch Monitoring

### Uptime Monitors (مجاناً)
- **UptimeRobot** أو **BetterStack**: ping على `/health` كل 5 دقائق
- **Alerts**: SMS/WhatsApp لو `/health` رجّع 503

### KPIs اليومية (من `/admin/analytics`)
- عدد الحجوزات
- نسبة الحجوزات الملغية
- زمن الاستجابة (من Nginx access log)
- عدد الأخطاء (من Sentry)

### أول 48 ساعة — حاجات لازم تراقبها
1. **`expired_holds_pending_release`** في `/health` — لو زاد عن 20 → cron واقف
2. **Payment webhook errors** — Paymob dashboard
3. **Support tickets الحقيقية** — رد خلال ساعة أول أسبوع
4. **Sentry error rate** — أي spike ≥ 10 errors/دقيقة → investigate

---

## 🆘 خطة استرداد الكوارث (Disaster Recovery)

- **Backup DB يومي**: `mysqldump` + upload لـS3 (script في crontab)
- **Backup storage/app يومي**: ملفات الصور + المستندات المرفوعة
- **Recovery Time Objective (RTO)**: 30 دقيقة
- **Recovery Point Objective (RPO)**: 24 ساعة

---

## ✅ الجواب الصريح: هل جاهزين للإطلاق؟

**نعم، تقنياً — على مستوى الكود المشروع 100% جاهز.**

اللي فاضل **مش كود** — تنفيذ operations:
1. شراء VPS + دومين (1 يوم)
2. تفعيل Paymob تجاري (3-5 أيام)
3. اشتراك بريد + Sentry (1 ساعة)
4. Deploy على السيرفر (2 ساعة)
5. إدخال محتوى حقيقي (يعتمد على فريقك — أسبوع)

**التوقّع المُتفائل: 10-14 يوم من دلوقتي وإنت شغّال في السوق.**
