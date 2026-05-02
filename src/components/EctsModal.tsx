import { useEffect, useRef } from "react";

import type { DegreeType, Education as EducationItem } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import type { EctsContext } from "./EctsPill";

const DEGREE_DEFAULT_TOTAL: Record<DegreeType, number> = {
  bachelor: 180,
  magister: 60,
  master: 120,
  medical: 330,
  other: 0,
};

const LADDER_MILESTONES: { value: number; key: keyof MilestoneStrings }[] = [
  { value: 60, key: "magister" },
  { value: 120, key: "master" },
  { value: 180, key: "bachelor" },
  { value: 240, key: "masterAfterBachelor" },
  { value: 300, key: "twoYearMaster" },
];

type MilestoneStrings = {
  magister: string;
  master: string;
  bachelor: string;
  masterAfterBachelor: string;
  twoYearMaster: string;
};

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
          <section className="ects-modal-intro">
            <p className="skill-modal-description">{ui.ects.intro}</p>
          </section>
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

function ProgramView({ program }: { program: EducationItem }) {
  const { t, ui } = useLang();
  const earned = parseEcts(program.credits) ?? 0;
  const explicitTotal = parseEcts(program.totalCredits);
  const degreeDefault = program.degreeType
    ? DEGREE_DEFAULT_TOTAL[program.degreeType]
    : 0;
  const total = explicitTotal ?? degreeDefault ?? earned;
  const minorEcts = parseEcts(program.minor?.credits);
  const thesisEcts = parseEcts(program.thesis?.credits);

  const minorSize = minorEcts ?? 0;
  const thesisSize = thesisEcts ?? 0;
  const mainSize = Math.max(0, total - minorSize - thesisSize);

  const segments: Array<{
    key: "main" | "minor" | "thesis";
    label: string;
    credits: number;
    completed: boolean;
  }> = [];
  segments.push({
    key: "main",
    label: ui.ects.segmentMain,
    credits: mainSize,
    completed: true,
  });
  if (minorSize > 0) {
    segments.push({
      key: "minor",
      label: ui.ects.segmentMinor,
      credits: minorSize,
      completed: program.minor?.completed ?? false,
    });
  }
  if (thesisSize > 0) {
    segments.push({
      key: "thesis",
      label: ui.ects.segmentThesis,
      credits: thesisSize,
      completed: program.thesis?.completed ?? false,
    });
  }

  const fillPct = total > 0 ? Math.min(100, (earned / total) * 100) : 0;

  const milestones = LADDER_MILESTONES.filter((m) => m.value <= total);

  const fieldName = t(program.field);

  return (
    <section className="ects-program">
      <h3 className="ects-section-heading">
        {ui.ects.programHeading(fieldName)}
      </h3>
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
      <PowerBar
        segments={segments}
        total={total}
        fillPct={fillPct}
        milestones={milestones.map((m) => ({
          value: m.value,
          label: ui.ects.milestones[m.key],
        }))}
      />
      <ul className="ects-segment-legend">
        {segments.map((seg) => (
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
  return (
    <section className="ects-course">
      {ects !== null && ects > 0 && (
        <p className="ects-course-line">
          {ui.ects.thisCourseLine(
            formatEcts(ects),
            formatEcts((ects * 40) / 60),
            String(Math.round(ects * 27)),
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
          {[
            { ects: 1.5, weeks: 1 },
            { ects: 7.5, weeks: 5 },
            { ects: 15, weeks: 10 },
            { ects: 30, weeks: 20 },
            { ects: 60, weeks: 40 },
          ].map((row) => (
            <tr key={row.ects}>
              <td>{formatEcts(row.ects)}</td>
              <td>{row.weeks}</td>
              <td>{formatSemester(row.ects)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ects-program-explainer">{ui.ects.courseExplainer}</p>
    </section>
  );
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
  segments: Array<{
    key: "main" | "minor" | "thesis";
    credits: number;
    completed: boolean;
    label: string;
  }>;
  total: number;
  fillPct: number;
  milestones: Array<{ value: number; label: string }>;
};

function PowerBar({ segments, total, fillPct, milestones }: PowerBarProps) {
  if (total <= 0) return null;
  const pct = (n: number) => `${(n / total) * 100}%`;
  const cumulative: number[] = [];
  let acc = 0;
  for (const seg of segments) {
    cumulative.push(acc);
    acc += seg.credits;
  }
  return (
    <div className="ects-bar-wrap">
      <div className="ects-bar-milestones" aria-hidden="true">
        {milestones.map((m) => (
          <span
            key={m.value}
            className="ects-bar-milestone"
            style={{ left: pct(m.value) }}
          >
            <span className="ects-bar-milestone-label">{m.label}</span>
            <span className="ects-bar-milestone-tick" />
          </span>
        ))}
      </div>
      <div
        className="ects-bar"
        role="img"
        aria-label={`${Math.round(fillPct)}% complete`}
      >
        {segments.map((seg, i) => (
          <div
            key={seg.key}
            className={`ects-bar-segment ects-bar-segment--${seg.key} ${
              seg.completed
                ? "ects-bar-segment--done"
                : "ects-bar-segment--missing"
            }`}
            style={{
              left: pct(cumulative[i]),
              width: pct(seg.credits),
            }}
            title={`${seg.label}: ${formatEcts(seg.credits)} ECTS`}
          />
        ))}
        <div
          className="ects-bar-fill"
          style={{ width: `${fillPct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="ects-bar-points" aria-hidden="true">
        {milestones
          .filter((m) => m.value !== total)
          .map((m) => (
            <span
              key={m.value}
              className="ects-bar-point"
              style={{ left: pct(m.value) }}
            >
              {m.value}
            </span>
          ))}
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
