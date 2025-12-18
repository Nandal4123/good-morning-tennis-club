import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ko from './locales/ko.json';

const resources = {
  ko: { translation: ko }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko', // 한국어 고정
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

