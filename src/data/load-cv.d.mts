import type { CV } from "./cv.types";

export const CV_PLACEHOLDER: "{...}";

export function loadCv(rootPath?: string): CV;

export function loadCvWithParts(rootPath?: string): {
  cv: CV;
  parts: string[];
  overridePath: string | null;
};
