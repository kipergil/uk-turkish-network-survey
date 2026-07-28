import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { localize } from '@shared/types';
import type { QuestionInputProps } from './types';

export function SingleChoiceQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const { lang } = useI18n();
  return (
    <RadioGroup value={(value as string) ?? ''} onValueChange={onChange} className="gap-3">
      {(question.options ?? []).map((opt) => {
        const optId = `${id}-${opt.value}`;
        return (
          <div key={opt.id} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={optId} />
            <Label htmlFor={optId} className="cursor-pointer font-normal">
              {localize(opt, 'label', lang)}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
