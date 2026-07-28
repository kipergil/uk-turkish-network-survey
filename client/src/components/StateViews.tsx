import { AlertCircle, Loader2, Inbox } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p>{label ?? t('state.loading')}</p>
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <p>{message ?? t('state.error')}</p>
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
      <Inbox className="h-6 w-6" aria-hidden="true" />
      <p>{message ?? t('state.empty')}</p>
    </div>
  );
}
