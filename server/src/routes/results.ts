import { Router } from 'express';
import { col, directus, readItems } from '../lib/directus.js';
import {
  aggregateBoolean, aggregateDistribution, aggregateMatrix, aggregateMultiChoice, aggregateNumeric, aggregateRanking,
} from '../lib/aggregate.js';
import { PRIVACY_THRESHOLD } from '../../../shared/api-types.js';
import type { CategoryResultsResponse, EditionResultsOverview, QuestionResult } from '../../../shared/api-types.js';
import type { Category, MatrixConfig, Question, QuestionOption, Submission } from '../../../shared/types.js';

export const resultsRouter = Router();

resultsRouter.get('/:editionId', async (req, res) => {
  const { editionId } = req.params;

  const [categories, submissions] = await Promise.all([
    directus.request(
      readItems(col('categories') as any, {
        filter: { edition_id: { _eq: editionId }, status: { _eq: 'active' } },
        sort: ['sort_order'],
        limit: -1,
      }),
    ) as Promise<Category[]>,
    directus.request(
      readItems(col('submissions') as any, {
        filter: { edition_id: { _eq: editionId } },
        fields: ['is_complete', 'completed_categories'],
        limit: -1,
      }),
    ) as Promise<Array<Pick<Submission, 'is_complete' | 'completed_categories'>>>,
  ]);

  const completedCountBySlug = new Map<string, number>();
  for (const sub of submissions) {
    for (const slug of sub.completed_categories ?? []) {
      completedCountBySlug.set(slug, (completedCountBySlug.get(slug) ?? 0) + 1);
    }
  }

  const overview: EditionResultsOverview = {
    editionId,
    totalSubmissions: submissions.length,
    completeSubmissions: submissions.filter((s) => s.is_complete).length,
    categories: categories.map((c) => ({
      categoryId: c.id,
      slug: c.slug,
      name_tr: c.name_tr,
      name_en: c.name_en,
      completedCount: completedCountBySlug.get(c.slug) ?? 0,
    })),
  };

  res.json(overview);
});

resultsRouter.get('/:editionId/:categorySlug', async (req, res) => {
  const { editionId, categorySlug } = req.params;

  const categories = (await directus.request(
    readItems(col('categories') as any, {
      filter: { edition_id: { _eq: editionId }, slug: { _eq: categorySlug } },
      limit: 1,
    }),
  )) as Category[];
  const category = categories[0];
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const questions = (await directus.request(
    readItems(col('questions') as any, {
      filter: { category_id: { _eq: category.id }, status: { _eq: 'active' } },
      sort: ['sort_order'],
      limit: -1,
    }),
  )) as Question[];

  const allOptions = questions.length
    ? ((await directus.request(
        readItems(col('question_options') as any, {
          filter: { question_id: { _in: questions.map((q) => q.id) } },
          sort: ['sort_order'],
          limit: -1,
        }),
      )) as QuestionOption[])
    : [];

  const questionResults: CategoryResultsResponse['questions'] = [];

  for (const question of questions) {
    const options = allOptions.filter((o) => o.question_id === question.id);

    const answers = (await directus.request(
      readItems(col('answers') as any, {
        filter: {
          question_id: { _eq: question.id },
          submission_id: { edition_id: { _eq: editionId } } as any,
        },
        fields: ['value_text', 'value_number', 'value_json'],
        limit: -1,
      }),
    )) as Array<{ value_text: string | null; value_number: number | null; value_json: unknown }>;

    const total = answers.length;
    let result: QuestionResult;

    if (total < PRIVACY_THRESHOLD) {
      result = { type: question.type, kind: 'insufficient_data', total };
    } else {
      switch (question.type) {
        case 'single_choice':
        case 'dropdown':
          result = {
            type: question.type,
            kind: 'distribution',
            total,
            counts: aggregateDistribution(answers.map((a) => a.value_text ?? '').filter(Boolean)),
          };
          break;
        case 'multi_choice':
          result = {
            type: 'multi_choice',
            kind: 'distribution',
            total,
            counts: aggregateMultiChoice(answers.map((a) => (a.value_json as string[]) ?? [])),
          };
          break;
        case 'boolean':
          result = {
            type: 'boolean',
            kind: 'distribution',
            total,
            counts: aggregateBoolean(answers.map((a) => a.value_text ?? '')),
          };
          break;
        case 'rating':
        case 'nps':
        case 'scale_likert':
          result = {
            type: question.type,
            kind: 'numeric',
            total,
            ...aggregateNumeric(answers.map((a) => a.value_number ?? 0)),
          };
          break;
        case 'matrix': {
          const cfg = question.config as MatrixConfig | null;
          const rowLabels = cfg?.rows_en ?? cfg?.rows_tr ?? [];
          result = {
            type: 'matrix',
            kind: 'matrix',
            total,
            rowAverages: aggregateMatrix(answers.map((a) => (a.value_json as Record<string, number>) ?? {}), rowLabels),
          };
          break;
        }
        case 'ranking':
          result = {
            type: 'ranking',
            kind: 'ranking',
            total,
            weighted: aggregateRanking(
              answers.map((a) => (a.value_json as string[]) ?? []),
              options.map((o) => o.value),
            ),
          };
          break;
        case 'open_text':
        default:
          result = { type: 'open_text', kind: 'not_public', total };
          break;
      }
    }

    questionResults.push({
      questionId: question.id,
      slug: question.slug,
      label_tr: question.label_tr,
      label_en: question.label_en,
      type: question.type,
      options: options.map((o) => ({ value: o.value, label_tr: o.label_tr, label_en: o.label_en })),
      result,
    });
  }

  const response: CategoryResultsResponse = {
    categoryId: category.id,
    categorySlug: category.slug,
    totalSubmissions: questionResults.reduce((max, q) => Math.max(max, q.result.total), 0),
    questions: questionResults,
  };

  res.json(response);
});
