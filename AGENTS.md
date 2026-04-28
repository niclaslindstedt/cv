# AGENTS.md

Guidance for AI coding agents working on this repository. This file is
the single source of truth for agent guidance — tool-specific guidance
files (e.g. `CLAUDE.md`) are symlinks pointing here (see
`OSS_SPEC.md` §7.1).

## What this project is

`niclaslindstedt.se` — a personal site / CV built with Vite, React 18,
and TypeScript. The built output is a static site deployed to GitHub
Pages via `.github/workflows/pages.yml`. There is no backend and no
CLI; tests live under `tests/` (Vitest + Playwright).

## Build and test commands

Prefer `make` targets over raw `npm run` commands so local and CI stay
in sync:

| Command                   | What it does                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `make install`            | `npm ci`                                                                                         |
| `make dev`                | Start Vite dev server                                                                            |
| `make build`              | Type-check and produce production build                                                          |
| `make preview`            | Preview the production build                                                                     |
| `make lint`               | ESLint + TypeScript type-check                                                                   |
| `make typecheck`          | `tsc -b --noEmit` only                                                                           |
| `make fmt`                | Prettier rewrite in place                                                                        |
| `make fmt-check`          | Prettier check without writing                                                                   |
| `make validate`           | Assemble `src/data/cv.json` + `src/data/cv/*.json` and validate against `schemas/cv.schema.json` |
| `make local`              | Build with `CV_LOCAL=1` so the gitignored `src/data/cv.local.json` override is merged in         |
| `make test`               | Vitest suite — schema roundtrip, `load-cv` deep-merge, `utils/date`                              |
| `make test-coverage`      | Vitest with v8 coverage                                                                          |
| `make test-visual`        | Playwright visual regression vs. baselines in `tests/visual/__screenshots__/`                    |
| `make test-visual-update` | Re-record visual baselines after an intentional UI change                                        |
| `make lighthouse`         | `lhci autorun` against `dist/`; budgets in `.lighthouserc.json`                                  |
| `make clean`              | Remove `dist/` and Vite cache                                                                    |

CI is split into three independent workflows, each with its own
one-word status badge. They run on every push and pull request:

- **CI** (`.github/workflows/ci.yml`) — `make fmt-check`, `make validate`,
  `make lint`, `make build`, `make test`.
- **Visual** (`.github/workflows/visual.yml`) — `make build`, then
  `make test-visual` (Playwright on Chromium, desktop + mobile viewports).
- **Lighthouse** (`.github/workflows/lighthouse.yml`) — `make build`,
  then `make lighthouse` to assert Web-Vitals + category-score budgets.

Deployment runs separately in **Pages** (`.github/workflows/pages.yml`)
on every push to `main`.

## Architecture summary

```
src/
├── App.tsx             # root component — composes sections in order
├── main.tsx            # React 18 entry, mounts <App /> into #root
├── styles.css          # global CSS — thin @import aggregator for ./styles/*.css
├── styles/             # per-domain CSS partials (tokens, hero, projects,
│                         experience, timeline-vis, modals, print, …)
├── components/         # one file per section (Hero, Focus, Projects, …)
│                         plus a generic <Section /> wrapper
├── data/cv.json        # CV skeleton — top-level "category" keys hold the
│                         literal sentinel "{...}" and are expanded from
│                         data/cv/<key>.json at build/validate time.
├── data/cv/*.json      # per-category content (focus, projects, companies,
│                         experience, education, courses, skills,
│                         skillDetails, languages, meta).
├── data/load-cv.mjs    # assembles cv.json + cv/*.json. Used by Vite, scripts,
│                         and the schema validator.
├── data/cv.ts          # typed wrapper around cv.json (post-assembly).
├── data/cv.types.ts    # TypeScript types mirroring the schema
├── data/timeline.types.ts # types for generated timeline.json
└── utils/date.ts       # date helpers used by Experience / Education
```

Dependency direction: `App.tsx` imports the assembled CV from
`data/cv` (which re-exports `data/cv.json` after the `cv-assembly`
Vite plugin expands the `{...}` placeholders). Components consume
`data/cv.types.ts` and `utils/date.ts`. Nothing in `data/` or `utils/`
imports from `components/`. Keep it that way.

## Where new code goes

| Change                                            | Location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New CV section (e.g. Talks, Awards)               | `src/components/<Name>.tsx` + slot into `src/App.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| New field on existing section                     | Extend `schemas/cv.schema.json` and `src/data/cv.types.ts`, then the component                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Content-only edits (roles, projects, skills)      | `src/data/cv/<category>.json` (focus, projects, companies, …) — prefer the `update-cv` skill. Top-level scalar fields stay in `src/data/cv.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Date formatting / parsing                         | `src/utils/date.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Global styles, layout, typography                 | `src/styles/<domain>.css` (e.g. `hero.css`, `projects.css`, `print.css`); `src/styles.css` only `@import`s them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Timeline tracks, layout, zoom behaviour           | `scripts/generate-timeline.mjs` + `src/components/Timeline.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Print / PDF rendering                             | `scripts/generate-print.mjs` bakes `src/data/print.json` (incl. `settings` from `cv.print` / `src/data/cv/print.json`); `src/components/PrintView.tsx` renders it and emits an inline `<style>` for `@page` + CSS variables; `src/styles/print.css` consumes those variables; `scripts/generate-print-html.mjs` SSRs PrintView per language into `dist/print-<lang>.html` so generate-pdf can skip booting the SPA                                                                                                                                                                                                                               |
| Print font, sizes, margins, page-break rules      | `src/data/cv/print.json` — see `docs/DESIGN.md` §6.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Per-entry print copy (project / job / assignment) | `printDescription` field on `projects[]`, `experience[]`, `experience[].assignments[]` in `src/data/cv/*.json` — see `update-cv` skill ("Print descriptions"). Falls back to the company/client/project `tagline` when omitted.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| GitHub commit activity fetch                      | `scripts/generate-github-activity.mjs` (requires `GITHUB_TOKEN` at build time)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Per-project repo commit stats fetch               | `scripts/generate-project-stats.mjs` (uses `PROJECT_STATS_TOKEN` if set, else `GITHUB_TOKEN`; needs `repo` scope to read private project repos)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `<head>` meta, OG, Twitter, JSON-LD               | `vite.config.ts` (`cvMetaHtmlPlugin`) — derived from `cv.meta` + `cv.links` + `cv.skills` + `cv.education`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Social-share OG image                             | `scripts/generate-og-image.mjs` (satori → `public/og-image.png`); runs in `prebuild`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Downloadable PDF resume                           | `scripts/generate-pdf.mjs` (puppeteer → `dist/<cv.print.pdfFilename ?? "cv.pdf">`); loads `dist/print-<lang>.html` (no SPA boot); runs as part of `npm run build` after `vite build` and `generate:print-html`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Local CV override (private contact / copy)        | `src/data/cv.local.json` (gitignored, deep-merged by `src/data/load-cv.mjs` when `CV_LOCAL=1`); see `cv.local.example.json` for the starter shape. Drives `make local`. The `update-cv` skill must keep sensitive content out of `src/data/cv*.json` and route it here.                                                                                                                                                                                                                                                                                                                                                                          |
| Sitemap                                           | `scripts/generate-sitemap.mjs` (writes `dist/sitemap.xml` post-build)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Search trigger / modal / ranker                   | Trigger button is part of `src/components/FloatingControls.tsx` + `src/styles/floating-controls.css`; modal in `src/components/SearchModal.tsx` + `src/styles/search.css`; ranker + fuzzy logic in `src/utils/search.ts` (no third-party search dep). Index baked by `scripts/generate-search-index.mjs` into gitignored `src/data/search-index.json` (schema `schemas/search-index.schema.json`). Hidden alternative names (`aliases` arrays) live on the source records under `skillDetails`, `projects`, `companies`, `focus`, `education`, `courses`, `experience`, and `assignments`. Full reference in [`docs/SEARCH.md`](docs/SEARCH.md). |
| `robots.txt`, `404.html`                          | Static files in `public/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Analytics (GoatCounter)                           | Snippet injected by `cvMetaHtmlPlugin` only when `VITE_GOATCOUNTER_ENDPOINT` env var is set at build time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Conventions

- **TypeScript strict mode is on** (`tsconfig.app.json`: `strict`,
  `noUnusedLocals`, `noUnusedParameters`). Don't disable these.
- **React function components only**, named exports, prop types declared
  inline as a `type Props = { … }`.
- **Prettier** (`.prettierrc.json`) owns formatting — double quotes,
  semicolons, trailing commas, 80-column width. Run `make fmt` before
  pushing.
- **Imports**: relative paths (no path aliases configured). External
  packages first, then relative, separated by a blank line.
- **Commit style**: conventional commits (`feat:`, `fix:`, `chore:`, …)
  per `OSS_SPEC.md` §8.1.
- **PR conventions**: PR titles must follow Conventional Commits format
  because the title becomes the squash-merge commit on `main`. Individual
  in-branch commits are not changelog-relevant. Squash-merge is the only
  permitted merge strategy.
- **Visual changes** (anything affecting CSS, layout, color, type,
  spacing, motion, or component shape) must conform to
  [`docs/DESIGN.md`](docs/DESIGN.md). Read the relevant section
  before changing styles. If the change introduces a pattern not yet
  described there, **update `docs/DESIGN.md` first in the same PR**.
  PR descriptions for visual changes should reference the section(s)
  they conform to.

## Documentation sync points

When you change X, update Y:

| If you change …                                     | Also update …                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `package.json` scripts                              | `Makefile`, `README.md` Scripts section                                                                    |
| `Makefile` targets                                  | `README.md` Scripts section, `.github/workflows/ci.yml`                                                    |
| Visual snapshots in `tests/visual/__screenshots__/` | Same PR — re-record only when the UI intentionally changed                                                 |
| Lighthouse budgets in `.lighthouserc.json`          | Mention in `README.md` Quality gates section                                                               |
| `src/` top-level layout                             | `README.md` Structure section                                                                              |
| `schemas/cv.schema.json`                            | `src/data/cv.types.ts` + any component consuming the changed field                                         |
| `src/data/cv.types.ts`                              | `schemas/cv.schema.json` + any component consuming the changed field                                       |
| `schemas/timeline.schema.json`                      | `src/data/timeline.types.ts` + `scripts/generate-timeline.mjs`                                             |
| `schemas/print.schema.json`                         | `src/data/print.types.ts` + `scripts/generate-print.mjs` + `PrintView` + `scripts/generate-print-html.mjs` |
| `schemas/search-index.schema.json`                  | `src/data/search-index.types.ts` + `scripts/generate-search-index.mjs` + `src/utils/search.ts`             |
| `cv.meta` (siteUrl / seo)                           | `vite.config.ts` `cvMetaHtmlPlugin` reads these directly                                                   |
| Node version in CI                                  | `.nvmrc`, `.github/workflows/pages.yml` (keep in sync)                                                     |
| `src/styles/tokens.css` or any new visual pattern   | `docs/DESIGN.md` (in the **same** PR)                                                                      |

## Test conventions

Tests live under `tests/` at the repo root (`OSS_SPEC.md` §20.3):

- `tests/data/` — schema roundtrip + the `load-cv` deep-merge contract.
- `tests/unit/` — pure-function unit tests (currently `utils/date`).
- `tests/visual/` — Playwright visual regression. Baseline PNGs are
  committed under `tests/visual/__screenshots__/` and were recorded on
  Linux; CI runs on `ubuntu-latest` for the same reason. Re-record with
  `make test-visual-update` only after an intentional UI change, and
  commit the new pixels in the same PR.

All test files end in `.test.ts` / `.test.mts` / `.tests.ts` per
`OSS_SPEC.md` §20.2 (regex `_?[Tt]ests?$` on the stem). Vitest picks
them up via `vitest.config.ts`; visual specs under `tests/visual/` are
excluded from the Vitest `include` so Playwright owns them. Don't
import test code from `src/`.

When adding a new top-level test domain (e.g. integration tests),
extend `vitest.config.ts` `include` rather than scattering test
discovery across multiple configs.

## Maintenance skills

The repo ships Claude skills under `.agent/skills/` (with
`.claude/skills` symlinked to it — `OSS_SPEC.md` §21.2):

| Skill                         | Purpose                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `update-cv`                   | Add/update/remove entries in `src/data/cv.json` and the per-category files in `src/data/cv/`; recommends what to change                 |
| `update-company-descriptions` | Rewrite `companies[].description` from each company's `sourceUrls` (data-only field)                                                    |
| `update-summary`              | Interactively rewrite `cv.summary` and `cv.longSummary` from facts already in the CV                                                    |
| `update-readme`               | Resync `README.md` with the code it describes                                                                                           |
| `sync-design`                 | Audit `src/styles/` and `src/components/` against `docs/DESIGN.md` (the design source of truth); propose patches, apply on confirmation |
| `debug-visual`                | Diagnose a failing Visual workflow, decide whether the snapshot drift is intentional, re-record baselines if so, and commit the pixels  |
| `maintenance`                 | Umbrella skill — routes to every `update-*` and `sync-*`                                                                                |

Invoke `maintenance` when you've landed a batch of changes and want a
single pass that brings drift-prone artifacts back in sync. Invoke a
specific `update-*` skill when you know which artifact is stale.

## Website staleness policy

This project does not yet ship a dedicated `website/` directory with a
source-extraction script (see `OSS_SPEC.md` §11.2). The deployed site
**is** the built React app. When a `website/` scaffold is added, it must
be regenerated whenever source-derived content changes; the `pages.yml`
workflow must chain the extraction step before the build step so that
the deployed site always reflects the latest released version.

## OSS_SPEC.md conformance

`OSS_SPEC.md` lives at the repo root for reference. The project
**intentionally uses a proprietary license** (all rights reserved) rather
than an SPDX-identified open-source license — it is a personal site, not
an OSS library. This is a known deviation from §2 of the spec. All other
spec requirements are followed to the extent applicable for a frontend
static site with no CLI and no LLM calls.
