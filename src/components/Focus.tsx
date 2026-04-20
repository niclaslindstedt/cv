import type { FocusArea } from "../data/cv";
import { formatMonth } from "../utils/date";
import { Section } from "./Section";

type Props = { focus: FocusArea[] };

export function Focus({ focus }: Props) {
  return (
    <Section id="focus" title="Current focus">
      <ul className="focus-list">
        {focus.map((item) => (
          <li key={item.area}>
            <span className="focus-area">{item.area}</span>
            <span className="focus-since">since {formatMonth(item.since)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
