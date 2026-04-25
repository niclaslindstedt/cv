import type { SpokenLanguage } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

type Props = {
  title: string;
  languages: SpokenLanguage[];
};

export function Languages({ title, languages }: Props) {
  const { t } = useLang();
  return (
    <Section id="languages" title={title}>
      <ul className="languages-list">
        {languages.map((language) => (
          <li key={language.name.en} className="language-item">
            <span className="language-name">{t(language.name)}</span>
            <span className="language-level">{t(language.level)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
