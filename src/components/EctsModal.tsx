import { useEffect, useRef } from "react";

import type { DegreeType, Education as EducationItem } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import type { EctsContext } from "./EctsPill";

const DEGREE_DEFAULT_TOTAL: Record<DegreeType, number> = {
  bachelor: 180,
  magister: 240,
  master: 300,
  medical: 330,
  other: 0,
};

const DEFAULT_MINOR_AFTER = 60;

function parseEcts(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEcts(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

type Props = {
  context: EctsContext | null;
  onClose: () => void;
};

export function EctsModal({ context, onClose }: Props) {
  const { ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalSwipe(modalRef, !!context, onClose);
  useModalFocus(modalRef, !!context);
  useBodyScrollLock(!!context);

  useEffect(() => {
    if (!context) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [context, onClose]);

  if (!context) return null;

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.ects.title}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal ects-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{ui.ects.title}</span>
          </h2>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label={ui.programModal.close}
          >
            ✕
          </button>
        </header>
        <div className="skill-modal-body">
          <p className="skill-modal-description">{ui.ects.intro}</p>
          {context.kind === "program" ? (
            <ProgramView program={context.program} />
          ) : (
            <CourseView credits={context.credits} />
          )}
        </div>
      </div>
    </div>
  );
}

type SegmentKey = "main" | "minor" | "thesis";

type BarSlice = {
  key: SegmentKey;
  credits: number;
  completed: boolean;
};

type LegendEntry = {
  key: SegmentKey;
  label: string;
  credits: number;
  completed: boolean;
};

function buildSegments(
  program: EducationItem,
  total: number,
  labels: { main: string; minor: string; thesis: string },
): { slices: BarSlice[]; entries: LegendEntry[] } {
  const minorSize = parseEcts(program.minor?.credits) ?? 0;
  const thesisSize = parseEcts(program.thesis?.credits) ?? 0;
  const mainSize = Math.max(0, total - minorSize - thesisSize);
  const minorCompleted = program.minor?.completed ?? false;
  const thesisCompleted = program.thesis?.completed ?? false;

  const slices: BarSlice[] = [];
  if (program.degreeType === "bachelor" && minorSize > 0 && mainSize > 0) {
    const requestedAfter =
      parseEcts(program.minor?.after) ?? DEFAULT_MINOR_AFTER;
    const mainBeforeMinor = Math.max(0, Math.min(requestedAfter, mainSize));
    const mainAfterMinor = mainSize - mainBeforeMinor;
    if (mainBeforeMinor > 0) {
      slices.push({ key: "main", credits: mainBeforeMinor, completed: true });
    }
    slices.push({
      key: "minor",
      credits: minorSize,
      completed: minorCompleted,
    });
    if (mainAfterMinor > 0) {
      slices.push({ key: "main", credits: mainAfterMinor, completed: true });
    }
    if (thesisSize > 0) {
      slices.push({
        key: "thesis",
        credits: thesisSize,
        completed: thesisCompleted,
      });
    }
  } else {
    if (mainSize > 0) {
      slices.push({ key: "main", credits: mainSize, completed: true });
    }
    if (minorSize > 0) {
      slices.push({
        key: "minor",
        credits: minorSize,
        completed: minorCompleted,
      });
    }
    if (thesisSize > 0) {
      slices.push({
        key: "thesis",
        credits: thesisSize,
        completed: thesisCompleted,
      });
    }
  }

  const entries: LegendEntry[] = [];
  if (mainSize > 0) {
    entries.push({
      key: "main",
      label: labels.main,
      credits: mainSize,
      completed: true,
    });
  }
  if (minorSize > 0) {
    entries.push({
      key: "minor",
      label: labels.minor,
      credits: minorSize,
      completed: minorCompleted,
    });
  }
  if (thesisSize > 0) {
    entries.push({
      key: "thesis",
      label: labels.thesis,
      credits: thesisSize,
      completed: thesisCompleted,
    });
  }

  return { slices, entries };
}

function ProgramView({ program }: { program: EducationItem }) {
  const { t, ui } = useLang();
  const earned = parseEcts(program.credits) ?? 0;
  const explicitTotal = parseEcts(program.totalCredits);
  const degreeDefault = program.degreeType
    ? DEGREE_DEFAULT_TOTAL[program.degreeType]
    : 0;
  const total = explicitTotal ?? degreeDefault ?? earned;

  const { slices, entries } = buildSegments(program, total, {
    main: ui.ects.segmentMain,
    minor: ui.ects.segmentMinor,
    thesis: ui.ects.segmentThesis,
  });

  const fillPct = total > 0 ? Math.min(100, (earned / total) * 100) : 0;

  const fieldName = t(program.field);
  const degreeName = program.degreeType
    ? ui.ects.degreeNames[program.degreeType]
    : null;

  return (
    <section className="ects-program">
      <h3 className="ects-section-heading">
        {ui.ects.programHeading(fieldName)}
      </h3>
      {degreeName && <p className="ects-program-subtitle">{degreeName}</p>}
      <p className="ects-program-meta">
        <span>
          {ui.ects.earnedOfTotal(formatEcts(earned), formatEcts(total))}
        </span>
        {total > 0 && (
          <span className="ects-program-pct">
            {Math.round((earned / total) * 100)}%
          </span>
        )}
      </p>
      <PowerBar slices={slices} total={total} fillPct={fillPct} />
      <ul className="ects-segment-legend">
        {entries.map((seg) => (
          <li
            key={seg.key}
            className={
              seg.completed
                ? "ects-segment-legend-item"
                : "ects-segment-legend-item ects-segment-legend-item--incomplete"
            }
          >
            <span
              className={`ects-segment-swatch ects-segment-swatch--${seg.key}`}
              aria-hidden="true"
            />
            <span className="ects-segment-legend-label">{seg.label}</span>
            <span className="ects-segment-legend-credits">
              {formatEcts(seg.credits)} ECTS
            </span>
            {!seg.completed && seg.key !== "main" && (
              <span className="ects-segment-legend-status">
                {ui.ects.notCompleted}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="ects-program-explainer">{ui.ects.programExplainer}</p>
    </section>
  );
}

function CourseView({ credits }: { credits: string }) {
  const { ui } = useLang();
  const ects = parseEcts(credits);
  const rows = buildCourseRows(ects);
  return (
    <section className="ects-course">
      {ects !== null && ects > 0 && (
        <p className="ects-course-line">
          {ui.ects.thisCourseLine(
            formatEcts(ects),
            formatEcts((ects * 40) / 60),
            String(Math.round(((ects * 40) / 60) * 40)),
          )}
        </p>
      )}
      <h3 className="ects-section-heading">{ui.ects.conversionHeading}</h3>
      <table className="ects-table">
        <thead>
          <tr>
            <th>{ui.ects.tableEcts}</th>
            <th>{ui.ects.tableWeeks}</th>
            <th>{ui.ects.tableSemesters}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.ects}
              className={
                row.isCourse
                  ? "ects-table-row ects-table-row--current"
                  : undefined
              }
            >
              <td>{formatEcts(row.ects)}</td>
              <td>{formatEcts((row.ects * 40) / 60)}</td>
              <td>{formatSemester(row.ects)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ects-program-explainer">{ui.ects.courseExplainer}</p>
    </section>
  );
}

const ANCHOR_ROWS = [1.5, 30, 60];

function buildCourseRows(
  courseEcts: number | null,
): Array<{ ects: number; isCourse: boolean }> {
  const values = new Map<string, { ects: number; isCourse: boolean }>();
  for (const v of ANCHOR_ROWS) {
    values.set(v.toFixed(2), { ects: v, isCourse: false });
  }
  if (courseEcts !== null && courseEcts > 0) {
    values.set(courseEcts.toFixed(2), { ects: courseEcts, isCourse: true });
  }
  return [...values.values()].sort((a, b) => a.ects - b.ects);
}

function formatSemester(ects: number): string {
  const sem = ects / 30;
  if (sem < 1) {
    const frac = Math.round(sem * 10) / 10;
    return frac === 0 ? "—" : `${frac}`;
  }
  return sem % 1 === 0 ? String(sem) : sem.toFixed(1);
}

type PowerBarProps = {
  slices: BarSlice[];
  total: number;
  fillPct: number;
};

function PowerBar({ slices, total, fillPct }: PowerBarProps) {
  if (total <= 0) return null;
  const pct = (n: number) => `${(n / total) * 100}%`;
  const cumulative: number[] = [];
  let acc = 0;
  for (const slice of slices) {
    cumulative.push(acc);
    acc += slice.credits;
  }
  return (
    <div className="ects-bar-wrap">
      <div
        className="ects-bar"
        role="img"
        aria-label={`${Math.round(fillPct)}% complete`}
      >
        {slices.map((slice, i) => (
          <div
            key={i}
            className={`ects-bar-segment ects-bar-segment--${slice.key} ${
              slice.completed
                ? "ects-bar-segment--done"
                : "ects-bar-segment--missing"
            }`}
            style={{
              left: pct(cumulative[i]),
              width: pct(slice.credits),
            }}
          />
        ))}
        <div
          className="ects-bar-fill"
          style={{ width: `${fillPct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="ects-bar-points" aria-hidden="true">
        <span
          className="ects-bar-point ects-bar-point--total"
          style={{ left: "100%" }}
        >
          {formatEcts(total)}
        </span>
      </div>
    </div>
  );
}
