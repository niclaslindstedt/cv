import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import timelineData from "../data/timeline.json";
import type { TimelineBar, TimelineData } from "../data/timeline.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang, type LanguageContextValue } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import { NoteIcon } from "./NoteIcon";
import { ProjectDateChip } from "./ProjectDateChip";
import { ResetIcon } from "./ResetIcon";
import { TrackIcon } from "./TrackIcon";

const MIN_SCALE = 0.3;
const MAX_SCALE = 8;
const BASE_MONTH_PX = 14;
const ZOOM_TWEEN_MS = 240;
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function monthIndex(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function previousMonthIso(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
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

type DetailsSideButtonProps = {
  direction: "prev" | "next";
  target: TimelineBar | null;
  onClick: () => void;
  ui: LanguageContextValue["ui"]["timeline"];
};

function DetailsSideButton({
  direction,
  target,
  onClick,
  ui,
}: DetailsSideButtonProps) {
  const label = direction === "prev" ? ui.previousDetails : ui.nextDetails;
  return (
    <button
      type="button"
      className={`timeline-vis-details-side timeline-vis-details-side-${direction}`}
      onClick={onClick}
      disabled={!target}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

export function Timeline() {
  const { lang, t, ui } = useLang();
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const labelsInnerRef = useRef<HTMLDivElement>(null);
  const githubDetailsRef = useRef<HTMLElement>(null);
  const sideProjectDetailsRef = useRef<HTMLElement>(null);
  const otherDetailsRef = useRef<HTMLElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number } | null>(null);
  const pendingPinchRef = useRef<{ dist: number; midpoint: number } | null>(
    null,
  );
  const pinchRafRef = useRef<number | null>(null);
  const pendingWheelRef = useRef<{ deltaY: number; clientX: number } | null>(
    null,
  );
  const wheelRafRef = useRef<number | null>(null);
  const didInitialScrollRef = useRef(false);
  const scaleRef = useRef(1);
  const scaleTweenRef = useRef<number | null>(null);
  const zoomAnchorRef = useRef<{
    pixelOffset: number;
    monthAtPixel: number;
  } | null>(null);

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
    const total =
      cumulative > 0 ? cumulative - TRACK_GAP + TRACK_HEADER - LANE_GAP : 0;
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

  const sameKindBars = useMemo<TimelineBar[]>(() => {
    if (!selectedItem) return [];
    const kind = selectedItem.kind;
    const bars: TimelineBar[] = [];
    for (const track of tracks) {
      for (const bar of track.bars) {
        if (bar.kind === kind) bars.push(bar);
      }
    }
    bars.sort((a, b) => {
      const aStart = a.segments[0].startMonth;
      const bStart = b.segments[0].startMonth;
      if (aStart !== bStart) return aStart - bStart;
      return a.id.localeCompare(b.id);
    });
    return bars;
  }, [selectedItem, tracks]);

  const navIndex = selectedItem
    ? sameKindBars.findIndex((b) => b.id === selectedItem.id)
    : -1;
  const prevBar = navIndex > 0 ? sameKindBars[navIndex - 1] : null;
  const nextBar =
    navIndex >= 0 && navIndex < sameKindBars.length - 1
      ? sameKindBars[navIndex + 1]
      : null;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    return () => {
      if (scaleTweenRef.current !== null) {
        cancelAnimationFrame(scaleTweenRef.current);
        scaleTweenRef.current = null;
      }
      if (pinchRafRef.current !== null) {
        cancelAnimationFrame(pinchRafRef.current);
        pinchRafRef.current = null;
      }
      if (wheelRafRef.current !== null) {
        cancelAnimationFrame(wheelRafRef.current);
        wheelRafRef.current = null;
      }
    };
  }, []);

  const cancelScaleTween = useCallback(() => {
    if (scaleTweenRef.current !== null) {
      cancelAnimationFrame(scaleTweenRef.current);
      scaleTweenRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const anchor = zoomAnchorRef.current;
    if (!anchor) return;
    const newMonthPx = BASE_MONTH_PX * scale;
    const newAxisLength = totalMonths * newMonthPx;
    const target = anchor.monthAtPixel * newMonthPx - anchor.pixelOffset;
    const maxScroll = Math.max(0, newAxisLength - viewport.clientWidth);
    viewport.scrollLeft = Math.max(0, Math.min(maxScroll, target));
  }, [scale, totalMonths]);

  const captureZoomAnchor = useCallback((clientX: number | null) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const pixelOffset =
      clientX !== null
        ? Math.max(0, Math.min(viewport.clientWidth, clientX - rect.left))
        : viewport.clientWidth / 2;
    const currentMonthPx = BASE_MONTH_PX * scaleRef.current;
    const monthAtPixel = (viewport.scrollLeft + pixelOffset) / currentMonthPx;
    zoomAnchorRef.current = { pixelOffset, monthAtPixel };
  }, []);

  const tweenScale = useCallback(
    (to: number) => {
      if (scaleTweenRef.current !== null) {
        cancelAnimationFrame(scaleTweenRef.current);
        scaleTweenRef.current = null;
      }
      const target = clamp(to, MIN_SCALE, MAX_SCALE);
      const startScale = scaleRef.current;
      if (Math.abs(target - startScale) < 0.001) return;
      captureZoomAnchor(null);
      if (prefersReducedMotion()) {
        setScale(target);
        return;
      }
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / ZOOM_TWEEN_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = startScale + (target - startScale) * eased;
        setScale(next);
        if (t < 1) {
          scaleTweenRef.current = requestAnimationFrame(tick);
        } else {
          scaleTweenRef.current = null;
        }
      };
      scaleTweenRef.current = requestAnimationFrame(tick);
    },
    [captureZoomAnchor],
  );

  const zoomAt = useCallback(
    (factor: number) => {
      tweenScale(scaleRef.current * factor);
    },
    [tweenScale],
  );

  const scrollToTrackStart = useCallback(
    (trackIdx: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const track = tracks[trackIdx];
      if (!track || track.bars.length === 0) return;
      let earliestStart = track.bars[0].segments[0].startMonth;
      for (const bar of track.bars) {
        const start = bar.segments[0].startMonth;
        if (start < earliestStart) earliestStart = start;
      }
      const left = (earliestStart - minMonth) * monthPx;
      const trackStart = AXIS_SIZE + trackTop[trackIdx];
      const trackEnd = trackStart + trackHeight[trackIdx];
      const viewTop = viewport.scrollTop + AXIS_SIZE;
      const viewBottom = viewport.scrollTop + viewport.clientHeight;
      let nextTop = viewport.scrollTop;
      if (trackStart < viewTop) {
        nextTop = Math.max(0, trackStart - AXIS_SIZE - 16);
      } else if (trackEnd > viewBottom) {
        nextTop = Math.max(0, trackEnd - viewport.clientHeight + 16);
      }
      viewport.scrollTo({
        left: Math.max(0, left - 24),
        top: nextTop,
        behavior: "smooth",
      });
    },
    [tracks, monthPx, minMonth, trackTop, trackHeight],
  );

  const scrollToBar = useCallback(
    (bar: TimelineBar) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      let trackIdx = -1;
      for (let t = 0; t < tracks.length; t++) {
        if (tracks[t].bars.some((b) => b.id === bar.id)) {
          trackIdx = t;
          break;
        }
      }
      if (trackIdx < 0) return;
      const startMonth = bar.segments[0].startMonth;
      const lastSeg = bar.segments[bar.segments.length - 1];
      const endMonth = bar.isOngoing
        ? Math.max(lastSeg.endMonth, nowMonthIndex() + 1)
        : lastSeg.endMonth;
      const barLeft = (startMonth - minMonth) * monthPx;
      const barWidth = Math.max(1, (endMonth - startMonth) * monthPx);
      const targetLeft = Math.max(
        0,
        barLeft + barWidth / 2 - viewport.clientWidth / 2,
      );
      const lane = bar.segments[0].activeLane;
      const barTop =
        AXIS_SIZE + trackTop[trackIdx] + TRACK_HEADER + lane * LANE_SIZE;
      const barBottom = barTop + LANE_SIZE;
      const viewTop = viewport.scrollTop + AXIS_SIZE;
      const viewBottom = viewport.scrollTop + viewport.clientHeight;
      let nextTop = viewport.scrollTop;
      if (barTop < viewTop) {
        nextTop = Math.max(0, barTop - AXIS_SIZE - 16);
      } else if (barBottom > viewBottom) {
        nextTop = Math.max(0, barBottom - viewport.clientHeight + 16);
      }
      viewport.scrollTo({
        left: targetLeft,
        top: nextTop,
        behavior: "smooth",
      });
    },
    [tracks, monthPx, minMonth, trackTop],
  );

  const navigateTo = useCallback(
    (bar: TimelineBar | null) => {
      if (!bar) return;
      setSelectedId(bar.id);
      setHighlightedId(null);
      scrollToBar(bar);
    },
    [scrollToBar],
  );

  useEffect(() => {
    if (didInitialScrollRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    didInitialScrollRef.current = true;

    const scrollBehavior: ScrollBehavior = prefersReducedMotion()
      ? "auto"
      : "smooth";

    const targetId =
      typeof window !== "undefined" && window.location.hash
        ? decodeURIComponent(window.location.hash.replace(/^#/, ""))
        : "";

    let targetBar: TimelineBar | null = null;
    let targetTrackIdx = -1;
    if (targetId) {
      for (let t = 0; t < tracks.length; t++) {
        const found = tracks[t].bars.find((b) => b.id === targetId);
        if (found) {
          targetBar = found;
          targetTrackIdx = t;
          break;
        }
      }
    }

    if (targetBar && targetTrackIdx >= 0) {
      const clientWidth = viewport.clientWidth;
      const startMonth = targetBar.segments[0].startMonth;
      const lastSeg = targetBar.segments[targetBar.segments.length - 1];
      const endMonth = targetBar.isOngoing
        ? Math.max(lastSeg.endMonth, nowMonthIndex() + 1)
        : lastSeg.endMonth;
      const monthSpan = Math.max(1, endMonth - startMonth);
      const minCoverageScale =
        (0.25 * clientWidth) / (monthSpan * BASE_MONTH_PX);
      const initialScale = clamp(
        Math.max(1, minCoverageScale),
        MIN_SCALE,
        MAX_SCALE,
      );
      setScale(initialScale);
      scaleRef.current = initialScale;
      setHighlightedId(targetBar.id);

      const newMonthPx = BASE_MONTH_PX * initialScale;
      const barLeft = (startMonth - minMonth) * newMonthPx;
      const barWidth = Math.max(1, (endMonth - startMonth) * newMonthPx);
      const left = Math.max(0, barLeft + barWidth / 2 - clientWidth / 2);

      const lane = targetBar.segments[0].activeLane;
      const barTop =
        AXIS_SIZE + trackTop[targetTrackIdx] + TRACK_HEADER + lane * LANE_SIZE;
      const top = Math.max(0, barTop - AXIS_SIZE - 16);

      requestAnimationFrame(() => {
        const v = viewportRef.current;
        if (v) v.scrollTo({ left, top, behavior: scrollBehavior });
      });
      return;
    }

    let latestExpStart: number | null = null;
    for (const track of tracks) {
      for (const bar of track.bars) {
        if (bar.kind !== "experience") continue;
        const start = bar.segments[0].startMonth;
        if (latestExpStart === null || start > latestExpStart) {
          latestExpStart = start;
        }
      }
    }

    const nowIdx = nowMonthIndex();
    const clientWidth = viewport.clientWidth;

    let initialScale = 1;
    if (latestExpStart !== null && nowIdx > latestExpStart) {
      const monthsSpan = nowIdx - latestExpStart + 2;
      const fitScale = clientWidth / monthsSpan / BASE_MONTH_PX;
      const minCoverageScale = 0.25 * fitScale;
      const upper = Math.min(MAX_SCALE, Math.max(1, minCoverageScale));
      initialScale = clamp(fitScale, 0.8, upper);
    }

    setScale(initialScale);
    scaleRef.current = initialScale;

    const newMonthPx = BASE_MONTH_PX * initialScale;
    const targetX = (nowIdx - minMonth) * newMonthPx;
    const left = Math.max(0, targetX - clientWidth + 24);

    requestAnimationFrame(() => {
      const v = viewportRef.current;
      if (v) v.scrollTo({ left, top: 0, behavior: scrollBehavior });
    });
  }, [minMonth, tracks, trackTop]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const flushWheel = () => {
      wheelRafRef.current = null;
      const pending = pendingWheelRef.current;
      pendingWheelRef.current = null;
      if (!pending) return;
      captureZoomAnchor(pending.clientX);
      const factor = Math.exp(-pending.deltaY * 0.0018);
      setScale((s) => clamp(s * factor, MIN_SCALE, MAX_SCALE));
    };
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      cancelScaleTween();
      if (pendingWheelRef.current) {
        pendingWheelRef.current.deltaY += e.deltaY;
        pendingWheelRef.current.clientX = e.clientX;
      } else {
        pendingWheelRef.current = { deltaY: e.deltaY, clientX: e.clientX };
      }
      if (wheelRafRef.current === null) {
        wheelRafRef.current = requestAnimationFrame(flushWheel);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [captureZoomAnchor, cancelScaleTween]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const inner = labelsInnerRef.current;
    if (!viewport || !inner) return;
    const onScroll = () => {
      inner.style.transform = `translateY(${-viewport.scrollTop}px)`;
    };
    onScroll();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [contentHeight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedId) setSelectedId(null);
        else if (highlightedId) setHighlightedId(null);
        else window.history.back();
        return;
      }
      if (!selectedId) return;
      if (e.key === "ArrowLeft" && prevBar) {
        e.preventDefault();
        navigateTo(prevBar);
      } else if (e.key === "ArrowRight" && nextBar) {
        e.preventDefault();
        navigateTo(nextBar);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, highlightedId, prevBar, nextBar, navigateTo]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const closeDetails = useCallback(() => setSelectedId(null), []);
  const detailsKind = selectedItem?.kind ?? null;
  const swipeNav = useMemo(
    () => ({
      onLeft: nextBar ? () => navigateTo(nextBar) : null,
      onRight: prevBar ? () => navigateTo(prevBar) : null,
    }),
    [prevBar, nextBar, navigateTo],
  );
  useModalSwipe(
    githubDetailsRef,
    detailsKind === "github",
    closeDetails,
    false,
    swipeNav,
  );
  useModalSwipe(
    sideProjectDetailsRef,
    detailsKind === "sideProject",
    closeDetails,
    false,
    swipeNav,
  );
  const otherDetailsActive =
    detailsKind !== null &&
    detailsKind !== "github" &&
    detailsKind !== "sideProject";
  useModalSwipe(
    otherDetailsRef,
    otherDetailsActive,
    closeDetails,
    false,
    swipeNav,
  );

  useModalFocus(githubDetailsRef, detailsKind === "github");
  useModalFocus(sideProjectDetailsRef, detailsKind === "sideProject");
  useModalFocus(otherDetailsRef, otherDetailsActive);

  const syncPinchBaseline = () => {
    const pts = Array.from(pointersRef.current.values());
    if (pts.length < 2) {
      pinchRef.current = null;
      pendingPinchRef.current = null;
      return;
    }
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    pinchRef.current = { dist: Math.hypot(dx, dy) || 1 };
    pendingPinchRef.current = null;
  };

  const flushPinch = () => {
    pinchRafRef.current = null;
    const pending = pendingPinchRef.current;
    pendingPinchRef.current = null;
    if (!pending || !pinchRef.current) return;
    const ratio = pending.dist / pinchRef.current.dist;
    if (Math.abs(ratio - 1) < 0.0005) return;
    pinchRef.current.dist = pending.dist;
    captureZoomAnchor(pending.midpoint);
    setScale((s) => clamp(s * ratio, MIN_SCALE, MAX_SCALE));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2) {
      cancelScaleTween();
      syncPinchBaseline();
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pinchRef.current || pointersRef.current.size < 2) return;
    const pts = Array.from(pointersRef.current.values());
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    const dist = Math.hypot(dx, dy) || 1;
    const midpoint = (pts[0].x + pts[1].x) / 2;
    pendingPinchRef.current = { dist, midpoint };
    if (pinchRafRef.current === null) {
      pinchRafRef.current = requestAnimationFrame(flushPinch);
    }
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
      pendingPinchRef.current = null;
      if (pinchRafRef.current !== null) {
        cancelAnimationFrame(pinchRafRef.current);
        pinchRafRef.current = null;
      }
    } else {
      syncPinchBaseline();
    }
  };

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
      highlightedId === bar.id ? "is-highlighted" : "",
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
          onClick={() => {
            setSelectedId(bar.id);
            setHighlightedId(null);
          }}
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

    const span = endMonth - startMonth;
    const hasRoles = !!(bar.roles && bar.roles.length >= 2 && span > 0);

    let roleSegments: ReactNode = null;
    let promotionMarkers: ReactNode = null;
    if (hasRoles) {
      const roles = bar.roles!;
      const boundaries: number[] = [startMonth];
      for (let i = 1; i < roles.length; i++) {
        const m = monthIndex(roles[i].startDate);
        boundaries.push(Math.min(Math.max(m, startMonth), endMonth));
      }
      boundaries.push(endMonth);

      roleSegments = roles.map((role, i) => {
        const segStart = boundaries[i];
        const segEnd = boundaries[i + 1];
        const left = `${((segStart - startMonth) / span) * 100}%`;
        const width = `${((segEnd - segStart) / span) * 100}%`;
        const isPromoted = i > 0;
        return (
          <span
            key={`role-${role.startDate}`}
            className={`timeline-vis-item-segment${
              isPromoted ? " is-promoted" : ""
            }`}
            style={{ left, width }}
          >
            {isPromoted && (
              <span className="timeline-vis-promo-arrow" aria-hidden="true">
                →
              </span>
            )}
            <span className="timeline-vis-item-segment-label">
              <span className="timeline-vis-item-title">{t(role.title)}</span>
              {barSubtitle && (
                <span className="timeline-vis-item-sub">{barSubtitle}</span>
              )}
            </span>
          </span>
        );
      });

      promotionMarkers = roles.slice(1).map((role) => {
        const m = monthIndex(role.startDate);
        if (m <= startMonth || m >= endMonth) return null;
        const left = `${((m - startMonth) / span) * 100}%`;
        const promoTitle = t(role.title);
        return (
          <span
            key={role.startDate}
            className="timeline-vis-promotion-marker"
            style={{ left }}
            title={ui.timeline.promotedTo(
              promoTitle,
              formatMonth(role.startDate, lang),
            )}
            aria-hidden="true"
          />
        );
      });
    }

    return (
      <button
        key={bar.id}
        type="button"
        className={`${classes}${hasRoles ? " has-roles" : ""}`}
        style={style}
        data-bar-id={bar.id}
        onClick={() => setSelectedId(bar.id)}
        title={title}
      >
        {hasRoles ? (
          roleSegments
        ) : (
          <span className="timeline-vis-item-label">
            <span className="timeline-vis-item-title">{barTitle}</span>
            <span className="timeline-vis-item-sub">{barSubtitle}</span>
          </span>
        )}
        {promotionMarkers}
      </button>
    );
  };

  const detailsAnnouncement = selectedItem
    ? ui.timeline.detailsOpened(t(selectedItem.title))
    : "";

  return (
    <div className="timeline-vis-page" aria-label={ui.timeline.title}>
      <div className="sr-only" role="status" aria-live="polite">
        {detailsAnnouncement}
      </div>
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
              className="timeline-vis-btn timeline-vis-btn-icon"
              onClick={() => tweenScale(1)}
              aria-label={ui.timeline.resetZoom}
              title={ui.timeline.resetZoom}
            >
              <ResetIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-vis-body">
        <div className="timeline-vis-labels">
          <div
            ref={labelsInnerRef}
            className="timeline-vis-labels-inner"
            style={{ height: AXIS_SIZE + contentHeight }}
          >
            {tracks.map((track, t) => {
              const labelText = track.label[lang] ?? track.label.en;
              return (
                <button
                  key={`label-${t}`}
                  type="button"
                  className="timeline-vis-track-label"
                  style={{
                    top: AXIS_SIZE + trackTop[t],
                    height: trackHeight[t],
                  }}
                  aria-label={labelText}
                  title={labelText}
                  onClick={() => scrollToTrackStart(t)}
                >
                  <TrackIcon kind={track.key} />
                  <span className="timeline-vis-track-label-text">
                    {labelText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          ref={viewportRef}
          className="timeline-vis-viewport"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".timeline-vis-item")) {
              setSelectedId(null);
              setHighlightedId(null);
            }
          }}
        >
          <div
            className="timeline-vis-content"
            style={{
              width: axisLength,
              minHeight: `max(100%, ${AXIS_SIZE + contentHeight}px)`,
            }}
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
          <aside
            ref={githubDetailsRef}
            className="timeline-vis-details"
            role="region"
            aria-labelledby="timeline-vis-details-title"
          >
            <DetailsSideButton
              direction="prev"
              target={prevBar}
              onClick={() => navigateTo(prevBar)}
              ui={ui.timeline}
            />
            <div className="timeline-vis-details-body">
              <div className="timeline-vis-details-head">
                <span className="timeline-vis-pill timeline-vis-github">
                  GitHub
                </span>
                <button
                  type="button"
                  className="timeline-vis-btn timeline-vis-btn-icon timeline-vis-details-close"
                  onClick={() => setSelectedId(null)}
                  aria-label={ui.timeline.closeDetails}
                  title={ui.timeline.closeDetails}
                >
                  ✕
                </button>
              </div>
              <h3
                id="timeline-vis-details-title"
                className="timeline-vis-details-title"
              >
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
                {selectedItem.github.busiestRepo && (
                  <>
                    <br />
                    {ui.timeline.busiestRepo}:{" "}
                    {selectedItem.github.busiestRepo.openSource ? (
                      <a
                        href={selectedItem.github.busiestRepo.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedItem.github.busiestRepo.name}
                      </a>
                    ) : (
                      selectedItem.github.busiestRepo.name
                    )}{" "}
                    ·{" "}
                    <span className="timeline-vis-commit-pill">
                      {ui.timeline.commits(
                        selectedItem.github.busiestRepo.commits,
                      )}
                    </span>
                  </>
                )}
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
            </div>
            <DetailsSideButton
              direction="next"
              target={nextBar}
              onClick={() => navigateTo(nextBar)}
              ui={ui.timeline}
            />
          </aside>
        )}
      {selectedItem &&
        selectedItem.kind === "sideProject" &&
        selectedItem.sideProject && (
          <aside
            ref={sideProjectDetailsRef}
            className="timeline-vis-details"
            role="region"
            aria-labelledby="timeline-vis-details-title"
          >
            <DetailsSideButton
              direction="prev"
              target={prevBar}
              onClick={() => navigateTo(prevBar)}
              ui={ui.timeline}
            />
            <div className="timeline-vis-details-body">
              <div className="timeline-vis-details-head">
                <span className="timeline-vis-pill timeline-vis-sideProject">
                  {ui.timeline.sideProject}
                </span>
                <button
                  type="button"
                  className="timeline-vis-btn timeline-vis-btn-icon timeline-vis-details-close"
                  onClick={() => setSelectedId(null)}
                  aria-label={ui.timeline.closeDetails}
                  title={ui.timeline.closeDetails}
                >
                  ✕
                </button>
              </div>
              <h3
                id="timeline-vis-details-title"
                className="timeline-vis-details-title"
              >
                {t(selectedItem.title)}
              </h3>
              <p className="timeline-vis-details-sub">
                {t(selectedItem.subtitle)}
              </p>
              <p className="timeline-vis-details-dates">
                {selectedItem.sideProject.firstCommitDate &&
                selectedItem.sideProject.lastCommitDate ? (
                  <>
                    <ProjectDateChip
                      iso={selectedItem.sideProject.firstCommitDate}
                      lang={lang}
                    />
                    <span className="project-date-sep" aria-hidden="true">
                      –
                    </span>
                    <ProjectDateChip
                      iso={selectedItem.sideProject.lastCommitDate}
                      lang={lang}
                    />
                  </>
                ) : (
                  formatRange(
                    selectedItem.startDate,
                    selectedItem.endDate,
                    lang,
                  )
                )}
                {" · "}
                <span className="timeline-vis-details-duration">
                  {formatDuration(
                    monthIndex(selectedItem.startDate),
                    monthIndex(selectedItem.endDate ?? selectedItem.startDate),
                    ui.timeline.yUnit,
                    ui.timeline.mUnit,
                  )}
                </span>
              </p>
              <p className="timeline-vis-details-dates">
                <span className="timeline-vis-commit-pill">
                  {ui.timeline.commits(selectedItem.sideProject.totalCommits)}
                </span>
              </p>
              {t(selectedItem.description) && (
                <p className="timeline-vis-details-desc">
                  {renderInlineCode(t(selectedItem.description))}
                </p>
              )}
              {selectedItem.sideProject.openSource && (
                <a
                  className="timeline-vis-details-link"
                  href={selectedItem.sideProject.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ui.timeline.viewRepository}
                </a>
              )}
              {selectedItem.skills.length > 0 && (
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
              )}
            </div>
            <DetailsSideButton
              direction="next"
              target={nextBar}
              onClick={() => navigateTo(nextBar)}
              ui={ui.timeline}
            />
          </aside>
        )}
      {selectedItem &&
        selectedItem.kind !== "github" &&
        selectedItem.kind !== "sideProject" &&
        (() => {
          const hasMultipleRoles =
            !!selectedItem.roles && selectedItem.roles.length >= 2;
          const headingText = t(selectedItem.title);
          const showSubtitle = t(selectedItem.subtitle).length > 0;
          const roleRanges = hasMultipleRoles
            ? selectedItem.roles!.map((role, i) => {
                const roles = selectedItem.roles!;
                const isLast = i === roles.length - 1;
                const startMonth = monthIndex(role.startDate);
                const endMonth = isLast
                  ? selectedItem.isOngoing
                    ? now
                    : monthIndex(selectedItem.endDate ?? selectedItem.startDate)
                  : monthIndex(roles[i + 1].startDate);
                const endIso = isLast
                  ? selectedItem.endDate
                  : previousMonthIso(roles[i + 1].startDate);
                return {
                  key: role.startDate,
                  title: role.title,
                  startDate: role.startDate,
                  endIso,
                  startMonth,
                  endMonth,
                };
              })
            : [];
          return (
            <aside
              ref={otherDetailsRef}
              className="timeline-vis-details"
              role="region"
              aria-labelledby="timeline-vis-details-title"
            >
              <DetailsSideButton
                direction="prev"
                target={prevBar}
                onClick={() => navigateTo(prevBar)}
                ui={ui.timeline}
              />
              <div className="timeline-vis-details-body">
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
                    className="timeline-vis-btn timeline-vis-btn-icon timeline-vis-details-close"
                    onClick={() => setSelectedId(null)}
                    aria-label={ui.timeline.closeDetails}
                    title={ui.timeline.closeDetails}
                  >
                    ✕
                  </button>
                </div>
                <h3
                  id="timeline-vis-details-title"
                  className="timeline-vis-details-title"
                >
                  {headingText}
                </h3>
                {showSubtitle && (
                  <p className="timeline-vis-details-sub">
                    {t(selectedItem.subtitle)}
                  </p>
                )}
                <p className="timeline-vis-details-dates">
                  {formatRange(
                    selectedItem.startDate,
                    selectedItem.endDate,
                    lang,
                  )}
                  {" · "}
                  <span className="timeline-vis-details-duration">
                    {formatDuration(
                      monthIndex(selectedItem.startDate),
                      selectedItem.isOngoing
                        ? now
                        : monthIndex(
                            selectedItem.endDate ?? selectedItem.startDate,
                          ),
                      ui.timeline.yUnit,
                      ui.timeline.mUnit,
                    )}
                  </span>
                </p>
                {hasMultipleRoles && (
                  <ul className="timeline-vis-details-roles">
                    {[...roleRanges].reverse().map((r) => (
                      <li key={r.key} className="timeline-vis-details-role">
                        <span className="timeline-vis-details-role-title">
                          {t(r.title)}
                        </span>
                        <span className="timeline-vis-details-role-meta">
                          {formatRange(r.startDate, r.endIso, lang)}
                          {" · "}
                          <span className="timeline-vis-details-duration">
                            {formatDuration(
                              r.startMonth,
                              r.endMonth,
                              ui.timeline.yUnit,
                              ui.timeline.mUnit,
                            )}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {(selectedItem.credits || selectedItem.remote) && (
                  <p className="timeline-vis-details-dates">
                    {selectedItem.credits && (
                      <span className="timeline-vis-credits-pill">
                        {selectedItem.credits}
                      </span>
                    )}
                    {selectedItem.credits && selectedItem.remote && " "}
                    {selectedItem.remote && (
                      <span className="timeline-vis-credits-pill">
                        {t({ en: "Remote", sv: "Distans" })}
                      </span>
                    )}
                  </p>
                )}
                {t(selectedItem.description) && (
                  <p className="timeline-vis-details-desc">
                    {renderInlineCode(t(selectedItem.description))}
                  </p>
                )}
                {selectedItem.notes && (
                  <p className="timeline-vis-details-notes">
                    <NoteIcon />
                    <span>{t(selectedItem.notes)}</span>
                  </p>
                )}
                {selectedItem.skills.length > 0 && (
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
                )}
              </div>
              <DetailsSideButton
                direction="next"
                target={nextBar}
                onClick={() => navigateTo(nextBar)}
                ui={ui.timeline}
              />
            </aside>
          );
        })()}
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
