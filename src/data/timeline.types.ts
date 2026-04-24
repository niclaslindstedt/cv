export type TimelineKind = "experience" | "assignment" | "education";

export type TimelineBar = {
  id: string;
  kind: TimelineKind;
  lane: number;
  title: string;
  subtitle: string;
  description: string;
  skills: string[];
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  endMonthAtBuild: number;
};

export type TimelineTrack = {
  key: TimelineKind;
  label: string;
  lanes: number;
  bars: TimelineBar[];
};

export type TimelineData = {
  minMonth: number;
  maxMonth: number;
  tracks: TimelineTrack[];
};
