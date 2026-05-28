/** As 20 línguas mais comuns (por número de falantes), em português. */
export interface LanguageOption {
  value: string;
  label: string;
}

export const COMMON_LANGUAGES: LanguageOption[] = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'zh', label: 'Chinês (Mandarim)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Árabe' },
  { value: 'bn', label: 'Bengali' },
  { value: 'fr', label: 'Francês' },
  { value: 'ru', label: 'Russo' },
  { value: 'ur', label: 'Urdu' },
  { value: 'id', label: 'Indonésio' },
  { value: 'de', label: 'Alemão' },
  { value: 'ja', label: 'Japonês' },
  { value: 'sw', label: 'Suaíli' },
  { value: 'mr', label: 'Marata' },
  { value: 'te', label: 'Télugo' },
  { value: 'tr', label: 'Turco' },
  { value: 'ta', label: 'Tâmil' },
  { value: 'ko', label: 'Coreano' },
  { value: 'it', label: 'Italiano' },
].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

const BY_VALUE = new Map(COMMON_LANGUAGES.map((l) => [l.value, l.label]));
const BY_LABEL = new Map(COMMON_LANGUAGES.map((l) => [l.label.toLowerCase(), l]));

export function languageLabel(value: string): string {
  return BY_VALUE.get(value) ?? value;
}

/** Converte código (pt) ou rótulo legado ("Português") para o código padrão. */
export function normalizeLanguage(input: string): string {
  if (BY_VALUE.has(input)) return input;
  const found = BY_LABEL.get(input.toLowerCase());
  return found ? found.value : input;
}
