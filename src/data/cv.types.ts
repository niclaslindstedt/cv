export type FocusArea = {
  area: string;
  since: string;
};

export type Project = {
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  repo: string;
};

export type Experience = {
  role: string;
  company: string;
  companyDescription: string;
  startDate: string;
  endDate: string | null;
  engagement?: string;
};

export type Education = {
  field: string;
  institution: string;
  level: string;
  credits: string;
  startDate: string;
  endDate: string;
};

export type Skills = {
  languages: string[];
  frameworks: string[];
  cloud: string[];
  databases: string[];
  ai: string[];
  devops: string[];
};

export type CV = {
  name: string;
  title: string;
  location: string;
  links: { linkedin: string; github: string };
  summary: string;
  focus: FocusArea[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  skills: Skills;
};
