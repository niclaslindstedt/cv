import type { SkillUsageItem, StackItem } from "../data/cv.types";

export type StackEntry = { name: string; unused: boolean; ratio: number };

export function toStackEntry(item: StackItem): StackEntry {
  if (typeof item === "string") return { name: item, unused: false, ratio: 1 };
  return {
    name: item.name,
    unused: item.unused === true,
    ratio: typeof item.ratio === "number" ? item.ratio : 1,
  };
}

export function stackEntries(items: StackItem[] | undefined): StackEntry[] {
  return (items ?? []).map(toStackEntry);
}

export function stackNames(items: StackItem[] | undefined): string[] {
  return stackEntries(items).map((e) => e.name);
}

export function usedStackNames(items: StackItem[] | undefined): string[] {
  return stackEntries(items)
    .filter((e) => !e.unused)
    .map((e) => e.name);
}

// Skill arrays accept either bare strings or `{ name, ratio? }` objects.
// Components rendering skill chips don't care about the ratio — they
// need a name. The skill-rating script needs both. These helpers
// extract whichever the caller wants.
export function skillName(item: SkillUsageItem): string {
  return typeof item === "string" ? item : item.name;
}

export function skillNames(items: SkillUsageItem[] | undefined): string[] {
  return (items ?? []).map(skillName);
}
