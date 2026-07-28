import { Router } from 'express';
import { col, directus, readItems } from '../lib/directus.js';
import type { Category, Country, Question, QuestionOption, Region, SurveyEdition } from '../../../shared/types.js';

/**
 * Read-only proxy for Directus content collections (countries/editions/
 * categories/questions/options/regions). This Directus instance does not
 * send CORS headers, so the browser cannot call it cross-origin directly —
 * the server makes the request instead (server-to-server calls aren't
 * subject to browser CORS) and forwards the JSON same-origin. The data
 * still lives in and is fetched live from Directus at request time; only
 * the network hop changed, not the "no hardcoded content" architecture.
 */
export const contentRouter = Router();

contentRouter.get('/countries', async (_req, res) => {
  const countries = (await directus.request(
    readItems(col('countries') as any, { filter: { is_active: { _eq: true } }, sort: ['sort_order'], limit: -1 }),
  )) as Country[];
  res.json(countries);
});

contentRouter.get('/editions/:countryCode/open', async (req, res) => {
  const rows = (await directus.request(
    readItems(col('survey_editions') as any, {
      filter: { country_code: { _eq: req.params.countryCode }, status: { _eq: 'open' } },
      sort: ['-year'],
      limit: 1,
    }),
  )) as SurveyEdition[];
  res.json(rows[0] ?? null);
});

contentRouter.get('/categories', async (req, res) => {
  const { editionId, country } = req.query as { editionId?: string; country?: string };
  if (!editionId || !country) return res.status(400).json({ error: 'editionId and country are required' });

  const categories = (await directus.request(
    readItems(col('categories') as any, {
      filter: {
        edition_id: { _eq: editionId },
        status: { _eq: 'active' },
        _or: [{ country_code: { _null: true } }, { country_code: { _eq: country } }],
      },
      sort: ['sort_order'],
      limit: -1,
    }),
  )) as Category[];
  res.json(categories);
});

contentRouter.get('/categories/by-slug', async (req, res) => {
  const { editionId, slug } = req.query as { editionId?: string; slug?: string };
  if (!editionId || !slug) return res.status(400).json({ error: 'editionId and slug are required' });

  const rows = (await directus.request(
    readItems(col('categories') as any, {
      filter: { edition_id: { _eq: editionId }, slug: { _eq: slug }, status: { _eq: 'active' } },
      limit: 1,
    }),
  )) as Category[];
  res.json(rows[0] ?? null);
});

contentRouter.get('/questions', async (req, res) => {
  const { categoryId } = req.query as { categoryId?: string };
  if (!categoryId) return res.status(400).json({ error: 'categoryId is required' });

  const questions = (await directus.request(
    readItems(col('questions') as any, {
      filter: { category_id: { _eq: categoryId }, status: { _eq: 'active' } },
      sort: ['sort_order'],
      limit: -1,
    }),
  )) as Question[];

  if (questions.length === 0) return res.json([]);

  const options = (await directus.request(
    readItems(col('question_options') as any, {
      filter: { question_id: { _in: questions.map((q) => q.id) } },
      sort: ['sort_order'],
      limit: -1,
    }),
  )) as QuestionOption[];

  res.json(questions.map((q) => ({ ...q, options: options.filter((o) => o.question_id === q.id) })));
});

contentRouter.get('/regions', async (req, res) => {
  const { country } = req.query as { country?: string };
  if (!country) return res.status(400).json({ error: 'country is required' });

  const regions = (await directus.request(
    readItems(col('regions') as any, { filter: { country_code: { _eq: country } }, sort: ['sort_order'], limit: -1 }),
  )) as Region[];
  res.json(regions);
});
