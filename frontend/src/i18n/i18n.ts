import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '../../public/locales/en/translation.json';
import translationRU from '../../public/locales/ru/translation.json';
import translationTJ from '../../public/locales/tj/translation.json';

const resources = {
  en: { translation: translationEN },
  ru: { translation: translationRU },
  tj: { translation: translationTJ },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
