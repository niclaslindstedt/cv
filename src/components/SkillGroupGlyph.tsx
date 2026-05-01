type SkillGroupKey =
  | "ai"
  | "languages"
  | "frameworks"
  | "cloud"
  | "databases"
  | "devops"
  | "practices"
  | "leadership"
  | "compliance";

type Props = {
  group: string;
  size?: number;
};

export function SkillGroupGlyph({ group, size = 16 }: Props) {
  const paths = renderPaths(group);
  if (!paths) return null;
  return (
    <svg
      className="skill-group-glyph"
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
      {paths}
    </svg>
  );
}

function renderPaths(group: string) {
  switch (group as SkillGroupKey) {
    case "ai":
      return (
        <>
          <path d="M12 3 L13.2 10.8 L21 12 L13.2 13.2 L12 21 L10.8 13.2 L3 12 L10.8 10.8 Z" />
          <path d="M19 4.5 L19.5 6.5 L21.5 7 L19.5 7.5 L19 9.5 L18.5 7.5 L16.5 7 L18.5 6.5 Z" />
        </>
      );
    case "languages":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 10 L10 12 L7 14" />
          <path d="M12 14 H17" />
        </>
      );
    case "frameworks":
      return (
        <>
          <path d="M12 3 L21 7.5 L12 12 L3 7.5 Z" />
          <path d="M3 12 L12 16.5 L21 12" />
          <path d="M3 16.5 L12 21 L21 16.5" />
        </>
      );
    case "cloud":
      return (
        <path d="M7 18 a4 4 0 0 1 -0.5 -7.95 a5 5 0 0 1 9.5 -1.5 A4 4 0 0 1 18 18 H7 Z" />
      );
    case "databases":
      return (
        <>
          <ellipse cx="12" cy="5.5" rx="8" ry="2.5" />
          <path d="M4 5.5 V18.5 c0 1.4 3.6 2.5 8 2.5 s8-1.1 8-2.5 V5.5" />
          <path d="M4 12 c0 1.4 3.6 2.5 8 2.5 s8-1.1 8-2.5" />
        </>
      );
    case "devops":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" />
        </>
      );
    case "practices":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5 L13 13 L8.5 15.5 L11 11 Z" />
        </>
      );
    case "leadership":
      return (
        <>
          <path d="M5 21 V3" />
          <path d="M5 3 H18 L15 7.5 L18 12 H5" />
        </>
      );
    case "compliance":
      return (
        <>
          <path d="M12 3 L20 6 V12 c0 5 -4 8 -8 9 -4 -1 -8 -4 -8 -9 V6 Z" />
          <path d="M9 12 L11 14 L15 10" />
        </>
      );
    default:
      return null;
  }
}
