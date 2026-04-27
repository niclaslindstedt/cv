---
name: sync-design
description: "Use when the implementation may have drifted from docs/DESIGN.md. Audits src/styles/ and src/components/ section-by-section against the design document, proposes patches, and applies them on confirmation."
---

# sync-design

Bring the website's CSS, tokens, and components back in sync with
`docs/DESIGN.md`, the source of truth for the visual design.

This skill is **drift-reactive** (run when the doc or the styling
moves) and **interactive** (it never auto-applies invasive changes —
it audits, proposes, and applies on confirmation).

## Tracking mechanism

The sibling file `.last-updated` holds the git commit hash of the
last successful run. An empty file means "never run" — use the
initial commit as the baseline.

## Discovery process

Determine what has changed since the baseline:

```sh
BASE=$(cat .agent/skills/sync-design/.last-updated)
HEAD=$(git rev-parse HEAD)
git log --oneline "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD" -- \
  docs/DESIGN.md src/styles/ src/components/
git diff --name-only "${BASE:-$(git rev-list --max-parents=0 HEAD)}..$HEAD" -- \
  docs/DESIGN.md src/styles/ src/components/
```

Then read `docs/DESIGN.md` end-to-end. The Implementation appendix
(§15) is the single mapping source — token map, component map,
pattern map, print map. Every audit in this skill is driven from
those tables.

## Mapping: DESIGN.md section → audit target

The doc owns the rules; these files express them. When a row's doc
section moves, audit the corresponding target. When a target moves
without a doc change, that is the drift this skill is for.

| DESIGN.md section           | Audit target                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| §3 Colour system            | `src/styles/tokens.css`; grep for raw hex / rgba in every other CSS file (any literal outside `tokens.css` is a drift signal).               |
| §4 Typography               | `src/styles/tokens.css` (font stacks); per-component CSS for font-size, weight, line-height, letter-spacing.                                 |
| §5 Spacing and layout       | Every CSS file; values must be members of the named scale (4/8/12/16/20/24/32/48). Container widths in `tokens.css` and `layout.css`.        |
| §6 Surfaces and elevation   | `src/styles/{tokens.css,base.css,modals.css,timeline-vis.css}`; backdrop-filter recipes per the table in §6.2.                               |
| §7 Iconography              | Inline SVG in `src/components/`; sizes must be members of the 4-step icon scale.                                                             |
| §8 Motion                   | Every CSS file; transition durations must be members of the 4-step timing ladder. `prefers-reduced-motion` block in `src/styles/sky.css`.    |
| §9 Components               | The Component map in §15.2. Each row → one or more files to audit against the component contract.                                            |
| §10 Patterns                | The Pattern map in §15.3.                                                                                                                    |
| §11 Voice and microcopy     | `src/data/cv/*.json`; `src/data/cv.json` (handled by `update-cv` — surface drift here only).                                                 |
| §12 Accessibility           | Per-component CSS (focus rings); component TSX (aria-label, role, tab order, semantic elements).                                             |
| §13 Print variant           | `src/data/cv/print.json`, `schemas/print.schema.json`, `src/styles/print.css`, `src/components/PrintView.tsx`, `scripts/generate-print.mjs`. |
| §14 Process                 | Not auditable — informational.                                                                                                               |
| §15 Implementation appendix | The mapping itself — verify that every CSS variable named in §15.1 exists in `tokens.css`, every component file in §15.2 exists, etc.        |

## Update checklist

Walk the codebase against the doc in this order. Each item produces
zero or more drift findings. Group findings by DESIGN.md section in
the report.

### Tokens (§3, §4, §15.1)

- [ ] Every design name in §15.1 has its mapped CSS variable defined
      in `src/styles/tokens.css`, in both the dark `:root` block and
      the light `:root[data-theme="light"]` block.
- [ ] No raw hex / `rgba(…)` literals appear outside
      `src/styles/tokens.css`. Known exceptions tracked in §15.1
      footnote: `Pulse` (currently `rgba(122,183,255,0.55)` in
      `experience.css` and `projects.css`) and `Halt` (currently
      `#c62828` in `modals.css`). When you remove either of these
      exceptions by tokenising the value, **delete the footnote**.
- [ ] No new colour token has been added to `tokens.css` without a
      named row in §15.1.

### Typography (§4)

- [ ] Font sizes used across `src/styles/` map to the six tiers in
      §4.2 (Display / Headline / Title / Body / Meta / Micro). Stray
      values like `0.78rem` or `1.07rem` are drift.
- [ ] Line-heights are members of the tier set
      (1.1 / 1.2 / 1.3 / 1.4 / 1.5).
- [ ] Letter-spacing only appears on Micro-tier uppercase eyebrows /
      mono chips.
- [ ] Mono is reserved for identifiers (project names, course codes,
      tech tags, role chain titles). Body copy in mono is drift.

### Spacing (§5)

- [ ] Every padding, margin, gap, and `top`/`left` literal in
      `src/styles/` is a member of the named scale
      (4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 px). Round-to-step or
      promote a new step (in §5.1) before fixing.
- [ ] Container widths match §5.2 (page 860, modal 560, hero summary
      640).
- [ ] Breakpoints used in `@media` queries are 480 or 520
      (Phone band) only. A third breakpoint is drift unless §5.3 is
      updated to declare it.

### Surfaces (§6)

- [ ] Every glass surface in `src/styles/` uses the
      `backdrop-filter` recipe matching its row in §6.2 — standard
      card 14px/150%, modal panel 18px/160%, modal backdrop
      20px/180%, timeline overlay 18px.
- [ ] No `filter: blur(…)` is applied to cloud, ambient orb, or
      focal orb layers in `src/styles/sky.css` (iOS Safari
      compositor rule).
- [ ] In-flow content cards have no `box-shadow`. Float Shadow
      appears only on floating panels.

### Iconography (§7)

- [ ] Inline SVG in `src/components/` declares `width`/`height` from
      the 4-step icon scale (12, 14, 16, 32). Other sizes are drift.
- [ ] Decorative icons set `aria-hidden`. Icon-only buttons set
      `aria-label` + `title`.

### Motion (§8)

- [ ] Every `transition` duration in `src/styles/` is `120ms`,
      `280ms`, or an `ambient` value (see §8.1). Other durations
      are drift.
- [ ] No animation targets `width`, `height`, `padding`, or
      `margin`.
- [ ] `@media (prefers-reduced-motion: reduce)` covers every
      ambient animation in `src/styles/sky.css`.

### Components (§9, §15.2)

- [ ] Every component file referenced in §15.2 exists.
- [ ] Each component matches the contract written in §9.x — surface,
      padding, radius, hover/active states. Walk one component at a
      time.
- [ ] No new visual variant has been introduced without a §9.x or
      §10.x entry.

### Patterns (§10, §15.3)

- [ ] Every pattern file referenced in §15.3 exists.
- [ ] Each pattern's geometry rules (e.g. role chain icon
      `margin-top: (line-height − icon) / 2 + 1px`) are still
      faithful in code.

### Print (§13, §15.4)

- [ ] `src/data/cv/print.json` validates against
      `schemas/print.schema.json`.
- [ ] All `pt` values in `src/styles/print.css` come from
      `--print-*` CSS variables, not literals.
- [ ] Translucent tokens (Vapor, Vapor Sheen, Veil, Shroud) collapse
      to opaque equivalents inside `@media print`.

### Mapping appendix (§15)

- [ ] Every row in §15.1 / §15.2 / §15.3 / §15.4 still points to a
      file that exists.
- [ ] Any `src/styles/*.css` not referenced by §15.2 or §15.3 is a
      drift signal — either the doc is missing a component or the
      file should be removed.

## Behaviour: audit, propose, apply with confirmation

This skill **never** auto-applies invasive changes. The flow is:

1. **Audit.** Walk the checklist above end-to-end, reading
   `docs/DESIGN.md` and the audit targets. Collect every drift
   finding with its file, line, and a one-line diagnosis.
2. **Report.** Print findings grouped by DESIGN.md section. Format:
   `[§3.5] src/styles/modals.css:429 — raw hex #c62828 used; should
be tokenised as Halt`. Order by section, then file.
3. **Propose.** For each finding, draft a concrete patch (file +
   suggested edit). Group related patches into batches by section.
   Show the batch as a unified diff before applying anything.
4. **Apply with confirmation.** Wait for the user to approve each
   batch ("apply tokens batch", "skip motion batch", "revise"). Do
   not apply more than one batch without explicit approval.
5. **Re-audit.** After applying any batch, re-run the checklist
   over the changed files and report residual drift.
6. **Stop on judgment calls.** Some drift is intentional (a deferred
   token, a component variant in flight, a known footnote in §15.1).
   Surface these and ask before changing anything.

## Verification

After every applied batch, and once at the end of the run:

- `make fmt` — format any touched CSS / TSX.
- `make fmt-check` — confirm formatting is clean.
- `make lint` — TypeScript and ESLint pass.
- `make build` — production build succeeds.
- Re-read each touched file end-to-end against its DESIGN.md
  section.

All four commands must pass before the run is considered successful.
On success, write the new `HEAD` hash to
`.agent/skills/sync-design/.last-updated`.

## Skill self-improvement

If the audit surfaces a drift class that the checklist or mapping
table does not yet cover (e.g. a new component family, a new
animation timing, a new surface tier), append a row to the mapping
table or a bullet to the checklist and commit the skill update
alongside the design fixes. The skill is its own long-lived memory;
without this step it rots the same way the doc would.

When tokens move from "footnote exception" to "first-class token"
(e.g. when `Pulse` or `Halt` finally become real CSS variables),
**delete** the footnote in §15.1 of `docs/DESIGN.md` in the same
patch — leaving stale exceptions is itself drift.
