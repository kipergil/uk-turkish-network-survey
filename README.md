# uk-turkish-network-survey

**LocalRater** — UK'de yaşayan Türkler için yıllık, topluluk temelli, çok-ülkeye hazır
census/survey uygulaması. Directus (Postgres) + React/Vite ön yüz + Express API katmanı.

Bu repo, paylaşımlı bir Directus instance'ında çalışacak şekilde tasarlandı: tüm
LocalRater koleksiyonları `lr_` önekini taşır ve yalnızca kendi izinlerini/verisini
yönetir — instance'taki diğer uygulamalara ait hiçbir koleksiyon, alan ya da izin
dokunulmadan bırakılır.

## Klasör yapısı

```
directus/   şema/izin/seed script'leri (bkz. directus/data-model.md)
shared/     zod şemaları (soru tipi başına 1) + Directus koleksiyon TS tipleri
server/     Express API — yazma işlemleri + sonuç agregasyonu + içerik proxy'si
client/     React 18 + Vite SPA
```

Tek bir kök `package.json` var (npm workspaces yok) — basitlik için client/server/
shared/directus hepsi aynı `node_modules`'ı paylaşır; Vite'ın `root`'u `client/`'a
işaret eder.

## Kurulum

```bash
cp .env.example .env   # DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN, DIRECTUS_SERVICE_TOKEN, VITE_* doldur
npm install

npm run directus:schema:apply           # lr_* koleksiyon/alan/ilişkileri kurar
npm run directus:permissions:apply      # Public policy'ye lr_* read/create izinlerini ekler
npm run directus:service-account:apply  # server/ için ayrı, lr_*'a scoped "LocalRater Service" token'ı üretir
npm run directus:seed                   # 1 country, 1 edition, 23 kategori, 99 soru

npm run dev   # server (:8787) + client (:5173) birlikte, Vite client'tan /api'ye proxy yapar
```

Dört Directus script'i de **idempotent**'tir — tekrar çalıştırmak veri çoğaltmaz veya
mevcut izinleri/alanları bozmaz, yalnızca eksik olanı tamamlar (ve önceki bir hatayı
düzeltir, örn. yanlış `sort_field`).

## Mimari: neden içerik okumaları da server üzerinden geçiyor

Orijinal plan client'ın Directus'a doğrudan (public policy ile) bağlanmasıydı. Ancak bu
paylaşımlı Directus instance'ı **CORS header'ı döndürmüyor** (muhtemelen bilinçli bir
altyapı kararı — instance'ın env değişkenlerine erişimimiz yok, değiştiremeyiz), yani
tarayıcıdan yapılan cross-origin istek TLS/ağ seviyesinde değil, browser'ın CORS
kontrolünde reddediliyor. Çözüm: **tüm** Directus trafiği (içerik okumaları dahil)
server/ üzerinden geçiyor — server-to-server istekler browser CORS'una tabi değil.
Veri hâlâ tamamen Directus'tan, runtime'da, hardcode olmadan geliyor; değişen sadece ağ
sıçraması. Bkz. `server/src/routes/content.ts` ve `client/src/lib/directus.ts`.

Bu aynı zamanda `server/`'ın Directus'a nasıl bağlandığını da belirledi: `directus/permissions/service-account.ts`
bu paylaşımlı instance'ta zaten var olan "Service" / "PinTogather Service" desenini
izleyerek ayrı bir **"LocalRater Service"** role + policy + kullanıcı oluşturur — yalnızca
`lr_*` koleksiyonlarında CRUD, master admin token asla server sürecine ya da tarayıcıya
sızmaz.

## Query key tasarımı (TanStack Query, staleTime ~60sn + refetchOnWindowFocus)

```
['categories', editionId, country]
['questions', categoryId]
['results', categorySlug, editionId]
['submission', token]
['categoryAnswers', token, categoryId]   // resume/prefill için
['stats', editionId]
```

## DynamicQuestion registry

`client/src/components/DynamicQuestion/index.tsx` içinde `type -> component` map'i:

| type | component |
|---|---|
| single_choice | RadioGroup |
| multi_choice | Checkbox grubu |
| dropdown | Select |
| rating | config.max yıldız |
| scale_likert | config.points + anchors |
| nps | 0..config.max segment |
| boolean | Switch |
| ranking | @dnd-kit/sortable |
| matrix | config.rows × columns grid |
| open_text | Textarea(config.maxlength) |

Yeni bir **tip** eklemek = yeni bir component dosyası + registry'ye 1 satır. Yeni bir
**soru** (mevcut tiplerden biriyle) eklemek = sadece Directus'ta veri, kod değişmez.

## shared/ zod şemaları

`shared/question-schemas.ts`: `buildAnswerValueSchema(question)` her tip için bir zod
şeması üretir (dinamik: seçenekler/config'e göre); `buildCategoryFormSchema(questions)`
bunları RHF için tek bir kategori şemasında birleştirir. `toAnswerPayload` /
`fromAnswerPayload` cevap saklama sözleşmesini (value_text/value_number/value_json)
uygular — hem `server/` hem `client/` aynı fonksiyonları kullanır.

## Cevap kaydetme akışı

1. İlk girişte `nanoid` token üretilir, `localStorage`'a yazılır (edition başına 1 token).
2. `POST /api/submissions` — token'a göre find-or-create (submission_token DB'de unique).
3. Kategori formu doldurulunca `POST /api/submissions/:token/answers` — her cevap
   `shared/question-schemas.ts`'teki sözleşmeyle value_text/number/json'a çevrilip
   upsert edilir; `completed_categories` güncellenir.
4. Bir kategoriye geri dönülünce `GET /api/submissions/:token/categories/:id/answers`
   önceki cevapları forma geri doldurur (yalnızca kendi token'ınla, kendi cevaplarına).
5. Anti-abuse: `express-rate-limit`, IP'nin kendisi değil salted SHA-256 hash'i anahtar
   olarak kullanılır (ham IP hiçbir yerde saklanmaz); anonimlik bozulmaz.

## Sonuç dashboard'u

`GET /api/results/:editionId` (kategori bazlı tamamlanma özeti) ve
`GET /api/results/:editionId/:categorySlug` (soru bazlı agregasyon) — ikisi de yalnızca
`server/`'ın kendi service token'ıyla `lr_answers`'ı okuyup **agrega** sonuç döner; ham
cevaplar hiçbir zaman client'a gitmez. Gizlilik eşiği `PRIVACY_THRESHOLD = 5`
(`shared/api-types.ts`): bir sorunun toplam cevap sayısı 5'in altındaysa
`{kind:"insufficient_data"}` döner. `open_text` asla agregate/gösterilmez (serbest metin
agregasyona uygun değil ve bireysel cevap sayılır).

## "Sorular veri, kod değil" doğrulaması

Directus admin'de `lr_categories` altında bir kategoriye yeni bir `lr_questions` satırı
ekleyin veya bir sorunun `status`'ünü `hidden` yapın — `/survey/:categorySlug` sayfası
**build almadan** (bir sonraki fetch'te) güncellenir. Bu repoyu geliştirirken bizzat
doğrulandı: `health` kategorisindeki bir soru `hidden` yapıldığında sayfa 8 yerine 7 soru
render etti; `active`'e geri alınca 8'e döndü.

## Ortam değişkenleri (.env, tek kök dosya)

```
DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN     # directus/ script'leri
DIRECTUS_SERVICE_TOKEN                 # server/ (lr_*'a scoped, ayrı script'le üretilir)
PORT, CORS_ORIGIN, IP_HASH_SALT         # server/
VITE_DIRECTUS_URL, VITE_API_BASE_URL    # client/ (Vite yalnızca VITE_ önekli olanları okur)
VITE_CLERK_PUBLISHABLE_KEY              # opsiyonel, /admin için
```

## /admin

`/admin/*` opsiyonel olarak Clerk ile korunur (`VITE_CLERK_PUBLISHABLE_KEY` set
edilmezse route "Clerk yapılandırılmadı" mesajı gösterir). Asıl içerik yönetimi
(kategori/soru/şık ekleme-düzenleme) Directus admin panelinden yapılır — bu route
sadece opsiyonel bir ek katman.
