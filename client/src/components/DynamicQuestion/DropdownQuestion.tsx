import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { localize } from '@shared/types';
import type { QuestionInputProps } from './types';

export function DropdownQuestion({ question, value, onChange, id }: QuestionInputProps) {
  const { lang } = useI18n();
  return (
    <Select value={(value as string) ?? undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="max-w-sm">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {(question.options ?? []).map((opt) => (
          <SelectItem key={opt.id} value={opt.value}>
            {localize(opt, 'label', lang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
