import { Router } from 'express';
import { col, directus, readItems } from '../lib/directus.js';
import type { StatsResponse } from '../../../shared/api-types.js';

export const statsRouter = Router();

statsRouter.get('/:editionId', async (req, res) => {
  const { editionId } = req.params;

  const submissions = (await directus.request(
    readItems(col('submissions') as any, {
      filter: { edition_id: { _eq: editionId } },
      fields: ['completed_categories'],
      limit: -1,
    }),
  )) as Array<{ completed_categories: string[] | null }>;

  const participantCount = submissions.filter((s) => (s.completed_categories ?? []).length > 0).length;

  res.json({ editionId, participantCount } satisfies StatsResponse);
});
