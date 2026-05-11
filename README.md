# راهنمای استقرار روی VPS — Athletes Survey App

پروژه یک اپلیکیشن پرسشنامه چندمرحله‌ای برای ورزشکاران مردان استان مازندران است.

---

## معماری سیستم

```
اینترنت → Nginx (80/443)
              ├── /api/*  →  API Server  (Express, port 8080)
              └── /*      →  فایل‌های استاتیک React (dist/)
```

- **فرانت‌اند:** React + Vite (build استاتیک)
- **بک‌اند:** Express.js (Node.js)
- **دیتابیس:** PostgreSQL
- **پروسس منیجر:** PM2

---

## پیش‌نیازها

### نسخه‌های موردنیاز

| ابزار | نسخه |
|-------|-------|
| Node.js | 22 یا بالاتر (توصیه: 24) |
| pnpm | 10 یا بالاتر |
| PostgreSQL | 14 یا بالاتر |
| Nginx | هر نسخه پایدار |
| PM2 | آخرین نسخه |

### نصب روی Ubuntu/Debian

```bash
# Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm@latest

# PM2
npm install -g pm2

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Nginx
sudo apt-get install -y nginx
```

---

## ۱. آماده‌سازی دیتابیس

```bash
# ورود به PostgreSQL
sudo -u postgres psql

# ساخت کاربر و دیتابیس
CREATE USER survey_user WITH PASSWORD 'رمز_قوی_بگذارید';
CREATE DATABASE survey_db OWNER survey_user;
GRANT ALL PRIVILEGES ON DATABASE survey_db TO survey_user;
\q
```

---

## ۲. دریافت کد و نصب وابستگی‌ها

```bash
# کلون یا آپلود پروژه
git clone <آدرس-ریپو> /var/www/survey-app
cd /var/www/survey-app

# نصب تمام وابستگی‌ها
pnpm install --frozen-lockfile
```

---

## ۳. تنظیم متغیرهای محیطی

یک فایل `.env` در مسیر روت پروژه بسازید:

```bash
nano /var/www/survey-app/.env
```

محتوای فایل:

```env
# اتصال دیتابیس
DATABASE_URL=postgresql://survey_user:رمز_قوی_بگذارید@localhost:5432/survey_db

# رمز رمزنگاری session (یک رشته تصادفی طولانی)
SESSION_SECRET=یک_رشته_تصادفی_خیلی_طولانی_و_امن_بگذارید

# رمز ورود به پنل ادمین (پیش‌فرض: admin1234)
ADMIN_PASSWORD=رمز_ادمین_قوی

# محیط اجرا
NODE_ENV=production
PORT=8080
```

> **نکته امنیتی:** فایل `.env` نباید هرگز در git کامیت شود. از `openssl rand -hex 32` برای ساخت SESSION_SECRET استفاده کنید.

---

## ۴. مایگریشن دیتابیس (ساخت جداول)

```bash
cd /var/www/survey-app

# بارگذاری متغیرهای محیطی و اجرای push schema
export $(cat .env | grep -v '#' | xargs)
pnpm --filter @workspace/db run push
```

---

## ۵. بیلد پروژه

```bash
cd /var/www/survey-app

# بیلد API Server
pnpm --filter @workspace/api-server run build

# بیلد فرانت‌اند (فایل‌های استاتیک)
pnpm --filter @workspace/survey-app run build
```

فایل‌های خروجی:
- **API:** `artifacts/api-server/dist/index.mjs`
- **فرانت‌اند:** `artifacts/survey-app/dist/`

---

## ۶. راه‌اندازی با PM2

یک فایل `ecosystem.config.cjs` در روت پروژه بسازید:

```bash
nano /var/www/survey-app/ecosystem.config.cjs
```

محتوا:

```javascript
module.exports = {
  apps: [
    {
      name: "survey-api",
      script: "artifacts/api-server/dist/index.mjs",
      cwd: "/var/www/survey-app",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "8080",
        DATABASE_URL: "postgresql://survey_user:رمز_قوی_بگذارید@localhost:5432/survey_db",
        SESSION_SECRET: "همان_مقدار_session_secret",
        ADMIN_PASSWORD: "رمز_ادمین_قوی",
      },
    },
  ],
};
```

سپس اجرا کنید:

```bash
cd /var/www/survey-app

# شروع سرویس
pm2 start ecosystem.config.cjs

# ذخیره برای auto-start بعد از reboot
pm2 save
pm2 startup  # دستور خروجی را اجرا کنید
```

---

## ۷. تنظیم Nginx

```bash
sudo nano /etc/nginx/sites-available/survey-app
```

محتوا (بدون SSL - برای HTTP):

```nginx
server {
    listen 80;
    server_name your-domain.com;  # دامنه یا IP سرور خود را بگذارید

    # فایل‌های استاتیک فرانت‌اند
    root /var/www/survey-app/artifacts/survey-app/dist;
    index index.html;

    # گزیپ برای performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # مسیر API → پروکسی به Express
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    # SPA fallback — همه مسیرها به index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

فعال‌سازی:

```bash
sudo ln -s /etc/nginx/sites-available/survey-app /etc/nginx/sites-enabled/
sudo nginx -t          # تست پیکربندی
sudo systemctl reload nginx
```

---

## ۸. SSL با Let's Encrypt (اختیاری اما توصیه‌شده)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run   # تست تجدید خودکار
```

---

## بررسی سلامت سیستم

```bash
# وضعیت PM2
pm2 status
pm2 logs survey-api

# تست API
curl http://localhost:8080/api/healthz

# تست از طریق Nginx
curl http://your-domain.com/api/healthz
```

---

## به‌روزرسانی پروژه (نسخه جدید — وقتی نسخه قبل در حال اجراست)

این بخش فرض می‌کند نسخه قبلی روی `/var/www/survey-app` با PM2 در حال اجراست.

### تغییرات این نسخه نسبت به قبلی

| تغییر | نیاز به اقدام |
|-------|--------------|
| ستون `scores` به جدول `submissions` اضافه شد | ✅ مایگریشن دیتابیس (مرحله ۳) |
| صفحه نتایج شخصی‌سازی‌شده برای کاربر | ✅ بیلد مجدد فرانت‌اند |
| داشبورد ادمین با نمودارهای امتیاز روانشناختی | ✅ بیلد مجدد فرانت‌اند |
| API آمار با میانگین امتیازات روانشناختی | ✅ بیلد مجدد + ری‌استارت API |
| رفع باگ ارسال دوتایی | ✅ بیلد مجدد |
| نام پژوهشگر و طراح در صفحه اصلی | ✅ بیلد مجدد فرانت‌اند |

---

### مراحل به‌روزرسانی (به ترتیب اجرا کنید)

#### مرحله ۱ — دریافت کد جدید

اگر از Git استفاده می‌کنید:

```bash
cd /var/www/survey-app
git pull
```

اگر فایل‌ها را مستقیم آپلود کردید، ابتدا فایل‌های جدید را جایگزین کنید، سپس ادامه دهید.

---

#### مرحله ۲ — نصب وابستگی‌های جدید

```bash
cd /var/www/survey-app
pnpm install --frozen-lockfile
```

---

#### مرحله ۳ — مایگریشن دیتابیس ⚠️ مهم

این نسخه یک ستون جدید (`scores JSONB`) به جدول `submissions` اضافه می‌کند. **بدون این مرحله API خطا می‌دهد.**

```bash
cd /var/www/survey-app

# بارگذاری متغیرهای محیطی از فایل .env
export $(cat .env | grep -v '#' | xargs)

# اعمال تغییرات schema روی دیتابیس زنده
pnpm --filter @workspace/db run push
```

خروجی موردانتظار:
```
[✓] Changes applied
```

> **نکته:** این دستور فقط ستون جدید اضافه می‌کند و **داده‌های قبلی را حذف نمی‌کند.**

---

#### مرحله ۴ — بیلد مجدد

```bash
cd /var/www/survey-app

# بیلد lib های مشترک
pnpm run typecheck:libs

# بیلد API Server
pnpm --filter @workspace/api-server run build

# بیلد فرانت‌اند
pnpm --filter @workspace/survey-app run build
```

---

#### مرحله ۵ — ری‌استارت سرویس

```bash
# ری‌استارت API (بدون downtime قابل توجه)
pm2 restart survey-api

# بررسی وضعیت
pm2 status
pm2 logs survey-api --lines 20
```

---

#### مرحله ۶ — تأیید عملکرد

```bash
# تست API
curl http://localhost:8080/api/healthz
# انتظار: {"status":"ok"}

# تست endpoint آمار ادمین
curl -b "admin_session=authenticated" http://localhost:8080/api/admin/stats
# انتظار: JSON با فیلد scoreAverages

# تست فرانت‌اند از طریق Nginx
curl -I http://your-domain.com/
# انتظار: HTTP 200
```

---

### رفع مشکلات احتمالی هنگام آپدیت

**خطای `column "scores" does not exist`:**
```bash
# مایگریشن اجرا نشده — مرحله ۳ را دوباره اجرا کنید
export $(cat .env | grep -v '#' | xargs)
pnpm --filter @workspace/db run push
pm2 restart survey-api
```

**خطای بیلد (TypeScript errors):**
```bash
# ابتدا lib ها را بیلد کنید، سپس اپ
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/survey-app run build
```

**فرانت‌اند کش قدیمی نشان می‌دهد:**
```bash
# Nginx cache را پاک کنید
sudo systemctl reload nginx
# و در مرورگر Ctrl+Shift+R بزنید
```

**PM2 پس از reboot اجرا نمی‌شود:**
```bash
pm2 save
pm2 startup  # دستور خروجی را اجرا کنید
```

---

## پنل مدیریت

- **آدرس:** `https://your-domain.com/admin/login`
- **رمز پیش‌فرض:** `admin1234`
- **تغییر رمز:** مقدار `ADMIN_PASSWORD` در `ecosystem.config.cjs` و اجرای `pm2 restart survey-api`

امکانات پنل ادمین:
- مشاهده آمار کلی پاسخ‌دهندگان
- لیست تمام ثبت‌نام‌ها
- مشاهده جزئیات هر پاسخ‌دهنده
- دانلود CSV با رمزگذاری UTF-8 BOM برای SPSS

---

## متغیرهای محیطی — مرجع کامل

| متغیر | اجباری | پیش‌فرض | توضیح |
|-------|--------|---------|-------|
| `DATABASE_URL` | ✅ | - | رشته اتصال PostgreSQL |
| `SESSION_SECRET` | ✅ | - | کلید رمزنگاری session ادمین |
| `ADMIN_PASSWORD` | ❌ | `admin1234` | رمز ورود پنل ادمین |
| `PORT` | ❌ | `8080` | پورت API Server |
| `NODE_ENV` | ❌ | `development` | محیط اجرا (`production`) |

---

## رفع مشکلات رایج

**API پاسخ نمی‌دهد:**
```bash
pm2 logs survey-api --lines 50
# بررسی اتصال به دیتابیس و مقادیر env
```

**خطای ۵۰۲ از Nginx:**
```bash
# اطمینان از اجرای PM2
pm2 status
# بررسی port
ss -tlnp | grep 8080
```

**خطای دیتابیس:**
```bash
# تست اتصال
psql "postgresql://survey_user:رمز@localhost:5432/survey_db" -c "\dt"
# اجرای مجدد مایگریشن
pnpm --filter @workspace/db run push
```

**فونت فارسی درست نمایش داده نمی‌شود:**
- نیازی به اقدام خاص نیست؛ فونت Vazirmatn از Google Fonts بارگذاری می‌شود.
- در صورت عدم دسترسی به اینترنت در سرور، فونت را دانلود و به صورت local قرار دهید.
