import type { FocusArea } from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { Section } from "./Section";

type Props = { title: string; focus: FocusArea[] };

export function Focus({ title, focus }: Props) {
  return (
    <Section id="focus" title={title}>
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
