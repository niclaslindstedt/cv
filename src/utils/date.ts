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
