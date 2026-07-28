import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateViews';
import { SubscribeForm } from '@/components/SubscribeForm';
import { useOpenEdition } from '@/hooks/useSurveyData';
import { useEditionResults } from '@/hooks/useResults';
import { useI18n } from '@/lib/i18n';
import { getSelectedCountry } from '@/lib/submission';
import { localize } from '@shared/types';

export default function Results() {
  const { t, lang } = useI18n();
  const country = getSelectedCountry() ?? 'UK';
  const { data: edition, isLoading: editionLoading } = useOpenEdition(country);
  const { data: overview, isLoading, error } = useEditionResults(edition?.id);

  if (editionLoading || isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!edition || !overview) return <EmptyState message={t('state.editionClosed')} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t('results.title')}</h1>
        <p className="text-muted-foreground">{t('results.subtitle')}</p>
        <p className="mt-2 text-sm">
          <strong>{overview.totalSubmissions}</strong> {t('results.totalSubmissions')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overview.categories.map((cat) => {
          const pct = overview.totalSubmissions > 0 ? Math.round((cat.completedCount / overview.totalSubmissions) * 100) : 0;
          return (
            <Card key={cat.categoryId}>
              <CardHeader>
                <CardTitle className="text-base">{localize(cat, 'name', lang)}</CardTitle>
                <Progress value={pct} className="mt-2" />
                <p className="text-xs text-muted-foreground">{cat.completedCount} {t('results.totalSubmissions')}</p>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/results/${cat.slug}`}>{t('nav.results')}</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('subscribe.title')}</CardTitle>
        </CardHeader>
        <CardFooter>
          <SubscribeForm editionId={edition.id} />
        </CardFooter>
      </Card>
    </div>
  );
}
