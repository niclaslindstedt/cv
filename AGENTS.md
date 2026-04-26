# AGENTS.md

Guidance for AI coding agents working on this repository. This file is
the single source of truth for agent guidance — tool-specific guidance
files (e.g. `CLAUDE.md`) are symlinks pointing here (see
`OSS_SPEC.md` §7.1).

## What this project is

`niclaslindstedt.se` — a personal site / CV built with Vite, React 18,
and TypeScript. The built output is a static site deployed to GitHub
Pages via `.github/workflows/pages.yml`. There is no backend, no tests
yet, and no CLI.

## Build and test commands

Prefer `make` targets over raw `npm run` commands so local and CI stay
in sync:

| Command          | What it does                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `make install`   | `npm ci`                                                                                         |
| `make dev`       | Start Vite dev server                                                                            |
| `make build`     | Type-check and produce production build                                                          |
| `make preview`   | Preview the production build                                                                     |
| `make lint`      | ESLint + TypeScript type-check                                                                   |
| `make typecheck` | `tsc -b --noEmit` only                                                                           |
| `make fmt`       | Prettier rewrite in place                                                                        |
| `make fmt-check` | Prettier check without writing                                                                   |
| `make validate`  | Assemble `src/data/cv.json` + `src/data/cv/*.json` and validate against `schemas/cv.schema.json` |
| `make test`      | Placeholder — no tests yet                                                                       |
| `make clean`     | Remove `dist/` and Vite cache                                                                    |

CI (`.github/workflows/ci.yml`) runs `make fmt-check`, `make validate`,
`make lint`, and `make build` on every push and pull request.

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

| Change                                       | Location                                                                                                                                                                                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New CV section (e.g. Talks, Awards)          | `src/components/<Name>.tsx` + slot into `src/App.tsx`                                                                                                                                                                                                                        |
| New field on existing section                | Extend `schemas/cv.schema.json` and `src/data/cv.types.ts`, then the component                                                                                                                                                                                               |
| Content-only edits (roles, projects, skills) | `src/data/cv/<category>.json` (focus, projects, companies, …) — prefer the `update-cv` skill. Top-level scalar fields stay in `src/data/cv.json`.                                                                                                                            |
| Date formatting / parsing                    | `src/utils/date.ts`                                                                                                                                                                                                                                                          |
| Global styles, layout, typography            | `src/styles/<domain>.css` (e.g. `hero.css`, `projects.css`, `print.css`); `src/styles.css` only `@import`s them                                                                                                                                                              |
| Timeline tracks, layout, zoom behaviour      | `scripts/generate-timeline.mjs` + `src/components/Timeline.tsx`                                                                                                                                                                                                              |
| Print / PDF rendering                        | `scripts/generate-print.mjs` bakes `src/data/print.json` (incl. `settings` from `cv.print` / `src/data/cv/print.json`); `src/components/PrintView.tsx` renders it and emits an inline `<style>` for `@page` + CSS variables; `src/styles/print.css` consumes those variables |
| Print font, sizes, margins, page-break rules | `src/data/cv/print.json` — see `docs/DESIGN.md` §6.1                                                                                                                                                                                                                         |
| GitHub commit activity fetch                 | `scripts/generate-github-activity.mjs` (requires `GITHUB_TOKEN` at build time)                                                                                                                                                                                               |
| Per-project repo commit stats fetch          | `scripts/generate-project-stats.mjs` (uses `PROJECT_STATS_TOKEN` if set, else `GITHUB_TOKEN`; needs `repo` scope to read private project repos)                                                                                                                              |
| `<head>` meta, OG, Twitter, JSON-LD          | `vite.config.ts` (`cvMetaHtmlPlugin`) — derived from `cv.meta` + `cv.links` + `cv.skills` + `cv.education`                                                                                                                                                                   |
| Social-share OG image                        | `scripts/generate-og-image.mjs` (satori → `public/og-image.png`); runs in `prebuild`                                                                                                                                                                                         |
| Downloadable PDF resume                      | `scripts/generate-pdf.mjs` (puppeteer → `dist/cv.pdf`); runs as part of `npm run build` after `vite build`                                                                                                                                                                   |
| Sitemap                                      | `scripts/generate-sitemap.mjs` (writes `dist/sitemap.xml` post-build)                                                                                                                                                                                                        |
| `robots.txt`, `404.html`                     | Static files in `public/`                                                                                                                                                                                                                                                    |
| Analytics (GoatCounter)                      | Snippet injected by `cvMetaHtmlPlugin` only when `VITE_GOATCOUNTER_ENDPOINT` env var is set at build time                                                                                                                                                                    |

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

| If you change …                                   | Also update …                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `package.json` scripts                            | `Makefile`, `README.md` Scripts section                                |
| `Makefile` targets                                | `README.md` Scripts section, `.github/workflows/ci.yml`                |
| `src/` top-level layout                           | `README.md` Structure section                                          |
| `schemas/cv.schema.json`                          | `src/data/cv.types.ts` + any component consuming the changed field     |
| `src/data/cv.types.ts`                            | `schemas/cv.schema.json` + any component consuming the changed field   |
| `schemas/timeline.schema.json`                    | `src/data/timeline.types.ts` + `scripts/generate-timeline.mjs`         |
| `schemas/print.schema.json`                       | `src/data/print.types.ts` + `scripts/generate-print.mjs` + `PrintView` |
| `cv.meta` (siteUrl / seo)                         | `vite.config.ts` `cvMetaHtmlPlugin` reads these directly               |
| Node version in CI                                | `.nvmrc`, `.github/workflows/pages.yml` (keep in sync)                 |
| `src/styles/tokens.css` or any new visual pattern | `docs/DESIGN.md` (in the **same** PR)                                  |

## Test conventions

The repo has **no tests yet**. When tests are added:

- Keep them in dedicated files, not inline (`OSS_SPEC.md` §20).
- Use the suffix convention `_test.ts` / `_tests.ts` or `*Test.ts`
  (§20.2).
- Place them under `tests/` at the repo root (§20.3).
- Add a real `test` step to `package.json` and wire `make test` to it.
- Add a `test` step to `.github/workflows/ci.yml`.

## Maintenance skills

The repo ships Claude skills under `.agent/skills/` (with
`.claude/skills` symlinked to it — `OSS_SPEC.md` §21.2):

| Skill                         | Purpose                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `update-cv`                   | Add/update/remove entries in `src/data/cv.json` and the per-category files in `src/data/cv/`; recommends what to change |
| `update-company-descriptions` | Rewrite `companies[].description` from each company's `sourceUrls` (data-only field)                                    |
| `update-summary`              | Interactively rewrite `cv.summary` and `cv.longSummary` from facts already in the CV                                    |
| `update-readme`               | Resync `README.md` with the code it describes                                                                           |
| `maintenance`                 | Umbrella skill — routes to every `update-*`                                                                             |

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
