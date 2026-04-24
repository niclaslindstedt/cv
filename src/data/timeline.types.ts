export type TimelineKind = "experience" | "assignment" | "education";

export type TimelineSegment = {
  startMonth: number;
  endMonth: number;
  activeLane: number;
};

export type TimelineBar = {
  id: string;
  kind: TimelineKind;
  title: string;
  subtitle: string;
  description: string;
  skills: string[];
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  endMonthAtBuild: number;
  segments: TimelineSegment[];
};

export type TimelineTrack = {
  key: TimelineKind;
  label: string;
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
