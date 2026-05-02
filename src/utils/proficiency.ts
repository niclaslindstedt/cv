import type { LanguageProficiency } from "../data/cv.types";

// The proficiency rungs in ascending order — Basic at the bottom of the
// power bar, Native at the top. The numeric step (1..5) is what the
// list-item dot indicator and modal power bar fill against.
export const PROFICIENCY_LEVELS: LanguageProficiency[] = [
  "basic",
  "conversational",
  "working",
  "professional",
  "native",
];

export const PROFICIENCY_MAX = PROFICIENCY_LEVELS.length;

export function proficiencyStep(value: LanguageProficiency): number {
  return PROFICIENCY_LEVELS.indexOf(value) + 1;
}
