import * as React from 'react';
import { toast } from 'sonner';
import { Copy, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSendRecoveryEmail } from '@/hooks/useSubmission';
import { dismissSaveProgress } from '@/lib/submission';
import { useI18n } from '@/lib/i18n';

export function SaveProgressCard({
  editionId,
  token,
  recoveryCode,
  onDismiss,
}: {
  editionId: string;
  token: string;
  recoveryCode: string;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const sendEmail = useSendRecoveryEmail(token);

  const copyCode = async () => {
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    dismissSaveProgress(editionId);
    onDismiss();
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    sendEmail.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success(t('recovery.emailSent'));
          setEmail('');
        },
      },
    );
  };

  return (
    <Card className="relative border-primary/30 bg-primary/5">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        aria-label={t('recovery.dismiss')}
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="text-base">{t('recovery.title')}</CardTitle>
        <CardDescription>{t('recovery.explain')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <code className="rounded-md border bg-background px-3 py-2 text-sm font-semibold tracking-wide">
            {recoveryCode}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copyCode}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? t('recovery.copied') : t('recovery.copy')}
          </Button>
        </div>

        <form onSubmit={handleSendEmail} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t('recovery.emailLabel')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder={t('recovery.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={sendEmail.isPending || !email}>
              {t('recovery.sendEmail')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
