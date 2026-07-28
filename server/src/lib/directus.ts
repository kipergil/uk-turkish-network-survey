import { createDirectus, rest, staticToken, readItems, createItem, updateItem } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN;

if (!DIRECTUS_URL) throw new Error('DIRECTUS_URL env var is required');
if (!SERVICE_TOKEN) throw new Error('DIRECTUS_SERVICE_TOKEN env var is required');

/**
 * Server-only Directus client. Uses the scoped "LocalRater Service" token
 * (see directus/permissions/service-account.ts) — full CRUD on lr_* only,
 * never the master admin token, never sent to the browser.
 */
export const directus = createDirectus(DIRECTUS_URL).with(staticToken(SERVICE_TOKEN)).with(rest());

export const col = (name: string) => `lr_${name}`;

export { readItems, createItem, updateItem };
