import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enApp from './locales/en/app.json';
import esApp from './locales/es/app.json';
import frApp from './locales/fr/app.json';
import itApp from './locales/it/app.json';
import ptBrApp from './locales/pt-BR/app.json';

const LANGUAGE_STORAGE_KEY = 'battle-arena:language';

export const supportedLanguages = ['en', 'fr', 'pt-BR', 'it', 'es'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  'pt-BR': 'Português (BR)',
  it: 'Italiano',
  es: 'Español',
};

export function normalizeLanguage(language: string | undefined | null): SupportedLanguage {
  const normalized = (language ?? '').trim().toLowerCase();

  if (normalized === 'pt' || normalized === 'pt-br' || normalized.startsWith('pt-')) {
    return 'pt-BR';
  }
  if (normalized.startsWith('fr')) {
    return 'fr';
  }
  if (normalized.startsWith('it')) {
    return 'it';
  }
  if (normalized.startsWith('es')) {
    return 'es';
  }

  return 'en';
}

function deviceLanguage(): SupportedLanguage {
  return normalizeLanguage(Localization.getLocales()[0]?.languageTag);
}

export const resources = {
  en: { app: enApp },
  fr: { app: frApp },
  'pt-BR': { app: ptBrApp },
  it: { app: itApp },
  es: { app: esApp },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  supportedLngs: supportedLanguages,
  fallbackLng: 'en',
  defaultNS: 'app',
  ns: ['app'],
  interpolation: {
    escapeValue: false,
  },
});

void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLanguage) => {
  if (savedLanguage) {
    void i18n.changeLanguage(normalizeLanguage(savedLanguage));
  }
});

i18n.on('languageChanged', (language) => {
  void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
});

export async function changeAppLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
}

export function currentAppLanguage(): SupportedLanguage {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
}

export default i18n;
