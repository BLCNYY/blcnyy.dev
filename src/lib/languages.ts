export const supportedLanguages = ["en", "tr", "es", "de", "it"] as const;

export type Language = (typeof supportedLanguages)[number];

export const languageOptions = [
  { value: "en", label: "English", nativeLabel: "English", short: "EN" },
  { value: "tr", label: "Turkish", nativeLabel: "Türkçe", short: "TR" },
  { value: "es", label: "Spanish", nativeLabel: "Español", short: "ES" },
  { value: "de", label: "German", nativeLabel: "Deutsch", short: "DE" },
  { value: "it", label: "Italian", nativeLabel: "Italiano", short: "IT" },
] as const satisfies readonly {
  value: Language;
  label: string;
  nativeLabel: string;
  short: string;
}[];

export const preferredContentLanguages: readonly Language[] =
  supportedLanguages;

const languageLabelMap = Object.fromEntries(
  languageOptions.map((option) => [option.value, option.label]),
) as Record<Language, string>;

export const getLanguageLabel = (value: Language) =>
  languageLabelMap[value] ?? value.toUpperCase();

export const getLanguageOption = (value: Language) =>
  languageOptions.find((option) => option.value === value) ?? null;

export const isLanguage = (value: string): value is Language =>
  (supportedLanguages as readonly string[]).includes(value);

