import { Link } from 'wouter';
import { Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t('app.title')}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/survey/categories">{t('nav.survey')}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/results">{t('nav.results')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('lang.toggle')}
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          >
            <Languages className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('theme.toggle')}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
