import { describe, expect, it } from "vitest";

import { yearsOfExperience, type SkillUsage } from "../../src/utils/skills";

const NOW = new Date("2026-04-30");

function exp(
  startDate: string,
  endDate: string | null,
  fte?: number,
): SkillUsage {
  return {
    kind: "experience",
    label: "Co",
    startDate,
    endDate,
    fte,
  };
}

describe("yearsOfExperience", () => {
  it("counts a full-time job at 1 FTE", () => {
    // 12 months at full-time = 1.0 years
    expect(yearsOfExperience([exp("2020-01", "2021-01")], NOW)).toBeCloseTo(
      1,
      5,
    );
  });

  it("halves a half-time job", () => {
    // 12 months at 0.5 FTE = 0.5 years
    expect(
      yearsOfExperience([exp("2020-01", "2021-01", 0.5)], NOW),
    ).toBeCloseTo(0.5, 5);
  });

  it("treats two simultaneous half-time jobs as a single full-time period", () => {
    // Symptoms-and-Indicio shape: same skill at two overlapping half-time
    // employments should not count as 2× the wall-clock duration nor as 0.5 ×
    // wall-clock — it should net out to 1.0 FTE for the overlap.
    const symptoms = exp("2015-11", "2020-01", 0.5);
    const indicio = exp("2015-09", "2020-01", 0.5);
    const years = yearsOfExperience([symptoms, indicio], NOW);

    // Sep 2015 → Nov 2015: 2 months at 0.5
    // Nov 2015 → Jan 2020: 50 months at 1.0 (capped)
    // total = 51 months → 51/12 years
    expect(years).toBeCloseTo(51 / 12, 5);
  });

  it("does not double-count overlapping full-time intervals (cap at 1)", () => {
    const a = exp("2020-01", "2021-01");
    const b = exp("2020-06", "2021-06");
    // Union span: Jan 2020 → Jun 2021 = 17 months at 1.0 (cap)
    expect(yearsOfExperience([a, b], NOW)).toBeCloseTo(17 / 12, 5);
  });

  it("uses `now` for usages with a null endDate", () => {
    // Apr 2024 → Apr 2026 = 24 months at 1.0
    const ongoing = exp("2024-04", null);
    expect(yearsOfExperience([ongoing], NOW)).toBeCloseTo(2, 5);
  });

  it("ignores non-job usages", () => {
    const project: SkillUsage = {
      kind: "project",
      label: "p",
      startDate: "2020-01",
      endDate: "2025-01",
    };
    expect(yearsOfExperience([project], NOW)).toBe(0);
  });
});
