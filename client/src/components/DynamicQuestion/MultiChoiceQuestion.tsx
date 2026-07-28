import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { localize } from '@shared/types';
import type { QuestionInputProps } from './types';

export function MultiChoiceQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const { lang } = useI18n();
  const selected = new Set((value as string[] | undefined) ?? []);

  const toggle = (optValue: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(optValue);
    else next.delete(optValue);
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-3">
      {(question.options ?? []).map((opt) => {
        const optId = `${id}-${opt.value}`;
        return (
          <div key={opt.id} className="flex items-center space-x-2">
            <Checkbox
              id={optId}
              checked={selected.has(opt.value)}
              onCheckedChange={(checked) => toggle(opt.value, checked === true)}
            />
            <Label htmlFor={optId} className="cursor-pointer font-normal">
              {localize(opt, 'label', lang)}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
