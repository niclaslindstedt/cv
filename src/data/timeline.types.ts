import type { LocalizedString } from "./cv.types";

export type TimelineKind =
  | "experience"
  | "assignment"
  | "education"
  | "course"
  | "sideProject"
  | "github";

export type TimelineSegment = {
  startMonth: number;
  endMonth: number;
  activeLane: number;
};

export type BusiestRepo = {
  owner: string;
  repo: string;
  name: string;
  commits: number;
  repoUrl: string;
};

export type GitHubPayload = {
  totalCommits: number;
  dailyCommits: number[];
  busiestMonth: number;
  busiestMonthCount: number;
  busiestWeekStart: string;
  busiestWeekCount: number;
  busiestDay: string;
  busiestDayCount: number;
  profileUrl: string;
  username: string;
  maxDailyCommits: number;
  busiestRepo?: BusiestRepo;
};

export type SideProjectPayload = {
  totalCommits: number;
  openSource: boolean;
  repoUrl: string;
  firstCommitDate?: string;
  lastCommitDate?: string;
};

export type TimelinePromotion = {
  startDate: string;
  title: LocalizedString;
};

export type TimelineBar = {
  id: string;
  kind: TimelineKind;
  title: LocalizedString;
  subtitle: LocalizedString;
  description: LocalizedString;
  skills: string[];
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  endMonthAtBuild: number;
  notes?: LocalizedString;
  credits?: string;
  segments: TimelineSegment[];
  github?: GitHubPayload;
  sideProject?: SideProjectPayload;
  promotions?: TimelinePromotion[];
};

export type TimelineTrack = {
  key: TimelineKind;
  label: LocalizedString;
  bars: TimelineBar[];
};

export type TimelineInterval = {
  startMonth: number;
  endMonth: number;
  trackActiveCounts: number[];
};

export type TimelineData = {
  minMonth: number;
  maxMonth: number;
  intervals: TimelineInterval[];
  tracks: TimelineTrack[];
};
