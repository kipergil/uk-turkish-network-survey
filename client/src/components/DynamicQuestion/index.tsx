import type * as React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { localize } from '@shared/types';
import type { Question, QuestionType } from '@shared/types';
import type { QuestionInputProps } from './types';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { MultiChoiceQuestion } from './MultiChoiceQuestion';
import { DropdownQuestion } from './DropdownQuestion';
import { RatingQuestion } from './RatingQuestion';
import { ScaleLikertQuestion } from './ScaleLikertQuestion';
import { NpsQuestion } from './NpsQuestion';
import { BooleanQuestion } from './BooleanQuestion';
import { RankingQuestion } from './RankingQuestion';
import { MatrixQuestion } from './MatrixQuestion';
import { OpenTextQuestion } from './OpenTextQuestion';

/**
 * type -> component registry. A brand new question TYPE needs exactly one
 * new entry here (plus its component file); existing types automatically
 * pick up any new question CONTENT added in Directus with zero code changes.
 */
const REGISTRY: Record<QuestionType, React.ComponentType<QuestionInputProps>> = {
  single_choice: SingleChoiceQuestion,
  multi_choice: MultiChoiceQuestion,
  dropdown: DropdownQuestion,
  rating: RatingQuestion,
  scale_likert: ScaleLikertQuestion,
  nps: NpsQuestion,
  boolean: BooleanQuestion,
  ranking: RankingQuestion,
  matrix: MatrixQuestion,
  open_text: OpenTextQuestion,
};

interface DynamicQuestionProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function DynamicQuestion({ question, value, onChange, error }: DynamicQuestionProps) {
  const { lang, t } = useI18n();
  const Field = REGISTRY[question.type];
  const id = `question-${question.slug}`;
  const help = localize(question, 'help', lang);

  if (!Field) return null;

  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border p-4">
      <legend className="flex flex-wrap items-center gap-2 px-1 text-sm font-medium">
        <Label htmlFor={id}>{localize(question, 'label', lang)}</Label>
        {question.is_required && (
          <Badge variant="outline" className="text-[10px]">
            {t('question.required')}
          </Badge>
        )}
      </legend>
      {help && <p className="px-1 text-xs text-muted-foreground">{help}</p>}
      <div className="px-1 pt-1">
        <Field question={question} value={value} onChange={onChange} id={id} />
      </div>
      {error && (
        <p role="alert" className="px-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
