import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ScaleLikertConfig } from '@shared/types';
import type { QuestionInputProps } from './types';

export function ScaleLikertQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const { lang } = useI18n();
  const cfg = question.config as ScaleLikertConfig | null;
  const points = cfg?.points ?? 5;
  const anchors = (lang === 'en' ? cfg?.anchors_en : cfg?.anchors_tr) ?? [];
  const current = (value as number | undefined) ?? 0;

  return (
    <div id={id} className="flex flex-col gap-2">
      <div role="radiogroup" className="flex flex-wrap items-center gap-2">
        {Array.from({ length: points }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={current === n}
            onClick={() => onChange(n)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              current === n ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-accent',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {anchors.length >= 2 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{anchors[0]}</span>
          <span>{anchors[anchors.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
