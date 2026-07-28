import type { Category, Country, Question, Region, SurveyEdition } from '@shared/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

/**
 * Content (countries/editions/categories/questions/options/regions) is
 * fetched from Directus at runtime — no hardcoding — but through our own
 * server's /api/content proxy rather than directly from the browser.
 * This Directus instance sends no CORS headers, so a direct browser ->
 * Directus cross-origin request is rejected before it ever reaches our
 * code; routing it through the server (a normal server-to-server call)
 * sidesteps that while keeping the data itself fully live/Directus-driven.
 */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/content${path}`);
  if (!res.ok) throw new Error(`Content request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchActiveCountries() {
  return get<Country[]>('/countries');
}

export async function fetchOpenEdition(countryCode: string) {
  return get<SurveyEdition | null>(`/editions/${encodeURIComponent(countryCode)}/open`);
}

export async function fetchCategories(editionId: string, countryCode: string) {
  return get<Category[]>(`/categories?editionId=${encodeURIComponent(editionId)}&country=${encodeURIComponent(countryCode)}`);
}

export async function fetchCategoryBySlug(editionId: string, slug: string) {
  return get<Category | null>(`/categories/by-slug?editionId=${encodeURIComponent(editionId)}&slug=${encodeURIComponent(slug)}`);
}

export async function fetchQuestions(categoryId: string) {
  return get<Question[]>(`/questions?categoryId=${encodeURIComponent(categoryId)}`);
}

export async function fetchRegions(countryCode: string) {
  return get<Region[]>(`/regions?country=${encodeURIComponent(countryCode)}`);
}
