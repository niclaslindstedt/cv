export type Meta = {
  documentTitle: string;
  description: string;
};

export type Link = {
  label: string;
  url: string;
  featured?: boolean;
};

export type Actions = {
  timeline: string;
  downloadPdf: string;
};

export type Sections = {
  focus: string;
  projects: string;
  experience: string;
  education: string;
  skills: string;
};

export type FocusArea = {
  area: string;
  since: string;
};

export type Project = {
  name: string;
  tagline: string;
  description: string;
  stack?: string[];
  skills: string[];
  repo: string;
};

export type Assignment = {
  role: string;
  client: string;
  clientDescription: string;
  startDate: string;
  endDate: string | null;
  stack?: string[];
  skills?: string[];
};

export type Experience = {
  role: string;
  company: string;
  companyDescription: string;
  startDate: string;
  endDate: string | null;
  engagement?: string;
  stack?: string[];
  skills?: string[];
  assignments?: Assignment[];
};

export type Education = {
  field: string;
  institution: string;
  level: string;
  credits: string;
  startDate: string;
  endDate: string;
  skills?: string[];
};

export type SkillGroup = {
  key: string;
  label: string;
  items: string[];
};

export type CV = {
  meta: Meta;
  name: string;
  title: string;
  location: string;
  summary: string;
  links: Link[];
  actions: Actions;
  sections: Sections;
  focus: FocusArea[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  skills: SkillGroup[];
};
