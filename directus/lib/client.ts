import { createDirectus, rest, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_URL) throw new Error('DIRECTUS_URL env var is required');
if (!ADMIN_TOKEN) throw new Error('DIRECTUS_ADMIN_TOKEN env var is required');

export const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

/** Prefix for every LocalRater collection, so it can never collide with
 *  unrelated collections already living in this shared Directus instance. */
export const PREFIX = 'lr_';
export const col = (name: string) => `${PREFIX}${name}`;
