# uk-turkish-network-survey

**LocalRater** — UK'de yaşayan Türkler için yıllık, topluluk temelli census/survey
uygulamasının Directus (Postgres) katmanı.

Bu repo, paylaşımlı bir Directus instance'ında çalışacak şekilde tasarlandı: tüm
LocalRater koleksiyonları `lr_` önekini taşır ve yalnızca kendi izinlerini/verisini
yönetir — instance'taki diğer uygulamalara ait hiçbir koleksiyon, alan ya da izin
dokunulmadan bırakılır.

## Kurulum

```bash
cp .env.example .env   # DIRECTUS_URL + DIRECTUS_ADMIN_TOKEN doldur
npm install
npm run directus:schema:apply       # lr_* koleksiyon/alan/ilişkileri kurar
npm run directus:permissions:apply  # Public policy'ye lr_* izinlerini ekler
npm run directus:seed               # 1 country, 1 edition, 23 kategori, 99 soru
```

Üç script de **idempotent**'tir — tekrar çalıştırmak veri çoğaltmaz, yalnızca eksik
olanı tamamlar.

## İçerik

- `directus/schema/apply.ts` — 9 koleksiyon (`lr_countries`, `lr_survey_editions`,
  `lr_categories`, `lr_questions`, `lr_question_options`, `lr_regions`,
  `lr_submissions`, `lr_answers`, `lr_subscribers`), alanları, ilişkileri.
- `directus/permissions/apply.ts` — mevcut Public policy'ye salt `lr_*` için read/create
  izinleri ekler; Administrator zaten `admin_access` ile tam erişimlidir.
- `directus/seed/localrater-seed.ts` — UK 2026 edition içeriği (23 kategori / 99 soru).
- `directus/data-model.md` — tam veri modeli, izin matrisi, doğrulama senaryosu.

## "Sorular veri, kod değil" doğrulaması

Directus admin'de `lr_categories` altında `health` kategorisine yeni bir `lr_questions`
satırı ekleyin veya bir sorunun `status` alanını `hidden` yapın — ön yüz build almadan
(runtime fetch ile) güncellenmelidir.
