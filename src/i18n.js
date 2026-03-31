import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Load translations from backend
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false, // React already escapes content
    },
  });

export default i18n;
