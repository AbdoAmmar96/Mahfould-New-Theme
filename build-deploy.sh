#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  محفول مكفول — تجهيز نسخة الرفع على السيرفر
#
#  بيطلّع أرشيف جاهز يترفع ويشتغل من غير composer ولا npm على السيرفر:
#    • vendor/ مبنيّة للإنتاج (بدون حزم التطوير)
#    • public/build/ أصول مبنية ومضغوطة
#    • من غير: node_modules · .git · tests · .env · اللوجات · قاعدة SQLite المحلية
#
#  الاستعمال:  ./build-deploy.sh
#  الناتج:     dist/mahfol-makfol-<تاريخ>-<كوميت>.tar.gz
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M)"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
NAME="mahfol-makfol-${STAMP}-${SHA}"
STAGE="$ROOT/dist/$NAME"

say() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }

# ── 1. أصول الواجهة ──
say "بناء أصول الواجهة (vite)"
npm run build

# ── 2. نسخ المصدر ──
say "نسخ ملفات المشروع"
rm -rf "$STAGE"
mkdir -p "$STAGE"
rsync -a \
  --exclude '.git' \
  --exclude '.github' \
  --exclude 'node_modules' \
  --exclude 'vendor' \
  --exclude 'dist' \
  --exclude 'tests' \
  --exclude '.env' \
  --exclude '.env.backup' \
  --exclude 'phpunit.xml' \
  --exclude '.phpunit.result.cache' \
  --exclude 'storage/logs/*' \
  --exclude 'storage/framework/cache/data/*' \
  --exclude 'storage/framework/sessions/*' \
  --exclude 'storage/framework/views/*' \
  --exclude 'bootstrap/cache/*.php' \
  --exclude 'database/*.sqlite*' \
  --exclude 'public/hot' \
  --exclude 'public/storage' \
  --exclude '*.tar.gz' \
  --exclude 'build-deploy.sh' \
  ./ "$STAGE/"

# ملفات التصميم المصدر (لوجوهات خام) — مش بتاعة السيرفر
find "$STAGE" -maxdepth 1 -name '*.png' -delete

# ── 3. اعتماديات PHP للإنتاج ──
say "تثبيت اعتماديات PHP (بدون حزم التطوير)"
cd "$STAGE"
composer install --no-dev --optimize-autoloader --classmap-authoritative \
  --no-interaction --no-progress --quiet
cd "$ROOT"

# ── 4. هيكل مجلدات التخزين ──
say "تجهيز مجلدات التخزين"
mkdir -p "$STAGE"/storage/{app/public,framework/{cache/data,sessions,views},logs}
mkdir -p "$STAGE/bootstrap/cache"
find "$STAGE/storage" "$STAGE/bootstrap/cache" -type d -exec touch {}/.gitkeep \;

# ── 5. الأرشيف ──
say "ضغط الأرشيف"
cd "$ROOT/dist"
tar -czf "${NAME}.tar.gz" "$NAME"
SIZE="$(du -h "${NAME}.tar.gz" | cut -f1)"
rm -rf "$NAME"

printf '\n\033[1;32m✔ جاهز:\033[0m dist/%s.tar.gz  (%s)\n' "$NAME" "$SIZE"
printf '  خطوات السيرفر مكتوبة في: DEPLOY.md\n\n'
