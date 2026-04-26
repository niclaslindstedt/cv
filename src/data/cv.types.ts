export type Language = "en" | "sv";

export type LocalizedString = { en: string; sv: string };

export type Seo = {
  keywords: string[];
  image: string;
  locale: string;
  alternateLocale: string;
};

export type Meta = {
  siteUrl: string;
  documentTitle: LocalizedString;
  description: LocalizedString;
  seo: Seo;
};

export type Link = {
  label: LocalizedString;
  url: string;
  featured?: boolean;
};

export type Actions = {
  timeline: LocalizedString;
  downloadPdf: LocalizedString;
};

export type Sections = {
  focus: LocalizedString;
  projects: LocalizedString;
  experience: LocalizedString;
  education: LocalizedString;
  courses: LocalizedString;
  skills: LocalizedString;
  languages: LocalizedString;
};

export type FocusArea = {
  area: LocalizedString;
  since: string;
  description: LocalizedString;
};

export type SkillDetail = {
  description: LocalizedString;
  benefits?: LocalizedString;
  drawbacks?: LocalizedString;
  url?: string;
};

export type GithubRepoRef = {
  owner: string;
  repo: string;
};

export type Project = {
  name: string;
  tagline: LocalizedString;
  description: LocalizedString;
  stack?: string[];
  skills: string[];
  github: GithubRepoRef;
  openSource: boolean;
  homepage?: string;
  dockerHub?: string;
  cratesIo?: string;
  pypi?: string;
  npm?: string;
};

export type ProjectStats = {
  owner: string;
  repo: string;
  username: string;
  firstCommitDate: string | null;
  lastCommitDate: string | null;
  totalCommits: number;
};

export type ProjectStatsFile = {
  enabled: boolean;
  username?: string;
  fetchedAt?: string;
  projects: Record<string, ProjectStats>;
};

export type SourceUrl = {
  title: string;
  url: string;
  description: string;
};

export type Company = {
  id: string;
  name: string;
  tagline: LocalizedString;
  description: LocalizedString;
  url?: string;
  terminated?: boolean;
  stack?: string[];
  sourceUrls?: SourceUrl[];
};

export type RoleTenure = {
  title: LocalizedString;
  startDate: string;
  endDate: string | null;
};

export type Assignment = {
  roles: RoleTenure[];
  clientId: string;
  startDate: string;
  endDate: string | null;
  stack?: string[];
  skills?: string[];
  notes?: LocalizedString;
};

export type Experience = {
  roles: RoleTenure[];
  companyId: string;
  startDate: string;
  endDate: string | null;
  engagement?: LocalizedString;
  stack?: string[];
  skills?: string[];
  notes?: LocalizedString;
  assignments?: Assignment[];
};

export type CourseMoment = {
  name: LocalizedString;
  code?: string;
  credits: string;
  completedDate?: string;
};

export type ProgramCourse = {
  name: LocalizedString;
  code: string;
  credits: string;
  completedDate?: string;
  grade?: string;
  completed?: boolean;
  moments?: CourseMoment[];
  skills?: string[];
};

export type Education = {
  field: LocalizedString;
  institution: LocalizedString;
  level: LocalizedString;
  credits: string;
  startDate: string;
  endDate: string;
  skills?: string[];
  notes?: LocalizedString;
  courses?: ProgramCourse[];
};

export type Course = {
  name: LocalizedString;
  code: string;
  institution: LocalizedString;
  credits: string;
  startDate?: string;
  completedDate?: string;
  engagement?: number;
  remote?: boolean;
  completed?: boolean;
  moments?: CourseMoment[];
  skills?: string[];
};

export type SkillGroup = {
  key: string;
  label: LocalizedString;
  items: string[];
};

export type SpokenLanguage = {
  name: LocalizedString;
  level: LocalizedString;
};

export type CV = {
  meta: Meta;
  name: string;
  title: LocalizedString;
  summary: LocalizedString;
  longSummary: LocalizedString;
  links: Link[];
  actions: Actions;
  sections: Sections;
  focus: FocusArea[];
  projects: Project[];
  companies: Company[];
  experience: Experience[];
  education: Education[];
  courses: Course[];
  skills: SkillGroup[];
  skillDetails: Record<string, SkillDetail>;
  languages: SpokenLanguage[];
};
