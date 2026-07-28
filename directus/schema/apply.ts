/**
 * LocalRater — Directus schema apply
 * -------------------------------------------------------------
 * Idempotent: safe to run multiple times. Only ever touches
 * collections/fields/relations under the `lr_` prefix — nothing
 * else in this shared Directus instance is read for writing or
 * modified.
 *
 * Run: npm run directus:schema:apply
 */
import 'dotenv/config';
import {
  readCollections, createCollection, updateCollection,
  readFieldsByCollection, createField, updateField,
  readRelations, createRelation,
} from '@directus/sdk';
import { client, col } from '../lib/client.js';

type FieldDef = {
  field: string;
  type: string;
  meta?: Record<string, unknown>;
  schema?: Record<string, unknown>;
};

type RelationDef = {
  collection: string;
  field: string;
  related_collection: string;
};

type CollectionDef = {
  name: string;
  icon: string;
  note: string;
  primaryKey: FieldDef;
  fields: FieldDef[];
  relations?: RelationDef[];
  /** Only set when the collection actually has a `sort_order` field. */
  sortField?: 'sort_order';
};

// ----------------------------------------------------------------------------
// Field helpers
// ----------------------------------------------------------------------------
const uuidPk = (): FieldDef => ({
  field: 'id',
  type: 'uuid',
  meta: { interface: 'input', readonly: true, hidden: true, special: ['uuid'] },
  schema: { is_primary_key: true, has_auto_increment: false, length: 36 },
});

const str = (field: string, opts: { required?: boolean; note?: string; choices?: string[]; default?: string; unique?: boolean } = {}): FieldDef => ({
  field,
  type: 'string',
  meta: {
    interface: opts.choices ? 'select-dropdown' : 'input',
    note: opts.note ?? null,
    required: opts.required ?? false,
    options: opts.choices ? { choices: opts.choices.map((c) => ({ text: c, value: c })) } : undefined,
  },
  schema: { is_nullable: !(opts.required ?? false), default_value: opts.default ?? null, is_unique: opts.unique ?? false },
});

const text = (field: string, note?: string): FieldDef => ({
  field,
  type: 'text',
  meta: { interface: 'input-multiline', note: note ?? null },
  schema: { is_nullable: true },
});

const bool = (field: string, defaultValue = false): FieldDef => ({
  field,
  type: 'boolean',
  meta: { interface: 'boolean' },
  schema: { is_nullable: false, default_value: defaultValue },
});

const int = (field: string, defaultValue: number | null = 0): FieldDef => ({
  field,
  type: 'integer',
  meta: { interface: 'input' },
  schema: { is_nullable: true, default_value: defaultValue },
});

const float = (field: string): FieldDef => ({
  field,
  type: 'float',
  meta: { interface: 'input' },
  schema: { is_nullable: true },
});

const json = (field: string, note?: string): FieldDef => ({
  field,
  type: 'json',
  meta: { interface: 'input-code', options: { language: 'json' }, note: note ?? null },
  schema: { is_nullable: true },
});

const timestamp = (field: string, note?: string): FieldDef => ({
  field,
  type: 'timestamp',
  meta: { interface: 'datetime', note: note ?? null },
  schema: { is_nullable: true },
});

const dateCreated = (field = 'created_at'): FieldDef => ({
  field,
  type: 'timestamp',
  meta: { interface: 'datetime', special: ['date-created'], readonly: true },
  schema: { is_nullable: true },
});

const dateUpdated = (field = 'updated_at'): FieldDef => ({
  field,
  type: 'timestamp',
  meta: { interface: 'datetime', special: ['date-updated'], readonly: true },
  schema: { is_nullable: true },
});

/** FK field pointing at a uuid PK collection */
const m2oUuid = (field: string, opts: { required?: boolean } = {}): FieldDef => ({
  field,
  type: 'uuid',
  meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: opts.required ?? false },
  schema: { is_nullable: !(opts.required ?? false) },
});

/** FK field pointing at lr_countries.code (string PK) */
const countryCodeFk = (): FieldDef => ({
  field: 'country_code',
  type: 'string',
  meta: {
    interface: 'select-dropdown-m2o',
    special: ['m2o'],
    note: 'null = CORE (tüm ülkelerde geçerli), "UK" = ülkeye özel',
  },
  schema: { is_nullable: true },
});

// ----------------------------------------------------------------------------
// Collection definitions
// ----------------------------------------------------------------------------
const COLLECTIONS: CollectionDef[] = [
  {
    name: 'countries',
    icon: 'public',
    note: 'LocalRater — desteklenen ülkeler',
    sortField: 'sort_order',
    primaryKey: { field: 'code', type: 'string', meta: { interface: 'input', note: 'ISO country code, e.g. UK' }, schema: { is_primary_key: true, has_auto_increment: false, length: 10 } },
    fields: [
      str('name_tr', { required: true }),
      str('name_en', { required: true }),
      bool('is_active', true),
      int('launch_year', null),
      str('currency'),
      str('flag_emoji'),
      int('sort_order', 0),
    ],
  },
  {
    name: 'survey_editions',
    icon: 'event',
    note: 'LocalRater — ülke bazlı anket dönemleri (yıl)',
    primaryKey: uuidPk(),
    fields: [
      countryCodeFk(),
      int('year', null),
      str('title_tr', { required: true }),
      str('title_en', { required: true }),
      str('status', { choices: ['draft', 'open', 'closed'], default: 'draft' }),
      timestamp('opens_at'),
      timestamp('closes_at'),
    ],
    relations: [{ collection: col('survey_editions'), field: 'country_code', related_collection: col('countries') }],
  },
  {
    name: 'categories',
    icon: 'category',
    note: 'LocalRater — anket kategorileri',
    sortField: 'sort_order',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('edition_id', { required: true }),
      countryCodeFk(),
      str('slug', { required: true }),
      str('name_tr', { required: true }),
      str('name_en', { required: true }),
      text('description_tr'),
      text('description_en'),
      str('icon'),
      int('sort_order', 0),
      bool('is_optional', true),
      str('status', { choices: ['active', 'hidden'], default: 'active' }),
    ],
    relations: [
      { collection: col('categories'), field: 'edition_id', related_collection: col('survey_editions') },
      { collection: col('categories'), field: 'country_code', related_collection: col('countries') },
    ],
  },
  {
    name: 'questions',
    icon: 'help',
    note: 'LocalRater — anket soruları (her soru bir kategoriye ZORUNLU bağlıdır)',
    sortField: 'sort_order',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('category_id', { required: true }),
      m2oUuid('edition_id', { required: true }),
      countryCodeFk(),
      str('slug', { required: true }),
      str('type', {
        required: true,
        choices: ['single_choice', 'multi_choice', 'dropdown', 'rating', 'scale_likert', 'nps', 'boolean', 'ranking', 'matrix', 'open_text'],
      }),
      str('label_tr', { required: true }),
      str('label_en', { required: true }),
      text('help_tr'),
      text('help_en'),
      bool('is_required', false),
      int('sort_order', 0),
      str('status', { choices: ['active', 'hidden'], default: 'active' }),
      json('config', 'type-specific config, bkz. data-model.md'),
      json('depends_on', '{ question_slug, equals | not_equals }'),
    ],
    relations: [
      { collection: col('questions'), field: 'category_id', related_collection: col('categories') },
      { collection: col('questions'), field: 'edition_id', related_collection: col('survey_editions') },
      { collection: col('questions'), field: 'country_code', related_collection: col('countries') },
    ],
  },
  {
    name: 'question_options',
    icon: 'list',
    note: 'LocalRater — çoktan seçmeli soru şıkları',
    sortField: 'sort_order',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('question_id', { required: true }),
      str('value', { required: true }),
      str('label_tr', { required: true }),
      str('label_en', { required: true }),
      int('sort_order', 0),
    ],
    relations: [{ collection: col('question_options'), field: 'question_id', related_collection: col('questions') }],
  },
  {
    name: 'regions',
    icon: 'map',
    note: 'LocalRater — şehir/bölge/borough hiyerarşisi',
    sortField: 'sort_order',
    primaryKey: uuidPk(),
    fields: [
      countryCodeFk(),
      str('name', { required: true }),
      m2oUuid('parent_id'),
      str('type', { choices: ['city', 'region', 'borough'] }),
      float('lat'),
      float('lng'),
      int('sort_order', 0),
    ],
    relations: [
      { collection: col('regions'), field: 'country_code', related_collection: col('countries') },
      { collection: col('regions'), field: 'parent_id', related_collection: col('regions') },
    ],
  },
  {
    name: 'submissions',
    icon: 'assignment_turned_in',
    note: 'LocalRater — anonim anket oturumları',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('edition_id', { required: true }),
      str('country_code'),
      str('submission_token', { required: true, unique: true }),
      dateCreated('created_at'),
      dateUpdated('updated_at'),
      bool('is_complete', false),
      json('completed_categories', 'tamamlanan kategori slug listesi'),
      m2oUuid('user_region_id'),
    ],
    relations: [
      { collection: col('submissions'), field: 'edition_id', related_collection: col('survey_editions') },
      { collection: col('submissions'), field: 'user_region_id', related_collection: col('regions') },
    ],
  },
  {
    name: 'answers',
    icon: 'question_answer',
    note: 'LocalRater — soru cevapları (public read KAPALI)',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('submission_id', { required: true }),
      m2oUuid('question_id', { required: true }),
      text('value_text'),
      float('value_number'),
      json('value_json'),
    ],
    relations: [
      { collection: col('answers'), field: 'submission_id', related_collection: col('submissions') },
      { collection: col('answers'), field: 'question_id', related_collection: col('questions') },
    ],
  },
  {
    name: 'subscribers',
    icon: 'mail',
    note: 'LocalRater — sonuç bildirimi için e-posta (cevaplarla İLİŞKİLENDİRİLMEZ)',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('edition_id'),
      str('email', { required: true }),
      dateCreated('created_at'),
    ],
    relations: [{ collection: col('subscribers'), field: 'edition_id', related_collection: col('survey_editions') }],
  },
  {
    name: 'recovery_codes',
    icon: 'vpn_key',
    note: 'LocalRater — anonim devam etme kodu (1 submission = 1 kod, PII yok)',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('submission_id', { required: true }),
      str('code', { required: true, unique: true }),
      dateCreated('created_at'),
    ],
    relations: [{ collection: col('recovery_codes'), field: 'submission_id', related_collection: col('submissions') }],
  },
  {
    name: 'recovery_emails',
    icon: 'forward_to_inbox',
    note: 'LocalRater — opsiyonel e-posta ile devam etme linki (Directus Flow bunu dinler)',
    primaryKey: uuidPk(),
    fields: [
      m2oUuid('submission_id', { required: true }),
      str('code', { required: true }),
      str('email', { required: true }),
      dateCreated('created_at'),
    ],
    relations: [{ collection: col('recovery_emails'), field: 'submission_id', related_collection: col('submissions') }],
  },
];

// ----------------------------------------------------------------------------
// Apply
// ----------------------------------------------------------------------------
async function run() {
  const existingCollectionRows = await client.request(readCollections());
  const existingCollections = new Map(existingCollectionRows.map((c: any) => [c.collection, c]));

  for (const def of COLLECTIONS) {
    const collectionName = col(def.name);
    const existing = existingCollections.get(collectionName);
    if (existing) {
      // Repair pass: earlier runs could have set sort_field incorrectly.
      const currentSortField = (existing as any).meta?.sort_field ?? null;
      const desiredSortField = def.sortField ?? null;
      if (currentSortField !== desiredSortField) {
        await client.request(updateCollection(collectionName as any, { meta: { sort_field: desiredSortField } } as any));
        console.log(`  ~ fixed sort_field for ${collectionName}: ${currentSortField} -> ${desiredSortField}`);
      }
      console.log(`= collection exists, skipping create: ${collectionName}`);
      continue;
    }
    await client.request(
      createCollection({
        collection: collectionName,
        meta: { icon: def.icon, note: def.note, sort_field: def.sortField ?? null },
        schema: {},
        fields: [{ ...def.primaryKey }],
      } as any),
    );
    console.log(`+ created collection: ${collectionName}`);
  }

  for (const def of COLLECTIONS) {
    const collectionName = col(def.name);
    const existingFieldRows = await client.request(readFieldsByCollection(collectionName as any));
    const existingByName = new Map((existingFieldRows as any[]).map((f: any) => [f.field, f]));
    for (const f of def.fields) {
      const existing = existingByName.get(f.field);
      if (!existing) {
        await client.request(createField(collectionName as any, f as any));
        console.log(`  + field ${collectionName}.${f.field}`);
        continue;
      }
      // Repair pass: pick up schema changes (e.g. is_unique) made to a field def after initial creation.
      const desiredUnique = (f.schema as any)?.is_unique ?? false;
      const currentUnique = existing.schema?.is_unique ?? false;
      if (desiredUnique !== currentUnique) {
        await client.request(updateField(collectionName as any, f.field, { schema: { is_unique: desiredUnique } } as any));
        console.log(`  ~ fixed is_unique for ${collectionName}.${f.field}: ${currentUnique} -> ${desiredUnique}`);
      }
    }
  }

  const existingRelations = new Set(
    (await client.request(readRelations())).map((r: any) => `${r.collection}.${r.field}`),
  );
  for (const def of COLLECTIONS) {
    for (const rel of def.relations ?? []) {
      const key = `${rel.collection}.${rel.field}`;
      if (existingRelations.has(key)) continue;
      await client.request(
        createRelation({
          collection: rel.collection,
          field: rel.field,
          related_collection: rel.related_collection,
        } as any),
      );
      console.log(`  ~ relation ${key} -> ${rel.related_collection}`);
    }
  }

  console.log(`Schema apply complete: ${COLLECTIONS.length} collections ensured (prefix "${col('')}").`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
