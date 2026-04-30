import type { FocusArea } from "../data/cv.types";
import { formatMonth, monthsSince } from "../utils/date";
import { useLang } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import { FocusGlyph } from "./FocusGlyph";
import { Section } from "./Section";

type Props = {
  title: string;
  focus: FocusArea[];
  onFocusClick: (focus: FocusArea) => void;
};

// First sentence of the description, used as the tile lede. Falls back to
// the whole string when there is no clean sentence break.
function lede(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

export function Focus({ title, focus, onFocusClick }: Props) {
  const { lang, t, ui } = useLang();
  return (
    <Section id="focus" title={title}>
      <ul className="focus-list">
        {focus.map((item) => {
          const months = monthsSince(item.since);
          const skillsCount = item.skills?.length ?? 0;
          return (
            <li key={item.area.en}>
              <button
                type="button"
                className="focus-item-btn"
                onClick={() => onFocusClick(item)}
                aria-label={ui.focus.detailAria(t(item.area))}
              >
                <span className="focus-item-head">
                  <span className="focus-glyph-wrap" aria-hidden="true">
                    <FocusGlyph area={item.area.en} />
                  </span>
                  <span className="focus-area">{t(item.area)}</span>
                  {skillsCount > 0 && (
                    <span className="focus-skill-count">
                      {ui.focus.skillCount(skillsCount)}
                    </span>
                  )}
                </span>
                <span className="focus-lede">
                  {renderInlineCode(lede(t(item.description)))}
                </span>
                <span className="focus-meta">
                  <span className="focus-since">
                    {ui.focus.since} {formatMonth(item.since, lang)}
                  </span>
                  {months > 0 && (
                    <>
                      <span className="focus-meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span className="focus-duration">
                        {ui.focus.duration(months)}
                      </span>
                    </>
                  )}
                </span>
                <span className="glass-reflect" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
