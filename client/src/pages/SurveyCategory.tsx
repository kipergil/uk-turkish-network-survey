import * as React from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateViews';
import { DynamicQuestion } from '@/components/DynamicQuestion';
import { useCategories, useCategoryBySlug, useOpenEdition, useQuestions } from '@/hooks/useSurveyData';
import { useCategoryAnswers, useSaveCategoryAnswers, useSubmission } from '@/hooks/useSubmission';
import { useI18n } from '@/lib/i18n';
import { getSelectedCountry } from '@/lib/submission';
import { buildCategoryFormSchema, isQuestionVisible } from '@shared/question-schemas';
import { localize } from '@shared/types';

export default function SurveyCategory() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const country = getSelectedCountry() ?? 'UK';

  const { data: edition, isLoading: editionLoading } = useOpenEdition(country);
  const { data: category, isLoading: categoryLoading, error: categoryError } = useCategoryBySlug(edition?.id, categorySlug);
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuestions(category?.id);
  const { data: allCategories } = useCategories(edition?.id, country);
  const { token, submission } = useSubmission(edition?.id);
  const { data: prefill } = useCategoryAnswers(token, category?.id);
  const saveMutation = useSaveCategoryAnswers(token);

  const schema = React.useMemo(() => buildCategoryFormSchema(questions ?? []), [questions]);
  const form = useForm<Record<string, any>>({ resolver: zodResolver(schema) as any, defaultValues: {} });

  React.useEffect(() => {
    if (prefill?.answers) form.reset(prefill.answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const watched = form.watch();

  if (editionLoading || categoryLoading || questionsLoading) return <LoadingState />;
  if (categoryError || questionsError) return <ErrorState />;
  if (!category) return <EmptyState />;

  const visibleQuestions = (questions ?? []).filter((q) => isQuestionVisible(q.depends_on, watched as Record<string, unknown>));

  const onSubmit = form.handleSubmit(async (values) => {
    const answers = visibleQuestions
      .filter((q) => values[q.slug] !== undefined && values[q.slug] !== null && values[q.slug] !== '')
      .map((q) => ({ questionId: q.id, type: q.type, value: values[q.slug] }));

    await saveMutation.mutateAsync({ categoryId: category.id, categorySlug: category.slug, answers });
    toast.success(t('category.saved'));

    const remaining = (allCategories ?? []).filter(
      (c) => c.slug !== category.slug && !(submission?.completedCategories ?? []).includes(c.slug),
    );
    if (remaining.length > 0) {
      toast(`${t('category.nextSuggestion')} ${localize(remaining[0], 'name', lang)}`, {
        action: { label: t('categories.start'), onClick: () => navigate(`/survey/${remaining[0].slug}`) },
      });
    } else {
      toast(t('category.allDone'));
    }
    navigate('/survey/categories');
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link href="/survey/categories">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('category.back')}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{localize(category, 'name', lang)}</h1>
        {localize(category, 'description', lang) && (
          <p className="text-muted-foreground">{localize(category, 'description', lang)}</p>
        )}
      </div>

      {visibleQuestions.length === 0 && <EmptyState />}

      {visibleQuestions.length > 0 && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {visibleQuestions.map((q) => (
            <Controller
              key={q.id}
              control={form.control}
              name={q.slug}
              render={({ field, fieldState }) => (
                <DynamicQuestion
                  question={q}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
          <Button type="submit" size="lg" disabled={saveMutation.isPending} className="self-start">
            {saveMutation.isPending ? t('category.saving') : t('category.submit')}
          </Button>
        </form>
      )}
    </div>
  );
}
