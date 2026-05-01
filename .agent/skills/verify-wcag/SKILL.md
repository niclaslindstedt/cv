---
name: verify-wcag
description: "Use to verify WCAG 2.2 conformance for the things axe-core can't catch. The Accessibility workflow (`.github/workflows/a11y.yml`) covers the machine-checkable rules; this skill walks the manual checklist for keyboard operability, focus order, screen-reader semantics, motion, reflow, target size, and label/alt-text quality. Interactive: audit → propose patch → apply on confirmation. Reads the WCAG 2.2 spec from `specs/wcag22.html` and the criteria index from `specs/criteria.md`."
---

# verify-wcag

Manual accessibility verification for the slice WCAG conformance that
the automated CI scan does **not** cover.

The `Accessibility` workflow (`.github/workflows/a11y.yml`) runs
`@axe-core/playwright` against the built site and gates pull requests
on every machine-checkable WCAG 2.0 / 2.1 / 2.2 Level A and AA rule.
That catches roughly 30–50% of conformance issues in practice — the
rest require human judgement, a real keyboard, and (where available) a
screen reader. This skill is that "rest".

It is **drift-reactive** (run before a release, after a UI overhaul,
when a real user reports an a11y bug, or when the WCAG 2.2 spec is
updated) and **interactive** (audit → report → propose → apply on
confirmation; never auto-rewrites markup, ARIA, or motion budgets).

## Mental model

> "axe verifies that the building blocks are spelled right; this skill
> verifies that the building blocks add up to something a keyboard or
> screen-reader user can actually use."

Practical consequences:

- A rule axe already enforces (contrast, `lang`, `<title>`, role/name
  presence, duplicate IDs) is **not** re-checked here. Re-checking it
  produces noise without finding new defects. Trust the workflow.
- A rule axe partially enforces (`1.1.1`, `1.3.1`, `2.4.4`, `2.5.8`,
  `4.1.3`) **is** re-checked here, scoped to the part the workflow
  misses. The criteria.md index marks each row **partial** /
  **no** so the gap is explicit.
- New WCAG 2.2 criteria (`2.4.11 Focus Not Obscured`, `2.5.7 Dragging
Movements`, `2.5.8 Target Size (Minimum)`, `3.2.6 Consistent Help`)
  have weak or no axe coverage. They are central to this skill.

## Bundled spec references

The skill ships the canonical W3C documents in `specs/` so audits can
run offline and stay reproducible across runs:

- [`specs/wcag22.html`](./specs/wcag22.html) — full WCAG 2.2
  Recommendation. Anchors match the SC slugs (e.g. `#focus-visible`,
  `#dragging-movements`).
- [`specs/wcag22-quickref.html`](./specs/wcag22-quickref.html) —
  "How to Meet WCAG 2.2" with sufficient & advisory techniques per SC.
- [`specs/wcag22-techniques-index.html`](./specs/wcag22-techniques-index.html)
  — index of every numbered Technique / Failure for cross-reference.
- [`specs/criteria.md`](./specs/criteria.md) — condensed routing table:
  every SC, its level, whether axe auto-checks it, and the anchor in
  `wcag22.html` to jump to.

When the catalogue below references an SC by number, open
`specs/criteria.md` first to confirm the anchor, then open
`specs/wcag22.html#<anchor>` for the normative wording.

## Tracking mechanism

The sibling file `.last-updated` holds the git commit hash of the last
successful run. Empty means "never run" — use the initial commit as
baseline.

```sh
BASE=$(cat .agent/skills/verify-wcag/.last-updated)
HEAD=$(git rev-parse HEAD)
git log --oneline "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD" -- \
  src/components/ src/styles/ src/data/cv/ src/App.tsx index.html
```

If only `src/data/cv/` JSON content moved (no schema or component
changes), most catalogue rows below can be skipped — the structure of
the page hasn't changed, only the strings inside it. The exceptions are
**alt-text quality** (`H1`) and **link-purpose quality** (`H8`), which
travel with content.

## Inputs the skill needs

- A built copy of the site running locally:
  `make build && npm run preview -- --host 127.0.0.1 --port 4173`.
  Audits run against the production bundle; `make dev` includes the
  Vite HMR overlay which can mask real focus / tab-order behaviour.
- A real keyboard. Most checks below are keyboard sweeps — Tab,
  Shift+Tab, Enter, Space, Escape, arrow keys.
- Optional: a screen reader. macOS VoiceOver (`Cmd+F5`), NVDA on
  Windows, or Orca on Linux. Several catalogue rows degrade to
  best-effort without one; surface to the user that the SR check
  was skipped.
- Browser DevTools' Accessibility / Tree pane open, plus the
  "Emulate vision deficiencies" and "Emulate prefers-reduced-motion"
  toggles.
- A device or DevTools touch-emulation viewport at 320×800 for reflow
  tests.

## Hazard catalogue

Walk this catalogue end-to-end on every run. Each row is one manual
check, scoped to a specific component / file pair. Rows are numbered
`H1`, `H2`, … so findings can cite them. Order is principle → SC.

> Citations refer to the SC by number; jump via
> `specs/criteria.md` → `specs/wcag22.html#<anchor>`.

### H1 — Alt text and accessible name _quality_ (SC 1.1.1, 2.5.3)

axe verifies `alt` is present and not equal to the filename. It
does **not** verify the alt text actually describes what the image
conveys, or that an `aria-label` matches the visible text in
clickable controls.

**Audit:**

```sh
grep -RnE '<img\b|aria-label=|alt=' src/components/ src/data/cv/
```

For every match, ask:

- For decorative images (icons that duplicate adjacent text), is the
  `alt=""` or `aria-hidden="true"`? `FocusGlyph.tsx`, `TrackIcon.tsx`,
  `NoteIcon.tsx`, `ResetIcon.tsx` are decorative SVGs — they should be
  `aria-hidden="true"` unless they carry standalone meaning.
- For meaningful images (project screenshots, the OG image referenced
  by share metadata), does the alt text describe what the image
  _conveys_ (not "image of X" or filename)? `src/data/cv/projects.json`
  fields like `imageAlt` are the source.
- For controls whose accessible name is `aria-label`, does the label
  match the visible text? SC 2.5.3 fails if a button reads "Save" but
  has `aria-label="Submit"`. Voice control users speaking the visible
  word can't activate it.

**Fix pointers:** edit the `alt` / `aria-label` strings in the
component or in `src/data/cv/<category>.json`. Add the corresponding
i18n string for both `en` and `sv` locales.

### H2 — Reading order and meaningful sequence (SC 1.3.2)

The DOM order must produce a sensible CV narrative when read top-to-bottom by a
screen reader, regardless of CSS-driven visual reflow. The site uses CSS Grid
in several sections (Focus tiles, Skills bars, Languages chips) — Grid's
`order` and `grid-area` can de-couple visual order from DOM order.

**Audit:**

```sh
grep -RnE 'order:\s*[-0-9]|grid-(row|column|area)' src/styles/
```

For each match:

1. Open the corresponding component.
2. Read the JSX top-to-bottom — that is the SR reading order.
3. Compare against the visual order in the rendered page.
4. If they diverge, either reorder the JSX or remove the CSS
   reordering. Never use `tabindex` to "fix" reading order — it only
   affects focus, not SR.

**Known-fine baseline:** `Focus.tsx`, `Skills.tsx`, `Languages.tsx`,
`Hero.tsx` were verified at the time of skill authoring. New grid /
flexbox layouts are the drift this row catches.

### H3 — Use of color (SC 1.4.1)

axe checks **contrast**, not whether color is the _sole_ differentiator.
Categories where the site historically signals state with color alone:

- `Focus.tsx` cybersecurity / AI / etc. category tiles — the colored
  glyph background must be paired with an icon or text label
  (`FocusGlyph.tsx` does this).
- `Skills.tsx` skill bars — the bar fill is colour-coded by tier; the
  numeric / textual tier label must also be visible (it is).
- `GitHub activity` heatmap (if present) — the colour scale must have
  a textual tooltip on hover/focus reading the commit count.
- Project status chips (`active`, `archived`, etc.) — the chip text
  carries the meaning, the colour is decoration.

**Audit:**

Open each section in the rendered site under `Cmd-Shift-P` →
"Emulate vision deficiencies" → "Achromatopsia". If meaning is lost,
the colour was load-bearing.

### H4 — Reflow at 320 CSS px (SC 1.4.10)

Content must be usable at 320×256 viewport without horizontal scrolling
(except for tables, maps, code, and unavoidable wide content). The
timeline is the obvious candidate for an exception — it has its own
horizontal scroll container and is documented as such.

**Audit:**

1. Open DevTools → Responsive viewport at 320×800.
2. Walk the page top to bottom.
3. Confirm no horizontal scrollbar on the **document**. The Timeline's
   `.timeline-vis-viewport` may scroll horizontally; the document body
   may not.
4. Confirm modals (`SearchModal`, `ProjectModal`, `FocusModal`,
   `SkillModal`, `CourseMomentsModal`, `ExperienceModal`,
   `CompanyModal`, `ProgramCoursesModal`, `SummaryModal`) fit and are
   dismissible at this width.

**Fix pointers:** width-locking (`min-width`, fixed `width`, large
`padding`) in the affected component's CSS partial under `src/styles/`.

### H5 — Resize text to 200 % (SC 1.4.4) and text spacing (SC 1.4.12)

Browser zoom (Cmd/Ctrl+`+`) to 200 % must keep text readable without
loss of content or function. The site uses `clamp()` in `tokens.css`
for fluid typography; verify that the upper bound still scales with
zoom.

**Audit:**

1. Zoom to 200 % at 1280×800. Walk the page; confirm no clipped
   headings, no overlapping rows.
2. With the page open, paste this into the console and re-walk:

   ```js
   document.documentElement.style.setProperty(
     "line-height",
     "1.5",
     "important",
   );
   document.documentElement.style.setProperty(
     "letter-spacing",
     "0.12em",
     "important",
   );
   document.documentElement.style.setProperty(
     "word-spacing",
     "0.16em",
     "important",
   );
   for (const p of document.querySelectorAll("p,li,dt,dd")) {
     p.style.setProperty("paragraph-spacing", "2em", "important");
   }
   ```

3. Nothing should clip, overlap, or disappear (SC 1.4.12).

### H6 — Content on hover or focus (SC 1.4.13)

Tooltips and hover-revealed content (project tooltips, focus tile
hover details, GitHub activity tooltips, skill bar tooltips) must
satisfy the "**dismissible, hoverable, persistent**" trio:

- **Dismissible.** The user can dismiss the popover _without moving
  the pointer or focus_. Pressing Escape must work, even when the
  popover was triggered by hover.
- **Hoverable.** The user can move the pointer over the popover
  content itself without it disappearing — for screenreader-magnifier
  users.
- **Persistent.** The popover stays visible until the user dismisses
  it, the trigger is no longer hovered/focused, _or_ the information
  is no longer valid.

**Audit:**

1. Hover a project chip on `Projects.tsx`. Move the pointer onto the
   tooltip — does it stay? Press Escape — does it close?
2. Same for the timeline detail popover.
3. Same for skill / language / focus tile hover tooltips.

**Fix pointer:** `useTooltip*` hooks (if any) and the corresponding
component. The fix is usually adding an Escape listener and a
`pointerleave` delay so the popover survives the pointer transition.

### H7 — Keyboard operability of every interactive element (SC 2.1.1, 2.1.2)

Every clickable element must also be operable via Enter / Space, and
Tab must reach it without a pointer. Custom widgets (anything that
isn't a native `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`)
are the high-risk surface.

**Custom widget inventory on this site:**

| Widget                                                                   | Source                         | Expected keys                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Theme switcher                                                           | `FloatingControls.tsx`         | Tab focuses, Enter/Space toggles, focus stays on control                                              |
| Lang switcher                                                            | `FloatingControls.tsx`         | Tab focuses, Enter/Space toggles language; page reloads cleanly                                       |
| Search trigger                                                           | `FloatingControls.tsx`         | Tab focuses, Enter/Space opens modal; focus moves into input                                          |
| Search modal input + list                                                | `SearchModal.tsx`              | Up/Down navigate results, Enter opens, Escape closes                                                  |
| Project / focus / course / experience / company / skill / summary modals | `*Modal.tsx`                   | Tab cycles inside modal, Shift+Tab cycles backwards, Escape closes, focus returns to invoking element |
| Timeline zoom controls                                                   | `Timeline.tsx`                 | Tab focuses zoom buttons; Enter/Space activates                                                       |
| Timeline drag-to-pan                                                     | `Timeline.tsx`                 | Must have a non-drag alternative (Tab to it, arrow keys to pan)                                       |
| `<details>` summary                                                      | `Experience.tsx` (assignments) | Enter/Space toggles; Tab continues into expanded content                                              |

**Audit:**

1. Hide the pointer (do not move the mouse). Tab from the address bar
   into the page.
2. Walk every interactive element. For each one, confirm:
   - It receives focus (visible indicator — see H10).
   - The expected key activates it.
   - Activation does not trap focus elsewhere unexpectedly.
3. Open each modal. Confirm Tab cycles only within the modal, Escape
   closes the modal, and focus returns to the element that opened it.
4. For Timeline drag, confirm a keyboard-only path exists. If only
   pointer drag works, that is a SC 2.1.1 + 2.5.7 failure.

**Fix pointers:** modal focus management lives inline in each `*Modal.tsx`
component. Look for `useEffect` with `addEventListener("keydown", …)`
and a focus-trap pattern. Missing? That's the patch.

### H8 — Tab / focus order matches visual order (SC 2.4.3)

Even when every element is reachable, the **order** must follow the
visual reading order. CSS `flex-direction: row-reverse`, `order`,
`position: absolute`, or `tabindex > 0` can break this.

**Audit:**

```sh
grep -RnE 'tabindex="?[1-9]|flex-direction:\s*(row-reverse|column-reverse)|order:\s*[-0-9]' src/components/ src/styles/
```

For each match, confirm the focus order still matches visual order
when tabbed. `tabindex="0"` is fine; `tabindex` ≥ 1 almost always
breaks 2.4.3 and should be replaced with DOM reorder.

### H9 — Link / button purpose from text alone (SC 2.4.4, 2.4.6)

axe flags empty link text. It does **not** flag links whose text
is "click here", "more", "→", "View", or just an emoji — generic
descriptors that fail in a screen reader's link list.

**Audit:**

```sh
grep -RnE '>(?:click here|read more|here|more|view|details|→|↗)' src/components/ src/data/cv/
```

For each match, the link text in isolation must describe the
destination. Acceptable patterns: "View on GitHub", "Read the
Languages.dev case study", "Open project repo". Unacceptable: "View",
"Read more", "Here".

`Projects.tsx` and `FocusModal.tsx` are the highest-risk surfaces — they
render lots of secondary action links.

### H10 — Focus visible (SC 2.4.7)

Every focusable element must have a visible focus indicator. The site's
focus contract (`docs/DESIGN.md` §12) is `outline: 2px solid var(--focus-ring)`
with adequate offset.

**Audit:**

1. Tab through every interactive element with a real keyboard.
2. For each one, confirm a visible ring (or equivalent) appears.
3. Pay attention to overlapping elements where the outline could be
   obscured by a sibling — chips, tooltips, sticky headers.

**Fix pointers:** `tokens.css` `--focus-ring` token; per-component
`*:focus-visible` rules in the matching CSS partial. Never delete
`outline` without replacing it with an equally-visible alternative.

### H11 — Focus not obscured (SC 2.4.11) ★ WCAG 2.2

When an element receives focus, no other content (sticky header,
floating controls, modals) may _fully_ obscure it. Partial obscurity
is allowed at this level (Minimum); SC 2.4.12 (Enhanced, AAA) bans
partial obscurity too.

**Audit:**

1. Resize the viewport to 1280×600 (short, to force overlap).
2. Tab through the page slowly. After each tab, confirm the focused
   element is **at least partially visible** — never fully hidden by
   `FloatingControls` (bottom-right) or any sticky element.
3. Repeat at 390×600 mobile.

**Fix pointer:** `scroll-margin-top` / `scroll-margin-bottom` on the
focusable element so the browser's default scroll-into-view leaves
breathing room around any sticky overlay.

### H12 — Pause / stop / hide moving content (SC 2.2.2)

The `CelestialSky.tsx` canvas paints stars on `requestAnimationFrame`.
Anything that moves longer than 5 s, blinks, or auto-updates must
honour `prefers-reduced-motion: reduce`.

**Audit:**

1. DevTools → Rendering → "Emulate CSS media feature
   prefers-reduced-motion: reduce".
2. Reload. The CelestialSky should freeze (or render a static frame /
   not render at all). Parallax in Hero, hover transitions in tile
   grids, and modal entry animations should also collapse to instant.
3. Grep guard:

   ```sh
   grep -RnE 'prefers-reduced-motion|requestAnimationFrame|@keyframes' src/components/ src/styles/
   ```

   Every `@keyframes` rule should appear inside (or be guarded by) a
   `@media (prefers-reduced-motion: no-preference)` block, **or** the
   component reading it must check `matchMedia` and short-circuit.

**Fix pointer:** `CelestialSky.tsx` already gates the RAF loop on
`matchMedia("(prefers-reduced-motion: reduce)").matches`. Verify the
gate is honoured after any refactor. Add the same gate to any new
animation-driving component.

### H13 — Pointer gestures and dragging movements (SC 2.5.1, 2.5.7)

Multi-point gestures (pinch-zoom, two-finger swipe) and _path-based_
gestures (drag along a path) must have a single-pointer alternative.
The Timeline's drag-to-pan and pinch-to-zoom are the only known
candidates on the site.

**Audit:**

1. Open the timeline. Confirm:
   - Drag-to-pan works (pointer / touch).
   - Pinch-to-zoom works on touch devices.
2. Confirm a _non-drag_ alternative exists for both:
   - Tab to a "scroll left / scroll right" affordance and use
     Enter/Space, or
   - Tab into the viewport and arrow-keys pan.
3. Confirm a _non-pinch_ zoom alternative exists (e.g. `+` / `−`
   buttons in `Timeline.tsx`).

If a single-pointer alternative does not exist, it's a SC 2.5.7 fail
(WCAG 2.2 AA). Surface to the user.

### H14 — Pointer cancellation (SC 2.5.2)

Single-pointer activation must complete on the **up-event**, not the
down-event, or provide an undo. Native `<button>` handles this; custom
`onMouseDown` handlers do not.

**Audit:**

```sh
grep -RnE 'onMouseDown|onPointerDown|onTouchStart' src/components/
```

For each match, confirm activation either:

- happens on `onClick` / `onMouseUp` instead, or
- is reversible (e.g. drag-cancellation), or
- the down-event is purely visual feedback with no side-effect.

### H15 — Target size minimum, 24×24 CSS px (SC 2.5.8) ★ WCAG 2.2

Every pointer target must be at least 24×24 CSS pixels, **or** spaced
so a 24×24 circle around its centre touches no other target. Exceptions
exist for inline links inside paragraphs and for legal/agreed-with-user
UI (the spec lists them).

**Audit:**

```sh
grep -RnE 'min-width|min-height|width:|height:|padding:|gap:' src/styles/floating-controls.css src/styles/projects.css src/styles/focus.css src/styles/skills.css src/styles/timeline-vis.css | grep -E '[0-9]+px'
```

Then in DevTools, inspect each interactive element on mobile (390×844)
and confirm the _hit-box_ (border + padding extent) is ≥ 24×24. The
chips on `Projects.tsx`, the FloatingControls buttons, and the
Timeline zoom buttons are the highest-risk surfaces.

**Fix pointer:** add `min-block-size: 24px; min-inline-size: 24px;` to
the offending control, or increase `padding`.

### H16 — Status messages announced to assistive tech (SC 4.1.3)

axe partially covers this — it checks for `role="status"` /
`role="alert"` presence — but not whether the _content_ of those
regions actually changes when state updates. The relevant surfaces:

- `SearchModal.tsx` — when results count changes ("3 of 17"), an
  `aria-live="polite"` region (or `role="status"`) should announce
  the new count without stealing focus.
- Modal opens — `role="dialog"` + `aria-modal="true"` (axe checks
  this) but also: an `aria-labelledby` referencing the dialog's
  visible heading.
- Theme / lang switches — if they swap visible content without
  reload, the change should be announced. Lang switch reloads the
  page so SC 3.2.2 / 3.2.5 implicitly cover it; theme switch is
  cosmetic only and needs no announcement.

**Audit:** open each modal and the search panel with a screen reader
attached (or DevTools → Accessibility tree), perform the action, and
confirm the new state is announced.

### H17 — On-focus / on-input do not change context (SC 3.2.1, 3.2.2)

Tabbing into a control must not navigate, open a modal, or submit
a form. Typing into an input must not, either. `FloatingControls.tsx`
language switcher uses `<button>` (not `<select onChange>`), so
selecting it requires Enter/Space — that is a deliberate user gesture,
not a focus or input event, and is fine.

**Audit:**

```sh
grep -RnE 'onFocus|onBlur|onChange' src/components/
```

For each `onChange` / `onFocus` handler, confirm it does not navigate,
open a modal, or otherwise change context. Visual changes (highlight,
hover state) are fine.

### H18 — Consistent help (SC 3.2.6) ★ WCAG 2.2

If the site offers a help mechanism (contact, support, link to source,
documentation), it must appear in a consistent location across pages.
The site is a single-page CV, so the "consistent location" is "the
same place on every render". Confirm:

- Contact link / email is in the same spot in every locale (`en`, `sv`).
- The "View source" link in `FloatingControls` (or wherever it lives)
  doesn't move between viewports.

This is a weak SC for a single-page site but flag it if a future
multi-page split lands.

### H19 — Language of parts (SC 3.1.2)

Snippets in a different language from the page's `<html lang>` must
declare their own `lang`. `src/data/cv/*.json` mixes English and
Swedish; `data/cv.json` carries `lang` directives per locale.

**Audit:**

```sh
grep -RnE '"en"\s*:|"sv"\s*:' src/data/cv/ | head -20
```

When a Swedish page renders an English-only proper noun (e.g. a
project codename or a quoted phrase) and vice versa, confirm the
component wraps it in `<span lang="en">…</span>`. Component-level
audit:

```sh
grep -RnE 'lang=' src/components/ src/App.tsx
```

This is a weak SC in practice for the CV's content shape — most
words are proper nouns and the lang attribute may be over-engineering.
Apply judgement; surface to the user.

## Behaviour: audit, propose, apply with confirmation

Mirrors `sync-cross-browser`. Never auto-applies invasive changes.

1. **Audit.** Walk the catalogue end-to-end (H1 → H19). Run each grep,
   open the rendered site, exercise the interaction, record findings.
2. **Report.** Print findings grouped by hazard.
   Format: `[H7] Timeline.tsx — drag-to-pan has no keyboard alternative
(SC 2.1.1, 2.5.7)`. Order by hazard, then file, then line.
3. **Propose.** For each finding, draft a concrete patch (file +
   suggested edit + which SC it satisfies). Group related patches into
   batches by hazard. Show each batch as a unified diff before
   applying.
4. **Apply with confirmation.** Wait for the user to approve each
   batch ("apply H7 batch", "skip H15 batch", "revise H1"). Do not
   apply more than one batch without explicit approval.
5. **Re-audit.** After applying any batch, re-run the audit for the
   touched hazards and report residual findings. Run `make test-a11y`
   to confirm the patch did not regress the automated gate.
6. **Stop on judgment calls.** Do not invent ARIA — wrong ARIA is
   worse than no ARIA. Do not collapse hover-only affordances into
   click-only "fixes" without confirming the visual design intent.
   Do not bypass `prefers-reduced-motion` to "make the animation work
   for everyone". Surface the trade-off and ask.

## What this skill must NOT do

- Do not duplicate axe-core's checks. If the criteria index says
  **yes** under Auto?, trust the workflow.
- Do not add ARIA roles or attributes that duplicate native semantics
  (`role="button"` on a `<button>`, `aria-label` that repeats the
  button text). The first rule of ARIA is "no ARIA is better than
  bad ARIA".
- Do not loosen the AA gate in `tests/a11y/site.test.ts` to silence a
  finding. The gate is configured to fail on real WCAG violations.
- Do not edit `docs/DESIGN.md` to retro-justify a finding. Visual
  changes route through `sync-design`; this skill stays at the
  semantic / behavioural layer.
- Do not commit screen-reader transcripts or recorded interaction
  videos. Findings are summarised in commit messages and PR bodies.

## Verification

After every applied batch, and once at the end of the run:

- `make fmt` — format any touched JSX / CSS.
- `make fmt-check` — confirm formatting is clean.
- `make lint` — TypeScript + ESLint pass.
- `make build` — production build succeeds.
- `make test` — Vitest schema / unit tests still pass.
- `make test-a11y` — axe scan still green; the patch did not
  regress automated A/AA conformance.
- `make test-visual` — visual snapshots still match (a11y fixes that
  add `aria-*` attributes are invisible to Playwright, but ones that
  change layout — e.g. raising a target's `min-height` — will move
  pixels and require `debug-visual`).

All seven commands must pass before the run is considered successful.
On success, write the new `HEAD` hash to
`.agent/skills/verify-wcag/.last-updated`.

## Skill self-improvement

If a run surfaces a hazard class the catalogue does not yet cover —
a new SC, a new component pattern, a new failure mode — append a new
`Hxx` row above with: SC reference, audit grep / procedure, fix
pointer. The catalogue is the long-lived memory of this skill;
without the append, the next run misses the class entirely.

When WCAG is updated (e.g. the W3C publishes WCAG 2.3 or amends a 2.2
SC), refresh `specs/` from
[`https://www.w3.org/TR/WCAG22/`](https://www.w3.org/TR/WCAG22/),
[`https://www.w3.org/WAI/WCAG22/quickref/`](https://www.w3.org/WAI/WCAG22/quickref/),
and [`https://www.w3.org/TR/WCAG22/all.html`](https://www.w3.org/TR/WCAG22/all.html).
Update `criteria.md` to reflect any added / removed / renumbered SC,
and adjust the catalogue rows that referenced changed criteria.
