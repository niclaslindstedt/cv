import raw from "./cv.json";

import type { CV } from "./cv.types";

// `cv.json` on disk is a skeleton: top-level keys whose value is the
// literal "{...}" sentinel are expanded from src/data/cv/<key>.json by
// the `cv-assembly` Vite plugin (see vite.config.ts). The cast reflects
// the assembled shape that consumers see at runtime.
export const cv = raw as unknown as CV;
export default cv;
