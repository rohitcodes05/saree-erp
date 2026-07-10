import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';

// ─── i18n Config ──────────────────────────────────────────────────────────────
// Architecture supports adding Hindi (hi), Tamil (ta), Telugu (te) later.
// To add Hindi: create src/i18n/locales/hi.ts and add to resources below.
import { InitOptions } from 'i18next';

const i18nConfig: InitOptions = {
  resources: {
    en: { translation: en },
    // hi: { translation: hi },  // Uncomment when Hindi translations are ready
    // ta: { translation: ta },
  },
  fallbackLng: 'en',
  supportedLngs: ['en'],
  interpolation: {
    escapeValue: false, // React already escapes by default
  },
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
    lookupLocalStorage: 'saree-erp-language',
  },
  // Enable namespace support for future splitting by module
  defaultNS: 'translation',
  ns: ['translation'],
};

i18n.use(LanguageDetector).use(initReactI18next).init(i18nConfig);

export default i18n;
export { i18nConfig };
