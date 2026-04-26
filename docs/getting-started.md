# Getting Started

This guide walks you through running `niclaslindstedt.se` locally.

## Prerequisites

- **Node.js** ≥ 24 — install via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install    # reads .nvmrc, installs the pinned version
  nvm use
  ```
- **npm** ≥ 10 (bundled with Node 24)

## Clone and install

```bash
git clone https://github.com/niclaslindstedt/niclaslindstedt.se.git
cd niclaslindstedt.se
make install
```

## Start the dev server

```bash
make dev
```

Open `http://localhost:5173` in your browser. The page hot-reloads on
every file change.

## Build for production

```bash
make build
```

Output lands in `dist/`. Preview it locally before deploying:

```bash
make preview
```

## Lint and format

```bash
make lint        # ESLint + TypeScript type-check
make fmt         # Prettier rewrite in place
make fmt-check   # Check formatting without modifying files
```

## Editing CV content

All content lives in `src/data/cv.ts`. Edit that file; changes
hot-reload instantly in the dev server.

## Project layout

```
src/
├── App.tsx          # root component — composes sections in order
├── main.tsx         # React 18 entry, mounts <App /> into #root
├── styles.css       # @import aggregator
├── styles/          # per-domain CSS partials (tokens, hero, projects, print, …)
├── output.ts        # central output/logging module
├── components/      # one file per CV section
├── data/cv.ts       # all CV content + TypeScript types
└── utils/date.ts    # date helpers
```

## Next steps

- See `AGENTS.md` for the full architecture summary and change routing
  table.
- See `CONTRIBUTING.md` for branch naming, commit conventions, and PR
  guidelines.
