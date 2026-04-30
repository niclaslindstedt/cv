import type { StackItem } from "../data/cv.types";

export type StackEntry = { name: string; unused: boolean };

export function toStackEntry(item: StackItem): StackEntry {
  return typeof item === "string"
    ? { name: item, unused: false }
    : { name: item.name, unused: item.unused === true };
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
