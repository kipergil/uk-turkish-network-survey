import * as React from 'react';
import type { Lang } from '@shared/types';

/** UI chrome strings. Survey CONTENT (categories/questions) always comes from
 * Directus's label_tr/label_en — this dictionary is only for the app shell. */
const dict = {
  tr: {
    'app.title': 'LocalRater',
    'nav.survey': 'Ankete Katıl',
    'nav.results': 'Sonuçlar',
    'landing.tagline': "UK'de yaşayan Türkler için yıllık, topluluk temelli anket",
    'landing.participants': 'katılımcı',
    'landing.selectCountry': 'Ülke seçin',
    'landing.comingSoon': 'Yakında',
    'landing.start': 'Anketi Başlat',
    'landing.viewResults': 'Sonuçları Gör',
    'categories.title': 'Kategoriler',
    'categories.subtitle': 'İstediğiniz kategorilerden başlayın — hiçbiri zorunlu değil.',
    'categories.optional': 'Opsiyonel',
    'categories.completed': 'Tamamlandı',
    'categories.inProgress': 'Devam ediyor',
    'categories.start': 'Başla',
    'categories.review': 'Gözden geçir',
    'category.back': 'Kategorilere dön',
    'category.submit': 'Kaydet ve devam et',
    'category.saving': 'Kaydediliyor…',
    'category.saved': 'Kaydedildi',
    'category.nextSuggestion': 'Sıradaki kategori:',
    'category.allDone': 'Tüm kategorileri tamamladınız. Teşekkürler!',
    'question.required': 'Zorunlu',
    'question.helpText': 'Yardım',
    'results.title': 'Canlı Sonuçlar',
    'results.subtitle': 'Toplu, anonim sonuçlar — bireysel cevaplar asla gösterilmez.',
    'results.insufficientData': 'Yeterli veri yok',
    'results.totalSubmissions': 'toplam katılım',
    'results.back': 'Sonuçlara dön',
    'common.yes': 'Evet',
    'common.no': 'Hayır',
    'common.dragToReorder': 'Sıralamak için sürükleyin',
    'state.loading': 'Yükleniyor…',
    'state.error': 'Bir şeyler ters gitti.',
    'state.empty': 'Gösterilecek içerik yok.',
    'state.editionClosed': 'Bu anket dönemi kapandı. Sonuçları görebilirsiniz.',
    'lang.toggle': 'EN',
    'theme.toggle': 'Tema',
    'subscribe.title': 'Sonuçlardan haberdar olun',
    'subscribe.placeholder': 'E-posta adresiniz',
    'subscribe.submit': 'Abone ol',
    'subscribe.success': 'Teşekkürler! Sonuçlar hazır olduğunda bilgilendirileceksiniz.',
    'recovery.title': 'İlerlemenizi kaydedin',
    'recovery.explain': 'Bu kod, başka bir cihazdan veya tarayıcıdan ankete kaldığınız yerden devam etmenizi sağlar. Kimliğinizle ilişkilendirilmez.',
    'recovery.copy': 'Kopyala',
    'recovery.copied': 'Kopyalandı',
    'recovery.dismiss': 'Anladım',
    'recovery.emailLabel': 'İsterseniz kodu e-postanıza gönderelim (opsiyonel, daha az anonim)',
    'recovery.emailPlaceholder': 'E-posta adresiniz',
    'recovery.sendEmail': 'Kodu e-posta ile gönder',
    'recovery.emailSent': 'Gönderildi! Gelen kutunuzu kontrol edin.',
    'recovery.resumeLink': 'Kodunuz mu var? Devam edin',
    'resume.title': 'Ankete devam et',
    'resume.explain': 'Daha önce aldığınız kurtarma kodunu girin.',
    'resume.placeholder': 'örn. amber-falcon-42',
    'resume.submit': 'Devam et',
    'resume.notFound': 'Bu kod bulunamadı. Kontrol edip tekrar deneyin.',
  },
  en: {
    'app.title': 'LocalRater',
    'nav.survey': 'Take the Survey',
    'nav.results': 'Results',
    'landing.tagline': 'An annual, community-driven survey for Turkish people living in the UK',
    'landing.participants': 'participants',
    'landing.selectCountry': 'Select a country',
    'landing.comingSoon': 'Coming soon',
    'landing.start': 'Start Survey',
    'landing.viewResults': 'View Results',
    'categories.title': 'Categories',
    'categories.subtitle': 'Start with any category you like — none are required.',
    'categories.optional': 'Optional',
    'categories.completed': 'Completed',
    'categories.inProgress': 'In progress',
    'categories.start': 'Start',
    'categories.review': 'Review',
    'category.back': 'Back to categories',
    'category.submit': 'Save and continue',
    'category.saving': 'Saving…',
    'category.saved': 'Saved',
    'category.nextSuggestion': 'Next up:',
    'category.allDone': "You've completed every category. Thank you!",
    'question.required': 'Required',
    'question.helpText': 'Help',
    'results.title': 'Live Results',
    'results.subtitle': 'Aggregate, anonymous results — individual answers are never shown.',
    'results.insufficientData': 'Not enough data yet',
    'results.totalSubmissions': 'total participants',
    'results.back': 'Back to results',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.dragToReorder': 'Drag to reorder',
    'state.loading': 'Loading…',
    'state.error': 'Something went wrong.',
    'state.empty': 'Nothing to show here.',
    'state.editionClosed': 'This survey edition has closed. You can still view the results.',
    'lang.toggle': 'TR',
    'theme.toggle': 'Theme',
    'subscribe.title': 'Get notified about results',
    'subscribe.placeholder': 'Your email',
    'subscribe.submit': 'Subscribe',
    'subscribe.success': "Thanks! We'll let you know when results are ready.",
    'recovery.title': 'Save your progress',
    'recovery.explain': "This code lets you resume the survey from another device or browser. It isn't linked to your identity.",
    'recovery.copy': 'Copy',
    'recovery.copied': 'Copied',
    'recovery.dismiss': 'Got it',
    'recovery.emailLabel': "We can also email you the code (optional, a bit less anonymous)",
    'recovery.emailPlaceholder': 'Your email',
    'recovery.sendEmail': 'Email me the code',
    'recovery.emailSent': "Sent! Check your inbox.",
    'recovery.resumeLink': 'Have a code? Resume',
    'resume.title': 'Resume the survey',
    'resume.explain': 'Enter the recovery code you were given.',
    'resume.placeholder': 'e.g. amber-falcon-42',
    'resume.submit': 'Resume',
    'resume.notFound': "That code wasn't found. Double-check and try again.",
  },
} as const;

type DictKey = keyof typeof dict.tr;

const LANG_KEY = 'localrater:lang';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'en' ? 'en' : 'tr';
  });

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  const t = React.useCallback((key: DictKey) => dict[lang][key] ?? dict.tr[key] ?? key, [lang]);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
