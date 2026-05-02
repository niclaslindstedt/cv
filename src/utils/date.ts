import type { Language } from "../data/cv.types";
import { UI_STRINGS } from "./i18n";

export function formatMonth(iso: string, lang: Language): string {
  const [year, month] = iso.split("-");
  const idx = Number(month) - 1;
  const months = UI_STRINGS[lang].months;
  return `${months[idx] ?? ""} ${year}`.trim();
}

export function formatRange(
  start: string,
  end: string | null,
  lang: Language,
): string {
  const endLabel = end ? formatMonth(end, lang) : UI_STRINGS[lang].present;
  return `${formatMonth(start, lang)} – ${endLabel}`;
}

// Whole months between an inclusive YYYY-MM start and `now`. Negative or
// zero results clamp to 0 — a focus area starting "this month" reads as 0.
export function monthsSince(
  startYearMonth: string,
  now: Date = new Date(),
): number {
  const [y, m] = startYearMonth.split("-").map(Number);
  if (!y || !m) return 0;
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return months > 0 ? months : 0;
}

export function formatFullDate(iso: string, lang: Language): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const locale = lang === "sv" ? "sv-SE" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
