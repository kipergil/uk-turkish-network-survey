import { useParams, Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateViews';
import { QuestionResultCard } from '@/components/charts/QuestionResultCard';
import { useOpenEdition } from '@/hooks/useSurveyData';
import { useCategoryResults } from '@/hooks/useResults';
import { useI18n } from '@/lib/i18n';
import { getSelectedCountry } from '@/lib/submission';

export default function ResultsCategory() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { t } = useI18n();
  const country = getSelectedCountry() ?? 'UK';
  const { data: edition, isLoading: editionLoading } = useOpenEdition(country);
  const { data: results, isLoading, error } = useCategoryResults(edition?.id, categorySlug);

  if (editionLoading || isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!results) return <EmptyState />;

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" asChild>
        <Link href="/results">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('results.back')}
        </Link>
      </Button>

      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{results.totalSubmissions}</strong> {t('results.totalSubmissions')}
      </p>

      {results.questions.length === 0 && <EmptyState />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {results.questions.map((q) => (
          <QuestionResultCard key={q.questionId} question={q} />
        ))}
      </div>
    </div>
  );
}
