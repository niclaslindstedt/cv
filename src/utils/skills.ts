import type { CV } from "../data/cv.types";

export type SkillUsage = {
  kind: "project" | "experience" | "assignment" | "education";
  label: string;
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
        startDate: role.startDate,
        endDate: role.endDate,
      });
    }
    for (const assignment of role.assignments ?? []) {
      for (const skill of assignment.skills ?? []) {
        push(skill, {
          kind: "assignment",
          label: `${assignment.client} (${role.company})`,
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

export function firstUsedDate(usages: SkillUsage[]): string | null {
  let earliest: string | null = null;
  for (const u of usages) {
    if (!u.startDate) continue;
    if (!earliest || u.startDate < earliest) earliest = u.startDate;
  }
  return earliest;
}
