import { cn } from '@/lib/utils';
import type { NpsConfig } from '@shared/types';
import type { QuestionInputProps } from './types';

export function NpsQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const cfg = question.config as NpsConfig | null;
  const min = cfg?.min ?? 0;
  const max = cfg?.max ?? 10;
  const current = value as number | undefined;

  return (
    <div id={id} role="radiogroup" className="flex flex-wrap gap-1.5">
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={current === n}
          onClick={() => onChange(n)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            current === n ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-accent',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
