import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export function SubscribeForm({ editionId }: { editionId: string }) {
  const { t } = useI18n();
  const [email, setEmail] = React.useState('');
  const mutation = useMutation({
    mutationFn: () => api.subscribe({ editionId, email }),
    onSuccess: () => {
      toast.success(t('subscribe.success'));
      setEmail('');
    },
  });

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (email) mutation.mutate();
      }}
    >
      <Input
        type="email"
        required
        placeholder={t('subscribe.placeholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="max-w-xs"
      />
      <Button type="submit" disabled={mutation.isPending}>
        {t('subscribe.submit')}
      </Button>
    </form>
  );
}
