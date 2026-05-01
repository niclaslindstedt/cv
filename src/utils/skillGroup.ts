import type { CSSProperties } from "react";

import type { SkillGroup } from "../data/cv.types";

// Per-group colour assignments for the Skills section. Mirrors
// docs/DESIGN.md §10.6.
const GROUP_RGB: Record<string, string> = {
  ai: "var(--tl-pink)",
  languages: "var(--tl-blue)",
  frameworks: "var(--tl-violet)",
  cloud: "var(--tl-cyan)",
  databases: "var(--tl-mint)",
  devops: "var(--tl-amber)",
  practices: "var(--tl-green)",
  leadership: "var(--tl-coral)",
  compliance: "var(--tl-steel)",
};

const GROUP_FG: Record<string, string> = {
  ai: "var(--tl-pink-fg)",
  languages: "var(--tl-blue-fg)",
  frameworks: "var(--tl-violet-fg)",
  cloud: "var(--tl-cyan-fg)",
  databases: "var(--tl-mint-fg)",
  devops: "var(--tl-amber-fg)",
  practices: "var(--tl-green-fg)",
  leadership: "var(--tl-coral-fg)",
  compliance: "var(--tl-steel-fg)",
};

export function skillGroupStyle(key: string): CSSProperties | undefined {
  const rgb = GROUP_RGB[key];
  const fg = GROUP_FG[key];
  if (!rgb) return undefined;
  return {
    "--cat-rgb": rgb,
    "--cat-fg": fg ?? rgb,
  } as CSSProperties;
}

export function findSkillGroupKey(
  groups: SkillGroup[],
  skill: string,
): string | undefined {
  for (const group of groups) {
    if (group.items.includes(skill)) return group.key;
  }
  return undefined;
}
