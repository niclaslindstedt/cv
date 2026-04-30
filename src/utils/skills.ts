import type {
  CV,
  Company,
  LocalizedString,
  RoleTenure,
  StackItem,
} from "../data/cv.types";
import { stackEntries, usedStackNames } from "./stack";

function joinRoleTitles(roles: RoleTenure[]): LocalizedString {
  const sorted = [...roles].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  return {
    en: sorted.map((r) => r.title.en).join(" → "),
    sv: sorted.map((r) => r.title.sv).join(" → "),
  };
}

export type SkillUsage = {
  kind: "project" | "experience" | "assignment" | "education" | "course";
  label: string | LocalizedString;
  role?: LocalizedString;
  via?: string;
  startDate?: string;
  endDate?: string | null;
  fte?: number;
};

export type UnusedStackLocation = {
  kind: "project" | "experience" | "assignment";
  label: string | LocalizedString;
  role?: LocalizedString;
  via?: string;
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
    for (const tag of uniq(usedStackNames(project.stack), project.skills)) {
      push(tag, { kind: "project", label: project.name });
    }
  }

  for (const exp of cv.experience) {
    for (const tag of uniq(usedStackNames(exp.stack), exp.skills)) {
      push(tag, {
        kind: "experience",
        label: companyName(exp.companyId),
        role: joinRoleTitles(exp.roles),
        startDate: exp.startDate,
        endDate: exp.endDate,
        fte: exp.fte,
      });
    }
    for (const assignment of exp.assignments ?? []) {
      for (const tag of uniq(
        usedStackNames(assignment.stack),
        assignment.skills,
      )) {
        push(tag, {
          kind: "assignment",
          label: companyName(assignment.clientId),
          via: companyName(exp.companyId),
          role: joinRoleTitles(assignment.roles),
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          fte: assignment.fte ?? exp.fte,
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

  for (const course of cv.courses ?? []) {
    for (const skill of course.skills ?? []) {
      push(skill, {
        kind: "course",
        label: course.institution,
        role: course.name,
        startDate: course.startDate,
        endDate: course.completedDate ?? null,
      });
    }
  }

  return map;
}

export type CompanyStackEntry = { name: string; unused: boolean };

export function buildCompanyStackMap(cv: CV): Map<string, CompanyStackEntry[]> {
  const maps = new Map<string, Map<string, boolean>>();

  const add = (
    companyId: string,
    items: readonly { name: string; unused: boolean }[] | undefined,
  ) => {
    if (!items?.length) return;
    let map = maps.get(companyId);
    if (!map) {
      map = new Map<string, boolean>();
      maps.set(companyId, map);
    }
    for (const item of items) {
      const prev = map.get(item.name);
      // A tech is "unused" only when every usage at this company is unused —
      // a single used occurrence flips the merged result back to used.
      const merged = prev === undefined ? item.unused : prev && item.unused;
      map.set(item.name, merged);
    }
  };

  for (const company of cv.companies) {
    add(company.id, stackEntriesFromItems(company.stack));
  }

  for (const exp of cv.experience) {
    add(exp.companyId, stackEntriesFromItems(exp.stack));
    for (const assignment of exp.assignments ?? []) {
      add(exp.companyId, stackEntriesFromItems(assignment.stack));
      add(assignment.clientId, stackEntriesFromItems(assignment.stack));
    }
  }

  return new Map(
    [...maps.entries()].map(([id, map]) => [
      id,
      [...map.entries()].map(([name, unused]) => ({ name, unused })),
    ]),
  );
}

function stackEntriesFromItems(items: CV["companies"][number]["stack"]) {
  return (items ?? []).map((item) =>
    typeof item === "string"
      ? { name: item, unused: false }
      : { name: item.name, unused: item.unused === true },
  );
}

// For each skill, the projects / jobs / assignments that list it as
// stack but flag it `unused: true`. Used by the skill modal to surface
// a "part of the stack but not personally practiced" hint instead of
// pretending the skill was used there.
export function buildUnusedStackUsageMap(
  cv: CV,
  companies: Map<string, Company>,
): Map<string, UnusedStackLocation[]> {
  const map = new Map<string, UnusedStackLocation[]>();

  const companyName = (id: string): string => {
    const company = companies.get(id);
    if (!company) throw new Error(`Unknown company id: ${id}`);
    return company.name;
  };

  const push = (skill: string, location: UnusedStackLocation) => {
    const list = map.get(skill) ?? [];
    list.push(location);
    map.set(skill, list);
  };

  const unusedNames = (items: StackItem[] | undefined): string[] =>
    stackEntries(items)
      .filter((e) => e.unused)
      .map((e) => e.name);

  for (const project of cv.projects) {
    for (const name of unusedNames(project.stack)) {
      push(name, { kind: "project", label: project.name });
    }
  }

  for (const exp of cv.experience) {
    for (const name of unusedNames(exp.stack)) {
      push(name, {
        kind: "experience",
        label: companyName(exp.companyId),
        role: joinRoleTitles(exp.roles),
        startDate: exp.startDate,
        endDate: exp.endDate,
      });
    }
    for (const a of exp.assignments ?? []) {
      for (const name of unusedNames(a.stack)) {
        push(name, {
          kind: "assignment",
          label: companyName(a.clientId),
          via: companyName(exp.companyId),
          role: joinRoleTitles(a.roles),
          startDate: a.startDate,
          endDate: a.endDate,
        });
      }
    }
  }

  return map;
}

// Set of skills that only ever appear as unused-stack entries. These are
// part of an employer/project stack but were never personally practiced,
// so they're suppressed from the Skills section to avoid showing as
// "Personal interest" (which would be misleading).
export function buildUnusedStackOnlySet(cv: CV): Set<string> {
  const usedSkills = new Set<string>();
  const unusedStackSkills = new Set<string>();

  const addUsed = (names: string[] | undefined) => {
    for (const name of names ?? []) usedSkills.add(name);
  };

  const recordStack = (items: StackItem[] | undefined) => {
    for (const entry of stackEntries(items)) {
      if (entry.unused) unusedStackSkills.add(entry.name);
      else usedSkills.add(entry.name);
    }
  };

  for (const project of cv.projects) {
    recordStack(project.stack);
    addUsed(project.skills);
  }

  for (const exp of cv.experience) {
    recordStack(exp.stack);
    addUsed(exp.skills);
    for (const a of exp.assignments ?? []) {
      recordStack(a.stack);
      addUsed(a.skills);
    }
  }

  for (const ed of cv.education ?? []) addUsed(ed.skills);
  for (const course of cv.courses ?? []) addUsed(course.skills);

  const result = new Set<string>();
  for (const name of unusedStackSkills) {
    if (!usedSkills.has(name)) result.add(name);
  }
  return result;
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

// Sums effective months across all experience/assignment usages, weighted by
// each usage's `fte` (defaulting to 1 = full-time). When part-time roles
// overlap, the per-month FTE is summed and capped at 1 — so two simultaneous
// half-time jobs count as one full-time month, not two.
export function yearsOfExperience(
  usages: SkillUsage[],
  now: Date = new Date(),
): number {
  const nowIdx = nowMonthIndex(now);
  const events: Array<{ m: number; delta: number }> = [];
  for (const u of usages) {
    if (!u.startDate) continue;
    if (u.kind !== "experience" && u.kind !== "assignment") continue;
    const start = monthIndex(u.startDate);
    const end = u.endDate ? monthIndex(u.endDate) : nowIdx;
    if (end <= start) continue;
    const fte = u.fte ?? 1;
    events.push({ m: start, delta: fte });
    events.push({ m: end, delta: -fte });
  }
  events.sort((a, b) => a.m - b.m);

  let totalMonths = 0;
  let curFte = 0;
  let prev = events[0]?.m ?? 0;
  for (const ev of events) {
    if (ev.m > prev && curFte > 0) {
      totalMonths += Math.min(curFte, 1) * (ev.m - prev);
    }
    curFte += ev.delta;
    prev = ev.m;
  }

  return totalMonths / 12;
}
