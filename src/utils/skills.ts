import type { CV } from "../data/cv.types";

export type SkillUsage = {
  kind: "project" | "experience" | "assignment" | "education";
  label: string;
  role?: string;
  startDate?: string;
  endDate?: string | null;
};

export function buildSkillUsageMap(cv: CV): Map<string, SkillUsage[]> {
  const map = new Map<string, SkillUsage[]>();

  const push = (skill: string, usage: SkillUsage) => {
    const list = map.get(skill) ?? [];
    list.push(usage);
    map.set(skill, list);
  };

  for (const project of cv.projects) {
    for (const skill of project.skills) {
      push(skill, { kind: "project", label: project.name });
    }
  }

  for (const role of cv.experience) {
    for (const skill of role.skills ?? []) {
      push(skill, {
        kind: "experience",
        label: role.company,
        role: role.role,
        startDate: role.startDate,
        endDate: role.endDate,
      });
    }
    for (const assignment of role.assignments ?? []) {
      for (const skill of assignment.skills ?? []) {
        push(skill, {
          kind: "assignment",
          label: `${assignment.client} (${role.company})`,
          role: assignment.role,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        });
      }
    }
  }

  for (const ed of cv.education) {
    for (const skill of ed.skills ?? []) {
      push(skill, {
        kind: "education",
        label: ed.institution,
        startDate: ed.startDate,
        endDate: ed.endDate,
      });
    }
  }

  return map;
}

export function jobAssignmentCount(usages: SkillUsage[]): number {
  let count = 0;
  for (const u of usages) {
    if (u.kind === "experience" || u.kind === "assignment") count += 1;
  }
  return count;
}

function monthsBetween(
  startIso: string,
  endIso: string | null | undefined,
  now: Date,
): number {
  const [sy, sm] = startIso.split("-").map(Number);
  const start = new Date(sy, sm - 1, 1);
  let end: Date;
  if (endIso) {
    const [ey, em] = endIso.split("-").map(Number);
    end = new Date(ey, em - 1, 1);
  } else {
    end = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return months > 0 ? months : 0;
}

export function yearsOfExperience(
  usages: SkillUsage[],
  now: Date = new Date(),
): number {
  let totalMonths = 0;
  for (const u of usages) {
    if (!u.startDate) continue;
    if (u.kind !== "experience" && u.kind !== "assignment") continue;
    totalMonths += monthsBetween(u.startDate, u.endDate, now);
  }
  return totalMonths / 12;
}

export function formatYearsOfExperience(years: number): string {
  if (years <= 0) return "no recorded experience";
  if (years < 1) return "< 1 year";
  const rounded = Math.round(years);
  return rounded === 1 ? "1 year" : `${rounded} years`;
}
