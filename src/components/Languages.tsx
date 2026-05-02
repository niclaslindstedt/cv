import type { SpokenLanguage } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { PROFICIENCY_MAX, proficiencyStep } from "../utils/proficiency";
import { FlagIcon } from "./FlagIcon";
import { Section } from "./Section";

type Props = {
  title: string;
  languages: SpokenLanguage[];
  onLanguageClick: (language: SpokenLanguage) => void;
};

export function Languages({ title, languages, onLanguageClick }: Props) {
  const { t, ui } = useLang();
  return (
    <Section id="languages" title={title} category="languages">
      <ul className="languages-list">
        {languages.map((language) => {
          const step = proficiencyStep(language.proficiency);
          const name = t(language.name);
          return (
            <li key={language.code}>
              <button
                type="button"
                className="language-item"
                onClick={() => onLanguageClick(language)}
                aria-label={ui.languages.detailAria(name)}
              >
                <span className="language-flag" aria-hidden="true">
                  <FlagIcon code={language.code} />
                </span>
                <span className="language-name">{name}</span>
                <span
                  className="language-meter"
                  role="img"
                  aria-label={ui.languages.proficiencyAria(
                    step,
                    PROFICIENCY_MAX,
                  )}
                >
                  {Array.from({ length: PROFICIENCY_MAX }, (_, i) => (
                    <span
                      key={i}
                      className={
                        i < step
                          ? "language-meter-pip is-on"
                          : "language-meter-pip"
                      }
                    />
                  ))}
                </span>
                <span className="language-level">{t(language.level)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
