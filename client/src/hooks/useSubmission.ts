import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getOrCreateSubmissionToken } from '@/lib/submission';
import type { SaveCategoryAnswersRequest } from '@shared/api-types';

/**
 * Ensures a submission exists for this browser + edition (creating one on
 * first visit, resuming via the localStorage token otherwise), then exposes
 * its live state under queryKey ['submission', token].
 *
 * This is intentionally a single useQuery (not a query + a separate mutation
 * both firing the same find-or-create call on mount) — that earlier shape
 * raced two concurrent create requests for a brand-new token and produced
 * two submission rows sharing one token. TanStack Query already dedupes
 * concurrent callers of the same queryKey, so one query is both correct and
 * sufficient here.
 */
export function useSubmission(editionId: string | undefined) {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!editionId) return;
    const { token: t } = getOrCreateSubmissionToken(editionId);
    setToken(t);
  }, [editionId]);

  const query = useQuery({
    queryKey: ['submission', token],
    queryFn: () => api.createOrResumeSubmission({ editionId: editionId as string, token: token as string }),
    enabled: !!token && !!editionId,
    staleTime: 60_000,
  });

  return { token, submission: query.data, isLoading: !token || query.isLoading };
}

export function useCategoryAnswers(token: string | null, categoryId: string | undefined) {
  return useQuery({
    queryKey: ['categoryAnswers', token, categoryId],
    queryFn: () => api.getCategoryAnswers(token as string, categoryId as string),
    enabled: !!token && !!categoryId,
  });
}

export function useSaveCategoryAnswers(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveCategoryAnswersRequest) => api.saveCategoryAnswers(token as string, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['submission', token], data);
      queryClient.invalidateQueries({ queryKey: ['submission', token] });
      queryClient.invalidateQueries({ queryKey: ['categoryAnswers', token, variables.categoryId] });
    },
  });
}
