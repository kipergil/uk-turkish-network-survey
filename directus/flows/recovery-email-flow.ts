/**
 * LocalRater — recovery email Flow
 * -------------------------------------------------------------
 * Creates a Directus Flow (event hook on lr_recovery_emails item creation)
 * that emails the resume link via Directus's own configured SMTP transport.
 * Idempotent by Flow name. Only ever creates NEW flow/operation rows —
 * never touches any of this shared instance's existing flows.
 *
 * Requires DIRECTUS_ADMIN_TOKEN (Flows are a system collection outside the
 * LocalRater Service role's lr_*-only scope).
 *
 * Run: npx tsx directus/flows/recovery-email-flow.ts
 */
import 'dotenv/config';

const DIRECTUS_URL = process.env.DIRECTUS_URL!;
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const APP_URL = process.env.LOCALRATER_APP_URL || 'https://turkish-network-survey.vercel.app';

const FLOW_NAME = 'LocalRater — send recovery email';

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

async function findFlow() {
  const json = await api(`/flows?filter=${encodeURIComponent(JSON.stringify({ name: { _eq: FLOW_NAME } }))}&limit=1`);
  return json?.data?.[0] ?? null;
}

const EMAIL_BODY = `
<p>Merhaba,</p>
<p>LocalRater anketine devam etmek için kodunuz: <strong>{{$trigger.payload.code}}</strong></p>
<p><a href="${APP_URL}/resume?code={{$trigger.payload.code}}">Devam etmek için tıklayın</a></p>
<hr/>
<p>Hi,</p>
<p>Your LocalRater survey resume code: <strong>{{$trigger.payload.code}}</strong></p>
<p><a href="${APP_URL}/resume?code={{$trigger.payload.code}}">Click to resume</a></p>
`.trim();

async function run() {
  const existing = await findFlow();
  if (existing) {
    console.log(`= flow exists: ${FLOW_NAME} (${existing.id})`);
    console.log('Delete it in Directus admin first if you want this script to recreate it with updated content.');
    return;
  }

  const flow = await api('/flows', {
    method: 'POST',
    body: JSON.stringify({
      name: FLOW_NAME,
      icon: 'forward_to_inbox',
      description: 'Sends the resume link by email when a new lr_recovery_emails row is created. Never reads submissions/answers.',
      status: 'active',
      trigger: 'event',
      accountability: 'all',
      options: {
        type: 'action',
        scope: ['items.create'],
        collections: ['lr_recovery_emails'],
      },
    }),
  });
  console.log(`+ created flow: ${FLOW_NAME} (${flow.data.id})`);

  const operation = await api('/operations', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Send resume email',
      key: 'send_resume_email',
      type: 'mail',
      position_x: 19,
      position_y: 1,
      flow: flow.data.id,
      options: {
        to: ['{{$trigger.payload.email}}'],
        subject: 'LocalRater — Anketinize devam edin / Resume your survey',
        type: 'wysiwyg',
        body: EMAIL_BODY,
      },
    }),
  });
  console.log(`+ created operation: send_resume_email (${operation.data.id})`);

  await api(`/flows/${flow.data.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ operation: operation.data.id }),
  });
  console.log('+ linked operation as flow entrypoint');

  console.log('Flow apply complete.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
