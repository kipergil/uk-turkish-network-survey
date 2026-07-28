import { Textarea } from '@/components/ui/textarea';
import type { OpenTextConfig } from '@shared/types';
import type { QuestionInputProps } from './types';

export function OpenTextQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const maxlength = (question.config as OpenTextConfig | null)?.maxlength ?? 1000;
  const text = (value as string | undefined) ?? '';

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        id={id}
        value={text}
        maxLength={maxlength}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-xl"
      />
      <span className="self-end text-xs text-muted-foreground">
        {text.length}/{maxlength}
      </span>
    </div>
  );
}
