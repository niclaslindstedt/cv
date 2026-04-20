# AGENTS.md

Guidance for AI coding agents working on this repository. This file is
the single source of truth for agent guidance — tool-specific guidance
files (e.g. `CLAUDE.md`) are symlinks pointing here (see
`OSS_SPEC.md` §7.1).

## What this project is

`niclaslindstedt.se` — a personal site / CV built with Vite, React 18,
and TypeScript. The built output is a static site deployed to GitHub
Pages via `.github/workflows/deploy.yml`. There is no backend, no tests
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

## Documentation sync points

When you change X, update Y:

| If you change …         | Also update …                                           |
| ----------------------- | ------------------------------------------------------- |
| `package.json` scripts  | `Makefile`, `README.md` Scripts section                 |
| `Makefile` targets      | `README.md` Scripts section, `.github/workflows/ci.yml` |
| `src/` top-level layout | `README.md` Structure section                           |
| `src/data/cv.ts` types  | Any component consuming the changed field               |
| Node version in CI      | `.github/workflows/deploy.yml` (keep them in sync)      |

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

## OSS_SPEC.md conformance

`OSS_SPEC.md` lives at the repo root for reference. The project does
**not** yet claim full conformance — it follows the spec's formatting /
linting / CI layer but omits CHANGELOG automation, governance docs, the
website/docs split, pre-commit hooks, and several other requirements.
Expand conformance incrementally; don't wholesale-apply the spec in a
single sweep.
