import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import timelineData from "../data/timeline.json";
import type {
  TimelineBar,
  TimelineData,
  TimelineSegment,
} from "../data/timeline.types";
import { formatMonth, formatRange } from "../utils/date";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 8;
const BASE_MONTH_PX = 14;
const LANE_SIZE = 28;
const LANE_GAP = 2;
const TRACK_HEADER = 20;
const TRACK_GAP = 32;
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

const layout = timelineData as TimelineData;

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

export function Timeline({ open, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  const tracks = layout.tracks;
  const intervals = layout.intervals;

  const { minMonth, maxMonth } = useMemo(() => {
    const runtimeNow = nowMonthIndex();
    return {
      minMonth: layout.minMonth,
      maxMonth: Math.max(layout.maxMonth, runtimeNow + 6),
    };
  }, []);

  const totalMonths = Math.max(1, maxMonth - minMonth);
  const monthPx = BASE_MONTH_PX * scale;
  const axisLength = totalMonths * monthPx;

  const { trackTop, trackHeight, contentHeight } = useMemo(() => {
    const maxLanes = new Array(tracks.length).fill(0);
    for (const interval of intervals) {
      for (let t = 0; t < tracks.length; t++) {
        if (interval.trackActiveCounts[t] > maxLanes[t]) {
          maxLanes[t] = interval.trackActiveCounts[t];
        }
      }
    }
    const tops: number[] = [];
    const heights: number[] = [];
    let cumulative = 0;
    for (let t = 0; t < tracks.length; t++) {
      tops.push(cumulative);
      const h = TRACK_HEADER + maxLanes[t] * LANE_SIZE;
      heights.push(h);
      cumulative += h + TRACK_GAP;
    }
    const total = cumulative > 0 ? cumulative - TRACK_GAP : 0;
    return {
      trackTop: tops,
      trackHeight: heights,
      contentHeight: total,
    };
  }, [tracks, intervals]);

  const selectedItem = useMemo<TimelineBar | null>(() => {
    if (!selectedId) return null;
    for (const track of tracks) {
      const found = track.bars.find((b) => b.id === selectedId);
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

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ cvTimelineOpen: true }, "");
    const onPopState = () => {
      setSelectedId(null);
      setScale(1);
      onClose();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (window.history.state?.cvTimelineOpen) {
        window.history.back();
      }
    };
  }, [open, onClose]);

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

  const axisPos = (m: number) => (m - minMonth) * monthPx;

  const renderBarSegments = (
    bar: TimelineBar,
    trackIdx: number,
    widestSeg: TimelineSegment,
  ) => {
    const classesBase = [
      "timeline-vis-item",
      `timeline-vis-${bar.kind}`,
      bar.isOngoing ? "is-ongoing" : "",
      selectedId === bar.id ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const title = `${bar.title} · ${bar.subtitle}\n${formatRange(
      bar.startDate,
      bar.endDate,
    )}`;

    const lastSegIdx = bar.segments.length - 1;

    return bar.segments.map((seg, segIdx) => {
      const isLast = segIdx === lastSegIdx;
      const segEnd =
        isLast && bar.isOngoing
          ? Math.max(seg.endMonth, now + 1)
          : seg.endMonth;
      const left = axisPos(seg.startMonth);
      const width = Math.max(1, (segEnd - seg.startMonth) * monthPx);
      const top =
        trackTop[trackIdx] + TRACK_HEADER + seg.activeLane * LANE_SIZE;
      const height = LANE_SIZE - LANE_GAP;
      const isLabelSeg = seg === widestSeg;
      const style: CSSProperties = { left, width, top, height };
      return (
        <button
          key={`${bar.id}-${segIdx}`}
          type="button"
          className={
            classesBase + (isLabelSeg ? "" : " timeline-vis-item-continuation")
          }
          style={style}
          data-bar-id={bar.id}
          onClick={() => setSelectedId(bar.id)}
          title={title}
        >
          {isLabelSeg && (
            <span className="timeline-vis-item-label">
              <span className="timeline-vis-item-title">{bar.title}</span>
              <span className="timeline-vis-item-sub">{bar.subtitle}</span>
            </span>
          )}
        </button>
      );
    });
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
            className="timeline-vis-close"
            onClick={handleClose}
            aria-label="Close timeline"
          >
            <span aria-hidden="true">✕</span>
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
          style={{ width: axisLength, height: AXIS_SIZE + contentHeight }}
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
              height: contentHeight,
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

            {tracks.map((track, t) => {
              const style: CSSProperties = {
                left: 0,
                width: axisLength,
                top: trackTop[t],
                height: trackHeight[t],
              };
              return (
                <div
                  key={`band-${t}`}
                  className={`timeline-vis-band timeline-vis-band-${track.key}`}
                  style={style}
                >
                  <div className="timeline-vis-band-label">{track.label}</div>
                </div>
              );
            })}

            {tracks.map((track, t) =>
              track.bars.map((bar) => {
                const widestSeg = bar.segments.reduce((max, s) =>
                  s.endMonth - s.startMonth > max.endMonth - max.startMonth
                    ? s
                    : max,
                );
                return renderBarSegments(bar, t, widestSeg);
              }),
            )}
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
                selectedItem.isOngoing
                  ? now
                  : monthIndex(selectedItem.endDate ?? selectedItem.startDate),
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
