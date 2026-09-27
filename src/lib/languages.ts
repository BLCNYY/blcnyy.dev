export const supportedLanguages = ["en", "tr", "es", "de", "it"] as const;

export type Language = (typeof supportedLanguages)[number];

export const languageOptions = [
  { value: "en", label: "English", short: "EN" },
  { value: "tr", label: "Turkish", short: "TR" },
  { value: "es", label: "Spanish", short: "ES" },
  { value: "de", label: "German", short: "DE" },
  { value: "it", label: "Italian", short: "IT" },
] as const satisfies readonly {
  value: Language;
  label: string;
  short: string;
}[];

export const preferredContentLanguages: readonly Language[] =
  supportedLanguages;

const languageLabelMap = Object.fromEntries(
  languageOptions.map((option) => [option.value, option.label]),
) as Record<Language, string>;

export const getLanguageLabel = (value: Language) =>
  languageLabelMap[value] ?? value.toUpperCase();

