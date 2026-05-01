# Design system — niclaslindstedt.se

A design profile for the personal site and CV at niclaslindstedt.se.

This document is the **source of truth** for the visual design. Every
visual change — palette, type, spacing, surface, motion, component,
pattern — is decided here first and then expressed in code. When the
doc and the code disagree, the code is wrong: run the
[`sync-design`](../.agent/skills/sync-design/SKILL.md) skill to bring
the implementation back in line.

The doc is written to stand on its own. A designer or contributor who
has never opened the codebase should be able to read it cover-to-cover
and understand the system: what the brand is, how the palette is
structured, what the components are, how to extend them.
Implementation details (CSS variable names, file paths, exact paint
values) live in the **Implementation appendix** at the end so the
body of the document is not a verbal mirror of the stylesheet.

---

## Contents

1. [Brand and voice](#1-brand-and-voice)
2. [Design principles](#2-design-principles)
3. [Colour system](#3-colour-system)
4. [Typography](#4-typography)
5. [Spacing and layout](#5-spacing-and-layout)
6. [Surfaces and elevation](#6-surfaces-and-elevation)
7. [Iconography](#7-iconography)
8. [Motion](#8-motion)
9. [Components](#9-components)
10. [Patterns](#10-patterns)
11. [Voice and microcopy](#11-voice-and-microcopy)
12. [Accessibility](#12-accessibility)
13. [Print variant](#13-print-variant)
14. [Process](#14-process)
15. [Implementation appendix](#15-implementation-appendix)

---

## 1. Brand and voice

### 1.1 Personality

The site is a personal CV — an instrument for being read carefully by
someone who already has tabs open with three other CVs. Its
personality is **calm, precise, and quietly atmospheric**. It is not
a dashboard, a portfolio reel, or a marketing page; it should never
sparkle, animate to attract attention, or compete with the words it
carries. Every visual choice serves the reading.

The aesthetic has two registers, paired at theme level:

- **Night sky** (dark theme). Deep blue-black gradient with a small,
  hand-placed starfield and a single luminous focal orb. Content
  floats on cool, faintly translucent glass. The mood is observatory:
  quiet, contemplative, late.
- **Monochrome lab** (light theme). Soft pearl gradient with a
  drifting cloud field and a chrome focal orb. Content floats on
  warm, faintly translucent glass. Accents are deep graphite rather
  than bright blue. The mood is studio: bright, even, considered.

The two themes are equals. There is no canonical theme; either
should feel finished. The brand is the _pair_, not one half.

### 1.2 What the site is not

- Not a dashboard. No KPIs framed in tiles. No charts as decoration.
- Not a marketing page. No oversized hero imagery, no parallax, no
  gradient buttons.
- Not a portfolio reel. Project covers are textual, not pictorial.
- Not a single-page-application showpiece. Routing is incidental;
  scrolling is the navigation.

### 1.3 What the site _is_

- A long-form document with consistent vertical rhythm.
- A typographic surface that earns its atmosphere by restraint.
- A reading experience that survives a 320-pixel-wide phone, a 4K
  monitor, an A4 print, and a screen reader equally well.

---

## 2. Design principles

Six principles. Every later section is downstream of these. When two
rules conflict, the earlier one wins.

1. **Information first.** The page is a CV. Visual flourishes never
   get in the way of scanning. If a treatment makes the page prettier
   but slower to read, it loses.

2. **One way to do one thing.** Each recurring element — pill, badge,
   button, link, card, modal — has exactly one canonical form.
   Variants exist only when they encode a different meaning, never
   for visual variety.

3. **The sky is the substrate.** All content sits on translucent
   glass over an atmospheric background. Anything that paints a
   fully opaque rectangle on top of glass breaks the illusion and is
   a bug.

4. **Light and dark are equals.** No feature is dark-only or
   light-only unless it is literally a celestial element (the orb,
   the stars, the clouds). Every colour token is defined twice, once
   per theme, and both must read finished.

5. **Motion is feedback, not decoration.** Hover, focus, and reveal
   transitions are short and functional. Layout never animates.
   Ambient motion lives in the celestial layer only and is dropped
   when the user prefers reduced motion.

6. **Nothing breaks at 320 pixels.** The narrowest target is a
   pre-Plus iPhone in portrait. Wrapping is deliberate; sideways
   scroll, clipped buttons, and orphan separators are all bugs.

---

## 3. Colour system

### 3.1 Naming

Tokens are named for the role they play in the system, not for their
hex value. Names are evocative rather than functional — `Aurora`, not
`Primary-500` — because the brand is built around a celestial
metaphor and the palette only makes sense inside that metaphor. The
[Implementation appendix](#151-token-map) maps each name to the
underlying CSS variable for engineers who need the literal mapping.

### 3.2 Core palette

Each token is a **theme pair**: a value for night-sky (dark) and a
value for monochrome-lab (light). Never use a hex value outside the
token table — every shade in the system has, or should have, a name.

| Token            | Role                                                                                                                         | Night-sky value         | Monochrome-lab value    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------- |
| **Nightfield**   | Page background fill behind the celestial layer.                                                                             | very dark blue-black    | pearl-grey              |
| **Slate**        | Solid opaque surface — only used where translucency would harm (modal print rendering, fallbacks, screenshot-safe surfaces). | dark navy               | near-white              |
| **Vapor**        | Glass card fill. The default content surface.                                                                                | navy at 42% alpha       | white at 58% alpha      |
| **Vapor Edge**   | Hairline border around glass.                                                                                                | white at 7% alpha       | navy at 7% alpha        |
| **Vapor Sheen**  | Inner chip / pill fill on a glass card.                                                                                      | white at 4% alpha       | white at 65% alpha      |
| **Veil**         | Standard modal backdrop. Translucent so the page reads behind.                                                               | near-black at 18% alpha | near-white at 18% alpha |
| **Aurora**       | Interactive accent. Links, buttons, focus, key data.                                                                         | luminous sky-blue       | deep graphite           |
| **Aurora Mist**  | Quiet accent fill. Pill backgrounds, hover wash.                                                                             | aurora at ~12% alpha    | graphite at ~8% alpha   |
| **Graphite**     | Primary text. Always the highest-contrast text on Vapor.                                                                     | pale ice                | deep slate              |
| **Mist**         | Secondary text and metadata. Never the only signal of state.                                                                 | cool grey               | warm grey               |
| **Hairline**     | Border on solid (non-glass) surfaces.                                                                                        | dim navy                | cool stone              |
| **Float Shadow** | Drop shadow under floating panels (modals, popovers).                                                                        | deep, low-spread        | soft, low-spread        |

### 3.3 Celestial palette

The atmosphere is built from a separate sub-palette. These tokens are
tuned together — change one and re-test the other.

| Token              | Role                                                          |
| ------------------ | ------------------------------------------------------------- |
| **Skyline Top**    | Top stop of the page-background gradient.                     |
| **Skyline Mid**    | Middle stop.                                                  |
| **Skyline Bottom** | Bottom stop.                                                  |
| **Sky Glow A / B** | Two radial-gradient atmospheres layered over the gradient.    |
| **Orb**            | Focal celestial body — the moon (dark) or chrome sun (light). |
| **Orb Soft**       | Ambient orb field — decorative atmosphere, very low alpha.    |

The light-theme celestial layer uses **only neutrals** — pearl,
silver, chrome. No warm hues, no chromatic accents. Emphasis comes
from value contrast, not colour. The dark-theme layer is allowed
cool blues and faint purples in the glow, but the focal orb stays
neutral.

### 3.4 Semantic palette

Reserved for state. Each token is a semantic flag and **always**
appears together with a textual cue (a word, a shape change). Colour
is never the sole signal of state — see §12.

| Token          | Role                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Pulse**      | "Currently active" — current employer, current side project, ongoing assignment. Rendered as a brightened Aurora border + 1px glow. |
| **Halt**       | "Incomplete" — courses started but not finished. Always paired with the word `INCOMPLETE`.                                          |
| **Sapphire**   | Timeline category: jobs.                                                                                                            |
| **Mint**       | Timeline category: education.                                                                                                       |
| **Ember**      | Timeline category: courses.                                                                                                         |
| **Iris**       | Timeline category: side projects.                                                                                                   |
| **Bloom**      | Timeline category: GitHub activity.                                                                                                 |
| **Bloom Text** | Brightened Bloom variant for legible text/links on the dark Bloom-tinted pill.                                                      |
| **Verdant**    | Timeline sub-category: assignments and assignment bars.                                                                             |

Timeline category tokens are stored as RGB triplets so they can be
combined with arbitrary alpha values inside the timeline component
(bar fill, hover ring, marker line, ramp legend).

Each chromatic timeline token also carries a paired **foreground
variant** (`--tl-blue-fg`, `--tl-mint-fg`, `--tl-amber-fg`,
`--tl-violet-fg`) used wherever the colour is rendered at full opacity
as a glyph or marker. Dark theme keeps the variant equal to the tint
triplet — the pastels read fine on Nightfield. Light theme deepens
the variant to the same hue at a lower lightness so glyphs stay
readable on the pearl-grey surface. The 16–22% alpha tint and 45%
alpha border continue to use the base triplet so card chrome stays
calibrated.

### 3.5 Usage rules

- **Reach for the closest semantic token first.** Aurora is for
  interactive surfaces; Mist is for metadata; Graphite is for body
  copy. Never use Aurora to "make something pop" — that erodes its
  meaning as the interactive colour.
- **No raw hex outside the token table.** If a needed colour does
  not exist, add it to the table here first, then implement it. The
  `Halt` red is the cautionary tale: it lived as a hardcoded
  `#c62828` for too long because it never had a name.
- **Light theme has no chromatic accent.** Aurora in light mode is
  graphite, not blue. Treating it as "the blue in light mode too" is
  a recurring mistake.
- **Aurora Mist is for fills, not borders.** Borders use Vapor Edge
  on glass and Hairline on solid surfaces. Aurora is allowed as a
  border only on hover or active states.

---

## 4. Typography

### 4.1 Type families

| Family          | Role                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Body Sans**   | All running text and headings on screen. System sans stack so the page renders without a webfont download.             |
| **Code Mono**   | Identifiers — project names, course codes, technology tags, role titles inside the role chain. System monospace stack. |
| **Print Serif** | Body type in the printed CV. Garamond-first stack for editorial calm.                                                  |
| **Print Sans**  | Headings in the printed CV. Inter-first stack for contrast against the serif body.                                     |

The mono family is reserved for things that should read as
**identifiers**, not sentences. Never set paragraph copy in mono.
Never set a project name in sans. The contrast itself is information.

### 4.2 Type scale (screen)

Six tiers. Sizes are relative (rem or clamp) so the scale stays
proportional under user font-size overrides.

| Tier         | Use                                       | Size                   | Weight  | Line-height |
| ------------ | ----------------------------------------- | ---------------------- | ------- | ----------- |
| **Display**  | Hero name only.                           | clamp(2rem, 5vw, 3rem) | 700     | 1.1         |
| **Headline** | Hero summary, modal title.                | 1.1rem                 | 400     | 1.5         |
| **Title**    | Card title (`h3`/`h4`).                   | 1.0–1.15rem            | 600     | 1.3         |
| **Body**     | Default running text in cards.            | 1.0rem                 | 400     | 1.5         |
| **Meta**     | Dates, small metadata, definition values. | 0.85–0.95rem           | 400     | 1.4         |
| **Micro**    | Section eyebrows, chip labels, badges.    | 0.7–0.85rem            | 500–600 | 1.2         |

Line-heights ladder from tight (Display 1.1) to relaxed (Body 1.5)
and back to tight (Micro 1.2). Avoid intermediate values — pick the
nearest tier rather than inventing a one-off.

### 4.3 Tracking

Tracking is used **structurally**, not decoratively.

- **Display, Title, Body, Meta** — default tracking (0).
- **Micro** in eyebrow form — `0.04em–0.12em`, uppercase. The wider
  tracking on uppercase is a pure legibility correction.
- **Code Mono** — slightly wider tracking (`0.04em`) when used at
  Micro size to compensate for monospace's tight perceived rhythm.

### 4.4 Hierarchy

Hierarchy is built from the type scale, **not** from colour. A
reader should be able to print the page in greyscale and still see
the section structure. Use weight and size first; reach for accent
colour only for genuinely interactive text.

---

## 5. Spacing and layout

### 5.1 Base unit and scale

The base unit is **4px**. Every margin, padding, and gap is a
multiple of the base unit. The scale is named, not numeric, so
changes propagate semantically:

| Step  | Value | Typical use                                                     |
| ----- | ----- | --------------------------------------------------------------- |
| `xs`  | 4px   | Inline gap inside a chip; tightest separation.                  |
| `sm`  | 8px   | Chip-to-chip gap, vertical gap between meta lines.              |
| `md`  | 12px  | Inner padding on small surfaces, gap between related items.     |
| `lg`  | 16px  | Card-to-card gap in a grid; standard inner card padding.        |
| `xl`  | 20px  | Generous card padding (default for content cards).              |
| `2xl` | 24px  | Page horizontal gutter on phone; vertical padding on pill rows. |
| `3xl` | 32px  | Inter-section breathing room minimum.                           |
| `4xl` | 48px  | Page top padding; inter-section breathing room maximum.         |

Anything outside this ladder is a smell — round to the nearest step,
or extract a new step _named_ here first.

### 5.2 Containers

| Container     | Width                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Page column   | `max-width: 860px`, centered.                                                                                  |
| Modal panel   | `max-width: 560px`.                                                                                            |
| Hero summary  | `max-width: 640px` (so the eye can sweep one line in two beats).                                               |
| Timeline page | Full viewport. Sits in normal document flow at `/timeline` so iOS Safari can keep the address bar translucent. |

### 5.3 Breakpoints

Three named tiers. There is no tablet-portrait special case — the
layout holds together fluidly between Phone and Wide.

| Tier         | Width           | What changes                                                                                                                          |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Phone**    | up to 520px     | Floating control bar collapses to icon-only; hero meta wraps; modal padding compacts; some grids drop to single column.               |
| **Wide**     | 520px and above | Default layout. Multi-column grids appear (focus list, skills group).                                                                 |
| **Timeline** | up to 640px     | Timeline-page-only band: the track-label sidebar collapses to an icon-only column and the details panel insets to the viewport edges. |
| **Print**    | print medium    | All translucency collapses. See §13.                                                                                                  |

A separate narrow breakpoint at **480px** exists for the floating
control bar (compact form). Treat 480/520 as the same band — both
exist only because Safari's hit-target geometry forced two minor
adjustments outside the timeline layout.

The Timeline 640px breakpoint is scoped exclusively to
`src/styles/timeline-vis.css`. It exists because the timeline page
has its own internal grid (label column + zoomable canvas) whose
sidebar must collapse before the page-level Phone breakpoint would
otherwise force a column reflow. Do not propagate 640 outside the
timeline; do not invent a fourth band.

### 5.4 Vertical rhythm

| Boundary                            | Spacing                       |
| ----------------------------------- | ----------------------------- |
| Page top padding                    | `4xl` (48px)                  |
| Page bottom padding                 | `4xl` doubled or page-natural |
| Page horizontal gutter              | `2xl` (24px)                  |
| Between top-level sections          | `3xl–4xl`                     |
| Between cards within a section grid | `lg` (16px)                   |
| Within a card (block-level gap)     | `sm` (8px)                    |
| Between an eyebrow and its body     | `lg` (16–20px)                |
| Between hero name and hero summary  | `lg`                          |

Sections collapse to a smaller bottom margin (`2xl`) when collapsed
via the chevron toggle so the page does not develop a void where a
section used to be.

---

## 6. Surfaces and elevation

### 6.1 Three tiers

The site uses exactly three surface tiers, in this order:

1. **Sky** — the page itself. Atmospheric gradient, stars or clouds,
   focal orb. Nothing else lives here.
2. **Glass** — every content card (Hero, Focus item, Project,
   Experience, Education, Skills group, modal panel). Translucent
   over Sky.
3. **Inner chip** — pills, badges, tags inside a Glass card. Painted
   with **Vapor Sheen** or **Aurora Mist**, never with a fully
   opaque colour. An opaque inner chip on glass punches a rectangle
   through the translucency illusion and is a bug.

### 6.2 Glass treatment

Glass is the brand. The exact recipe matters.

| Surface                  | Backdrop blur | Saturate | Background     |
| ------------------------ | ------------- | -------- | -------------- |
| Standard card            | 14px          | 150%     | Vapor          |
| Modal panel              | 18px          | 160%     | Vapor (denser) |
| Modal backdrop           | 20px          | 180%     | Veil           |
| Timeline page            | (none)        | (none)   | Sky            |
| Timeline details (float) | 14px          | 150%     | Vapor (denser) |

**Translucency rule.** On the dark theme home page, you should be
able to see the Sky bleed faintly through every card. If you cannot,
the card alpha is too high. The reference Vapor values are
calibrated against the current Sky brightness; if you re-tune Sky,
re-tune Vapor.

**Performance rule.** Do not use `filter: blur()` on cloud, ambient
orb, or focal orb layers. The blurred-blob look is achieved with
extended radial-gradient stops on the elements themselves — a single
cached paint per element. Stacked runtime blur layers underneath the
page's `backdrop-filter` glass cards crash the iOS Safari compositor
during scroll (cards paint blank). Keep the celestial field
deliberately small: every additional drifting element is one more
overdraw against every glass card on screen.

### 6.3 Borders and shadows

- Glass cards use **Vapor Edge** as a 1px border at rest, except
  cards in the four sections that carry a category glyph bar
  (§10.5) — Experience, Side projects, Education, Courses — whose
  border picks up the section's category token at 45% alpha at rest
  so the outline matches the glyph and the glyph-bar's right edge.
- Solid surfaces (modals in print, `Slate`-backed contexts) use
  **Hairline** at 1px.
- Drop shadow (**Float Shadow**) is reserved for floating panels —
  modals, popovers, the floating control bar. In-flow content cards
  do not get a shadow; the page would look quilted.
- Active or current cards (see §10.2) saturate the same category
  token to full alpha for the border and add a 1px outer glow at
  45% alpha of the token. Glass cards that don't carry a category
  bar fall back to a brighter Aurora-derived (Pulse) border plus
  the same 1px outer glow.

---

## 7. Iconography

### 7.1 Style

All icons are **inline SVG**, not a font, not a sprite, not a
third-party set. The visual language is:

- Outlined or single-stroke geometric shapes.
- 1.5–2px stroke at the canonical 24×24 viewBox, scaled to display
  size via `width` / `height`.
- Painted in **Aurora** when interactive, **Mist** when at rest as
  metadata.
- Geometric centerline aligned within the viewBox so vertical
  alignment is predictable across icons.

Icons are decorative unless they are the only content of a button. A
decorative icon is `aria-hidden`; an icon-only button has
`aria-label` and `title`.

### 7.2 Scale

Icons live on a small fixed scale, not a continuous range:

| Step     | Size  | Use                                                                                                                              |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| `micro`  | 12×12 | Section chevron; in-text inline glyphs.                                                                                          |
| `small`  | 14×14 | Promotion arrow, role-start circle, theme/language toggle, in-line list markers.                                                 |
| `medium` | 16×16 | Standalone icons inside larger buttons; modal-header glyphs.                                                                     |
| `target` | 32×32 | Tap target wrapper for a `medium` icon (close button, floating bar buttons). The hit area is 32; the rendered glyph stays 14–16. |

There is no `large` icon. If something needs to be larger than 32,
it is no longer an icon — promote it to a typographic glyph or an
illustration.

### 7.3 Alignment

See §10.7 — icon-in-text alignment is a recurring pattern with two
canonical solutions (inline and grid/flex row).

---

## 8. Motion

### 8.1 Timing scale

Motion runs on a four-step timing ladder. Each step has one purpose;
do not invent intermediate values.

| Step      | Duration | Use                                                                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `instant` | 0ms      | Layout changes (open/close a section, mount a modal). Layout never animates.                                                                 |
| `fast`    | 120ms    | Hover, focus, active state feedback. The default UI transition.                                                                              |
| `medium`  | 280ms    | Panel reveal — floating control bar, swipe-to-close drag fade.                                                                               |
| `ambient` | 11–240s  | Celestial loops — orb pulse, star twinkle, cloud drift. Multiple values are allowed within this band because the loops must not synchronise. |

### 8.2 Easing

Three easings, one per duration band:

- `fast` and `medium` use **`ease`** — quick out, quick in.
  Functional.
- `ambient` uses **`ease-in-out`** with `alternate` direction so
  loops never snap back to a start frame.
- Layout uses no easing because layout does not animate.

### 8.3 What animates

- Allowed: `color`, `background-color`, `border-color`, `transform`,
  `opacity`.
- Forbidden: `width`, `height`, `padding`, `margin`, anything that
  triggers reflow. If a "reveal" needs to feel animated, fade or
  translate it; do not animate its dimensions.

### 8.4 Reduced motion

When the user requests reduced motion (`prefers-reduced-motion:
reduce`), all `ambient` motion stops and the focal orb settles to
its mid-cycle state. `fast` and `medium` transitions stay because
they are functional feedback, not decoration.

---

## 9. Components

Each component is described **abstractly**: what it _is_, what it
encodes, and the visual contract it must keep. The
[Implementation appendix](#152-component-map) maps each component to
its source file.

### 9.1 Card

The default content surface. Every meaningful content block lives in
a card so the page reads as a stack of weighted units.

- **Surface.** Glass (§6).
- **Padding.** `xl` on all sides. `lg` is allowed for dense content
  (timeline rows that need more rows visible at once).
- **Corner radius.** `radius-md` (10px). Universal — every card and
  button uses the same value so the page reads as one family.
- **Border.** For cards that carry a category glyph bar (§10.5),
  the border picks up the section's category token: a desaturated
  tint at rest (45% alpha) and the same token at full saturation
  when the card is active (§10.2). All other glass cards use Vapor
  Edge at rest. Aurora on hover for whole-card-clickable cards
  without a category bar; cards with a category bar use the full
  category token on hover so the resting tint snaps to its
  saturated form.
- **Shadow.** None for in-flow cards. Float Shadow for floating
  panels.
- **Hover.** A single change: border colour snaps to its saturated
  form — Aurora for plain glass cards, the full category token for
  cards with a category glyph bar (§10.5). _Never_ fill the body
  with Aurora Mist on hover — Aurora Mist is reserved for pill and
  button shapes (§9.2, §9.4).
- **Cards that are not whole-card-clickable** (Experience, where
  only the company title opens a modal) get **no** card-level hover.
  Only the interactive sub-element gets feedback.

#### Hero exception — full-bleed band

The Hero is the one card that **does not** keep card-radius or vertical
borders. It spans the full viewport width as a glass band anchored to
the top of the page; rounded sides would clip at the viewport edges
and break the seal. The band keeps the standard glass surface (§6.2)
and a 1px Vapor Edge along the bottom only — the bottom border is the
tier boundary between hero and the cards below. Inner content is
constrained to the same max-width column as the rest of the page via
a `.hero-inner` wrapper, so the column still reads as a single
gravity. The aurora glow that used to live inside the hero now lives
on a Sky-tier `.page-glow` element (see §6.1 — it sits behind every
glass card and is sampled through their `backdrop-filter`, so the
glow diffuses through the cards instead of being trapped inside the
hero's overflow box).

### 9.2 Pill

A rounded-rectangle (`radius-pill` = 999px) chip used for
**quantitative metadata** — counts, percentages, codes, technology
tags.

Two variants:

- **Tech tag.** Soft Mist fill (a light tonal wash — ~5–6% white in
  dark mode, ~5–6% navy in light mode), no resting outline, Code
  Mono type at Micro size. Used for skill chips on a card. The fill
  alone separates the chip from the card surface; the chip's text
  carries WCAG 1.4.11 component identity, so the border is reserved
  for hover/focus feedback.
- **Accent pill.** Aurora Mist fill, Aurora text. Used for ECTS
  counts, course counts, percentages, language toggle, hero meta
  link buttons.

Both variants share the same height, padding, and corner radius. The
variant signals what the chip _is_, not how loud it should be.

### 9.3 Badge

A small filled label that conveys **state**. Always uppercase Code
Mono at Micro size.

| Badge                     | Meaning                                                                                                                                                          | Surface                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPEN SOURCE`             | Project repository is public.                                                                                                                                    | Tinted with the host card's category color — same fill (`rgba(--cat-rgb, 0.16)`) and text (`rgb(--cat-fg)`) as the card's glyph bar, so the badge reads as part of the card's identity. Pinned to the top-right corner of the card as a "folded" label, matching the PRESENT badge geometry.                                                                   |
| `INCOMPLETE`              | A course was started but not finished.                                                                                                                           | Halt fill, white text. Only appears on course cards.                                                                                                                                                                                                                                                                                                           |
| `PRESENT`                 | Role or assignment is currently ongoing.                                                                                                                         | Tinted with the host card's category color — same fill (`rgba(--cat-rgb, 0.16)`) and text (`rgb(--cat-fg)`) as the card's glyph bar. Pinned to the top-right corner of the card as a "folded" label — top-right corner inherits the card's `radius-md`, the bottom-left corner curves inward at the same radius, the other two corners are square. The card's Pulse border + glow is the secondary current-affordance; the badge is the primary one. |
| `half-time` / `part-time` | Engagement fraction on Experience cards. Distinct words, not synonyms — `half-time`/`halvtid` is exactly 50%, `part-time`/`deltid` is unspecified non-full-time. | Aurora Mist pill.                                                                                                                                                                                                                                                                                                                                              |

The PRESENT badge family is reserved for Experience and Assignment
cards. Do not adopt it for other card families — the tight coupling
with the Pulse border is the badge's whole grammar.

### 9.4 Button

There is **one** button family. All site buttons are pill-shaped,
use the same border weight (`1px solid Aurora Mist`), Aurora text,
and an Aurora Mist fill on hover. There are no
"primary / secondary / tertiary" weight tiers — emphasis comes from
placement, not from making one button thicker than another.

- **Resting.** Aurora Mist border, Aurora text, transparent fill.
- **Hover/focus.** Border keeps Aurora Mist; fill becomes Aurora
  Mist.
- **Disabled.** Reduce opacity to ~0.55 and block pointer events.
  The control should still look like itself, just dimmer.
- **Modal close exception.** The `×` on a modal uses the same border
  treatment and no fill, but its corners follow the host panel's
  `--radius` instead of the pill family's full pill — a perfect circle
  reads as out-of-place against a softly-rounded square panel. Same
  family, special geometry.

### 9.5 Inline link

Plain text painted with **Aurora**, no underline at rest, dashed
Aurora Mist underline on hover. Used for in-card references.

The hero meta row is the explicit exception: link items marked
`featured: true` in the data render as Aurora pills (§9.2 accent
variant) so the primary outbound destinations read as actions.
Unfeatured entries fall back to the plain inline-link style.

### 9.6 Section

Each top-level content block is wrapped in a **Section**.

- **Eyebrow.** Micro tier, uppercase, tracked, Mist colour. Precedes
  the body by `lg`–`xl` of vertical space.
- **Toggle.** The eyebrow doubles as a button. A `micro`-sized
  chevron sits at the right of the eyebrow text. Click toggles the
  body's visibility; the chevron rotates `-90°` when collapsed. The
  body uses the native `hidden` attribute so layout collapses
  cleanly — no height animation (motion is feedback, not layout,
  §2.5).
- **Persistence.** Collapsed state persists per-section in
  `localStorage` so a reader's fold preferences survive reloads.
- **Print.** Sections always render expanded in print and the
  chevron is hidden.

### 9.7 Modal

A focused content panel layered above the page. Two flavours,
distinct by purpose:

- **Standard modal** — opens over the page (skill detail, focus
  detail, summary, project, company, program courses, course
  modules). Uses the **Veil** backdrop (lightly dimmed, frosted) so
  the page is visibly hinted at as glass beneath, not blacked out.
  Inner panel is a Glass card (`max-width: 560px`) with the standard
  close button at top-right.
- **Category accent.** Modals that open from one of the four
  categorised sections (Experience, Side projects, Education,
  Courses — and Companies, which sit under Experience) borrow that
  section's Sapphire/Iris/Mint/Ember palette: a glyph chip in the
  header, a soft category-tinted header gradient, and the accent
  token retuned so the year pill and action-link pills inherit the
  same hue. See §10.5 for the full recipe. Skill, summary, focus,
  and search modals stay Aurora — they aren't bound to one of the
  four categories.

The timeline is **not** a modal. It is a separate page at `/timeline`
(see §9.10) — a navigation, not an overlay — so iOS Safari can keep
the address bar translucent and the back button gives the natural
return path.

**Interaction contract.**

- Click the backdrop → close.
- `Escape` → close.
- Tab focus is trapped inside the panel.
- Body scroll is locked while a modal is open.
- On touch, swipe-to-close drags the panel with the finger and
  fades both panel and backdrop with distance. Past the threshold,
  the panel animates fully past the viewport edge (translate by
  `viewport + panel`) at full opacity while the backdrop fades — no
  mid-flight disappearance.

### 9.8 Floating control bar

The hero meta row carries the Timeline button, language toggle, and
theme toggle. Once the user scrolls past the hero, the same three
controls mirror into a fixed Glass pill at the top-right of the
viewport.

- **Surface.** Glass (the standard recipe).
- **Reveal.** `medium` fade + slight downward translateY. Slower
  than hover feedback because this is a panel reveal, not state
  feedback.
- **Tab order.** Hidden via `opacity` + `visibility` so the pill
  stays out of the tab order when not visible.
- **Compactness.** On Phone, the Timeline button drops its label and
  becomes icon-only. The in-hero variant always keeps its label.
- **Print.** Hidden.

### 9.9 Project date chip

A small Code Mono chip used twice: in the Project modal "active"
row, and in the Timeline side-project details panel. Renders the
month-year by default; on hover/focus, reveals a tooltip with the
full calendar date.

- **Resting.** Aurora-coloured Code Mono at Micro size. Subtle pill
  framing only on hover.
- **Hover/focus.** Aurora Mist fill, dashed Vapor Edge outline,
  tooltip below.
- **Mobile.** Tap focuses the chip and pins the tooltip until the
  user taps elsewhere.
- **Accessibility.** The accessible name is the **full** date; the
  tooltip is decorative.

### 9.10 Empty state

When a list-shaped component (a skill chip with zero usages, a
section with no entries) has nothing to render, **keep the component
visible but dimmed** (`opacity ~0.55`) and add a `title` +
`aria-label` explaining why ("No entries yet"). Never silently
render a broken-looking control or skip the affordance. An empty
thing that explains itself is honest; an empty thing that vanishes
is confusing.

### 9.11 Search trigger

The search affordance is the magnifier-icon button that lives in the
**hero meta row** while the hero is in view, and mirrors into the
**floating control bar** (§9.8) once the user scrolls past it.
Clicking the button opens the standard search Modal (§9.7) which hosts
the real input and the ranked results.

- **Surface.** A circular Aurora-stroke icon button, 32×32 in both
  the hero meta row and the floating bar — same family, same icon,
  same height as the surrounding pills and toggles so the row reads as
  one cluster.
- **Placement.** Last item of both rows. On desktop (≥ 640px) the
  meta row stays single-line and `margin-left: auto` pushes the
  button to the right edge so the search reads as a sibling of the
  Timeline / language / theme cluster. On mobile (< 640px) the row
  wraps and the auto-margin is dropped, so the button sits naturally
  adjacent to the theme toggle on whichever wrapped row it lands on
  (left-aligned within that row).
- **Reveal.** The hero variant is always visible above the fold.
  The floating-bar variant fades in (and the whole pill with it)
  once `.hero-meta` scrolls off, gated by the same
  IntersectionObserver as the rest of the floating bar.
- **Compactness.** On Phone the floating-bar icon shrinks to 28×28,
  matching the rest of the bar.
- **Keyboard.** `⌘K` / `Ctrl+K` and `/` (when focus is not in another
  text input) open the search modal globally. The handlers live in
  `App.tsx` so they're active regardless of scroll position.
- **Print.** Hidden, together with the rest of the floating bar; the
  in-hero button inherits the meta row's print rules.

### 9.12 Search results

Ranked, **flat** result list inside the search modal. Results are
mixed across kinds and ordered strictly by score, so a strong
stack/skill match never loses its slot to a weak title match in a
different kind. Each row carries:

- **Kind badge.** A pill on the left of the title row (`Project`,
  `Skill`, `Experience`, …) painted in Aurora-on-Aurora-Mist so the
  category is glanceable without dominating the row.
- **Title + secondary.** Standard 0.95rem semibold title; optional
  smaller Mist secondary (e.g. company name for an experience).

The ranker still uses field weights and match-type modifiers
internally, but the modal does **not** surface that machinery to
readers — the row is the result, not a debug trace. Field weights
and match modifiers are documented in [`docs/SEARCH.md`](SEARCH.md).

The search input itself is rendered as a single rounded field that
contains the magnifier icon, the text input, and the WebKit clear-X
cancel button. The modal-close button sits **outside** that field as
a separate circular control, so the inline X is unambiguously the
clear-input affordance and the outer X dismisses the modal.

---

## 10. Patterns

Patterns are recurring _compositions_ — they reuse the components
defined above to express something more specific.

### 10.1 Promotion arrow and role chain

A job (Experience entry) and an assignment (consultancy client
engagement) each represent **one continuous tenure**. Internal
promotions or title changes do not break that continuity — they live
inside a single card as a `roles[]` array.

- **On the timeline card heading,** a `small`-sized arrow icon
  (Aurora) appears in the title whenever the parent has more than
  one role. The chain (when `roles.length > 1`) renders directly
  after the date row and lists **only the older roles** —
  reverse-chronological — because the heading already shows the
  newest title.
- **In the experience/assignment modal,** the title does **not**
  carry the arrow icon. The newest role stays in the title alone
  (so long company names stay visually clean), and the role chain
  in the body renders **every** role including the newest one, so
  the full promotion history is one self-contained list rather
  than split between the title and the chain.
- Within the chain, every row shows arrow + title + date range, in
  reverse-chronological order. The bottom row (the original
  starting title) shows a `small` hollow-circle icon (Aurora at 0.7
  opacity) so the column reads as a chain anchored at an origin
  rather than a series of arrows trailing into space.
- The chain sits inside a 1px Aurora left border that visually
  anchors the progression.
- Title type in the chain uses Code Mono (matching the heading role)
  at Meta size.
- Alignment follows §10.7.
- **Assignment subject line.** When an Assignment modal renders the
  subject (client company), the consultancy is labelled with a
  small accent pill (§9.2) reading `via <Consultancy>`. The pill is
  `nowrap` so it stays a single token; the subject row is
  `flex-wrap` so the pill drops to its own line when the client
  name fills the width. Used only here — jobs have no consultancy
  layer, so the pill never appears outside the assignment subject.

### 10.2 Active / Present indicator

Cards whose underlying record has `endDate === null` (currently
active) get an `is-active` modifier. Visual treatment:

- **Border.** Cards with a category glyph bar (§10.5) saturate their
  resting tinted border to the full category token (`rgb(--cat-rgb)`)
  and add a 1px outer glow at 45% alpha of the same token. Cards
  without a category bar use Pulse (brightened Aurora) + the same
  glow. Light theme drops the outer glow in both cases.
- **PRESENT badge** pinned to the top-right corner (Experience and
  Assignment cards only) — see §9.3.

The border + badge pair is the **complete** vocabulary for
"current". Do not add stars, "Active" copy in the body, italics, or
other affordances. The grammar is set; redundancy makes it noisier,
not clearer.

### 10.3 Timeline visualization

The Timeline page is the most complex composite in the system. It
renders horizontal bars by category across a zoomable, pannable date
axis.

- **Categories** (each carries one of the
  Sapphire / Mint / Ember / Iris / Bloom / Verdant tokens): jobs,
  education, courses, side projects, GitHub activity, assignments.
- **Single-role bar.** Title + subtitle (company), centered.
- **Multi-role bar.** Each role in `exp.roles` becomes a per-role
  text segment, anchored to its `startDate` and absolutely
  positioned within the bar at its time-slice (left/width as
  percentages). Each segment uses `overflow: hidden` with
  `text-overflow: clip` so role titles get cut cleanly when the
  segment is too narrow.
- **Promotion markers.** Between segments, a 1px vertical line in
  the bar's category colour at 0.55 opacity, with a `xs` inset top
  and bottom so it reads as an internal divider, not a track
  gridline.
- **Promotion glyph.** Each promoted segment is prefixed with a `→`
  in Mist, so the chain reads as `Role | → Role 2 | → Role 3`.
- **Subtitle.** Only the first segment carries the company name on
  its second line; subsequent segments show only the role title
  (company is the same across the whole bar).
- **Click target.** Markers and arrow are decorative
  (`pointer-events: none`); the entire bar is one click target.
- **Details modal — multi-role layout.** When the selected bar has
  more than one role, the modal heading becomes the company name
  (the bar's subtitle) and the redundant subtitle line is hidden.
  Roles render as a left-bordered list matching the Aurora-Mist
  treatment of the notes block, each role showing
  title + date range + duration. Each role's "end" date is the
  calendar month before the next role's `startDate`; the last role
  inherits the bar's end date (or `Present`).
- **GitHub bars.** Use the Bloom token at log-normalised opacity per
  cell so the heatmap shows daily/weekly/monthly activity intensity.

### 10.4 Wrapping with separator characters

Inline metadata that uses `·` separators
(institution · level · credits · count) **must never wrap with a
leading `·` on a new line**. Wrap each segment that includes its own
preceding separator in a `<span>` with `white-space: nowrap` so the
dot and the segment travel together to the next line.

This is a typography hygiene rule, not a styling preference. A line
beginning with `·` reads as a bullet, not a continuation.

### 10.5 Category glyph bar

Cards in the four scrolled sections — **Experience**, **Side
projects**, **Education**, **Courses** — carry a coloured left bar
that doubles as the card's identity badge, and a matching tinted
outline picks the same colour up around the rest of the card (§6.3,
§10.2). The bar and outline together are the only place
non-Aurora colour is applied to a card surface, so the pattern must
be used consistently and only for these four section types.

- **Surface.** A 36px-wide column flush to the card's left edge,
  rendered as the card's `::before`/inner span and rounded to match
  the card's left corners (`radius-md`). It sits inside the existing
  card border so the card outline stays unbroken.
- **Tint.** Flat fill at 16% alpha of the section's timeline category
  token; 22% in light theme. A 1px right edge at 45% alpha provides
  the 3:1 non-text contrast that WCAG 1.4.11 requires.
- **Glyph.** A 1.75px-stroke outlined SVG at `medium` (16–18px),
  painted in the section's category foreground token (`--tl-*-fg`) at
  full opacity. Dark theme uses the same pastel as the tint; light
  theme deepens the hue so the glyph reads on the pearl Nightfield.
  The glyph sits pinned to the **top** of the bar with `lg` (16px) of
  breathing room so it remains anchored as the card grows downward —
  it's a marker, not a centerpiece.
- **Category mapping.**

  | Section       | Token         | Glyph               |
  | ------------- | ------------- | ------------------- |
  | Experience    | `--tl-blue`   | Briefcase           |
  | Side projects | `--tl-violet` | Code brackets `</>` |
  | Education     | `--tl-mint`   | Mortarboard         |
  | Courses       | `--tl-amber`  | Open book           |

  The mapping mirrors the Timeline's category palette (§10.3) so the
  same Sapphire/Iris/Mint/Ember language reads the same in both views.

- **Section title.** The matching glyph also appears inline before the
  section eyebrow (Mist tier), tinted in the section's category token.
  This is the only place the eyebrow gets a chromatic accent, and it
  ties the title visually to the cards underneath.
- **Modal header.** When a modal opens from one of the four categorised
  surfaces (project card, company chip in Experience, experience or
  assignment card, education program, course), the panel borrows the
  same category language so the overlay reads as part of its parent
  section rather than a generic Aurora popover. Two pieces:
  1. A **glyph chip** before the title, identical in recipe to the card
     bar — 36px square, low-alpha tint fill, 1px border at 45% alpha,
     glyph painted in `--tl-*-fg`.
  2. A **soft category gradient** on the header background plus a
     border-bottom in the same hue, so the eye carries the colour from
     the chip across the whole header row.

  The accent token (`--accent` / `--accent-soft`) is locally redefined
  on the modal so the year pill, action-link pills, the close-hover
  ring, and the focus-visible outline all pick the category tone up
  automatically. The body remains neutral Glass — colour is reserved
  for the header strip and the small accent leaves below it, never the
  description prose.

- **Print.** The bar and the title glyph are hidden in print — the PDF
  pipeline runs through `PrintView` (§6) which doesn't include either.
  Modals never print. A defensive `@media print` rule keeps the bar
  and title glyph hidden if the SPA components are ever printed
  directly.

### 10.6 Skill-group glyph

The Skills section is a single page section but a long one, broken
into nine groups (AI, Languages, Frameworks, Cloud, Databases,
DevOps, Practices, Leadership, Compliance). Without per-group
identity it reads as one undifferentiated wall of pills, so each
group carries its own small glyph chip and a hue that tints the
pills inside it on hover.

This pattern is **scoped to the Skills section** — it intentionally
does not bleed onto card surfaces, modal headers, or the Timeline.
The four-category language in §10.5 (Sapphire / Iris / Mint / Ember)
remains the only chromatic vocabulary that travels across surfaces.

- **Glyph chip.** A 22px square sitting inline before each group
  heading, rounded to `6px` (smaller than the §10.5 card-bar radius
  to read as a label, not a section badge). Flat fill at 16% alpha
  of the group's RGB triplet (22% in light theme), 1px border at 45%
  alpha for the WCAG 1.4.11 3:1 non-text contrast, glyph painted in
  the matching `--*-fg` token at full opacity.
- **Glyph.** A 1.75px-stroke outlined SVG at 16px on a 24×24
  viewBox, rendered by `src/components/SkillGroupGlyph.tsx`.
- **Pill tint.** Pills inside a tinted group hover to that group's
  hue (foreground colour, 60%-alpha border, 16%-alpha background)
  and the usage-count chip on each pill borrows the same colour at
  18% alpha. Default state stays neutral Mist so the page only
  ignites under interaction.
- **Pill indent.** The pill list inside a group is left-padded by
  `30px` (the 22px glyph chip + the 8px gap between glyph and
  label) so pills line up with the **label text** rather than the
  glyph edge. The glyph then reads as the visual hierarchy anchor
  for the items it owns, and the extra whitespace breaks up what
  would otherwise be nine flush-left pill walls in a row.
- **SkillModal header.** When a single skill is opened in the
  Skills modal, the modal header borrows the per-group recipe: the
  group's `--cat-rgb` / `--cat-fg` pair are set on the modal root
  via `skillGroupStyle`, the `.skill-modal--cat` class redefines
  `--accent` so the year pill, action links, focus ring, and close
  hover ring all pick the group hue up automatically, and the
  group's `SkillGroupGlyph` sits in a 36px square chip on the left
  of the title — the same recipe the four-category modals use
  (§10.5). Mapping the modal's chrome to the same hue the user
  just clicked from keeps the page → modal transition continuous.
- **Group → hue mapping.**

  | Group      | Token         | Glyph                       |
  | ---------- | ------------- | --------------------------- |
  | AI         | `--tl-pink`   | Sparkle (4-pt star + spark) |
  | Languages  | `--tl-blue`   | Terminal box `>_`           |
  | Frameworks | `--tl-violet` | Stacked layers (×3)         |
  | Cloud      | `--tl-cyan`   | Cloud silhouette            |
  | Databases  | `--tl-mint`   | Database cylinder           |
  | DevOps     | `--tl-amber`  | Gear                        |
  | Practices  | `--tl-green`  | Compass                     |
  | Leadership | `--tl-coral`  | Flag                        |
  | Compliance | `--tl-steel`  | Shield with check           |

  Sapphire / Iris / Mint / Ember are reused here intentionally — the
  Skills context (small heading inside one section) is far enough
  from the §10.5 card-surface usage that no confusion arises, and it
  keeps the palette small.

- **Print.** Skill-group glyphs and tints are excluded from
  PrintView; Skills prints as a flat list to keep the PDF compact.

### 10.7 Icon-in-text alignment

Small inline SVG icons must read as visually centered with the text
beside them. Two cases:

1. **Inline next to text** (a heading, a paragraph, a button label):
   use `vertical-align: middle` on the SVG and a 1px upward optical
   nudge (`transform: translateY(-1px)`). The geometric centerline
   sits slightly below the eye's text-center for most fonts; 1px
   corrects it. Do not use bespoke `vertical-align: -2px` magic
   numbers — they do not scale with the surrounding font-size.
2. **Inside a flex/grid row whose other cell can wrap to multiple
   lines** (the role chain): use `align-items: start`, give the row
   an explicit line-height, and offset the icon with `margin-top`
   equal to `(line-height − icon-height) / 2 + 1px` so the icon
   centers with the **first** text line, not the wrapped block.

Icon viewBoxes used in the system are pre-centered (visual center
at viewBox center), so both rules produce the expected optical
center without further adjustment.

---

## 11. Voice and microcopy

### 11.1 Language

The site is **bilingual** — English and Swedish — and the two are
equals. Every user-visible string lives as `{ en, sv }`. Translations
are not literal but register-matched: the goal is the same
_impression_, not the same words.

- **English voice.** Calm, factual, slightly understated. Past tense
  for past roles; present tense only for the current role. No
  marketing superlatives ("expert", "passionate", "10x").
- **Swedish voice.** Same register, with Swedish business idiom.
  Avoid Anglicisms where a clean Swedish term exists.

### 11.2 Capitalisation

- **Sentence case** for body text and headings.
- **UPPERCASE** for Micro tier eyebrows and badges, where wider
  tracking compensates for legibility.
- **Title Case** is not used anywhere.

### 11.3 Numbers and dates

- Dates render as month + year by default, full date on demand
  (Project date chip).
- Durations render in years + months ("3 yr 4 mo"), localised.
- Counts use a unit suffix where the unit is non-obvious
  ("142 commits", "30 ECTS"). Bare integers are reserved for
  self-explanatory contexts (badge counts).

### 11.4 The summary

The hero summary stands on its own as a one-paragraph headline. The
"Read more" affordance is a quiet, dashed-underlined hint, not a
button — the long form is supplementary, not the substitute.

---

## 12. Accessibility

### 12.1 Contrast

- Body text on Vapor over the darkest Sky region clears WCAG AA
  (4.5:1). Re-check after any token change.
- Mist text (metadata) clears full WCAG AA (≥4.5:1) on Vapor and
  Vapor Edge in both themes.
- Aurora text on Vapor clears WCAG AA in both themes.
- **Non-text contrast (WCAG 1.4.11).** Hairline (`--border`) and
  Vapor Edge (`--glass-border`) are calibrated to clear 3:1
  against Nightfield in both themes so component boundaries on
  inputs, modal close pills, the search field, and content cards
  are perceivable. Do not weaken these tokens without rechecking
  the affected components against a contrast tool.
- Buttons identified only by their border (transparent fill —
  e.g. `.hero-download`, `.hero-timeline-btn`, `.skill-modal-link`)
  use a solid `--accent` border, not Aurora Mist, so the button
  shape itself meets 1.4.11.

### 12.2 Focus

Every interactive control has a visible focus ring on
`:focus-visible`: **2px solid Aurora**, 2px offset. The ring is the
only focus affordance — do not also dim the rest of the page or
animate the focused element on focus.

### 12.3 Keyboard

- Every control reachable by mouse is reachable by keyboard.
- Tab order follows reading order.
- Modals trap focus; `Escape` closes.
- Section toggle buttons are real `<button>` elements, not divs with
  click handlers.

### 12.4 Semantics

- Headings nest in document order: one `h1` (the hero name), `h2`
  per Section eyebrow, `h3` per card title, `h4` per nested
  sub-card.
- Lists are real `<ul>` / `<ol>` / `<dl>` so screen readers announce
  count and position.
- Decorative icons are `aria-hidden`. Icon-only buttons have
  `aria-label` + `title`.

### 12.5 Colour is never the only signal

- "Currently active" is communicated by the PRESENT badge **and**
  the Pulse border.
- "Incomplete" is communicated by the word `INCOMPLETE` **and** the
  Halt fill.
- "Empty" is communicated by dimming **and** an `aria-label`.

### 12.6 Reduced motion

Honour `prefers-reduced-motion: reduce` (§8.4). Ambient celestial
motion stops; functional `fast` / `medium` transitions remain.

---

## 13. Print variant

Print is a **co-equal medium**, not a stripped screen view. It has
its own type system, spacing scale, and page-break contract — driven
by a structured settings block at `cv.print` (sourced from
`src/data/cv/print.json`) so editorial decisions live in data, not
in CSS.

### 13.1 Type

- **Body** is set in **Print Serif** (Garamond-first) at 10.5pt
  with line-height 1.4. Editorial calm; long-form readability.
- **Headings** are set in **Print Sans** (Inter-first) for contrast
  against the serif body.
- The screen sans/mono divide does not carry to print. Identifiers
  in print read as differentiated by the typography of their
  containing context, not by a separate family.

### 13.2 Heading scale

Six tiers, declared in `print.json`: `name`, `title`, `section`,
`entry`, `subEntry`, `subHeading`. Sized in points, not rems.

### 13.3 Spacing

Five tokens, declared in `print.json` as point values:

| Token          | Use                                            |
| -------------- | ---------------------------------------------- |
| `section`      | Between top-level sections.                    |
| `entry`        | Between entries within a section.              |
| `subEntry`     | Between sub-entries within an entry.           |
| `paragraph`    | Between paragraphs in body copy.               |
| `headerToBody` | Between a section heading and its first entry. |

Use these instead of hard-coded margins for any new print element.

### 13.4 Page

- A4 page size; 2cm × 1.8cm margin.
- Page-break controls: `orphans` and `widows` (default 3 lines
  each); three boolean toggles (`avoidInsideEntry`,
  `avoidInsideSubEntry`, `keepHeadingWithNext`) all default true.
- Notes inclusion is a single boolean (`includeNotes`), default
  true.

### 13.5 Surface

Glass collapses to opaque white. All `backdrop-filter` is removed.
Cards lose Float Shadow and gain a Hairline border. Sky, stars,
clouds, hover states are all suppressed. Floating controls are
hidden. Sections always render expanded; the chevron is hidden.

### 13.6 Per-entry print copy

Some entries override their on-screen tagline with a print-specific
description (`printDescription` on projects, experience, and
assignments). Use this when the screen tagline is too long, too
casual, or otherwise unsuitable for the printed CV. Falls back to
the screen tagline when omitted.

---

## 14. Process

### 14.1 The doc is the source of truth

When this document and the implementation disagree, the
implementation is wrong. To bring it back in line, run the
[`sync-design`](../.agent/skills/sync-design/SKILL.md) skill.

### 14.2 Before any visual change

1. Read the relevant section of this document.
2. If the change introduces a pattern not described here, **update
   this document first** in the same PR.
3. Reference the section(s) in your PR description ("Conforms to
   §6.2 Glass treatment").
4. Re-screenshot the affected area on iPhone width in both themes
   before merging.

### 14.3 Adding a new token

Tokens are added here first (in §3, §4, §5, §8, etc.), then
expressed as CSS variables, then referenced from components. Reverse
the order and the system rots.

### 14.4 Adding a new component

1. Decide whether the new thing is genuinely new, or a variant of an
   existing component (§9). Variants are almost always wrong — see
   principle 2.
2. If genuinely new, add a §9.x subsection here describing the
   component _abstractly_: its purpose, its surface, its states, its
   contract.
3. Implement it in `src/components/`. Reference its source file in
   §15.
4. Add it to the sync skill's mapping table.

---

## 15. Implementation appendix

A single mapping from the abstract design system to the concrete
codebase. Engineers and the `sync-design` skill both read from this
table. **Update this whenever the implementation moves**.

### 15.1 Token map

| Design name     | CSS custom property      | Source file                     |
| --------------- | ------------------------ | ------------------------------- |
| Nightfield      | `--bg`                   | `src/styles/tokens.css`         |
| Slate           | `--bg-elev`              | `src/styles/tokens.css`         |
| Vapor           | `--glass-bg`             | `src/styles/tokens.css`         |
| Vapor Edge      | `--glass-border`         | `src/styles/tokens.css`         |
| Vapor Sheen     | `--glass-highlight`      | `src/styles/tokens.css`         |
| Veil            | `--modal-overlay`        | `src/styles/tokens.css`         |
| Aurora          | `--accent`               | `src/styles/tokens.css`         |
| Aurora Mist     | `--accent-soft`          | `src/styles/tokens.css`         |
| Graphite        | `--fg`                   | `src/styles/tokens.css`         |
| Mist            | `--fg-muted`             | `src/styles/tokens.css`         |
| Hairline        | `--border`               | `src/styles/tokens.css`         |
| Float Shadow    | `--shadow`               | `src/styles/tokens.css`         |
| Skyline Top     | `--sky-top`              | `src/styles/tokens.css`         |
| Skyline Mid     | `--sky-mid`              | `src/styles/tokens.css`         |
| Skyline Bottom  | `--sky-bottom`           | `src/styles/tokens.css`         |
| Sky Glow A      | `--sky-glow-1`           | `src/styles/tokens.css`         |
| Sky Glow B      | `--sky-glow-2`           | `src/styles/tokens.css`         |
| Orb             | `--orb-color`            | `src/styles/tokens.css`         |
| Orb Soft        | `--orb-color-soft`       | `src/styles/tokens.css`         |
| Sapphire        | `--tl-blue`              | `src/styles/tokens.css`         |
| Sapphire Fg     | `--tl-blue-fg`           | `src/styles/tokens.css`         |
| Mint            | `--tl-mint`              | `src/styles/tokens.css`         |
| Mint Fg         | `--tl-mint-fg`           | `src/styles/tokens.css`         |
| Ember           | `--tl-amber`             | `src/styles/tokens.css`         |
| Ember Fg        | `--tl-amber-fg`          | `src/styles/tokens.css`         |
| Iris            | `--tl-violet`            | `src/styles/tokens.css`         |
| Iris Fg         | `--tl-violet-fg`         | `src/styles/tokens.css`         |
| Bloom           | `--tl-pink`              | `src/styles/tokens.css`         |
| Bloom Text      | `--tl-green-fg`          | `src/styles/tokens.css`         |
| Verdant         | `--tl-green`             | `src/styles/tokens.css`         |
| Cyan            | `--tl-cyan`              | `src/styles/tokens.css`         |
| Cyan Fg         | `--tl-cyan-fg`           | `src/styles/tokens.css`         |
| Coral           | `--tl-coral`             | `src/styles/tokens.css`         |
| Coral Fg        | `--tl-coral-fg`          | `src/styles/tokens.css`         |
| Steel           | `--tl-steel`             | `src/styles/tokens.css`         |
| Steel Fg        | `--tl-steel-fg`          | `src/styles/tokens.css`         |
| Pulse           | `--pulse`                | `src/styles/tokens.css`         |
| Pulse Soft      | `--pulse-soft`           | `src/styles/tokens.css`         |
| Pulse Glow      | `--pulse-glow`           | `src/styles/tokens.css`         |
| Halt            | `--halt`                 | `src/styles/tokens.css`         |
| Halt Foreground | `--halt-fg`              | `src/styles/tokens.css`         |
| `radius-md`     | `--radius`               | `src/styles/tokens.css`         |
| `radius-pill`   | (literal `999px`)        | (no token — universal constant) |
| Page column     | `--max-width`            | `src/styles/tokens.css`         |
| Body Sans       | `font-family` on `:root` | `src/styles/tokens.css`         |
| Code Mono       | `--font-mono`            | `src/styles/tokens.css`         |

### 15.2 Component map

| Component (§9)         | Source file(s)                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Card                   | All section components; styled per file (`projects.css`, `experience.css`, `education.css`, `focus.css`, `skills.css`, `languages.css`). |
| Pill                   | `src/styles/projects.css` (tech tags), `src/styles/education.css` (counts), `src/styles/hero.css` (link pills).                          |
| Badge — OPEN SOURCE    | `src/components/Projects.tsx` + `src/styles/projects.css`.                                                                               |
| Badge — INCOMPLETE     | `src/components/Courses.tsx` + `src/styles/modals.css`.                                                                                  |
| Badge — PRESENT        | `src/components/Experience.tsx` + `src/styles/experience.css`.                                                                           |
| Badge — half/part-time | `src/components/Experience.tsx` + `src/styles/experience.css`.                                                                           |
| Button                 | `src/components/Controls.tsx`; styles in `src/styles/toggles.css` and per-component CSS.                                                 |
| Inline link            | `src/styles/base.css` and per-component CSS.                                                                                             |
| Section                | `src/components/Section.tsx` + `src/styles/section.css`.                                                                                 |
| Modal — standard       | `src/components/{Skill,Focus,Summary,Project,Company,ProgramCourses,CourseModules}Modal.tsx` + `src/styles/modals.css`.                  |
| Modal — Timeline       | `src/components/Timeline.tsx` + `src/styles/timeline-vis.css`.                                                                           |
| Floating control bar   | `src/components/FloatingControls.tsx` + `src/styles/floating-controls.css`.                                                              |
| Search trigger         | `src/components/SearchTrigger.tsx` + `src/components/SearchModal.tsx` + `src/styles/search.css`.                                         |
| Project date chip      | `src/components/ProjectDateChip.tsx` + `src/styles/projects.css`.                                                                        |
| Empty state            | `src/components/Skills.tsx` + `src/styles/skills.css`.                                                                                   |
| Skill-group glyph      | `src/components/SkillGroupGlyph.tsx` + `src/components/Skills.tsx` + `src/styles/skills.css`.                                            |
| Languages              | `src/components/Languages.tsx` + `src/styles/languages.css`.                                                                             |
| Page chrome (Sky)      | `src/components/CelestialSky.tsx` + `src/styles/sky.css`; page column + footer in `src/styles/layout.css` and `src/styles/base.css`.     |

### 15.3 Pattern map

| Pattern (§10)                      | Source file(s)                                                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promotion arrow + role chain       | `src/components/Experience.tsx` + `src/styles/experience.css`.                                                                                                                                                            |
| Active / Present indicator         | `src/components/Experience.tsx` + `src/styles/experience.css`.                                                                                                                                                            |
| Timeline visualization             | `src/components/Timeline.tsx` + `src/styles/timeline-vis.css`.                                                                                                                                                            |
| Wrapping with separator characters | `src/components/Education.tsx` (`<p class="education-meta-trail">` + `.education-meta-trail > span` rule in `src/styles/education.css`).                                                                                  |
| Skill-group glyph                  | `src/components/SkillGroupGlyph.tsx` + `src/components/Skills.tsx` + `src/components/SkillModal.tsx` + `src/utils/skillGroup.ts` + `src/styles/skills.css` + `src/styles/modals.css` + tokens in `src/styles/tokens.css`. |
| Icon-in-text alignment             | `src/styles/experience.css`, `src/styles/section.css`, etc.                                                                                                                                                               |

### 15.4 Print map

| Print concern (§13)            | Source                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| Settings (font, spacing, page) | `src/data/cv/print.json` (assembled into `cv.print`).          |
| Schema for settings            | `schemas/print.schema.json`.                                   |
| Type contract                  | `src/data/print.types.ts`.                                     |
| Settings → CSS variables       | `src/components/PrintView.tsx` (injects `<style>` per render). |
| Stylesheet                     | `src/styles/print.css`.                                        |
| Generator                      | `scripts/generate-print.mjs`.                                  |
| PDF generator                  | `scripts/generate-pdf.mjs` (puppeteer).                        |

### 15.5 Files outside this map

If a CSS file is touched and its component does not appear in §15.2
or §15.3, that is a drift signal. Either the doc needs a new
component/pattern entry, or the change should be reverted. The
`sync-design` skill catches these.
