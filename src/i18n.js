import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Load translations from backend
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}.json`,
    },
    lng: localStorage.getItem('language') || 'ar',
    fallbackLng: 'ar',
    debug: true,
    interpolation: {
      escapeValue: false, // React already escapes content
    },
  });

export default i18n;

function syncDocumentLanguage(language = i18n.resolvedLanguage || i18n.language) {
  const languageCode = language?.split("-")[0] || "ar";
  document.documentElement.lang = languageCode;
  document.documentElement.dir = languageCode === "ar" ? "rtl" : "ltr";
}

i18n.on("initialized", () => syncDocumentLanguage());
i18n.on("languageChanged", syncDocumentLanguage);
syncDocumentLanguage();
