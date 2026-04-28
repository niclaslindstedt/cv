import type { Language, LocalizedString } from "./cv.types";

export type SearchKind =
  | "project"
  | "company"
  | "experience"
  | "assignment"
  | "education"
  | "course"
  | "skill"
  | "focus"
  | "summary";

export type SearchRecord = {
  id: string;
  kind: SearchKind;
  openerKey: string;
  title: string;
  secondary?: string;
  lang: Language;
  haystack: string;
  localizedTitle?: LocalizedString;
  localizedSecondary?: LocalizedString;
};

export type SearchIndex = {
  generatedAt: string;
  records: SearchRecord[];
};
