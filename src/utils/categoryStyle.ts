import type { CSSProperties } from "react";

// The four scrolled-section categories (Experience, Side projects, Education,
// Courses). The names mirror the Timeline palette (§10.3) and the card glyph
// bar (§10.5) so the same Sapphire / Iris / Mint / Ember language reads the
// same in every surface that opts into a category.
export type ModalCategory = "experience" | "project" | "education" | "course";

// Section-title-only categories — Focus, Skills, Languages don't carry
// card-glyph bars or category-tinted modal headers, but their section
// eyebrow gets a coloured glyph so the page's section list reads as a
// labelled index rather than a stack of grey headings. Kept distinct
// from `ModalCategory` so the §10.5 four-category language is not
// diluted on card surfaces.
export type SectionTitleCategory =
  | ModalCategory
  | "focus"
  | "skills"
  | "languages";

const CATEGORY_RGB: Record<SectionTitleCategory, string> = {
  experience: "var(--tl-blue)",
  project: "var(--tl-violet)",
  education: "var(--tl-mint)",
  course: "var(--tl-amber)",
  focus: "var(--accent-rgb)",
  skills: "var(--tl-pink)",
  languages: "var(--tl-cyan)",
};

const CATEGORY_FG: Record<SectionTitleCategory, string> = {
  experience: "var(--tl-blue-fg)",
  project: "var(--tl-violet-fg)",
  education: "var(--tl-mint-fg)",
  course: "var(--tl-amber-fg)",
  focus: "var(--accent-rgb)",
  skills: "var(--tl-pink-fg)",
  languages: "var(--tl-cyan-fg)",
};

// Inline-style helper that exposes the chosen category as `--cat-rgb` /
// `--cat-fg` custom properties on the element. CSS downstream consumes those
// vars via `rgba(var(--cat-rgb), a)` (tints, borders) and `rgb(var(--cat-fg))`
// (glyph stroke, accent text). Returning a CSSProperties cast keeps the
// custom-property keys past the React typings.
export function categoryStyle(category: SectionTitleCategory): CSSProperties {
  return {
    "--cat-rgb": CATEGORY_RGB[category],
    "--cat-fg": CATEGORY_FG[category],
  } as CSSProperties;
}
