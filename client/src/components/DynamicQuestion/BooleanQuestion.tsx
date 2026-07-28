import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import type { QuestionInputProps } from './types';

export function BooleanQuestion({ value, onChange, id }: QuestionInputProps) {
  const { t } = useI18n();
  const current = value as boolean | undefined;

  return (
    <div className="flex items-center gap-3">
      <Switch id={id} checked={current ?? false} onCheckedChange={onChange} />
      <span className="text-sm text-muted-foreground">{current ? t('common.yes') : t('common.no')}</span>
    </div>
  );
}
