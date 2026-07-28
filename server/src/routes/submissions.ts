import { Router } from 'express';
import { z } from 'zod';
import { col, createItem, directus, readItems, updateItem } from '../lib/directus.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { fromAnswerPayload, toAnswerPayload } from '../../../shared/question-schemas.js';
import type {
  CategoryAnswersResponse, CreateOrResumeSubmissionRequest, SaveCategoryAnswersRequest, SubmissionStateResponse,
} from '../../../shared/api-types.js';
import type { Question, Submission } from '../../../shared/types.js';

export const submissionsRouter = Router();

const createOrResumeSchema = z.object({
  editionId: z.string().uuid(),
  token: z.string().min(10).max(64).optional(),
  countryCode: z.string().max(10).nullable().optional(),
  regionId: z.string().uuid().nullable().optional(),
});

async function findSubmission(token: string, editionId: string): Promise<Submission | null> {
  const rows = (await directus.request(
    readItems(col('submissions') as any, {
      filter: { submission_token: { _eq: token }, edition_id: { _eq: editionId } },
      limit: 1,
    }),
  )) as Submission[];
  return rows[0] ?? null;
}

function toState(sub: Submission): SubmissionStateResponse {
  return {
    token: sub.submission_token,
    submissionId: sub.id,
    isComplete: sub.is_complete,
    completedCategories: sub.completed_categories ?? [],
  };
}

submissionsRouter.post('/', writeRateLimiter(), async (req, res) => {
  const parsed = createOrResumeSchema.safeParse(req.body as CreateOrResumeSubmissionRequest);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { editionId, token, countryCode, regionId } = parsed.data;

  if (token) {
    const existing = await findSubmission(token, editionId);
    if (existing) return res.json(toState(existing));
  }

  const newToken = token ?? crypto.randomUUID().replace(/-/g, '');
  const created = (await directus.request(
    createItem(col('submissions') as any, {
      edition_id: editionId,
      country_code: countryCode ?? null,
      submission_token: newToken,
      is_complete: false,
      completed_categories: [],
      user_region_id: regionId ?? null,
    }),
  )) as Submission;

  res.json(toState(created));
});

const saveAnswersSchema = z.object({
  categoryId: z.string().uuid(),
  categorySlug: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      type: z.string(),
      value: z.unknown(),
    }),
  ),
});

submissionsRouter.post('/:token/answers', writeRateLimiter(), async (req, res) => {
  const { token } = req.params;
  const parsed = saveAnswersSchema.safeParse(req.body as SaveCategoryAnswersRequest);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { categoryId, categorySlug, answers } = parsed.data;

  const rows = (await directus.request(
    readItems(col('submissions') as any, { filter: { submission_token: { _eq: token } }, limit: 1 }),
  )) as Submission[];
  const submission = rows[0];
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  for (const answer of answers) {
    const payload = toAnswerPayload(answer.type as Question['type'], answer.value);
    const existingAnswer = (await directus.request(
      readItems(col('answers') as any, {
        filter: { submission_id: { _eq: submission.id }, question_id: { _eq: answer.questionId } },
        limit: 1,
      }),
    )) as Array<{ id: string }>;

    if (existingAnswer[0]) {
      await directus.request(updateItem(col('answers') as any, existingAnswer[0].id, payload as any));
    } else {
      await directus.request(
        createItem(col('answers') as any, {
          submission_id: submission.id,
          question_id: answer.questionId,
          ...payload,
        } as any),
      );
    }
  }

  const completed = new Set(submission.completed_categories ?? []);
  completed.add(categorySlug);
  const updated = (await directus.request(
    updateItem(col('submissions') as any, submission.id, {
      completed_categories: Array.from(completed),
    } as any),
  )) as Submission;

  res.json(toState(updated));
});

submissionsRouter.get('/:token/categories/:categoryId/answers', async (req, res) => {
  const { token, categoryId } = req.params;

  const subRows = (await directus.request(
    readItems(col('submissions') as any, { filter: { submission_token: { _eq: token } }, limit: 1 }),
  )) as Submission[];
  const submission = subRows[0];
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  const questions = (await directus.request(
    readItems(col('questions') as any, { filter: { category_id: { _eq: categoryId } }, limit: -1 }),
  )) as Question[];
  if (questions.length === 0) return res.json({ answers: {} } satisfies CategoryAnswersResponse);

  const answerRows = (await directus.request(
    readItems(col('answers') as any, {
      filter: { submission_id: { _eq: submission.id }, question_id: { _in: questions.map((q) => q.id) } },
      limit: -1,
    }),
  )) as Array<{ question_id: string; value_text: string | null; value_number: number | null; value_json: unknown }>;

  const answers: Record<string, unknown> = {};
  for (const row of answerRows) {
    const question = questions.find((q) => q.id === row.question_id);
    if (!question) continue;
    answers[question.slug] = fromAnswerPayload(question.type, row);
  }

  res.json({ answers } satisfies CategoryAnswersResponse);
});
