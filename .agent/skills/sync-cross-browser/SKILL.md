---
name: sync-cross-browser
description: "Use when CSS may render or behave differently across Safari, Chrome, and Firefox. Treats Safari as the source of truth (the author codes on Safari), audits src/styles/ for known cross-browser hazards, optionally diffs live renders via Playwright's webkit/chromium/firefox engines, and applies fixes that bring Chrome and Firefox in line with Safari without regressing Safari."
---

# sync-cross-browser

Bring Chrome and Firefox renderings in line with **Safari**, the
browser the author codes the site in. Safari is the master; Chrome and
Firefox are the conformance targets.

This skill is **drift-reactive** (run when CSS in `src/styles/` has
moved, when a fresh feature lands, or when a real cross-browser bug
report comes in) and **interactive** (audit → propose → apply on
confirmation; never auto-rewrites tokens or touches `docs/DESIGN.md`
rules).

## Mental model

> "Safari is right. If Chrome or Firefox look or behave differently,
> the **rule** is wrong, not Safari."

In practice that means:

- Add the missing standard property when the project only has the
  `-webkit-` prefix (Firefox needs the unprefixed form).
- Add the missing `-webkit-` prefix when the project only has the
  standard form (some Safari/iOS features still require the prefix).
- Keep the value Safari already renders. Do **not** retune blur radii,
  saturation, opacities, or motion timings to "match" Chrome — those
  are Safari-calibrated and `docs/DESIGN.md` §6.2 owns them.
- Tokenised opacity bumps (`--glass-bg-modal`) that compensate for
  Firefox/Edge under-rendering of nested `backdrop-filter` are
  intentional. Do **not** remove them.

## Tracking mechanism

The sibling file `.last-updated` holds the git commit hash of the
last successful run. Empty means "never run" — use the initial commit
as the baseline.

```sh
BASE=$(cat .agent/skills/sync-cross-browser/.last-updated)
HEAD=$(git rev-parse HEAD)
git log --oneline "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD" -- \
  src/styles/ src/components/ playwright.config.ts
git diff --name-only "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD" -- \
  src/styles/ src/components/ playwright.config.ts
```

If only `src/data/` changed since the baseline, exit early — content
edits cannot introduce cross-browser CSS drift.

## Hazard catalogue

The site's CSS lives entirely under `src/styles/` (18 files,
~3.9k lines). Walk this catalogue end-to-end on every run. Each row
describes a class of cross-browser drift, the property pattern that
triggers it, the audit command, and the Safari-anchored fix.

### 1. `backdrop-filter` — must be paired with `-webkit-backdrop-filter`

| Affected browsers    | Symptom                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Safari (macOS + iOS) | Nothing happens without the `-webkit-` prefix; the panel turns into a flat translucent rectangle.                                                                                                                                                                                                                       |
| Firefox + Edge       | Render the unprefixed form, but **under-render nested** `backdrop-filter` (a modal stacked inside an overlay; the timeline detail popover inside a transformed scroll container). The token system already compensates via `--glass-bg-modal: rgba(14, 20, 32, 0.82)` (see `tokens.css:5–11`). Do not weaken the alpha. |

**Audit:**

```sh
grep -nE 'backdrop-filter|-webkit-backdrop-filter' src/styles/*.css
```

For every selector that declares one form, the **other** form must
appear on an adjacent line with the same value. Order: `-webkit-`
first, unprefixed second (so the standard wins where both are
honoured).

**Known-good baseline** — every `backdrop-filter` rule across these
files has the pair: `education.css`, `experience.css`,
`floating-controls.css`, `focus.css`, `languages.css`, `modals.css`,
`projects.css`, `search.css`, `timeline-vis.css`. A new rule that
breaks the pair is the drift this row exists to catch.

### 2. `mask` / `mask-composite` — Firefox needs the unprefixed pair

`src/styles/sky.css` `.glass-reflect` is the canonical example: it
ships `-webkit-mask` + `-webkit-mask-composite: xor` and unprefixed
`mask-composite: exclude`, but **no** unprefixed `mask:` shorthand. In
Firefox the mask never engages and the rim-light ring renders as a
solid block.

**Audit:**

```sh
grep -nE '(-webkit-)?mask(-composite)?\s*:' src/styles/*.css
```

For every selector with a `-webkit-mask` declaration, an unprefixed
`mask` declaration with the same value must follow. Same for
`mask-composite`. Safari accepts both; Firefox accepts only
unprefixed; Chromium accepts both.

**Safari-anchored fix:** add the unprefixed form **after** the
prefixed form. Never remove the `-webkit-` line — older WebKit still
wants it.

### 3. `font-smoothing` — Firefox/macOS needs `-moz-osx-font-smoothing`

`base.css:11` declares `-webkit-font-smoothing: antialiased` only.
Firefox on macOS keeps default subpixel rendering, which makes the
hero name read fractionally heavier than in Safari/Chrome.

**Audit:**

```sh
grep -nE 'font-smoothing' src/styles/*.css
```

**Fix:** in the same rule, add `-moz-osx-font-smoothing: grayscale;`.
Apply once in `base.css`. Do not propagate elsewhere — the global
`html, body` rule covers the whole tree.

### 4. `<details>` / `<summary>` disclosure marker

`experience.css:246` hides the WebKit/Blink marker via
`::-webkit-details-marker { display: none }`. Firefox uses the
standard `::marker` pseudo (or the `list-style` shorthand on the
`summary`), so it still shows the default triangle next to the
custom chevron the project draws via `summary::before`.

**Audit:**

```sh
grep -nE '(-webkit-details-marker|summary[^{]*::marker|list-style)' src/styles/*.css
```

**Fix:** in the same selector that hides the WebKit marker, also set
either `list-style: none;` on the `summary` or `summary::marker {
content: ""; }`. Safari accepts both; the `list-style` form is the
shorter, broader fix.

### 5. Search input native UI (`<input type="search">`)

`search.css` uses `::-webkit-search-cancel-button` to skin the clear
button. Firefox does not render a native cancel button at all —
acceptable degradation, but flag it. Safari additionally rounds the
field by default; the project resets it via `appearance: none` on
`.search-modal-input` (line 109). Confirm the reset is present any
time a new `<input type="search">` lands.

**Audit:**

```sh
grep -nE 'type=.search.|::-webkit-search|appearance' src/styles/*.css src/components/*.tsx
```

### 6. Viewport units — `100dvh` / `100lvh` / `100svh`

`base.css:16–17` and `:24–25` correctly layer `100dvh` then `100lvh`
as a fallback for the html/body root. `timeline-vis.css:6` uses
`100svh` with no fallback. Modern browsers (Safari 15.1+, Chrome
108+, Firefox 101+) accept all three; older Safari (which this site
targets, but has not exhaustively tested) collapses to nothing.

**Audit:**

```sh
grep -nE '100(dvh|lvh|svh|dvw|lvw|svw)' src/styles/*.css
```

**Fix:** for any new `100svh|100lvh|100dvh` rule, ensure either an
older `100vh` line precedes it (cascade fallback) or the rule lives
inside `@supports (height: 100svh)`. Do **not** rewrite the existing
`base.css` `100dvh → 100lvh` cascade — it is Safari-correct.

### 7. `display: contents`

`projects.css:135` uses `display: contents` on `.project-meta-row`.
Safari ≥ 16.4 and Chrome ≥ 65 and Firefox ≥ 37 honour it; older
Safari (≤ 16.3) collapses the row into a normal block and breaks
the meta grid.

**Audit:**

```sh
grep -nE 'display:\s*contents' src/styles/*.css
```

**Fix:** for new uses, gate behind `@supports (display: contents)`
and provide a flat-grid fallback. Existing usage is not retroactively
gated; only add the gate if a new display:contents rule is introduced
or the user reports an old-Safari bug.

### 8. `:has()` selectors

`projects.css:104`, `education.css:24`. Safari 15.4+, Chrome 105+,
Firefox 121+. On older browsers the rule silently no-ops; the
non-`:has()` styling on the same element still renders. Acceptable
graceful degradation.

**Audit:**

```sh
grep -nE ':has\(' src/styles/*.css
```

No fix unless the user reports an issue on an unsupported browser.

### 9. Sticky positioning inside transformed / scrollable parents

`timeline-vis.css:196` makes `.timeline-vis-axis` sticky inside
`.timeline-vis-viewport` (which has its own `overflow` and
transforms). Safari historically de-stickies sticky children of
transformed ancestors. Audit by reading the rule and tracing the
ancestor chain: if any ancestor between sticky child and scroll
container has `transform`, `filter`, or `will-change: transform`,
sticky breaks in Safari.

**Audit:**

```sh
grep -nE 'position:\s*sticky' src/styles/*.css
```

For each match, walk the parent chain in the corresponding TSX
component and grep for `transform|filter|will-change` in the
ancestors' CSS rules.

**Fix:** if a transform-bearing ancestor is found, either remove the
transform or replace the sticky with a JS-driven alternative. Do not
silently delete the sticky — surface to the user.

### 10. `overscroll-behavior`

Safari 16+, Chrome 63+, Firefox 59+. Used in `search.css:66` and
`timeline-vis.css:181`. The site already locks body scroll in JS via
`useBodyScrollLock` while modals are open, so the CSS is a defense in
depth. No fix unless older-Safari support is required.

### 11. `env(safe-area-inset-*)`

`timeline-vis.css:98–100` reads notch insets. Safari and modern
Chromium honour it (with `viewport-fit=cover`); Firefox mobile
ignores it. Acceptable.

### 12. `clip-path` polygons

`sky.css:114–123` uses polygon `clip-path` on `.star`. Safari 15.4+
respects it; older Safari renders the unclipped element. Acceptable
graceful degradation; do not duplicate as `-webkit-clip-path` (no
longer needed).

### 13. `-webkit-line-clamp` block

`search.css:268–270` uses the canonical three-line recipe:

```css
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
```

Firefox aliases all three properties; this works everywhere. **Do
not** "modernise" to the new `line-clamp` standard property until it
actually ships in Safari — Safari currently still requires the
prefixed trio.

### 14. Print preview discrepancies (`@media print`)

`print.css` (413 lines) is the print stylesheet. Cross-browser
quirks:

- Safari is the most generous with `@page` margins and background
  colour preservation.
- Chrome strips colours when "Background graphics" is off; the site
  forces `color-scheme: light` (`print.css:22`) and uses opaque
  tokens, which is correct.
- Firefox honours `break-*` properties identically to Chromium; both
  redundant `break-after` + `page-break-after` lines must remain
  (they are paired throughout `print.css`).

**Audit:**

```sh
grep -nE '@page|break-(inside|before|after)|page-break' src/styles/print.css
```

A new `@page` rule must include a Safari test in the report. There is
no automated check.

### 15. Form control reset (`appearance: none`)

Every interactive element that overrides native UI (buttons, inputs,
selects) must declare `appearance: none`. Safari renders chrome
buttons and search inputs with their own border-radius and
background-attachment otherwise. The current codebase covers all of
them; flag any new button without it.

**Audit:**

```sh
grep -nE '<(button|input|select|textarea)\b' src/components/*.tsx \
  | grep -vE 'appearance|className.*-btn|className.*-input'
```

Cross-reference each match with the corresponding CSS file to confirm
`appearance: none` is set.

### 16. Scrollbar styling

The repo currently does not style scrollbars (`grep -E
'scrollbar-(width|color)|::-webkit-scrollbar'` returns no matches).
If scrollbar styling is added, it must declare both:

- `scrollbar-width: thin;` + `scrollbar-color: <thumb> <track>;`
  (Firefox standard properties)
- `::-webkit-scrollbar { ... }` rules (Safari/Chromium)

Either alone produces drift.

### 17. `outline-offset` on rounded buttons

Safari draws the focus outline tracing the border-radius perfectly;
Chrome and Firefox sometimes show a faintly-jagged inner edge at the
corners. Visual only; do not "fix" by switching to box-shadow rings,
which breaks the colour-tokenised focus contract in `docs/DESIGN.md`
§12. Surface as informational, not actionable.

### 18. `gap` / grid `auto-fit` / logical properties

All well-supported in modern browsers. Listed for completeness; no
audit needed.

## Live render diff (optional, on demand)

When the audit catalogue does not surface the discrepancy the user
reported (e.g. "the hero looks different in Firefox") and a live
visual diff is needed, drive Playwright's three engines manually
without touching the committed `playwright.config.ts`:

```sh
make build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort &
npx playwright install webkit firefox chromium

# webkit (Safari) — the master
npx playwright screenshot --browser=webkit --viewport-size=1280,800 \
  --full-page http://127.0.0.1:4173/ /tmp/cv-webkit.png
# chromium
npx playwright screenshot --browser=chromium --viewport-size=1280,800 \
  --full-page http://127.0.0.1:4173/ /tmp/cv-chromium.png
# firefox
npx playwright screenshot --browser=firefox --viewport-size=1280,800 \
  --full-page http://127.0.0.1:4173/ /tmp/cv-firefox.png
```

Then diff `/tmp/cv-webkit.png` against the other two with any pixel
diff tool the agent has, or open them side-by-side in the report.
**Webkit is the reference**; differences in the other two are drift.

Do **not** add `webkit` or `firefox` projects to the committed
`playwright.config.ts`. The visual workflow is calibrated for
`chromium-desktop` + `chromium-mobile` only and the baselines under
`tests/visual/__screenshots__/` were recorded against Chromium on
Linux. A multi-engine matrix is a separate, larger PR.

## Behaviour: audit, propose, apply with confirmation

This skill **never** auto-applies invasive changes. The flow:

1. **Audit.** Walk the hazard catalogue end-to-end, running each
   `grep` and reading the matched lines in context. Collect every
   drift finding with file, line, and a one-line diagnosis.
2. **Report.** Print findings grouped by hazard number.
   Format: `[H2] src/styles/sky.css:228 — -webkit-mask without
unprefixed mask; Firefox renders no mask`. Order by hazard, then
   file, then line.
3. **Propose.** For each finding, draft a concrete patch (file +
   suggested edit). Group related patches into batches by hazard
   number. Show the batch as a unified diff before applying.
4. **Apply with confirmation.** Wait for the user to approve each
   batch ("apply mask batch", "skip details-marker batch", "revise").
   Do not apply more than one batch without explicit approval.
5. **Re-audit.** After applying any batch, re-run the matched grep
   commands over the changed files and report residual drift.
6. **Stop on judgment calls.** Do not retune Safari-correct values
   (blur radii, opacities, motion timings, `--glass-bg-modal` alpha).
   Do not silently delete sticky / display:contents / `:has()`
   declarations — surface them and ask first.

## What this skill must NOT do

- Do not retune visual tokens (`tokens.css`) to make Firefox or
  Chrome match Safari. Tokens are Safari-calibrated; Chrome/Firefox
  drift is fixed in property syntax, not values.
- Do not remove `-webkit-` prefixes that are still load-bearing
  (`-webkit-line-clamp`, `-webkit-mask`, `-webkit-search-cancel-button`,
  `-webkit-tap-highlight-color`).
- Do not add `webkit` or `firefox` projects to the committed
  `playwright.config.ts`.
- Do not re-record visual snapshots under
  `tests/visual/__screenshots__/`. That is `debug-visual`'s job.
- Do not edit `docs/DESIGN.md` rules. Cross-browser parity is
  property-level; design-level changes route through `sync-design`.

## Verification

After every applied batch, and once at the end of the run:

- `make fmt` — format any touched CSS.
- `make fmt-check` — confirm formatting is clean.
- `make lint` — TypeScript + ESLint pass.
- `make build` — production build succeeds.
- `make test-visual` — Chromium snapshots still match. **A failure
  here means the patch perturbed Chromium rendering**; re-read the
  patch before re-recording any baseline (and prefer to call
  `debug-visual` to walk through it rather than re-recording in this
  skill).

All five commands must pass before the run is considered successful.
On success, write the new `HEAD` hash to
`.agent/skills/sync-cross-browser/.last-updated`.

## Skill self-improvement

If a run surfaces a hazard class the catalogue does not yet cover
(a new property, a new prefix, a new browser-specific bug), append a
new numbered row above with: affected browsers, symptom, audit grep,
Safari-anchored fix. The catalogue is the long-lived memory of this
skill; without the append, the next run misses the class entirely.

When a `-webkit-` prefix becomes load-free (the standard property
finally ships in Safari and the prefix can be dropped without
regressing iOS), update the corresponding row to remove the prefix
from the "must keep" list and add a row to the **What this skill
must NOT do** section's exceptions. Do not silently delete prefixes
without updating the catalogue.
