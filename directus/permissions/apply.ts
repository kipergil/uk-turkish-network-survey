/**
 * LocalRater — Directus permissions apply
 * -------------------------------------------------------------
 * Idempotent: safe to run multiple times. Adds permission rows for
 * `lr_*` collections ONLY to the existing shared Public policy —
 * every other permission row already on that policy (for the other
 * apps living in this Directus instance) is left untouched.
 * Administrator already has admin_access, so it needs no explicit rows.
 *
 * Run: npm run directus:permissions:apply
 */
import 'dotenv/config';
import { readPolicies, readPermissions, createPermission } from '@directus/sdk';
import { client, col } from '../lib/client.js';

type PermissionDef = {
  collection: string;
  action: 'read' | 'create';
  permissions?: Record<string, unknown>;
  fields?: string[];
};

const PUBLIC_PERMISSIONS: PermissionDef[] = [
  // read: reference/config data + only the "live" parts of the survey
  { collection: col('countries'), action: 'read', permissions: {} },
  { collection: col('survey_editions'), action: 'read', permissions: { status: { _eq: 'open' } } },
  { collection: col('categories'), action: 'read', permissions: { status: { _eq: 'active' } } },
  { collection: col('questions'), action: 'read', permissions: { status: { _eq: 'active' } } },
  { collection: col('question_options'), action: 'read', permissions: {} },
  { collection: col('regions'), action: 'read', permissions: {} },
  // create: anonymous submission flow. No read permission is granted on
  // lr_answers (or lr_submissions) — raw answers stay non-public.
  { collection: col('submissions'), action: 'create', permissions: {} },
  { collection: col('answers'), action: 'create', permissions: {} },
  { collection: col('subscribers'), action: 'create', permissions: {} },
];

async function findPublicPolicyId(): Promise<string> {
  const override = process.env.DIRECTUS_PUBLIC_POLICY_ID;
  if (override) return override;

  const policies = await client.request(
    readPolicies({ filter: { name: { _eq: '$t:public_label' } }, limit: 1 } as any),
  );
  const policy = (policies as any[])[0];
  if (!policy) {
    throw new Error(
      'Could not find the default Public policy (name === "$t:public_label"). ' +
        'Set DIRECTUS_PUBLIC_POLICY_ID in .env to the correct policy id and re-run.',
    );
  }
  return policy.id;
}

async function run() {
  const policyId = await findPublicPolicyId();
  console.log(`Using Public policy: ${policyId}`);

  const existing = await client.request(
    readPermissions({ filter: { policy: { _eq: policyId } }, limit: -1, fields: ['collection', 'action'] } as any),
  );
  const existingKeys = new Set((existing as any[]).map((p) => `${p.collection}.${p.action}`));

  for (const perm of PUBLIC_PERMISSIONS) {
    const key = `${perm.collection}.${perm.action}`;
    if (existingKeys.has(key)) {
      console.log(`= permission exists, skipping: ${key}`);
      continue;
    }
    await client.request(
      createPermission({
        policy: policyId,
        collection: perm.collection,
        action: perm.action,
        permissions: perm.permissions ?? {},
        fields: perm.fields ?? ['*'],
      } as any),
    );
    console.log(`+ permission ${key}`);
  }

  console.log('Permissions apply complete.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
