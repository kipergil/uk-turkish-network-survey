import { Router } from 'express';
import { z } from 'zod';
import { col, createItem, directus } from '../lib/directus.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import type { SubscribeRequest } from '../../../shared/api-types.js';

export const subscribersRouter = Router();

const subscribeSchema = z.object({
  editionId: z.string().uuid(),
  email: z.string().email(),
});

subscribersRouter.post('/', writeRateLimiter({ limit: 5 }), async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body as SubscribeRequest);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  await directus.request(
    createItem(col('subscribers') as any, { edition_id: parsed.data.editionId, email: parsed.data.email }),
  );

  res.json({ ok: true });
});
