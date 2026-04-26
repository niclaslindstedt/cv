import type { LocalizedString } from "./cv.types";

export type PrintRoleHistoryEntry = {
  title: LocalizedString;
  range: LocalizedString;
};

export type PrintAssignment = {
  role: LocalizedString;
  client: string;
  range: LocalizedString;
  tagline: LocalizedString;
  tags: string[];
  notes?: LocalizedString;
  roleHistory: PrintRoleHistoryEntry[];
};

export type PrintExperience = {
  role: LocalizedString;
  company: string;
  range: LocalizedString;
  engagement?: LocalizedString;
  tagline: LocalizedString;
  tags: string[];
  notes?: LocalizedString;
  roleHistory: PrintRoleHistoryEntry[];
  assignments: PrintAssignment[];
};

export type PrintProject = {
  name: string;
  tagline: LocalizedString;
};

export type PrintEducation = {
  field: LocalizedString;
  institution: LocalizedString;
  level: LocalizedString;
  credits: string;
  range: LocalizedString;
};

export type PrintCourse = {
  name: LocalizedString;
  institution: LocalizedString;
  code: string;
  credits: string;
  range: LocalizedString;
  details: LocalizedString[];
};

export type PrintSkillGroup = {
  label: LocalizedString;
  items: string[];
};

export type PrintLanguage = {
  name: LocalizedString;
  level: LocalizedString;
};

export type PrintSections = {
  experience: LocalizedString;
  projects: LocalizedString;
  education: LocalizedString;
  courses: LocalizedString;
  skills: LocalizedString;
  languages: LocalizedString;
};

export type PrintData = {
  name: string;
  title: LocalizedString;
  longSummary: LocalizedString;
  sections: PrintSections;
  experience: PrintExperience[];
  projects: PrintProject[];
  education: PrintEducation[];
  courses: PrintCourse[];
  skills: PrintSkillGroup[];
  languages: PrintLanguage[];
};
