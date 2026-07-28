import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateViews';
import { useCategories, useOpenEdition } from '@/hooks/useSurveyData';
import { useSubmission } from '@/hooks/useSubmission';
import { useI18n } from '@/lib/i18n';
import { getSelectedCountry } from '@/lib/submission';
import { localize } from '@shared/types';
import * as Icons from 'lucide-react';

function CategoryIcon({ name }: { name: string | null }) {
  const Icon = (name && (Icons as any)[toPascalCase(name)]) || Icons.CircleHelp;
  return <Icon className="h-6 w-6" aria-hidden="true" />;
}

function toPascalCase(kebab: string) {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export default function SurveyCategories() {
  const { t, lang } = useI18n();
  const country = getSelectedCountry() ?? 'UK';
  const { data: edition, isLoading: editionLoading, error: editionError } = useOpenEdition(country);
  const { data: categories, isLoading, error } = useCategories(edition?.id, country);
  const { submission } = useSubmission(edition?.id);

  if (editionLoading || isLoading) return <LoadingState />;
  if (editionError || error) return <ErrorState />;
  if (!edition) return <EmptyState message={t('state.editionClosed')} />;
  if (!categories || categories.length === 0) return <EmptyState />;

  const completed = new Set(submission?.completedCategories ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
        <p className="text-muted-foreground">{t('categories.subtitle')}</p>
      </div>

      {edition.status === 'closed' && <EmptyState message={t('state.editionClosed')} />}

      {edition.status !== 'closed' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const isDone = completed.has(cat.slug);
            return (
              <Card key={cat.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <CategoryIcon name={cat.icon} />
                    <div className="flex gap-1">
                      {cat.is_optional && <Badge variant="outline">{t('categories.optional')}</Badge>}
                      {isDone && <Badge>{t('categories.completed')}</Badge>}
                    </div>
                  </div>
                  <CardTitle>{localize(cat, 'name', lang)}</CardTitle>
                  {localize(cat, 'description', lang) && (
                    <CardDescription>{localize(cat, 'description', lang)}</CardDescription>
                  )}
                </CardHeader>
                <CardFooter>
                  <Button asChild className="w-full" variant={isDone ? 'outline' : 'default'}>
                    <Link href={`/survey/${cat.slug}`}>{isDone ? t('categories.review') : t('categories.start')}</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
