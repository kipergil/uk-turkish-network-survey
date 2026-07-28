/**
 * LocalRater — request/response contracts between client/ and server/.
 * Kept here so both sides stay in sync without duplicating shapes.
 */
import type { QuestionType } from './types.js';

export const PRIVACY_THRESHOLD = 5;

export interface CreateOrResumeSubmissionRequest {
  editionId: string;
  token?: string;
  countryCode?: string | null;
  regionId?: string | null;
}

export interface SubmissionStateResponse {
  token: string;
  submissionId: string;
  isComplete: boolean;
  completedCategories: string[];
}

export interface SaveCategoryAnswersRequest {
  categoryId: string;
  categorySlug: string;
  answers: Array<{
    questionId: string;
    type: QuestionType;
    value: unknown;
  }>;
}

export interface CategoryAnswersResponse {
  /** keyed by question slug, already inverted to the form-facing value shape */
  answers: Record<string, unknown>;
}

export interface SubscribeRequest {
  editionId: string;
  email: string;
}

export interface StatsResponse {
  editionId: string;
  participantCount: number;
}

/** One question's aggregated result, shape depends on `type`. */
export type QuestionResult =
  | { type: 'single_choice' | 'dropdown' | 'multi_choice'; kind: 'distribution'; total: number; counts: Record<string, number> }
  | { type: 'boolean'; kind: 'distribution'; total: number; counts: { true: number; false: number } }
  | { type: 'rating' | 'nps' | 'scale_likert'; kind: 'numeric'; total: number; average: number; histogram: Record<string, number> }
  | { type: 'matrix'; kind: 'matrix'; total: number; rowAverages: Array<{ row: string; average: number }> }
  | { type: 'ranking'; kind: 'ranking'; total: number; weighted: Array<{ value: string; score: number }> }
  // free text is never aggregated for public display — individual answers must never be exposed
  | { type: 'open_text'; kind: 'not_public'; total: number }
  | { type: QuestionType; kind: 'insufficient_data'; total: number };

export interface CategoryResultsResponse {
  categoryId: string;
  categorySlug: string;
  totalSubmissions: number;
  questions: Array<{
    questionId: string;
    slug: string;
    label_tr: string;
    label_en: string;
    type: QuestionType;
    options: Array<{ value: string; label_tr: string; label_en: string }>;
    result: QuestionResult;
  }>;
}

export interface EditionResultsOverview {
  editionId: string;
  totalSubmissions: number;
  completeSubmissions: number;
  categories: Array<{
    categoryId: string;
    slug: string;
    name_tr: string;
    name_en: string;
    completedCount: number;
  }>;
}
