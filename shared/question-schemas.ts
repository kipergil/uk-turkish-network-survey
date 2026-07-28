/**
 * LocalRater — one zod schema per question type.
 * Used for BOTH react-hook-form validation (client) and answer payload
 * construction (client + server). This is the single source of truth
 * for "is this answer value valid for this question" — adding a new
 * question TYPE means adding one case here (content itself never needs
 * a code change, only new types do).
 */
import { z } from 'zod';
import type {
  MatrixConfig, NpsConfig, OpenTextConfig, Question, RatingConfig, ScaleLikertConfig,
} from './types.js';

/** Build the zod schema for a single question's answer VALUE (not the payload envelope). */
export function buildAnswerValueSchema(question: Pick<Question, 'type' | 'config' | 'options' | 'is_required'>): z.ZodTypeAny {
  const optionValues = (question.options ?? []).map((o) => o.value);

  switch (question.type) {
    case 'single_choice':
    case 'dropdown': {
      return optionValues.length
        ? z.enum(optionValues as [string, ...string[]])
        : z.string().min(1);
    }
    case 'boolean':
      return z.boolean();
    case 'open_text': {
      const cfg = (question.config as OpenTextConfig | null);
      const maxlength = cfg?.maxlength ?? 1000;
      return z.string().trim().max(maxlength);
    }
    case 'rating': {
      const cfg = (question.config as RatingConfig | null);
      const max = cfg?.max ?? 5;
      return z.number().int().min(1).max(max);
    }
    case 'nps': {
      const cfg = (question.config as NpsConfig | null);
      return z.number().int().min(cfg?.min ?? 0).max(cfg?.max ?? 10);
    }
    case 'scale_likert': {
      const cfg = (question.config as ScaleLikertConfig | null);
      const points = cfg?.points ?? 5;
      return z.number().int().min(1).max(points);
    }
    case 'multi_choice': {
      const base = optionValues.length
        ? z.array(z.enum(optionValues as [string, ...string[]]))
        : z.array(z.string());
      return question.is_required ? base.min(1) : base;
    }
    case 'ranking': {
      if (!optionValues.length) return z.array(z.string());
      return z.array(z.enum(optionValues as [string, ...string[]])).length(optionValues.length);
    }
    case 'matrix': {
      const cfg = (question.config as MatrixConfig | null);
      const rows = cfg?.rows_en ?? cfg?.rows_tr ?? [];
      const columns = cfg?.columns ?? [1, 2, 3, 4, 5];
      const shape: Record<string, z.ZodTypeAny> = {};
      rows.forEach((_row, i) => {
        shape[String(i)] = z.union(
          columns.map((c) => z.literal(c)) as [z.ZodLiteral<number>, z.ZodLiteral<number>, ...z.ZodLiteral<number>[]],
        );
      });
      return z.object(shape);
    }
    default: {
      const _exhaustive: never = question.type;
      return z.any();
    }
  }
}

/** Wraps the value schema with optional/nullable when the question isn't required. */
export function buildFormFieldSchema(question: Pick<Question, 'type' | 'config' | 'options' | 'is_required'>): z.ZodTypeAny {
  const base = buildAnswerValueSchema(question);
  return question.is_required ? base : base.optional().nullable();
}

/** Builds a whole-category RHF/zod schema, keyed by question slug. */
export function buildCategoryFormSchema(questions: Pick<Question, 'slug' | 'type' | 'config' | 'options' | 'is_required'>[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    shape[q.slug] = buildFormFieldSchema(q);
  }
  return z.object(shape);
}

export type AnswerPayload = {
  value_text: string | null;
  value_number: number | null;
  value_json: unknown;
};

/**
 * Answer storage contract:
 *  single_choice/dropdown/boolean/open_text -> value_text
 *  rating/nps/scale_likert                  -> value_number
 *  multi_choice/ranking/matrix              -> value_json
 */
export function toAnswerPayload(type: Question['type'], value: unknown): AnswerPayload {
  switch (type) {
    case 'single_choice':
    case 'dropdown':
    case 'open_text':
      return { value_text: value == null ? null : String(value), value_number: null, value_json: null };
    case 'boolean':
      return { value_text: value == null ? null : (value ? 'true' : 'false'), value_number: null, value_json: null };
    case 'rating':
    case 'nps':
    case 'scale_likert':
      return { value_text: null, value_number: value == null ? null : Number(value), value_json: null };
    case 'multi_choice':
    case 'ranking':
    case 'matrix':
      return { value_text: null, value_number: null, value_json: value ?? null };
    default: {
      const _exhaustive: never = type;
      return { value_text: null, value_number: null, value_json: null };
    }
  }
}

/** Inverse of toAnswerPayload — used to prefill a form when resuming a submission. */
export function fromAnswerPayload(type: Question['type'], row: AnswerPayload): unknown {
  switch (type) {
    case 'single_choice':
    case 'dropdown':
    case 'open_text':
      return row.value_text ?? undefined;
    case 'boolean':
      return row.value_text == null ? undefined : row.value_text === 'true';
    case 'rating':
    case 'nps':
    case 'scale_likert':
      return row.value_number ?? undefined;
    case 'multi_choice':
    case 'ranking':
    case 'matrix':
      return row.value_json ?? undefined;
    default:
      return undefined;
  }
}

/** Client-side depends_on evaluation: hide the field if it doesn't match. */
export function isQuestionVisible(
  dependsOn: Question['depends_on'],
  answers: Record<string, unknown>,
): boolean {
  if (!dependsOn) return true;
  const current = answers[dependsOn.question_slug];
  const currentStr = current == null ? undefined : String(current);
  if ('equals' in dependsOn && dependsOn.equals !== undefined) {
    return currentStr === dependsOn.equals;
  }
  if ('not_equals' in dependsOn && dependsOn.not_equals !== undefined) {
    return currentStr !== dependsOn.not_equals;
  }
  return true;
}
