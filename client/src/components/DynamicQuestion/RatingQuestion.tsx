import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RatingConfig } from '@shared/types';
import type { QuestionInputProps } from './types';

export function RatingQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const max = (question.config as RatingConfig | null)?.max ?? 5;
  const current = (value as number | undefined) ?? 0;

  return (
    <div id={id} role="radiogroup" className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={current === n}
          aria-label={`${n}/${max}`}
          onClick={() => onChange(n)}
          className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn('h-7 w-7 transition-colors', n <= current ? 'fill-primary text-primary' : 'text-muted-foreground')}
          />
        </button>
      ))}
    </div>
  );
}
