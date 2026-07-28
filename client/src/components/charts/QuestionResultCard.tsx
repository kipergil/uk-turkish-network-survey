import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { localize } from '@shared/types';
import type { CategoryResultsResponse } from '@shared/api-types';
import { DistributionChart } from './DistributionChart';
import { NumericChart } from './NumericChart';
import { MatrixResultChart } from './MatrixResultChart';
import { RankingResultChart } from './RankingResultChart';

type QuestionWithResult = CategoryResultsResponse['questions'][number];

export function QuestionResultCard({ question }: { question: QuestionWithResult }) {
  const { t, lang } = useI18n();
  const { result } = question;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{localize(question, 'label', lang)}</CardTitle>
      </CardHeader>
      <CardContent>
        {result.kind === 'insufficient_data' && (
          <p className="text-sm text-muted-foreground">{t('results.insufficientData')}</p>
        )}
        {result.kind === 'not_public' && (
          <p className="text-sm text-muted-foreground">{t('results.insufficientData')}</p>
        )}
        {result.kind === 'distribution' && 'counts' in result && (
          <DistributionChart counts={result.counts as Record<string, number>} options={question.options} />
        )}
        {result.kind === 'numeric' && <NumericChart average={result.average} histogram={result.histogram} />}
        {result.kind === 'matrix' && <MatrixResultChart rowAverages={result.rowAverages} />}
        {result.kind === 'ranking' && <RankingResultChart weighted={result.weighted} options={question.options} />}
      </CardContent>
    </Card>
  );
}
