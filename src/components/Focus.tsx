import type { FocusArea } from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

type Props = {
  title: string;
  focus: FocusArea[];
  onFocusClick: (focus: FocusArea) => void;
};

export function Focus({ title, focus, onFocusClick }: Props) {
  const { lang, t, ui } = useLang();
  return (
    <Section id="focus" title={title}>
      <ul className="focus-list">
        {focus.map((item) => (
          <li key={item.area.en}>
            <button
              type="button"
              className="focus-item-btn"
              onClick={() => onFocusClick(item)}
              aria-label={ui.focus.detailAria(t(item.area))}
            >
              <span className="focus-area">{t(item.area)}</span>
              <span className="focus-since">
                {ui.focus.since} {formatMonth(item.since, lang)}
              </span>
              <span className="glass-reflect" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
