import { useQuery } from '@tanstack/react-query';
import {
  fetchActiveCountries, fetchCategories, fetchCategoryBySlug, fetchOpenEdition, fetchQuestions, fetchRegions,
} from '@/lib/directus';

export function useActiveCountries() {
  return useQuery({ queryKey: ['countries'], queryFn: fetchActiveCountries });
}

export function useOpenEdition(countryCode: string | null) {
  return useQuery({
    queryKey: ['edition', countryCode],
    queryFn: () => fetchOpenEdition(countryCode as string),
    enabled: !!countryCode,
  });
}

export function useCategories(editionId: string | undefined, country: string | null) {
  return useQuery({
    queryKey: ['categories', editionId, country],
    queryFn: () => fetchCategories(editionId as string, country as string),
    enabled: !!editionId && !!country,
  });
}

export function useCategoryBySlug(editionId: string | undefined, slug: string) {
  return useQuery({
    queryKey: ['category', editionId, slug],
    queryFn: () => fetchCategoryBySlug(editionId as string, slug),
    enabled: !!editionId,
  });
}

export function useQuestions(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['questions', categoryId],
    queryFn: () => fetchQuestions(categoryId as string),
    enabled: !!categoryId,
  });
}

export function useRegions(countryCode: string | null) {
  return useQuery({
    queryKey: ['regions', countryCode],
    queryFn: () => fetchRegions(countryCode as string),
    enabled: !!countryCode,
  });
}
