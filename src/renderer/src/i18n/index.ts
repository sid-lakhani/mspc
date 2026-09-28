/**
 * i18n bootstrap — react-i18next with inline JSON resources.
 *
 * English is the sole supported locale for the initial MSPC release.
 * The i18n architecture is preserved so additional locales can be added later:
 * drop a `locales/<code>.json` with the same key tree as `en.json`, register it
 * in `resources` and `supportedLngs`, and add an entry to `LANGUAGES`.
 * No other code needs to change.
 *
 * The user's language choice is persisted in localStorage (`mspc.language`).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_GOD_NAME } from '../../../shared/godIdentity';
import en from './locales/en.json';

/**
 * Registered languages. Add entries here when adding new locale files.
 * `dir` drives RTL layout — it is the ONLY thing the app uses for direction.
 */
export const LANGUAGES: Array<{ code: string; label: string; dir: 'ltr' | 'rtl' }> = [
  { code: 'en', label: 'English', dir: 'ltr' }
];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const RTL_CODES: ReadonlySet<string> = new Set(
  LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code)
);

export function isRtlLanguage(lng: string | undefined | null): boolean {
  return !!lng && RTL_CODES.has(lng);
}

export function directionFor(lng: string | undefined | null): 'rtl' | 'ltr' {
  return isRtlLanguage(lng) ? 'rtl' : 'ltr';
}

const STORAGE_KEY = 'mspc.language';
const SUPPORTED: readonly string[] = LANGUAGES.map((l) => l.code);

/**
 * The orchestrator's display name — supplied as an i18next default variable so
 * every `{{godName}}` string resolves without its call site knowing the name.
 */
export function setGodName(name: string | undefined | null): void {
  const next = name?.trim() || DEFAULT_GOD_NAME;
  const interpolation = i18n.options.interpolation ?? (i18n.options.interpolation = {});
  const vars = interpolation.defaultVariables ?? (interpolation.defaultVariables = {});
  if (vars.godName === next) return;
  vars.godName = next;
  i18n.emit('languageChanged', i18n.language);
}

function detectLanguage(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved as LanguageCode)) return saved;
  } catch { /* localStorage unavailable — English it is */ }
  return 'en';
}

export function setLanguage(lng: string): void {
  void i18n.changeLanguage(lng);
  try { window.localStorage.setItem(STORAGE_KEY, lng); } catch { /* best-effort */ }
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en }
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en'],
    react: { useSuspense: false },
    interpolation: { escapeValue: false, defaultVariables: { godName: DEFAULT_GOD_NAME } },
    returnNull: false
  });

export default i18n;
