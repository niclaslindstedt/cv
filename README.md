# cv

[![CI](https://github.com/niclaslindstedt/cv/actions/workflows/ci.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/ci.yml)
[![Visual](https://github.com/niclaslindstedt/cv/actions/workflows/visual.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/visual.yml)
[![Accessibility](https://github.com/niclaslindstedt/cv/actions/workflows/a11y.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/a11y.yml)
[![Lighthouse](https://github.com/niclaslindstedt/cv/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/lighthouse.yml)
[![Pages](https://github.com/niclaslindstedt/cv/actions/workflows/pages.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/pages.yml)
[![Dependabot](https://github.com/niclaslindstedt/cv/actions/workflows/dependabot.yml/badge.svg)](https://github.com/niclaslindstedt/cv/actions/workflows/dependabot.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

Personal site and CV for Niclas Lindstedt — built with Vite, React 18,
and TypeScript, deployed as a static bundle to GitHub Pages.

> Live at **[niclaslindstedt.se](https://niclaslindstedt.se)**.

## Overview

The site is a single-page React app whose content is stored as JSON,
schema-validated at build time, and re-projected into several output
surfaces — the rendered site, a bilingual PDF resume, an Open Graph
share image, a sitemap, and an in-page search index — from one source.
There is no CMS, no database, and no runtime backend; everything ships
as static assets.

## At a glance

- **Stack** — React 18, Vite 5, TypeScript (strict mode), plain CSS with
  design tokens.
- **Content** — JSON skeleton + per-category JSON parts, deep-merged at
  build time, validated with AJV against `schemas/cv.schema.json`.
- **Output** — static site to GitHub Pages, bilingual PDF (English /
  Swedish) via headless Chromium, 1200×630 OG image via
  [satori](https://github.com/vercel/satori), `sitemap.xml`, and a
  weighted in-page search index — all derived from the same CV data.
- **Tests** — Vitest for data and units, Playwright visual regression
  with committed pixel baselines, Lighthouse CI with hard Web Vitals,
  accessibility, and SEO budgets.
- **Deploy** — every push to `main` ships to GitHub Pages via
  `.github/workflows/pages.yml`.

## How it works

### Content as data

The CV is JSON, not React props. `src/data/cv.json` holds the skeleton —
top-level scalars (name, summary, links, meta) and `"{...}"` placeholders
that point at per-category files in `src/data/cv/` (`projects.json`,
`experience.json`, `companies.json`, `skills.json`, …). At build and
validate time `src/data/load-cv.mjs` deep-merges them into a single
object that's checked against `schemas/cv.schema.json` via AJV. Anything
that breaks the schema fails the build before TypeScript ever sees it.

A gitignored override at `src/data/cv.local.json` provides a private
layer for content that shouldn't ship publicly — full contact details,
longer descriptions, anything indexable. `make local` deep-merges it on
top and produces a separate set of PDFs alongside the public site.

### One source, many surfaces

The same assembled CV drives every visible artifact:

- **The React site** — `App.tsx` composes the per-section components
  (`Hero`, `Focus`, `Projects`, `Experience`, `Skills`, `Timeline`, …),
  each consuming typed slices of the CV.
- **A bilingual PDF** — `scripts/generate-print.mjs` bakes a
  print-shaped JSON; `scripts/generate-print-html.mjs` server-side
  renders `<PrintView />` to `dist/print-en.html` and `dist/print-sv.html`;
  `scripts/generate-pdf.mjs` opens each in headless Chromium and
  exports `cv-en.pdf` / `cv-sv.pdf`. The PDF generator never boots the
  SPA — no hydration, no font race conditions, identical output every
  run.
- **The `<head>` block** — a small Vite plugin (`cvMetaHtmlPlugin` in
  `vite.config.ts`) injects Open Graph and Twitter card meta, the
  canonical URL, and JSON-LD (`Person`, `WebSite`) derived from
  `cv.meta`, `cv.links`, `cv.skills`, and `cv.education`.
- **An OG share image** — `scripts/generate-og-image.mjs` renders a
  1200×630 PNG via satori into `public/og-image.png` during `prebuild`.
- **A sitemap** — `scripts/generate-sitemap.mjs` writes `dist/sitemap.xml`
  after `vite build`.
- **An in-page search index** — `scripts/generate-search-index.mjs`
  builds `src/data/search-index.json` from the CV plus hidden `aliases`
  on individual records.

### Build pipeline

Two custom Vite plugins live in `vite.config.ts`:

- `cv-assembly` expands the JSON placeholders during dev and build, so
  the React app imports a single fully-resolved CV object via
  `src/data/cv.ts`.
- `cvMetaHtmlPlugin` injects the SEO `<head>` block at build time.

`npm run build` chains `tsc -b` → `vite build` →
`generate:print-html` → `generate:pdf` → `generate:sitemap`. Pre-build
hooks regenerate the timeline, GitHub activity, per-project commit
stats, print JSON, search index, and OG image. The data fetchers
gracefully degrade when their tokens are missing — the GitHub commit
track and per-project stats simply drop out rather than failing the
build.

### Visual system

Design tokens (color, type scale, spacing, motion) live in
`src/styles/tokens.css`; per-domain CSS partials (`hero.css`,
`projects.css`, `experience.css`, `timeline-vis.css`, `print.css`, …)
consume them. `src/styles.css` is a thin `@import` aggregator. Dark
mode and print styles share the same token set.

`docs/DESIGN.md` is the source of truth for visual changes; the
`sync-design` maintenance skill audits drift between the document and
the CSS / component layer.

### Search

The search modal uses a hand-written ranker in `src/utils/search.ts` —
no third-party search library. Each record is indexed across weighted
fields (`title` > `alias` > `stack` > `skill` > `secondary` >
`description`) with match-type modifiers for exact, prefix, partial,
and fuzzy hits. Records carry hidden `aliases` so common abbreviations
("k8s", "TS", "react") resolve to the right entry without polluting
the visible copy. Full reference in
[`docs/SEARCH.md`](docs/SEARCH.md).

### i18n and PDF

The site is bilingual (English / Swedish). UI strings live in
`src/utils/i18n.ts`; content fields use `LocalizedString` shapes that
the components resolve via a `LanguageProvider` context. The print
pipeline emits one PDF per language, using the same data and the same
typed components as the live site.

## Quality gates

Independent workflows run on every push and pull request, each with
its own one-word status badge:

- **CI** (`.github/workflows/ci.yml`) — Prettier check, schema
  validation (CV, timeline, print view, search index, skill-tag
  registry), ESLint, TypeScript, the production build, and the Vitest
  suite (schema roundtrip, `load-cv` deep-merge contract, `utils/date`).
- **Visual** (`.github/workflows/visual.yml`) — Playwright visual
  regression on Chromium, desktop and mobile viewports. Baselines live
  under `tests/visual/__screenshots__/` and were recorded on Linux; CI
  runs on `ubuntu-latest` to keep pixels stable.
- **Accessibility** (`.github/workflows/a11y.yml`) — Playwright +
  axe-core scan of the built site against WCAG 2.0 / 2.1 / 2.2 Level A
  and AA, on Chromium desktop and mobile viewports, for both languages
  and both themes. Fails on any axe violation tagged `wcag2a` /
  `wcag2aa` / `wcag21a` / `wcag21aa` / `wcag22a` / `wcag22aa`. A second
  AAA pass (`wcag2aaa` / `wcag21aaa` / `wcag22aaa`) runs as advisory
  only — findings are logged and attached to the report but never
  fail the build.
- **Accessibility (deep)** (`.github/workflows/a11y-deep.yml`) —
  scheduled daily at 06:00 UTC (and manually dispatchable). Runs
  pa11y-ci (HTML CodeSniffer, a different rule engine from axe-core)
  at WCAG 2.2 AAA against both languages plus the print views.
  Always advisory; findings are printed in the workflow log so they
  never block PRs but stay visible. Off the per-PR critical path
  because WCAG 2.2 AAA against four URLs is slow.
- **Lighthouse** (`.github/workflows/lighthouse.yml`) — `lhci autorun`
  against the built `dist/` with hard budgets in `.lighthouserc.json`:
  LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 300 ms, plus accessibility and SEO
  category scores.
- **Dependabot** (`.github/workflows/dependabot.yml`) — fails when any
  Dependabot PR is open so the badge turns red until the queue is
  cleared; re-runs hourly via cron and on PR open/close events.

Deployment runs separately as **Pages**
(`.github/workflows/pages.yml`) on every push to `main`.

Conventional Commits, squash-merge only — the squash-merge title
becomes the changelog entry on `main`.

## Project layout

```
src/
├── App.tsx              # root component — composes CV sections in order
├── main.tsx             # React 18 entry
├── styles.css           # @import aggregator
├── styles/              # per-domain CSS partials (tokens, hero, projects,
│                        # experience, timeline-vis, print, …)
├── components/          # one file per section + modals (Project, Company,
│                        # Skill, Focus, Summary, …) + PrintView
├── data/
│   ├── cv.json          # CV skeleton; "{...}" placeholders point at cv/*.json
│   ├── cv/              # per-category parts (projects, experience, skills, …)
│   ├── cv.ts            # typed wrapper around the assembled CV
│   ├── cv.types.ts      # types mirroring the schema
│   └── load-cv.mjs      # pure-Node assembler used by Vite, scripts, validators
└── utils/               # date, search, theme, i18n, LanguageProvider, …

schemas/                 # JSON schemas (cv, timeline, print, search-index)
scripts/                 # generators + validators (timeline, print, OG, PDF, …)
tests/                   # Vitest (data + unit) and Playwright (visual)
docs/                    # DESIGN.md, SEARCH.md, getting-started.md
```

See [`AGENTS.md`](AGENTS.md) for the full architecture summary,
dependency direction, and change-routing table.

## Running it locally

```bash
nvm use            # Node 24, pinned in .nvmrc
make install       # npm ci
make dev           # Vite dev server at http://localhost:5173
```

Other useful targets:

| Command         | What it does                                                      |
| --------------- | ----------------------------------------------------------------- |
| `make build`    | Type-check, production build, generate per-language PDFs, sitemap |
| `make validate` | Validate the assembled CV and generated artifacts against schemas |
| `make test`     | Vitest suite (data + unit tests)                                  |
| `make local`    | Build with the gitignored `cv.local.json` override merged in      |

The full `make` target reference and troubleshooting notes live in
[`docs/getting-started.md`](docs/getting-started.md).

## Further reading

- [`docs/DESIGN.md`](docs/DESIGN.md) — design language, components, and
  patterns.
- [`docs/SEARCH.md`](docs/SEARCH.md) — search index, ranking model, and
  aliases.
- [`AGENTS.md`](AGENTS.md) — architecture and contribution rules.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branch and commit conventions.

## License

See [LICENSE](LICENSE). This is a personal site; all rights reserved.
