import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import ky from '@/locales/ky.json';
import ru from '@/locales/ru.json';
import { defaultLanguage, languages } from '@/shared/config/i18n';

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    ky: { translation: ky },
    en: { translation: en },
  },
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: languages,
  interpolation: { escapeValue: false },
});

export default i18n;
