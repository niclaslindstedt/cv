import type { CV, Company, LocalizedString } from "../data/cv.types";

export type SkillUsage = {
  kind: "project" | "experience" | "assignment" | "education";
  label: string | LocalizedString;
  role?: LocalizedString;
  startDate?: string;
  endDate?: string | null;
};

export function buildSkillUsageMap(
  cv: CV,
  companies: Map<string, Company>,
): Map<string, SkillUsage[]> {
  const map = new Map<string, SkillUsage[]>();

  const companyName = (id: string): string => {
    const company = companies.get(id);
    if (!company) throw new Error(`Unknown company id: ${id}`);
    return company.name;
  };

  const push = (skill: string, usage: SkillUsage) => {
    const list = map.get(skill) ?? [];
    list.push(usage);
    map.set(skill, list);
  };

  const uniq = (...lists: (readonly string[] | undefined)[]): string[] => {
    const seen = new Set<string>();
    for (const list of lists) {
      for (const item of list ?? []) seen.add(item);
    }
    return [...seen];
  };

  for (const project of cv.projects) {
    for (const tag of uniq(project.stack, project.skills)) {
      push(tag, { kind: "project", label: project.name });
    }
  }

  for (const role of cv.experience) {
    for (const tag of uniq(role.stack, role.skills)) {
      push(tag, {
        kind: "experience",
        label: companyName(role.companyId),
        role: role.role,
        startDate: role.startDate,
        endDate: role.endDate,
      });
    }
    for (const assignment of role.assignments ?? []) {
      for (const tag of uniq(assignment.stack, assignment.skills)) {
        push(tag, {
          kind: "assignment",
          label: `${companyName(assignment.clientId)} (${companyName(role.companyId)})`,
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

function monthIndex(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function nowMonthIndex(now: Date): number {
  return now.getFullYear() * 12 + now.getMonth();
}

export function yearsOfExperience(
  usages: SkillUsage[],
  now: Date = new Date(),
): number {
  const nowIdx = nowMonthIndex(now);
  const intervals: Array<[number, number]> = [];
  for (const u of usages) {
    if (!u.startDate) continue;
    if (u.kind !== "experience" && u.kind !== "assignment") continue;
    const start = monthIndex(u.startDate);
    const end = u.endDate ? monthIndex(u.endDate) : nowIdx;
    if (end > start) intervals.push([start, end]);
  }
  intervals.sort((a, b) => a[0] - b[0]);

  let totalMonths = 0;
  let curStart = -1;
  let curEnd = -1;
  for (const [s, e] of intervals) {
    if (s > curEnd) {
      if (curEnd > curStart) totalMonths += curEnd - curStart;
      curStart = s;
      curEnd = e;
    } else if (e > curEnd) {
      curEnd = e;
    }
  }
  if (curEnd > curStart) totalMonths += curEnd - curStart;

  return totalMonths / 12;
}
