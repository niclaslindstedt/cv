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
import type { TimelineBar, TimelineData } from "../data/timeline.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { NoteIcon } from "./NoteIcon";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 8;
const BASE_MONTH_PX = 14;
const LANE_SIZE = 48;
const LANE_GAP = 4;
const TRACK_HEADER = 8;
const TRACK_GAP = 24;
const AXIS_SIZE = 40;
const GH_DAILY_THRESHOLD = 30;
const GH_WEEKLY_THRESHOLD = 10;
const GH_DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 1 && isLeapYear(year)) return 29;
  return GH_DAYS_PER_MONTH[month];
}

type GhCell = { offset: number; span: number; count: number };

function computeGhCells(
  year: number,
  daily: number[],
  monthPx: number,
): { cells: GhCell[]; totalDays: number } {
  const totalDays = daily.length;
  const dayFraction = 12 / totalDays;
  if (monthPx >= GH_DAILY_THRESHOLD) {
    const cells: GhCell[] = [];
    for (let d = 0; d < totalDays; d++) {
      cells.push({
        offset: d * dayFraction,
        span: dayFraction,
        count: daily[d],
      });
    }
    return { cells, totalDays };
  }
  if (monthPx >= GH_WEEKLY_THRESHOLD) {
    const cells: GhCell[] = [];
    for (let start = 0; start < totalDays; start += 7) {
      const end = Math.min(start + 7, totalDays);
      let count = 0;
      for (let d = start; d < end; d++) count += daily[d];
      cells.push({
        offset: start * dayFraction,
        span: (end - start) * dayFraction,
        count,
      });
    }
    return { cells, totalDays };
  }
  const cells: GhCell[] = [];
  let dayCursor = 0;
  for (let m = 0; m < 12; m++) {
    const days = daysInMonth(year, m);
    let count = 0;
    for (let d = 0; d < days && dayCursor + d < totalDays; d++) {
      count += daily[dayCursor + d];
    }
    cells.push({ offset: m, span: 1, count });
    dayCursor += days;
  }
  return { cells, totalDays };
}

function ghOpacity(
  count: number,
  maxDailyCommits: number,
  mode: "day" | "week" | "month",
): number {
  if (count <= 0) return 0;
  const refMax = Math.max(
    1,
    mode === "day"
      ? maxDailyCommits
      : mode === "week"
        ? maxDailyCommits * 5
        : maxDailyCommits * 15,
  );
  const norm = Math.log1p(count) / Math.log1p(refMax);
  return Math.min(1, 0.12 + norm * 0.88);
}

export function Timeline({ open, onClose }: Props) {
  const { lang, t, ui } = useLang();
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

  const monthNames = ui.months;

  function formatMonthDay(iso: string): string {
    const [, m, d] = iso.split("-").map(Number);
    return `${monthNames[m - 1]} ${d}`;
  }

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
      monthTicks.push({ month: m, label: monthNames[monthNum] });
    }
  }

  const axisPos = (m: number) => (m - minMonth) * monthPx;

  const renderBar = (bar: TimelineBar, trackIdx: number) => {
    const classes = [
      "timeline-vis-item",
      `timeline-vis-${bar.kind}`,
      bar.isOngoing ? "is-ongoing" : "",
      selectedId === bar.id ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const lane = bar.segments[0].activeLane;
    const startMonth = bar.segments[0].startMonth;
    const lastSeg = bar.segments[bar.segments.length - 1];
    const endMonth = bar.isOngoing
      ? Math.max(lastSeg.endMonth, now + 1)
      : lastSeg.endMonth;

    const left = axisPos(startMonth);
    const width = Math.max(1, (endMonth - startMonth) * monthPx);
    const top = trackTop[trackIdx] + TRACK_HEADER + lane * LANE_SIZE;
    const height = LANE_SIZE - LANE_GAP;
    const style: CSSProperties = { left, width, top, height };

    const barTitle = t(bar.title);
    const barSubtitle = t(bar.subtitle);

    if (bar.kind === "github" && bar.github) {
      const year = Number(barTitle);
      const mode: "day" | "week" | "month" =
        monthPx >= GH_DAILY_THRESHOLD
          ? "day"
          : monthPx >= GH_WEEKLY_THRESHOLD
            ? "week"
            : "month";
      const { cells } = computeGhCells(year, bar.github.dailyCommits, monthPx);
      const ghTitle = ui.timeline.commitsInYear(
        bar.github.totalCommits,
        barTitle,
      );
      return (
        <button
          key={bar.id}
          type="button"
          className={classes}
          style={style}
          data-bar-id={bar.id}
          onClick={() => setSelectedId(bar.id)}
          title={ghTitle}
          aria-label={ghTitle}
        >
          {cells.map((cell, i) => {
            const opacity = ghOpacity(
              cell.count,
              bar.github!.maxDailyCommits,
              mode,
            );
            if (opacity <= 0) return null;
            const cellStyle: CSSProperties = {
              left: `${(cell.offset / 12) * 100}%`,
              width: `${(cell.span / 12) * 100}%`,
              background: `rgba(34, 197, 94, ${opacity})`,
            };
            return (
              <span
                key={i}
                className="timeline-vis-gh-cell"
                style={cellStyle}
              />
            );
          })}
        </button>
      );
    }

    const title = `${barTitle} · ${barSubtitle}\n${formatRange(
      bar.startDate,
      bar.endDate,
      lang,
    )}`;

    return (
      <button
        key={bar.id}
        type="button"
        className={classes}
        style={style}
        data-bar-id={bar.id}
        onClick={() => setSelectedId(bar.id)}
        title={title}
      >
        <span className="timeline-vis-item-label">
          <span className="timeline-vis-item-title">{barTitle}</span>
          <span className="timeline-vis-item-sub">{barSubtitle}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="timeline-vis-overlay" role="dialog" aria-modal="true">
      <div className="timeline-vis-toolbar">
        <div className="timeline-vis-title">
          <strong>{ui.timeline.title}</strong>
          <span className="timeline-vis-hint">{ui.timeline.hint}</span>
        </div>
        <div className="timeline-vis-controls">
          <div className="timeline-vis-zoom">
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => zoomAt(1 / 1.3)}
              aria-label={ui.timeline.zoomOut}
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
              aria-label={ui.timeline.zoomIn}
            >
              +
            </button>
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => setScale(1)}
              aria-label={ui.timeline.resetZoom}
            >
              {ui.timeline.reset}
            </button>
          </div>
          <button
            type="button"
            className="timeline-vis-close"
            onClick={handleClose}
            aria-label={ui.timeline.close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      <div className="timeline-vis-body">
        <div
          className="timeline-vis-labels"
          style={{ height: AXIS_SIZE + contentHeight }}
        >
          {tracks.map((track, t) => (
            <div
              key={`label-${t}`}
              className="timeline-vis-track-label"
              style={{
                top: AXIS_SIZE + trackTop[t],
                height: trackHeight[t],
              }}
            >
              {track.label[lang] ?? track.label.en}
            </div>
          ))}
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
                    <span className="timeline-vis-tick-label">
                      {tick.label}
                    </span>
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
                  />
                );
              })}

              {tracks.map((track, t) =>
                track.bars.map((bar) => renderBar(bar, t)),
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedItem &&
        selectedItem.kind === "github" &&
        selectedItem.github && (
          <aside className="timeline-vis-details">
            <div className="timeline-vis-details-head">
              <span className="timeline-vis-pill timeline-vis-github">
                GitHub
              </span>
              <button
                type="button"
                className="timeline-vis-btn"
                onClick={() => setSelectedId(null)}
                aria-label={ui.timeline.closeDetails}
              >
                ✕
              </button>
            </div>
            <h3 className="timeline-vis-details-title">
              {t(selectedItem.title)}
            </h3>
            <p className="timeline-vis-details-sub">
              <span className="timeline-vis-commit-pill">
                {ui.timeline.commits(selectedItem.github.totalCommits)}
              </span>
            </p>
            <p className="timeline-vis-details-dates">
              {ui.timeline.yearRange(t(selectedItem.title))}
            </p>
            <p className="timeline-vis-details-desc">
              {ui.timeline.busiestMonth}:{" "}
              {monthNames[selectedItem.github.busiestMonth - 1]} ·{" "}
              <span className="timeline-vis-commit-pill">
                {ui.timeline.commits(selectedItem.github.busiestMonthCount)}
              </span>
              <br />
              {ui.timeline.busiestWeek}:{" "}
              {formatMonthDay(selectedItem.github.busiestWeekStart)} ·{" "}
              <span className="timeline-vis-commit-pill">
                {ui.timeline.commits(selectedItem.github.busiestWeekCount)}
              </span>
              <br />
              {ui.timeline.busiestDay}:{" "}
              {formatMonthDay(selectedItem.github.busiestDay)} ·{" "}
              <span className="timeline-vis-commit-pill">
                {ui.timeline.commits(selectedItem.github.busiestDayCount)}
              </span>
            </p>
            <a
              className="timeline-vis-details-link"
              href={`${selectedItem.github.profileUrl}?tab=overview&from=${t(selectedItem.title)}-01-01&to=${t(selectedItem.title)}-12-31`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ui.timeline.viewOnGitHub}
            </a>
            <p className="timeline-vis-details-when">
              @{selectedItem.github.username}
            </p>
          </aside>
        )}
      {selectedItem && selectedItem.kind !== "github" && (
        <aside className="timeline-vis-details">
          <div className="timeline-vis-details-head">
            <span
              className={`timeline-vis-pill timeline-vis-${selectedItem.kind}`}
            >
              {selectedItem.kind === "experience"
                ? ui.timeline.job
                : selectedItem.kind === "assignment"
                  ? ui.timeline.assignment
                  : selectedItem.kind === "course"
                    ? ui.timeline.course
                    : ui.timeline.education}
            </span>
            <button
              type="button"
              className="timeline-vis-btn"
              onClick={() => setSelectedId(null)}
              aria-label={ui.timeline.closeDetails}
            >
              ✕
            </button>
          </div>
          <h3 className="timeline-vis-details-title">
            {t(selectedItem.title)}
          </h3>
          <p className="timeline-vis-details-sub">{t(selectedItem.subtitle)}</p>
          <p className="timeline-vis-details-dates">
            {formatRange(selectedItem.startDate, selectedItem.endDate, lang)}
            <span className="timeline-vis-details-duration">
              {" · "}
              {formatDuration(
                monthIndex(selectedItem.startDate),
                selectedItem.isOngoing
                  ? now
                  : monthIndex(selectedItem.endDate ?? selectedItem.startDate),
                ui.timeline.yUnit,
                ui.timeline.mUnit,
              )}
            </span>
          </p>
          {t(selectedItem.description) && (
            <p className="timeline-vis-details-desc">
              {t(selectedItem.description)}
            </p>
          )}
          {selectedItem.notes && (
            <p className="timeline-vis-details-notes">
              <NoteIcon />
              <span>{t(selectedItem.notes)}</span>
            </p>
          )}
          {selectedItem.skills.length > 0 ? (
            <>
              <h4 className="timeline-vis-details-skills-title">
                {ui.timeline.skillsUsed}
              </h4>
              <ul className="timeline-vis-details-skills">
                {selectedItem.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="timeline-vis-details-empty">{ui.timeline.noSkills}</p>
          )}
          <p className="timeline-vis-details-when">
            {ui.timeline.starts} {formatMonth(selectedItem.startDate, lang)}
          </p>
        </aside>
      )}
    </div>
  );
}

function formatDuration(
  startMonth: number,
  endMonth: number,
  yUnit: string,
  mUnit: string,
): string {
  const total = Math.max(0, endMonth - startMonth);
  const years = Math.floor(total / 12);
  const months = total % 12;
  const ySep = yUnit.length > 1 ? " " : "";
  const mSep = mUnit.length > 1 ? " " : "";
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}${ySep}${yUnit}`);
  if (months > 0 || years === 0) parts.push(`${months}${mSep}${mUnit}`);
  return parts.join(" ");
}
