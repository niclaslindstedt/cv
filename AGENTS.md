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

| Command          | What it does                            |
| ---------------- | --------------------------------------- |
| `make install`   | `npm ci`                                |
| `make dev`       | Start Vite dev server                   |
| `make build`     | Type-check and produce production build |
| `make preview`   | Preview the production build            |
| `make lint`      | ESLint + TypeScript type-check          |
| `make typecheck` | `tsc -b --noEmit` only                  |
| `make fmt`       | Prettier rewrite in place               |
| `make fmt-check` | Prettier check without writing          |
| `make test`      | Placeholder — no tests yet              |
| `make clean`     | Remove `dist/` and Vite cache           |

CI (`.github/workflows/ci.yml`) runs `make fmt-check`, `make lint`, and
`make build` on every push and pull request.

## Architecture summary

```
src/
├── App.tsx          # root component — composes sections in order
├── main.tsx         # React 18 entry, mounts <App /> into #root
├── styles.css       # global CSS
├── components/      # one file per section (Hero, Focus, Projects, …)
│                     plus a generic <Section /> wrapper
├── data/cv.ts       # all CV content + TypeScript types
└── utils/date.ts    # date helpers used by Experience / Education
```

Dependency direction: `components/*` and `App.tsx` consume `data/cv.ts`
and `utils/date.ts`. Nothing in `data/` or `utils/` imports from
`components/`. Keep it that way.

## Where new code goes

| Change                                       | Location                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| New CV section (e.g. Talks, Awards)          | `src/components/<Name>.tsx` + slot into `src/App.tsx`   |
| New field on existing section                | Extend the type in `src/data/cv.ts`, then the component |
| Content-only edits (roles, projects, skills) | `src/data/cv.ts` — no component change usually needed   |
| Date formatting / parsing                    | `src/utils/date.ts`                                     |
| Global styles, layout, typography            | `src/styles.css`                                        |

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

## Documentation sync points

When you change X, update Y:

| If you change …         | Also update …                                           |
| ----------------------- | ------------------------------------------------------- |
| `package.json` scripts  | `Makefile`, `README.md` Scripts section                 |
| `Makefile` targets      | `README.md` Scripts section, `.github/workflows/ci.yml` |
| `src/` top-level layout | `README.md` Structure section                           |
| `src/data/cv.ts` types  | Any component consuming the changed field               |
| Node version in CI      | `.nvmrc`, `.github/workflows/pages.yml` (keep in sync)  |

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

| Skill           | Purpose                                       |
| --------------- | --------------------------------------------- |
| `update-readme` | Resync `README.md` with the code it describes |
| `maintenance`   | Umbrella skill — routes to every `update-*`   |

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
