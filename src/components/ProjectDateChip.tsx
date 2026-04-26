import type { Language } from "../data/cv.types";
import { formatFullDate, formatMonth } from "../utils/date";

type Props = {
  iso: string;
  lang: Language;
};

export function ProjectDateChip({ iso, lang }: Props) {
  const month = formatMonth(iso.slice(0, 7), lang);
  const full = formatFullDate(iso, lang);
  return (
    <button
      type="button"
      className="project-date"
      data-full={full}
      aria-label={full}
    >
      <time dateTime={iso.slice(0, 10)}>{month}</time>
    </button>
  );
}
