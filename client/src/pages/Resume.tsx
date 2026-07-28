import * as React from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResumeByCode } from '@/hooks/useSubmission';
import { setSelectedCountry } from '@/lib/submission';
import { useI18n } from '@/lib/i18n';

export default function Resume() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const search = useSearch();
  const codeFromLink = React.useMemo(() => new URLSearchParams(search).get('code') ?? '', [search]);
  const [code, setCode] = React.useState(codeFromLink);
  const resume = useResumeByCode();

  const submitCode = React.useCallback(
    (value: string) => {
      if (!value.trim()) return;
      resume.mutate(
        { code: value.trim().toLowerCase() },
        {
          onSuccess: () => {
            // The edition's country isn't known from the code alone; UK is the
            // only launched edition today, so default to it. Multi-country
            // resume can pass the country along once more countries are live.
            setSelectedCountry('UK');
            navigate('/survey/categories');
          },
        },
      );
    },
    [resume, navigate],
  );

  // Clicking the emailed resume link (/resume?code=...) resumes immediately,
  // no retyping needed.
  React.useEffect(() => {
    if (codeFromLink) submitCode(codeFromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromLink]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCode(code);
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t('resume.title')}</CardTitle>
          <CardDescription>{t('resume.explain')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('resume.placeholder')}
              autoFocus
            />
            {resume.isError && <p className="text-sm text-destructive">{t('resume.notFound')}</p>}
            <Button type="submit" disabled={resume.isPending || !code.trim()}>
              {t('resume.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
