import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/clerk-react';
import { queryClient } from '@/lib/queryClient';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/sonner';
import { SiteHeader } from '@/components/SiteHeader';
import Landing from '@/pages/Landing';
import SurveyCategories from '@/pages/SurveyCategories';
import SurveyCategory from '@/pages/SurveyCategory';
import Results from '@/pages/Results';
import ResultsCategory from '@/pages/ResultsCategory';
import Resume from '@/pages/Resume';
import AdminLayout from '@/pages/admin/AdminLayout';
import NotFound from '@/pages/NotFound';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function Shell() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/survey/categories" component={SurveyCategories} />
          <Route path="/survey/:categorySlug" component={SurveyCategory} />
          <Route path="/results" component={Results} />
          <Route path="/results/:categorySlug" component={ResultsCategory} />
          <Route path="/resume" component={Resume} />
          <Route path="/admin/:rest*" component={AdminLayout} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}

export default function App() {
  const body = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>
          <Shell />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

  if (!CLERK_PUBLISHABLE_KEY) return body;

  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{body}</ClerkProvider>;
}
