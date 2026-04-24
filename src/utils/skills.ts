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
