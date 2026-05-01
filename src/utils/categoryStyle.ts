import type { CSSProperties } from "react";

// The four scrolled-section categories (Experience, Side projects, Education,
// Courses). The names mirror the Timeline palette (§10.3) and the card glyph
// bar (§10.5) so the same Sapphire / Iris / Mint / Ember language reads the
// same in every surface that opts into a category.
export type ModalCategory = "experience" | "project" | "education" | "course";

const CATEGORY_RGB: Record<ModalCategory, string> = {
  experience: "var(--tl-blue)",
  project: "var(--tl-violet)",
  education: "var(--tl-mint)",
  course: "var(--tl-amber)",
};

const CATEGORY_FG: Record<ModalCategory, string> = {
  experience: "var(--tl-blue-fg)",
  project: "var(--tl-violet-fg)",
  education: "var(--tl-mint-fg)",
  course: "var(--tl-amber-fg)",
};

// Inline-style helper that exposes the chosen category as `--cat-rgb` /
// `--cat-fg` custom properties on the element. CSS downstream consumes those
// vars via `rgba(var(--cat-rgb), a)` (tints, borders) and `rgb(var(--cat-fg))`
// (glyph stroke, accent text). Returning a CSSProperties cast keeps the
// custom-property keys past the React typings.
export function categoryStyle(category: ModalCategory): CSSProperties {
  return {
    "--cat-rgb": CATEGORY_RGB[category],
    "--cat-fg": CATEGORY_FG[category],
  } as CSSProperties;
}
