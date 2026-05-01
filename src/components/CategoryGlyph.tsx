type Category = "experience" | "project" | "education" | "course";

type Props = {
  category: Category;
  size?: number;
};

// Outlined SVG glyphs at the canonical 24x24 viewBox per docs/DESIGN.md §7.1.
// Stroke uses currentColor so the parent controls Aurora vs category tinting.
export function CategoryGlyph({ category, size = 18 }: Props) {
  return (
    <svg
      className="category-glyph"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      {renderPaths(category)}
    </svg>
  );
}

function renderPaths(category: Category) {
  switch (category) {
    case "experience":
      // Briefcase — handle on top, latch on the front.
      return (
        <>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M3 13h18" />
        </>
      );
    case "project":
      // Code brackets with a center divider — </>.
      return (
        <>
          <path d="M9 7l-5 5 5 5" />
          <path d="M15 7l5 5-5 5" />
          <path d="M13.5 5l-3 14" />
        </>
      );
    case "education":
      // Mortarboard / graduation cap.
      return (
        <>
          <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5z" />
          <path d="M6.5 11.5v4c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4" />
          <path d="M21.5 9.5v5" />
        </>
      );
    case "course":
      // Open book.
      return (
        <>
          <path d="M3 5h6a3 3 0 0 1 3 3v11a2.5 2.5 0 0 0-2.5-2.5H3z" />
          <path d="M21 5h-6a3 3 0 0 0-3 3v11a2.5 2.5 0 0 1 2.5-2.5H21z" />
        </>
      );
  }
}
