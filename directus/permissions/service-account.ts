/**
 * LocalRater — Directus service account
 * -------------------------------------------------------------
 * Creates a scoped "LocalRater Service" role + policy + user, mirroring
 * the "Service" / "PinTogather Service" pattern already used elsewhere
 * in this shared instance for server-only BFF tokens. The resulting
 * static token is used ONLY by server/ (never sent to the browser, never
 * the master admin token) and is permissioned strictly to `lr_*`
 * collections — full CRUD there, nothing else. Nothing outside `lr_*`
 * is granted, read, or modified.
 *
 * Idempotent. Prints the service token once so it can be copied into
 * server/.env as DIRECTUS_SERVICE_TOKEN — it is NOT written to disk by
 * this script and is not retrievable again afterwards (Directus stores
 * tokens hashed), so save it when it's printed.
 *
 * Run: npx tsx directus/permissions/service-account.ts
 */
import 'dotenv/config';
import { readPermissions, createPermission } from '@directus/sdk';
import { client, col } from '../lib/client.js';

const DIRECTUS_URL = process.env.DIRECTUS_URL!;
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

const ROLE_NAME = 'LocalRater Service';
const POLICY_NAME = 'LocalRater Service';
// example.com is IANA-reserved and intentionally never delivers mail — this
// account is only ever accessed via its static API token, never logged into.
const SERVICE_EMAIL = 'localrater-service@example.com';

const LR_COLLECTIONS = [
  'countries', 'survey_editions', 'categories', 'questions', 'question_options',
  'regions', 'submissions', 'answers', 'subscribers', 'recovery_codes', 'recovery_emails',
].map(col);

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function findOne(collection: string, filterQuery: string) {
  const json = await api(`/${collection}?filter=${encodeURIComponent(filterQuery)}&limit=1`);
  return json?.data?.[0] ?? null;
}

async function ensureRole(): Promise<string> {
  const existing = await findOne('roles', JSON.stringify({ name: { _eq: ROLE_NAME } }));
  if (existing) {
    console.log(`= role exists: ${ROLE_NAME}`);
    return existing.id;
  }
  const created = await api('/roles', {
    method: 'POST',
    body: JSON.stringify({
      name: ROLE_NAME,
      icon: 'dns',
      description: "LocalRater's Express server-only token. Never exposed to the browser. Scoped to lr_* only.",
    }),
  });
  console.log(`+ created role: ${ROLE_NAME}`);
  return created.data.id;
}

async function ensurePolicy(): Promise<string> {
  const existing = await findOne('policies', JSON.stringify({ name: { _eq: POLICY_NAME } }));
  if (existing) {
    console.log(`= policy exists: ${POLICY_NAME}`);
    return existing.id;
  }
  const created = await api('/policies', {
    method: 'POST',
    body: JSON.stringify({
      name: POLICY_NAME,
      icon: 'dns',
      description: 'Full CRUD on lr_* collections only — used by the LocalRater Express server for writes and results aggregation.',
      admin_access: false,
      app_access: false,
    }),
  });
  console.log(`+ created policy: ${POLICY_NAME}`);
  return created.data.id;
}

async function ensureAccess(roleId: string, policyId: string) {
  const existing = await findOne('access', JSON.stringify({ role: { _eq: roleId }, policy: { _eq: policyId } }));
  if (existing) {
    console.log('= role<->policy access link exists');
    return;
  }
  await api('/access', { method: 'POST', body: JSON.stringify({ role: roleId, policy: policyId }) });
  console.log('+ linked role <-> policy');
}

async function ensurePermissions(policyId: string) {
  const existing = await client.request(
    readPermissions({ filter: { policy: { _eq: policyId } }, limit: -1, fields: ['collection', 'action'] } as any),
  );
  const existingKeys = new Set((existing as any[]).map((p) => `${p.collection}.${p.action}`));

  for (const collection of LR_COLLECTIONS) {
    for (const action of ['create', 'read', 'update'] as const) {
      const key = `${collection}.${action}`;
      if (existingKeys.has(key)) continue;
      await client.request(
        createPermission({ policy: policyId, collection, action, permissions: {}, fields: ['*'] } as any),
      );
      console.log(`+ permission ${key}`);
    }
  }
}

async function ensureServiceUser(roleId: string): Promise<{ id: string; isNew: boolean }> {
  const existing = await findOne('users', JSON.stringify({ email: { _eq: SERVICE_EMAIL } }));
  if (existing) {
    console.log(`= service user exists: ${SERVICE_EMAIL}`);
    return { id: existing.id, isNew: false };
  }
  const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const created = await api('/users', {
    method: 'POST',
    body: JSON.stringify({
      email: SERVICE_EMAIL,
      password: randomPassword,
      role: roleId,
      status: 'active',
      first_name: 'LocalRater',
      last_name: 'Service',
    }),
  });
  console.log(`+ created service user: ${SERVICE_EMAIL}`);
  return { id: created.data.id, isNew: true };
}

async function issueStaticToken(userId: string): Promise<string> {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
  await api(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ token }) });
  return token;
}

async function run() {
  const roleId = await ensureRole();
  const policyId = await ensurePolicy();
  await ensureAccess(roleId, policyId);
  await ensurePermissions(policyId);
  const { id: userId, isNew } = await ensureServiceUser(roleId);

  if (isNew || process.env.LOCALRATER_ROTATE_SERVICE_TOKEN === '1') {
    const token = await issueStaticToken(userId);
    console.log('\n=== DIRECTUS_SERVICE_TOKEN (copy into server/.env now — shown once) ===');
    console.log(token);
    console.log('========================================================================\n');
  } else {
    console.log('Service user already existed — token left as-is. Set LOCALRATER_ROTATE_SERVICE_TOKEN=1 to rotate it.');
  }

  console.log('Service account apply complete.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
