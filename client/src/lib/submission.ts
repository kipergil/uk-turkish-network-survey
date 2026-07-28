import { nanoid } from 'nanoid';

const KEY_PREFIX = 'localrater:submission-token:';

/** One token per edition, persisted in localStorage so a visitor can leave and resume. */
export function getOrCreateSubmissionToken(editionId: string): { token: string; isNew: boolean } {
  const key = `${KEY_PREFIX}${editionId}`;
  const existing = localStorage.getItem(key);
  if (existing) return { token: existing, isNew: false };
  const token = nanoid(24);
  localStorage.setItem(key, token);
  return { token, isNew: true };
}

const COMPLETED_KEY_PREFIX = 'localrater:completed-categories:';

export function getLocalCompletedCategories(editionId: string): string[] {
  try {
    const raw = localStorage.getItem(`${COMPLETED_KEY_PREFIX}${editionId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setLocalCompletedCategories(editionId: string, slugs: string[]) {
  localStorage.setItem(`${COMPLETED_KEY_PREFIX}${editionId}`, JSON.stringify(slugs));
}

const COUNTRY_KEY = 'localrater:selected-country';

export function getSelectedCountry(): string | null {
  return localStorage.getItem(COUNTRY_KEY);
}

export function setSelectedCountry(code: string) {
  localStorage.setItem(COUNTRY_KEY, code);
}
