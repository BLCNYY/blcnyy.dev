import { dateLocales, type Locale } from "@/lib/i18n";

export const formatIsoDate = (value: string | null, locale: Locale = "en") => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(dateLocales[locale], {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};
