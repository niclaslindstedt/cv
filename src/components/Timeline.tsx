import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { CV } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";

type TimelineKind = "experience" | "assignment" | "education";

type TimelineItem = {
  id: string;
  kind: TimelineKind;
  title: string;
  subtitle: string;
  description: string;
  startDate: string;
  endDate: string | null;
  skills: string[];
};

type PlacedItem = TimelineItem & { lane: number };

type TrackDef = {
  key: TimelineKind;
  label: string;
  items: PlacedItem[];
  lanes: number;
};

type Props = {
  cv: CV;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 8;
const BASE_MONTH_PX = 14;
const LANE_SIZE = 40;
const LANE_GAP = 6;
const TRACK_HEADER = 22;
const TRACK_GAP = 10;
const AXIS_SIZE = 40;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function monthIndex(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function nowMonthIndex(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

function assignLanes(items: TimelineItem[]): PlacedItem[] {
  const sorted = [...items].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const lanes: number[] = [];
  const placed: PlacedItem[] = [];
  for (const item of sorted) {
    const start = monthIndex(item.startDate);
    const end = item.endDate ? monthIndex(item.endDate) : nowMonthIndex();
    let lane = lanes.findIndex((occupiedUntil) => occupiedUntil <= start);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(end);
    } else {
      lanes[lane] = end;
    }
    placed.push({ ...item, lane });
  }
  return placed;
}

function buildItems(cv: CV): TimelineItem[] {
  const items: TimelineItem[] = [];

  cv.experience.forEach((exp, i) => {
    items.push({
      id: `exp-${i}`,
      kind: "experience",
      title: exp.role,
      subtitle: exp.company,
      description: exp.companyDescription,
      startDate: exp.startDate,
      endDate: exp.endDate,
      skills: exp.skills ?? [],
    });
    const grouped = new Map<
      string,
      {
        firstIndex: number;
        roles: { role: string; startDate: string }[];
        client: string;
        description: string;
        startDate: string;
        endDate: string | null;
        skills: string[];
      }
    >();
    exp.assignments?.forEach((a, j) => {
      const existing = grouped.get(a.client);
      if (!existing) {
        grouped.set(a.client, {
          firstIndex: j,
          roles: [{ role: a.role, startDate: a.startDate }],
          client: a.client,
          description: a.clientDescription,
          startDate: a.startDate,
          endDate: a.endDate,
          skills: [...(a.skills ?? [])],
        });
      } else {
        existing.roles.push({ role: a.role, startDate: a.startDate });
        if (a.startDate < existing.startDate) existing.startDate = a.startDate;
        if (existing.endDate !== null) {
          if (a.endDate === null) existing.endDate = null;
          else if (a.endDate > existing.endDate) existing.endDate = a.endDate;
        }
        for (const skill of a.skills ?? []) {
          if (!existing.skills.includes(skill)) existing.skills.push(skill);
        }
      }
    });
    for (const group of grouped.values()) {
      const sortedRoles = [...group.roles].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      );
      const title = sortedRoles.map((r) => r.role).join(" → ");
      items.push({
        id: `exp-${i}-asg-${group.firstIndex}`,
        kind: "assignment",
        title,
        subtitle: `${group.client} · via ${exp.company}`,
        description: group.description,
        startDate: group.startDate,
        endDate: group.endDate,
        skills: group.skills,
      });
    }
  });

  cv.education.forEach((ed, i) => {
    items.push({
      id: `edu-${i}`,
      kind: "education",
      title: ed.field,
      subtitle: `${ed.institution} · ${ed.level}`,
      description: `${ed.credits}`,
      startDate: ed.startDate,
      endDate: ed.endDate,
      skills: ed.skills ?? [],
    });
  });

  return items;
}

export function Timeline({ cv, open, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  const items = useMemo(() => buildItems(cv), [cv]);

  const tracks = useMemo<TrackDef[]>(() => {
    const experience = assignLanes(
      items.filter((i) => i.kind === "experience"),
    );
    const assignment = assignLanes(
      items.filter((i) => i.kind === "assignment"),
    );
    const education = assignLanes(items.filter((i) => i.kind === "education"));
    const laneCount = (list: PlacedItem[]) =>
      list.length === 0 ? 0 : Math.max(...list.map((x) => x.lane)) + 1;
    return [
      {
        key: "experience",
        label: "Jobs",
        items: experience,
        lanes: Math.max(1, laneCount(experience)),
      },
      {
        key: "assignment",
        label: "Assignments",
        items: assignment,
        lanes: Math.max(1, laneCount(assignment)),
      },
      {
        key: "education",
        label: "Education",
        items: education,
        lanes: Math.max(1, laneCount(education)),
      },
    ];
  }, [items]);

  const { minMonth, maxMonth } = useMemo(() => {
    const now = nowMonthIndex();
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const item of items) {
      min = Math.min(min, monthIndex(item.startDate));
      max = Math.max(max, item.endDate ? monthIndex(item.endDate) : now);
    }
    return {
      minMonth: min - 6,
      maxMonth: Math.max(max, now) + 6,
    };
  }, [items]);

  const totalMonths = Math.max(1, maxMonth - minMonth);
  const monthPx = BASE_MONTH_PX * scale;
  const axisLength = totalMonths * monthPx;

  const trackOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cumulative = 0;
    for (const track of tracks) {
      offsets.push(cumulative);
      cumulative += TRACK_HEADER + track.lanes * LANE_SIZE + TRACK_GAP;
    }
    return { offsets, total: cumulative };
  }, [tracks]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    for (const track of tracks) {
      const found = track.items.find((i) => i.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [selectedId, tracks]);

  const zoomAt = useCallback((factor: number) => {
    setScale((s) => clamp(s * factor, MIN_SCALE, MAX_SCALE));
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0018);
      setScale((s) => clamp(s * factor, MIN_SCALE, MAX_SCALE));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setScale(1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedId) setSelectedId(null);
        else handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose, selectedId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchRef.current = { dist: Math.hypot(dx, dy) || 1, scale };
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const dist = Math.hypot(dx, dy) || 1;
      const ratio = dist / pinchRef.current.dist;
      setScale(clamp(pinchRef.current.scale * ratio, MIN_SCALE, MAX_SCALE));
    }
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  if (!open) return null;

  const now = nowMonthIndex();

  const yearTicks: { month: number; label: string }[] = [];
  const firstYear = Math.ceil(minMonth / 12);
  const lastYear = Math.floor(maxMonth / 12);
  for (let y = firstYear; y <= lastYear; y++) {
    yearTicks.push({ month: y * 12, label: String(y) });
  }

  const showMonthTicks = monthPx >= 26;
  const showMonthLabels = monthPx >= 48;
  const monthTicks: { month: number; label: string }[] = [];
  if (showMonthTicks) {
    for (let m = minMonth; m <= maxMonth; m++) {
      if (m % 12 === 0) continue;
      const monthNum = ((m % 12) + 12) % 12;
      monthTicks.push({ month: m, label: MONTH_NAMES[monthNum] });
    }
  }

  const contentWidth = axisLength;
  const contentHeight = AXIS_SIZE + trackOffsets.total;

  const axisPos = (m: number) => (m - minMonth) * monthPx;

  const renderItem = (item: PlacedItem, trackOffset: number) => {
    const startIdx = monthIndex(item.startDate);
    const endIdx = item.endDate ? monthIndex(item.endDate) : now;
    const timePos = axisPos(startIdx);
    const timeLen = Math.max(monthPx * 0.5, (endIdx - startIdx) * monthPx);
    const perpPos = trackOffset + TRACK_HEADER + item.lane * LANE_SIZE;
    const perpSize = LANE_SIZE - LANE_GAP;
    const style: CSSProperties = {
      left: timePos,
      width: timeLen,
      top: perpPos,
      height: perpSize,
    };
    const ongoing = item.endDate === null;
    const classes = [
      "timeline-vis-item",
      `timeline-vis-${item.kind}`,
      ongoing ? "is-ongoing" : "",
      selectedId === item.id ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        key={item.id}
        type="button"
        className={classes}
        style={style}
        onClick={() => setSelectedId(item.id)}
        title={`${item.title} · ${item.subtitle}\n${formatRange(item.startDate, item.endDate)}`}
      >
        <span className="timeline-vis-item-label">
          <span className="timeline-vis-item-title">{item.title}</span>
          <span className="timeline-vis-item-sub">{item.subtitle}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="timeline-vis-overlay" role="dialog" aria-modal="true">
      <div className="timeline-vis-toolbar">
        <div className="timeline-vis-title">
          <strong>Career timeline</strong>
          <span className="timeline-vis-hint">
            Ctrl+scroll to zoom · pinch on touch · drag to pan
          </span>
        </div>
        <div className="timeline-vis-controls">
          <div className="timeline-vis-zoom">
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => zoomAt(1 / 1.3)}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="timeline-vis-scale">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => zoomAt(1.3)}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => setScale(1)}
              aria-label="Reset zoom"
            >
              Reset
            </button>
          </div>
          <button
            type="button"
            className="timeline-vis-btn timeline-vis-close"
            onClick={handleClose}
            aria-label="Close timeline"
          >
            <span className="timeline-vis-close-icon" aria-hidden="true">
              ✕
            </span>
            <span>Close</span>
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="timeline-vis-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          className="timeline-vis-content"
          style={{ width: contentWidth, height: contentHeight }}
        >
          <div
            className="timeline-vis-axis"
            style={{ left: 0, top: 0, width: axisLength, height: AXIS_SIZE }}
          >
            {yearTicks.map((tick) => {
              const pos = axisPos(tick.month);
              return (
                <div
                  key={`y-${tick.month}`}
                  className="timeline-vis-tick timeline-vis-tick-year"
                  style={{ left: pos }}
                >
                  <span className="timeline-vis-tick-label">{tick.label}</span>
                </div>
              );
            })}
            {monthTicks.map((tick) => {
              const pos = axisPos(tick.month);
              return (
                <div
                  key={`m-${tick.month}`}
                  className="timeline-vis-tick timeline-vis-tick-month"
                  style={{ left: pos }}
                >
                  {showMonthLabels && (
                    <span className="timeline-vis-tick-label">
                      {tick.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="timeline-vis-tracks"
            style={{
              left: 0,
              top: AXIS_SIZE,
              width: axisLength,
              height: trackOffsets.total,
            }}
          >
            {yearTicks.map((tick) => {
              const pos = axisPos(tick.month);
              return (
                <div
                  key={`g-${tick.month}`}
                  className="timeline-vis-gridline"
                  style={{ left: pos, top: 0, bottom: 0 }}
                />
              );
            })}

            {tracks.map((track, idx) => {
              const offset = trackOffsets.offsets[idx];
              const size = TRACK_HEADER + track.lanes * LANE_SIZE;
              const bandStyle: CSSProperties = {
                left: 0,
                width: axisLength,
                top: offset,
                height: size,
              };
              const headerStyle: CSSProperties = {
                left: 0,
                top: offset,
                height: TRACK_HEADER,
              };
              return (
                <div
                  key={track.key}
                  className={`timeline-vis-band timeline-vis-band-${track.key}`}
                  style={bandStyle}
                >
                  <div className="timeline-vis-band-label" style={headerStyle}>
                    {track.label}
                  </div>
                  {track.items.map((item) => renderItem(item, offset))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedItem && (
        <aside className="timeline-vis-details">
          <div className="timeline-vis-details-head">
            <span
              className={`timeline-vis-pill timeline-vis-${selectedItem.kind}`}
            >
              {selectedItem.kind === "experience"
                ? "Job"
                : selectedItem.kind === "assignment"
                  ? "Assignment"
                  : "Education"}
            </span>
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => setSelectedId(null)}
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
          <h3 className="timeline-vis-details-title">{selectedItem.title}</h3>
          <p className="timeline-vis-details-sub">{selectedItem.subtitle}</p>
          <p className="timeline-vis-details-dates">
            {formatRange(selectedItem.startDate, selectedItem.endDate)}
            <span className="timeline-vis-details-duration">
              {" · "}
              {formatDuration(
                monthIndex(selectedItem.startDate),
                selectedItem.endDate ? monthIndex(selectedItem.endDate) : now,
              )}
            </span>
          </p>
          {selectedItem.description && (
            <p className="timeline-vis-details-desc">
              {selectedItem.description}
            </p>
          )}
          {selectedItem.skills.length > 0 ? (
            <>
              <h4 className="timeline-vis-details-skills-title">Skills used</h4>
              <ul className="timeline-vis-details-skills">
                {selectedItem.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="timeline-vis-details-empty">
              No skills tagged on this entry.
            </p>
          )}
          <p className="timeline-vis-details-when">
            Starts {formatMonth(selectedItem.startDate)}
          </p>
        </aside>
      )}
    </div>
  );
}

function formatDuration(startMonth: number, endMonth: number): string {
  const total = Math.max(0, endMonth - startMonth);
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0 || years === 0) parts.push(`${months}m`);
  return parts.join(" ");
}
