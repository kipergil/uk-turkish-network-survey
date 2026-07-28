# LocalRater — Directus Veri Modeli

Bu proje, paylaşımlı bir Directus instance'ında (başka uygulamalara ait koleksiyonlarla
birlikte) yaşar. Çakışmayı önlemek ve etkiyi tamamen izole etmek için **her LocalRater
koleksiyonu `lr_` önekini taşır**. Instance'taki diğer hiçbir koleksiyon/alan/izin
LocalRater kurulumu tarafından okunmaz, değiştirilmez veya silinmez.

Temel ilke: **anket soruları kodda değil, Directus'ta veridir.** Ön yüz kategori/soru
listelerini runtime'da çeker; içerik eklenip/güncellenince kod değişmeden yansır.

Mimari çok-ülkeli baştan hazır: `country_code = null` → CORE (tüm ülkelerde geçerli),
`country_code = "UK"` → yalnızca o ülkeye özel.

## Koleksiyonlar

| Koleksiyon | PK | Alanlar | İlişkiler |
|---|---|---|---|
| `lr_countries` | `code` (string, manuel) | name_tr/en, is_active, launch_year, currency, flag_emoji, sort_order | — |
| `lr_survey_editions` | `id` (uuid) | country_code(FK), year, title_tr/en, status(draft\|open\|closed), opens_at, closes_at | country_code → lr_countries.code |
| `lr_categories` | `id` (uuid) | edition_id(FK), country_code(FK, null=core), slug, name_tr/en, description_tr/en, icon, sort_order, is_optional, status(active\|hidden) | edition_id → lr_survey_editions.id; country_code → lr_countries.code |
| `lr_questions` | `id` (uuid) | **category_id(FK, NOT NULL)**, edition_id(FK), country_code(FK, null=core), slug, type, label_tr/en, help_tr/en, is_required, sort_order, status(active\|hidden), config(json), depends_on(json) | category_id → lr_categories.id; edition_id → lr_survey_editions.id; country_code → lr_countries.code |
| `lr_question_options` | `id` (uuid) | question_id(FK), value, label_tr/en, sort_order | question_id → lr_questions.id |
| `lr_regions` | `id` (uuid) | country_code(FK), name, parent_id(self FK), type(city\|region\|borough), lat, lng, sort_order | country_code → lr_countries.code; parent_id → lr_regions.id |
| `lr_submissions` | `id` (uuid) | edition_id(FK), country_code, submission_token, created_at, updated_at, is_complete, completed_categories(json), user_region_id(FK) | edition_id → lr_survey_editions.id; user_region_id → lr_regions.id |
| `lr_answers` | `id` (uuid) | submission_id(FK), question_id(FK), value_text, value_number, value_json | submission_id → lr_submissions.id; question_id → lr_questions.id |
| `lr_subscribers` | `id` (uuid) | edition_id(FK), email, created_at | edition_id → lr_survey_editions.id (cevaplarla **İLİŞKİLENDİRİLMEZ**) |
| `lr_recovery_codes` | `id` (uuid) | submission_id(FK, unique), code(unique), created_at | submission_id → lr_submissions.id — PII yok |
| `lr_recovery_emails` | `id` (uuid) | submission_id(FK), code, email, created_at | submission_id → lr_submissions.id — bir Directus Flow bunu dinler |

**Kritik kural:** `lr_questions.category_id` NOT NULL — kategorisiz soru olamaz.
`status = active | hidden` (`lr_categories`, `lr_questions`) ile yayına alınır/çıkarılır;
silme gerekmez.

## Kimlik & devam etme (recovery) modeli

Katılımcı kimliği hâlâ anonim `submission_token`'dır (nanoid, localStorage). Buna ek
olarak her submission oluşturulduğunda **insan-okunur bir kurtarma kodu** (örn.
`amber-falcon-42`) üretilir ve `lr_recovery_codes`'a yazılır — bu kod submission_id'ye
1:1 bağlıdır ve hiçbir kişisel bilgi içermez. `POST /api/submissions/resume {code}`
bu kodu herhangi bir cihazdan token'a çevirir.

Kullanıcı isterse (opsiyonel, varsayılan değil) bir e-posta da girebilir:
`POST /api/submissions/:token/recovery-email {email}` bunu `lr_subscribers`'a DEĞİL,
ayrı bir `lr_recovery_emails` koleksiyonuna yazar (`{submission_id, code, email}`).
Bu satırın oluşturulması, `directus/flows/recovery-email-flow.ts` ile kurulan bir
Directus Flow'u (event hook: `items.create` on `lr_recovery_emails`, `mail` operasyonu,
Directus'un kendi SMTP'si) tetikler ve `{APP_URL}/resume?code=...` linkini e-postayla
gönderir.

**Anonimlik notu:** kod-tabanlı kurtarma tamamen anonim kalır (kodu kimseye söylemediği
sürece kimse kodu bir kişiyle eşleştiremez). E-posta yolunu seçen kullanıcılar için
`{email, submission_id}` eşleşmesi DB'de var olur — bu, admin erişimi olan biri için
teorik olarak o kişinin cevaplarıyla eşleştirilebilir anlamına gelir. Bu yüzden e-posta
alanı UI'da net şekilde "daha az anonim" olarak etiketlenir ve varsayılan olarak
gösterilmez/zorunlu değildir.

## Soru tipleri (10)

`single_choice` · `multi_choice` · `dropdown` · `rating` · `scale_likert` · `nps` ·
`boolean` · `ranking` · `matrix` · `open_text`

## Cevap saklama sözleşmesi (`lr_answers`)

| Soru tipi | Alan |
|---|---|
| single_choice / dropdown / boolean / open_text | `value_text` |
| rating / nps / scale_likert | `value_number` |
| multi_choice / ranking / matrix | `value_json` |

## `config` (json) şemaları

```
rating:       { "max": 5 }  |  { "max": 10 }
nps:          { "min": 0, "max": 10 }
scale_likert: { "points": 5, "anchors_tr": [...], "anchors_en": [...] }
matrix:       { "rows_tr": [...], "rows_en": [...], "columns": [1,2,3,4,5] }
open_text:    { "maxlength": 280 }
```

## `depends_on` (json)

```
{ "question_slug": "has_children", "equals": "true" }
{ "question_slug": "immigration_status", "not_equals": "no" }
```

Client-side uygulanır (form watch ile); eşleşmezse soru gizlenir.

## İzin matrisi

Bu instance'ta zaten var olan **Public** policy'ye (diğer uygulamaların da kullandığı
paylaşımlı policy) yalnızca aşağıdaki 9 yeni izin satırı **eklendi** — mevcut hiçbir izin
satırı değiştirilmedi ya da silinmedi:

| Koleksiyon | Aksiyon | Filtre |
|---|---|---|
| `lr_countries` | read | — |
| `lr_survey_editions` | read | `status = open` |
| `lr_categories` | read | `status = active` |
| `lr_questions` | read | `status = active` |
| `lr_question_options` | read | — |
| `lr_regions` | read | — |
| `lr_submissions` | create | — |
| `lr_answers` | create | — |
| `lr_subscribers` | create | — |

Ham `lr_answers`'a (ve `lr_submissions`'a) **public READ yok** — bireysel cevaplar asla
dışarı sızmaz, yalnızca agrega sonuçlar (uygulama katmanında) hesaplanabilir.

**Administrator** policy'sinin `admin_access: true` olması nedeniyle explicit bir izin
satırına ihtiyaç duymadan tüm `lr_*` koleksiyonlarına tam erişimi vardır.

## Seed

`directus/seed/localrater-seed.ts` — idempotent (slug/unique alanla upsert). Çalıştırınca:

```
Seed complete: 1 country, 1 edition, 23 categories, 99 questions.
```

23 kategori: 19 CORE (`country_code = null`) + 4 UK-özel (`country_code = "UK"`):
Vize/Göçmenlik · ILR & Vatandaşlık · Sigorta/Pension/Tasarruf · Online Hizmetler (UK).

## Doğrulama senaryosu

Directus admin'de `lr_categories` altında `health` kategorisine yeni bir `lr_questions`
satırı ekle veya bir sorunun `status` alanını `hidden` yap. Ön yüz (TanStack Query
`staleTime` + `refetchOnWindowFocus` + `invalidateQueries` ile) **build almadan**
güncellenmelidir — bu, "sorular veri, kod değil" ilkesinin kanıtıdır.

## Scriptler

```bash
cp .env.example .env   # DIRECTUS_URL + DIRECTUS_ADMIN_TOKEN doldur
npm install
npm run directus:schema:apply       # koleksiyon/alan/ilişkileri kurar (idempotent)
npm run directus:permissions:apply  # Public policy'ye lr_* izinlerini ekler (idempotent)
npm run directus:seed               # 1 country, 1 edition, 23 kategori, 99 soru (idempotent)
```

## Yeni ülke onboarding (gelecek)

`lr_countries`'e satır ekle (`is_active = true`) → yeni `lr_survey_editions` kaydı →
CORE kategoriler otomatik geçerli olur → yalnızca o ülkeye özel kategori/soruları seed'le.
Kod değişmez.
