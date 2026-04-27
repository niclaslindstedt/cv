# Design

This document is the source of truth for the visual design of
`niclaslindstedt.se`. Every visual change — tokens, components,
spacing, type, motion — must conform to it. If a needed pattern is not
described here, **update this document in the same PR** that
introduces it.

The site's aesthetic is **calm, dense, and slightly celestial**: a
night sky in dark mode, a bright monochrome lab in light mode, with
content floating on translucent glass surfaces. It should read like a
CV, not a dashboard.

---

## 1. Principles

1. **Information first.** The page is a CV. Visual flourishes never
   get in the way of scanning.
2. **One way to do one thing.** Every recurring pattern (pill, badge,
   button, link) has one canonical form. Variants exist only when
   semantically distinct.
3. **The sky is the substrate.** All cards sit on glass over a
   gradient sky + stars (dark) or clouds + chrome orb (light). Glass
   means `--glass-bg` + `backdrop-filter`. Anything that punches a
   fully opaque rectangle on top of glass is a bug.
4. **Light and dark are equals.** No feature is dark-mode-only or
   light-mode-only unless it's literally the orb or stars. Every token
   has a light + dark pair.
5. **Motion is feedback, not decoration.** Hover/focus uses `120ms
ease`. Layout never animates. Reduced motion is honored.
6. **Nothing breaks on a 320px-wide phone.** All wrapping is
   deliberate; no orphans, no sideways scroll, no clipped buttons.

---

## 2. Tokens (CSS custom properties)

Defined in `src/styles/tokens.css` `:root` (dark) and
`:root[data-theme="light"]`. Never hard-code hex outside these blocks;
always reach for the token. If a token does not exist for what you
need, add it here first.

### 2.1 Color

| Token               | Dark                         | Light                            | Meaning                                              |
| ------------------- | ---------------------------- | -------------------------------- | ---------------------------------------------------- |
| `--bg`              | `#050810`                    | `#ebeef3`                        | Page background fill behind the sky.                 |
| `--bg-elev`         | `#0c1322`                    | `#f6f8fb`                        | Solid surface (modals, print). Avoid on glass cards. |
| `--glass-bg`        | `rgba(14,20,32,0.42)`        | `rgba(255,255,255,0.58)`         | Translucent surface for every content card.          |
| `--glass-border`    | `rgba(255,255,255,0.07)`     | `rgba(20,28,40,0.07)`            | Hairline border on glass.                            |
| `--glass-highlight` | `rgba(255,255,255,0.04)`     | `rgba(255,255,255,0.65)`         | Inner pill/chip fill on glass.                       |
| `--overlay`         | `rgba(8,10,13,0.72)`         | `rgba(240,243,247,0.72)`         | Timeline modal backdrop (heavier dim).               |
| `--modal-overlay`   | `rgba(8,10,13,0.18)`         | `rgba(240,243,247,0.18)`         | Standard modal backdrop (frosted, see-through).      |
| `--accent`          | `#7ab7ff`                    | `#1c2230`                        | Interactive color: links, buttons, focus, key data.  |
| `--accent-soft`     | `rgba(122,183,255,0.12)`     | `rgba(28,34,48,0.08)`            | Quiet accent fill: pill backgrounds, hover states.   |
| `--fg`              | `#e6e9ef`                    | `#11161e`                        | Primary text.                                        |
| `--fg-muted`        | `#8a93a1`                    | `#4b5462`                        | Secondary text and metadata.                         |
| `--border`          | `#1d2533`                    | `#c7cfd9`                        | Solid borders on solid surfaces.                     |
| `--shadow`          | `0 12px 40px rgba(0,0,0,.5)` | `0 12px 40px rgba(11,13,16,.12)` | Floating-surface shadow.                             |

### 2.2 Sky and celestial

`--sky-top`, `--sky-mid`, `--sky-bottom` (gradient stops),
`--sky-glow-1`, `--sky-glow-2` (radial glow alphas), `--orb-color`,
`--orb-color-soft` (orb/moon). These are tuned together — change one,
re-test both themes.

The light theme uses a **cool monochrome palette**: pearl/silver glows
on a near-white slate, deep graphite (`#1c2230`) as the accent, and a
chrome orb in place of a sun. No warm hues (no yellow, no orange) and
no chromatic accents — emphasis comes from value contrast and
typographic weight.

The light sky is layered: a single focal **chrome orb** (top centre,
the sun replacement), a drifting cloud field of ~5 blobs, and an
**ambient orb field** of ~6 secondary orbs at varying sizes (small to
large), heavily feathered, and very low alpha (~0.13–0.20). Ambient
orbs are decorative atmosphere only — they should never read as
objects, only as soft luminance variation. Don't add chromatic tint;
reach for the silver/pearl gradient already used by `.ambient-orb`.

**Don't use `filter: blur(...)` on clouds, ambient orbs, or focal-orb
layers.** The "blurred blob" look is achieved with extended
`radial-gradient` stops on `.cloud`, `.ambient-orb`, `.orb-halo`, and
`.orb-body` — a single cached paint per element. Stacking many
runtime `filter: blur` layers underneath the page's `backdrop-filter`
glass cards crashes the iOS Safari compositor during scroll (cards
paint blank). Keep the field deliberately small: more elements means
more overdraw against every glass card on screen. `.celestial-sky`
itself is a composite layer (`isolation: isolate; transform:
translateZ(0)`) so its drift animations don't invalidate
`backdrop-filter` reads above it.

### 2.3 Geometry

| Token         | Value   | Notes                                      |
| ------------- | ------- | ------------------------------------------ |
| `--radius`    | `10px`  | All cards, buttons, panels.                |
| `--max-width` | `860px` | Hard upper bound for content column.       |
| Pill radius   | `999px` | Used directly, no token (it's a constant). |

### 2.4 Spacing scale

Use multiples of **4**: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48`.
Anything else is a smell — either round to scale or extract a token.

### 2.5 Typography

| Use                                   | Family      | Size                             | Weight |
| ------------------------------------- | ----------- | -------------------------------- | ------ |
| Body                                  | system sans | `1rem`                           | 400    |
| Hero name                             | system sans | `clamp(2rem,5vw,3rem)`           | 700    |
| Hero summary                          | system sans | `1.1rem`                         | 400    |
| Section eyebrow (uppercase)           | system sans | `0.75–0.9rem`, `0.04em` tracking | 500    |
| Card title (`h3`)                     | system sans | `1rem–1.15rem`                   | 600    |
| Project name, course code, code chips | mono        | `0.8rem–1.15rem`                 | 500    |
| Metadata, dates                       | system sans | `0.85–0.95rem`                   | 400    |

The mono family is reserved for _identifiers_ (project names, course
codes, technology tags). Never use mono for paragraph copy.

### 2.6 Motion

- Hover/focus transitions: `120ms ease` on `color`, `background`,
  `border-color`, `transform`. Never on `width`, `height`, `padding`.
- Long-form ambient motion (cloud drift, star twinkle) lives in
  `CelestialSky`. Don't add ambient motion to content.
- Honor `prefers-reduced-motion`: disable ambient motion, keep
  120ms transitions (they're functional).

---

## 3. Surfaces

Three tiers, used in this order:

1. **Sky** — the page itself: `--bg` + `<CelestialSky>` (stars or
   clouds). Nothing else.
2. **Glass card** — every content container (Hero, Focus item,
   Project, Experience, Education, Skills group, modal panels):
   ```css
   background: var(--glass-bg);
   backdrop-filter: blur(14px) saturate(150%);
   -webkit-backdrop-filter: blur(14px) saturate(150%);
   border: 1px solid var(--glass-border);
   border-radius: var(--radius);
   ```
   Modals use `blur(18px) saturate(160%)` for slightly stronger
   separation from the page beneath them.
3. **Inner chip / pill** on a glass card — use `--glass-highlight` (a
   very thin white wash) or `--accent-soft`. **Never `--bg-elev`** on
   a glass card; it punches an opaque rectangle and breaks the glass
   illusion.

The mobile UA chrome (iOS Safari status bar) is treated as part of
the sky: `index.html` sets a `theme-color` meta tag matching
`--sky-top` (`#02030a` dark, `#d2d8e1` light), updated on theme
toggle by `useTheme`. Keep the two values in sync with `--sky-top`
when you re-tune the sky.

### 3.1 Translucency rule

If you can't see the sky bleed through a card on the dark theme home
page, the alpha is too high. The reference values
(`rgba(14,20,32,0.42)` dark, `rgba(255,255,255,0.58)` light) are
calibrated against the current sky-glow + 16-star starfield. If you
change the sky brightness, re-tune `--glass-bg` to keep the same
"barely-translucent" feel.

---

## 4. Components

### 4.1 Pill

A rounded rectangle (`border-radius: 999px`) with subtle border, used
for **quantitative metadata**: ECTS counts, course counts, commit
counts, percentages, course codes, tech tags on cards.

- Tech tag (skill on a card): `--glass-highlight` fill, `--border`
  outline, `--font-mono`, `0.8rem`.
- Accent pill (ECTS, course count, percentage, language toggle):
  `--accent-soft` fill, `--accent` text.

### 4.2 Badge

A small filled label that conveys **state**:

- `OPEN SOURCE` → accent fill (`--accent-soft` + `--accent` text),
  uppercase, mono, `0.7rem`. Always inline at the right of the project
  name (never wrapping below).
- `INCOMPLETE` → red fill, white text, uppercase. Only ever appears on
  course cards.
- `PRESENT` → solid `--accent` fill with `--bg` text in dark mode;
  `--fg-muted` fill with white text in light mode. Pinned to the
  top-right of `.timeline-item` and `.assignment-item` cards while the
  role/assignment is current. Uppercase, mono, `0.7rem`. The card's
  blue border + glow is the secondary "current" affordance; the badge
  is the primary one. Never use the same badge on other card families.
- `half-time` / `part-time` → accent-soft pill on Experience cards.
  These are **distinct words**, not stylistic variants:
  - "half-time" / "halvtid" = exactly 50%.
  - "part-time" / "deltid" = unspecified non-full-time fraction.
    Don't homogenize.

### 4.3 Button

There is **one** button family. All site buttons are pill-shaped with
the same border weight (`1px solid var(--accent-soft)`), accent text,
and an `--accent-soft` fill on hover. Avoid invented "primary" /
"secondary" weight tiers — emphasis comes from placement, not from
making one button thicker than another.

The exception is the close (`×`) button on modals: a 32px circle, same
border treatment, no fill.

### 4.4 Inline link

Plain text colored with `--accent`, no underline by default,
underlined on hover. **Used by default for inline references** (in-card
links).

The hero meta row is the exception: every entry in `cv.links` (Blog,
GitHub, LinkedIn, …) renders as an `--accent-soft` pill so the
primary outbound destinations all read as actions. Mark each entry
with `"featured": true` in `cv.json` to opt into the pill treatment;
unmarked entries fall back to the plain inline-link style.

### 4.5 Card

All content lives in a card (see §3, glass). Cards have:

- 16–20px internal padding.
- `--glass-border` outline.
- `--shadow` for floating panels (modals, popovers); no shadow for
  in-flow cards.
- The **hover** state (for cards that are themselves clickable, like
  Focus, Project, Education) is a single change: `border-color:
var(--accent)`. Never fill the card body with `--accent-soft` on
  hover — that fill is reserved for pill/button-shaped controls (§4.1,
  §4.3). Cards that aren't clickable as a whole (Experience, where
  only the company title opens a modal) get no card-level hover at
  all.
- The **active** state (current employer, current side project) gets
  `border-color: rgba(122,183,255,0.55)` and a 1px accent glow.
  Experience and assignment cards additionally show a `PRESENT` badge
  pinned to the top-right corner (see §4.2). Don't add other "current"
  affordances (stars, "Active" copy in body text, etc.) — the border
  - badge pair is the full vocabulary.

### 4.6 Section

Each top-level section uses `<Section>` with an uppercase tracked
eyebrow. Eyebrow color: `--fg-muted`. Always 32–48px of vertical
breathing room between sections.

Sections are **collapsible by default**. The eyebrow renders as a
button with a 12×12 chevron (`▾`) at the right of the title. Clicking
toggles visibility of the section body; the chevron rotates `-90°` to
`▸` when collapsed. The chevron is `--fg-muted` at rest, `--accent` on
hover, and animates only its own `transform` and `color` (`120ms
ease`). The body is hidden via the native `hidden` attribute so layout
collapses cleanly — no height animation (motion is feedback, not
layout, per §1).

Collapsed state persists per-section in `localStorage` under
`section-collapsed:<id>`. Print styles always render every section
expanded and hide the chevron, so the printed CV is never
artificially truncated.

### 4.7 Modal

Full-bleed backdrop with `backdrop-filter: blur(20px) saturate(180%)`
over `--modal-overlay` (~18% alpha — much more translucent than the
timeline's `--overlay`) so the underlying page is visibly hinted at as
frosted glass rather than dimmed to a flat fill. The timeline's full-screen overlay keeps the heavier
`--overlay` + `blur(18px)` since it replaces, rather than floats over,
the page. Inner panel is a glass card with `blur(20px) saturate(170%)`
and the standard close button top-right. Modal content scrolls;
backdrop does not.

Swipe-to-close (touch only) drags the panel with the finger and fades
both panel and backdrop with distance. Past the threshold, the panel
animates fully past the viewport edge (translate by `viewport +
panel`) at full opacity while the backdrop fades — no mid-flight
disappearance.

### 4.8 Empty state

When a list is empty (e.g., a skill chip with zero usages), keep the
component visible but dimmed (`.skill-pill-empty`, `opacity ~0.55`)
**and** add a `title` + `aria-label` explaining why ("No entries
yet"). Never silently render a broken-looking control.

---

## 5. Patterns

### 5.1 Wrapping

Inline metadata that uses `·` separators (institution · level ·
credits · count) must never wrap with a leading `·` on a new line.
Wrap each _segment that includes its own preceding separator_ in a
`<span>` with `white-space: nowrap`. See
`.education-meta-trail` in `src/styles/education.css` for the pattern.

### 5.2 Promotion arrow (`↑`) and role chain

A job (top-level Experience entry) and an assignment (consultancy
client engagement) each represent **one continuous tenure**. Internal
promotions or title changes do not break that continuity — they live
inside a single card as a `roles[]` array on the parent.

The arrow is a 14×14 SVG in `--accent`. It appears on the card
heading whenever the parent has more than one role (i.e. the most
recent title was reached via promotion), and again on every role row
in the chain except the original starting role at the bottom.

Alignment follows the icon-in-text rule (§5.6): inline in card
headings via `vertical-align: middle` plus a 1px upward optical
nudge; in the role chain (a grid row with possibly wrapping content)
via `align-items: start` on the row + an explicit `margin-top` on the
icon equal to `(line-height − icon-height) ÷ 2` so the icon centers
with the **first** text line, not the wrapped block.

**Role chain.** When `roles.length > 1`, the card renders a
`<ol class="role-chain">` directly after the date row. Rows are
listed reverse-chronologically (newest at the top). Each row is one
line:

```
[↑] {title} · {start — end}
[○] {title} · {start — end}   ← original starting role
```

The bottom row (the original starting title) shows a 14×14 hollow
circle (`.role-start-icon`) in `--accent` at 0.7 opacity, signalling
"start of the progression" so the column reads as a chain anchored
at an origin rather than a series of arrows trailing into blank
space. The chain sits inside a 1px accent left border that visually
anchors the progression. Type scale matches the timeline metadata
(`0.9rem`/`0.85rem`); titles in the chain use `--font-mono` like the
heading role.

The card's outer heading (`h3` on Experience, `h4` on Assignment) is
the **anchor**: it always displays the most recent title plus the
company/client name, and carries the arrow when the parent has more
than one role.

### 5.3 Active employer / project glow

A card with `endDate === null` (currently active) gets the
`is-active` class, which paints a slightly brighter
`rgba(122,183,255,0.55)` border and a 1px outer glow. No other
"current" badge is needed.

### 5.4 Clickable hero summary

The hero summary (`.hero-summary`) doubles as a button that opens a
modal containing `cv.longSummary` — a longer narrative of the CV. The
short summary still stands on its own as the headline; the modal is a
"read more" affordance, not a substitute.

- The control is a `<button>`, not a wrapping `<a>` — it opens an
  in-page modal, not a route.
- Hover affordance is a 1px dashed `--accent-soft` underline on the
  paragraph plus a `Read more →` / `Läs mer →` hint rendered inline at
  the end of the line in `--accent` (`0.85rem`, weight 500). The hint
  is decorative (`aria-hidden`); the button's accessible name comes
  from `aria-label`.
- The modal is the standard glass modal from §4.7, with the author's
  name as the title and the localized `cv.title` as the accent pill —
  matching the tagline pill on `ProjectModal`.
- Print collapses the control to plain text: no underline, no hint,
  no cursor. The long form is intentionally _not_ inlined into the
  printed CV — print stays scoped to the short summary.

### 5.5 Code-style display

Project names, course codes, and technology tags use `--font-mono`.
This is the visual cue for "this is an identifier, not a sentence."

### 5.6 Icon-in-text alignment

Small inline SVG icons (the promotion arrow, role-start circle, note
icon, terminated icon, etc.) must read as visually centered with the
text they sit beside. Two cases:

1. **Inline next to text** (a heading, a paragraph, a button label):
   use `vertical-align: middle` on the SVG. Add `transform:
translateY(-1px)` for an optical nudge upward — the geometric
   centerline (baseline + half-x-height) sits slightly below the eye's
   text-center for most fonts, and 1px corrects it. **Don't** use
   bespoke `vertical-align: -2px` / `-3px` magic numbers; they don't
   scale with the surrounding font-size.

2. **Inside a flex/grid row whose other cell can wrap to multiple
   lines** (e.g. the role chain): `align-items: baseline` falls back
   to the SVG's bottom edge (SVG has no real text baseline), so the
   icon sits high; `align-items: center` centers with the wrapped
   block, drifting the icon below the first line. Use `align-items:
start` and give the row an explicit `line-height`, then offset the
   icon with `margin-top` equal to `(line-height − icon-height) / 2 +
   1px` (the geometric centerline plus the same 1px optical nudge as
   case 1). This keeps the icon centered with the **first line only**,
   regardless of how the rest wraps.

The arrow's viewBox geometry is centered (visual center at viewBox
12,12), so both rules above produce the expected optical center
without further adjustment.

### 5.7 Timeline promotion markers

A bar with multiple roles (e.g. `Senior Consultant → Manager → Senior
Manager`) needs to convey both the order of titles **and** when each
promotion took effect. Each role in `exp.roles` (and `assignment.roles`)
is emitted as an entry on the bar's `roles` array in `timeline.json`,
and the renderer splits the bar into per-role text segments anchored
to each role's `startDate`.

- Each segment is absolutely positioned within the bar at its
  time-slice (left/width as percentages of the bar span) and uses
  `overflow: hidden` with `text-overflow: clip` so role titles get
  cut cleanly when the segment is too narrow (mobile, low zoom).
- Between segments, a 1px vertical line marks the promotion date.
  The line spans the bar's interior with a 4px inset top and bottom
  so it reads as an internal divider, not a track gridline. Color
  matches the bar's accent (blue for jobs, green for assignments)
  at 0.55 opacity.
- Each promoted segment is prefixed with a `→` glyph in
  `--fg-muted` to make the chain readable as
  `Role | → Role 2 | → Role 3`.
- The first segment carries the bar's subtitle (company name)
  beneath the role title; subsequent segments show only the role
  title, since the company is the same across the entire bar.
- Segment labels are top-aligned (`align-items: flex-start`) with
  the same `10px` top padding as a single-role bar's content, so
  the first line (the role title) sits on the same baseline across
  every segment regardless of whether the segment also carries the
  subtitle on a second line.
- Markers and the arrow are decorative (`aria-hidden`); the
  screen-reader story is covered by the bar's accessible `title`
  tooltip (full title and date range). The marker's native `title`
  tooltip names the promoted role and date for sighted hover.
- `pointer-events: none` on the markers keeps the entire bar a
  single click target.

A bar with one role has no `roles` field and renders the original
single-label layout (centered title + subtitle). Other timeline
kinds (education, course, side project, github) never have a
`roles` field.

**Details modal — multi-role layout.** When the selected bar has
more than one role, the modal replaces the arrow-joined title
(`Role A → Role B → Role C`) with a per-role interval list:

- The heading becomes the company name (the bar's subtitle), and
  the redundant subtitle line is hidden so the company is not
  repeated.
- The overall date range and total duration stay on the dates row.
- A `<ul class="timeline-vis-details-roles">` follows the dates row.
  Each role is rendered as a left-bordered card matching the
  `--accent-soft` style of the notes block (without the icon),
  with the role title in the body type and the role's own date
  range plus duration on a mono meta line.
- Each role's "end" date is the calendar month immediately before
  the next role's `startDate`; the last role inherits the bar's
  end date (or "Present" if the bar is ongoing). Durations are
  computed identically to the bar-level duration so they sum to
  the total.

### 5.8 Project date chip

Side-project commit ranges are derived automatically from GitHub
(`firstCommitDate` / `lastCommitDate` in `project-stats.json`). The
day-precision is meaningful — it shows when a repo was actually
touched — but rendering "March 15, 2024 – December 28, 2025" inline
adds clutter to the project meta row. Each end of the range therefore
renders as a `.project-date` chip:

- The chip is a `<button type="button">` so it is keyboard-focusable
  and tap-focusable on touch devices.
- Resting state: month + year only (`Mar 2024`), reusing the existing
  `formatMonth` output.
- Hover, focus, and focus-visible all reveal:
  - a soft `--accent-soft` background and dashed `--glass-border`
    pill outline on the chip itself, and
  - a small mono-font tooltip below the chip showing the full
    localized date (`March 15, 2024` / `15 mars 2024`), positioned
    via `::after { content: attr(data-full) }`.
- Mobile press is covered by the `:focus` rule — tapping the chip
  focuses it and pins the tooltip until the user taps elsewhere.
- The accessible name is the full date (`aria-label`); the tooltip
  itself is decorative because the chip already announces it.
- Used in two places with identical semantics: `ProjectModal`'s
  Active row, and `Timeline`'s side-project details panel.

### 5.9 Floating controls bar

The Timeline button, language toggle, and theme toggle live in the
hero meta row by default. Once the user scrolls past the hero (the
`.hero-meta` row leaves the viewport), an `IntersectionObserver` mirrors
those three controls into a fixed glass pill at `top: 16px; right:
16px`. The bar fades in with a soft `280ms ease-out` on `opacity` and
`transform` (translateY) — slower than the standard `120ms` because
this is a panel reveal, not hover feedback. It is hidden via `opacity`

- `visibility` so it stays out of the tab order when not visible. It
  uses the standard glass surface (`--glass-bg`, `backdrop-filter`,
  `--glass-border`, `--shadow`). The shared button definitions live in
  `src/components/Controls.tsx`; the floating bar (`FloatingControls.tsx`)
  reuses them so the in-hero and floating instances always stay in sync.
  The Timeline button uses its `iconOnly` mode in the floating bar — the
  three-dot timeline glyph alone, in a 32px circle (28px on narrow
  viewports) — so the bar stays compact while the in-hero variant keeps
  its label. Hidden in print.

---

## 6. Print

The print stylesheet (in `src/styles/print.css`) flattens everything:

- All translucent tokens collapse to opaque white.
- Sky, stars, clouds, hover states are removed.
- Cards lose `box-shadow` and gain a hairline `--border`.

If you add a new color or surface, also add its print fallback in the
`@media print` block.

### 6.1 Print settings

Print is driven by a structured settings block at `cv.print` (sourced
from `src/data/cv/print.json`). `PrintView` injects an inline `<style>`
that emits the `@page` rule and binds CSS custom properties on
`.print-view`; `src/styles/print.css` consumes those variables and
provides fallbacks so the stylesheet stays valid in isolation.

The contract:

- **Font** — `fontFamily` is a CSS font-family stack used for the entire
  print body. The default is a Garamond-first serif stack (`"EB
Garamond", Garamond, "Adobe Garamond Pro", "Apple Garamond", Georgia,
serif`). `headingFontFamily` is a separate stack applied to every
  print heading (name, title, section titles, entry titles, sub-headings)
  via `--print-heading-font-family`; the default pairs an Inter-first
  sans-serif with the Garamond body for editorial contrast. `fontSize`
  is the body size; `lineHeight` is unitless.
- **Page** — `page.size` and `page.margin` map to the `@page` descriptor
  (`size: A4; margin: 2cm 1.8cm;` by default).
- **Spacing** — five tokens (`section`, `entry`, `subEntry`, `paragraph`,
  `headerToBody`) drive vertical rhythm between blocks. Use these
  instead of hard-coded margins for new print elements.
- **Headings** — six tokens for the heading hierarchy (`name`, `title`,
  `section`, `entry`, `subEntry`, `subHeading`).
- **Page breaks** — `orphans`/`widows` set line minima; the boolean
  toggles (`avoidInsideEntry`, `avoidInsideSubEntry`,
  `keepHeadingWithNext`) default to true and emit `break-inside: auto !important`
  overrides when set to false.
- **Notes** — `includeNotes` (boolean) controls whether per-entry
  `notes` (on experience, assignments, education) are rendered in the
  printed/PDF CV. Default is `true`; set to `false` to omit notes from
  print output entirely.

When you add a new print block: declare its sizing/spacing in
`print.css` using the existing `--print-*` variables, not literal `pt`
values.

---

## 7. Accessibility

- All interactive controls have a visible `:focus-visible` outline of
  `2px solid var(--accent)` with `2px` offset.
- All icon-only buttons have `aria-label` and `title`.
- Color is never the _only_ signal: state (active, incomplete, empty)
  is also expressed in text or shape.
- Contrast: body text vs. `--glass-bg` over the darkest sky region
  must clear WCAG AA (4.5:1). Re-check after any token change.

---

## 8. Process

1. **Before any visual change**, read the relevant section of this
   doc.
2. **If the change introduces a new pattern not described here**,
   update this doc _first_ in the same PR.
3. **PR description** should reference the section(s) of this doc the
   change conforms to (e.g. _"Conforms to §4.1 Pill, §3 Surfaces."_).
4. Re-screenshot the affected section on iPhone width in both themes
   before merging.

---

## 9. File map

| File                                                                      | What it owns                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles.css`                                                          | Thin `@import` aggregator for `src/styles/*.css`.                                                                                                                                                                                                                               |
| `src/styles/`                                                             | Per-domain partials: `tokens.css` (CSS variables), `base.css`, `sky.css`, `layout.css`, `hero.css`, `section.css`, `focus.css`, `languages.css`, `projects.css`, `experience.css`, `education.css`, `skills.css`, `toggles.css`, `timeline-vis.css`, `modals.css`, `print.css`. |
| `src/components/CelestialSky.tsx`                                         | Sky, stars, clouds, orb.                                                                                                                                                                                                                                                        |
| `src/components/Hero.tsx`                                                 | Header, hero buttons, language and theme toggles.                                                                                                                                                                                                                               |
| `src/components/Section.tsx`                                              | Section wrapper with eyebrow.                                                                                                                                                                                                                                                   |
| `src/components/{Focus,Projects,Experience,Education,Skills,Courses}.tsx` | Content sections.                                                                                                                                                                                                                                                               |
| `src/components/Timeline.tsx`                                             | Career timeline modal.                                                                                                                                                                                                                                                          |
| `docs/DESIGN.md`                                                          | This document.                                                                                                                                                                                                                                                                  |
