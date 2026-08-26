import type { Locale } from "./i18n";

export function qar(amount: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-QA" : "en-QA").format(amount);
  return locale === "ar" ? `${formatted} ر.ق` : `QAR ${formatted}`;
}

export function fmtDate(date: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-QA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function fmtDateTime(date: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-QA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
