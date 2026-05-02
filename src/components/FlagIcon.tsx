import type { LanguageCode } from "../data/cv.types";

type Props = {
  code: LanguageCode;
  size?: number;
};

// Small SVG flag glyph used inside the Languages list and modal. Each flag
// is clipped to a soft-corner rectangle so it sits next to the language
// name as a chip rather than a billboard. The viewBox is the flag's own
// canonical aspect (60×30 for the Union Jack; 16×10 for the Swedish
// cross), and the wrapper sets a fixed width/height so the chip stays
// aligned regardless of source ratio.
export function FlagIcon({ code, size = 16 }: Props) {
  const width = size * 1.5;
  const height = size;
  switch (code) {
    case "sv":
      return (
        <svg
          className="flag-icon"
          viewBox="0 0 16 10"
          width={width}
          height={height}
          aria-hidden="true"
          role="img"
          preserveAspectRatio="xMidYMid slice"
        >
          <clipPath id="flag-icon-sv-clip">
            <rect width="16" height="10" rx="1.4" />
          </clipPath>
          <g clipPath="url(#flag-icon-sv-clip)">
            <rect width="16" height="10" fill="#006AA7" />
            <rect x="5" width="2" height="10" fill="#FECC00" />
            <rect y="4" width="16" height="2" fill="#FECC00" />
          </g>
        </svg>
      );
    case "en":
      return (
        <svg
          className="flag-icon"
          viewBox="0 0 60 30"
          width={width}
          height={height}
          aria-hidden="true"
          role="img"
          preserveAspectRatio="xMidYMid slice"
        >
          <clipPath id="flag-icon-en-clip">
            <rect width="60" height="30" rx="3" />
          </clipPath>
          <g clipPath="url(#flag-icon-en-clip)">
            <rect width="60" height="30" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path
              d="M0,0 L60,30 M60,0 L0,30"
              stroke="#C8102E"
              strokeWidth="2"
              clipPath="url(#flag-icon-en-clip)"
            />
            <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );
  }
}
