import type { Education as EducationItem } from "../data/cv.types";
import { useLang } from "../utils/i18n";

export type EctsContext =
  | { kind: "program"; program: EducationItem }
  | { kind: "course"; credits: string };

type Props = {
  credits: string;
  context: EctsContext;
  onOpen: (context: EctsContext) => void;
};

export function EctsPill({ credits, context, onOpen }: Props) {
  const { ui } = useLang();
  return (
    <button
      type="button"
      className="ects-pill"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(context);
      }}
      aria-label={ui.ects.pillAria(credits)}
    >
      {credits}
    </button>
  );
}
