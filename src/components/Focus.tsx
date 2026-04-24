import type { FocusArea } from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

type Props = { title: string; focus: FocusArea[] };

export function Focus({ title, focus }: Props) {
  const { lang, t, ui } = useLang();
  return (
    <Section id="focus" title={title}>
      <ul className="focus-list">
        {focus.map((item) => (
          <li key={item.area.en}>
            <span className="focus-area">{t(item.area)}</span>
            <span className="focus-since">
              {ui.focus.since} {formatMonth(item.since, lang)}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
