/**
 * LocalRater — shared Directus collection types.
 * Mirrors directus/data-model.md. Consumed by both client/ and server/.
 */

export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'dropdown'
  | 'rating'
  | 'scale_likert'
  | 'nps'
  | 'boolean'
  | 'ranking'
  | 'matrix'
  | 'open_text';

export interface Country {
  code: string;
  name_tr: string;
  name_en: string;
  is_active: boolean;
  launch_year: number | null;
  currency: string | null;
  flag_emoji: string | null;
  sort_order: number;
}

export interface SurveyEdition {
  id: string;
  country_code: string;
  year: number;
  title_tr: string;
  title_en: string;
  status: 'draft' | 'open' | 'closed';
  opens_at: string | null;
  closes_at: string | null;
}

export interface Category {
  id: string;
  edition_id: string;
  country_code: string | null;
  slug: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  icon: string | null;
  sort_order: number;
  is_optional: boolean;
  status: 'active' | 'hidden';
}

export interface QuestionOption {
  id: string;
  question_id: string;
  value: string;
  label_tr: string;
  label_en: string;
  sort_order: number;
}

export interface DependsOn {
  question_slug: string;
  equals?: string;
  not_equals?: string;
}

export interface RatingConfig { max: number }
export interface NpsConfig { min: number; max: number }
export interface ScaleLikertConfig { points: number; anchors_tr: string[]; anchors_en: string[] }
export interface MatrixConfig { rows_tr: string[]; rows_en: string[]; columns: number[] }
export interface OpenTextConfig { maxlength: number }

export interface Question {
  id: string;
  category_id: string;
  edition_id: string;
  country_code: string | null;
  slug: string;
  type: QuestionType;
  label_tr: string;
  label_en: string;
  help_tr: string | null;
  help_en: string | null;
  is_required: boolean;
  sort_order: number;
  status: 'active' | 'hidden';
  config: Record<string, unknown> | null;
  depends_on: DependsOn | null;
  options?: QuestionOption[];
}

export interface Region {
  id: string;
  country_code: string;
  name: string;
  parent_id: string | null;
  type: 'city' | 'region' | 'borough' | null;
  lat: number | null;
  lng: number | null;
  sort_order: number;
}

export interface Submission {
  id: string;
  edition_id: string;
  country_code: string | null;
  submission_token: string;
  created_at: string;
  updated_at: string;
  is_complete: boolean;
  completed_categories: string[] | null;
  user_region_id: string | null;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  value_text: string | null;
  value_number: number | null;
  value_json: unknown;
}

export interface Subscriber {
  id: string;
  edition_id: string;
  email: string;
  created_at: string;
}

export type Lang = 'tr' | 'en';

/** Pick the localized field for the current language, tr first. */
export function localize(obj: object, field: string, lang: Lang): string {
  const record = obj as Record<string, unknown>;
  const key = `${field}_${lang}`;
  const fallback = `${field}_tr`;
  return (record[key] as string) ?? (record[fallback] as string) ?? '';
}
