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

export type SearchField =
  | "title"
  | "alias"
  | "stack"
  | "skill"
  | "secondary"
  | "description";

export type SearchMatchType = "exact" | "prefix" | "partial" | "fuzzy";

export type SearchMatch = {
  field: SearchField;
  value: string;
  type: SearchMatchType;
};

export type SearchFields = {
  title: string;
  secondary?: string;
  description?: string;
  stack?: string[];
  skills?: string[];
  aliases?: string[];
};

export type SearchRecord = {
  id: string;
  kind: SearchKind;
  openerKey: string;
  title: string;
  secondary?: string;
  lang: Language;
  fields: SearchFields;
  localizedTitle?: LocalizedString;
  localizedSecondary?: LocalizedString;
};

export type SearchIndex = {
  generatedAt: string;
  records: SearchRecord[];
};
