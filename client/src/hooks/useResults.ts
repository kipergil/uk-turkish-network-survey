import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useEditionResults(editionId: string | undefined) {
  return useQuery({
    queryKey: ['results', 'overview', editionId],
    queryFn: () => api.editionResults(editionId as string),
    enabled: !!editionId,
  });
}

export function useCategoryResults(editionId: string | undefined, categorySlug: string) {
  return useQuery({
    queryKey: ['results', categorySlug, editionId],
    queryFn: () => api.categoryResults(editionId as string, categorySlug),
    enabled: !!editionId,
  });
}

export function useStats(editionId: string | undefined) {
  return useQuery({
    queryKey: ['stats', editionId],
    queryFn: () => api.stats(editionId as string),
    enabled: !!editionId,
    refetchInterval: 60_000,
  });
}
