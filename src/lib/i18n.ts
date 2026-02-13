import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { fr, enCA } from 'date-fns/locale';

import frTranslations from '@/locales/fr.json';
import enTranslations from '@/locales/en.json';

const STORAGE_KEY = 'app_lang';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: frTranslations },
      en: { translation: enTranslations }
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

// Helper to get current locale for date-fns
export const getDateLocale = () => {
  return i18n.language === 'en' ? enCA : fr;
};

// Helper to format currency: always "30 267,00 $" (space = thousands, comma = decimals)
// Used everywhere: tableaux, analyses, budget, etc.
export const formatCurrency = (amount: number) => {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = new Intl.NumberFormat("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(rounded);
  return `${formatted} $`;
};

// Helper to format numbers
export const formatNumber = (num: number) => {
  const locale = i18n.language === 'en' ? 'en-CA' : 'fr-CA';
  return new Intl.NumberFormat(locale).format(num);
};

export default i18n;
