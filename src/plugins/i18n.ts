import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import ru from '@/locales/ru.json';
import zh from '@/locales/zh.json';

export const defaultLocale = 'en';

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    zh,
    en,
    fr,
    ru,
    ko,
    ja,
  },
});

export function setLocale(locale: 'zh' | 'en' | 'fr' | 'ru' | 'ko' | 'ja') {
  i18n.global.locale.value = locale;
  localStorage.setItem('locale', locale);
  document.querySelector('html')?.setAttribute('lang', locale);
}
