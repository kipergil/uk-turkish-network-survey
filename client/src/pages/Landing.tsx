import * as React from 'react';
import { useLocation, Link } from 'wouter';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/StateViews';
import { useActiveCountries, useOpenEdition } from '@/hooks/useSurveyData';
import { useStats } from '@/hooks/useResults';
import { useI18n } from '@/lib/i18n';
import { getSelectedCountry, setSelectedCountry } from '@/lib/submission';
import { localize } from '@shared/types';

export default function Landing() {
  const { t, lang } = useI18n();
  const [, navigate] = useLocation();
  const { data: countries, isLoading, error } = useActiveCountries();
  const [selected, setSelected] = React.useState<string | null>(() => getSelectedCountry());

  React.useEffect(() => {
    if (!selected && countries && countries.length > 0) {
      setSelected(countries[0].code);
    }
  }, [countries, selected]);

  const { data: edition } = useOpenEdition(selected);
  const { data: stats } = useStats(edition?.id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const chooseCountry = (code: string, active: boolean) => {
    if (!active) return;
    setSelected(code);
    setSelectedCountry(code);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">{t('app.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('landing.tagline')}</p>
      </div>

      <div className="w-full">
        <p className="mb-3 text-sm font-medium text-muted-foreground">{t('landing.selectCountry')}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(countries ?? []).map((c) => {
            const isSelected = selected === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => chooseCountry(c.code, c.is_active)}
                disabled={!c.is_active}
                aria-pressed={isSelected}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className={isSelected ? 'border-primary' : undefined}>
                  <CardContent className="flex flex-col items-center gap-1 p-4">
                    <span className="text-2xl" aria-hidden="true">{c.flag_emoji}</span>
                    <span className="text-sm font-medium">{localize(c, 'name', lang)}</span>
                    {!c.is_active && <Badge variant="secondary">{t('landing.comingSoon')}</Badge>}
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {edition && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold">{localize(edition, 'title', lang)}</h2>
          {stats && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>
                <strong className="text-foreground">{stats.participantCount}</strong> {t('landing.participants')}
              </span>
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/survey/categories')}>
              {t('landing.start')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/results')}>
              {t('landing.viewResults')}
            </Button>
          </div>
          <Link href="/resume" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            {t('recovery.resumeLink')}
          </Link>
        </div>
      )}
    </div>
  );
}
