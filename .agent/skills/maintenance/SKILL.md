---
name: maintenance
description: "Use to bring the whole repo back in sync after a batch of changes. Routes to every update-* skill in deterministic order and aggregates the resulting diff."
---

# maintenance

Umbrella skill that dispatches to every `update-*` and `sync-*` skill
in the repo. Does no rewriting of its own — only schedules other
skills and aggregates their output.

## Registry

Run the skills below in order. Skip a row if its target artifact does
not exist yet.

| Order | Skill                | Target                                                        |
| ----- | -------------------- | ------------------------------------------------------------- |
| 1     | `update-docs`        | `docs/` ↔ source (tokens, schemas, scripts, search internals) |
| 2     | `update-readme`      | `README.md`                                                   |
| 3     | `sync-design`        | `src/styles/` + `src/components/` ↔ `docs/DESIGN.md`          |
| 4     | `sync-cross-browser` | `src/styles/` cross-browser parity (Safari is the master)     |
| 5     | `sync-oss-spec`      | Whole repo ↔ `OSS_SPEC.md` (final residual-drift sweep)       |

Add a row every time a new `update-*` or `sync-*` skill is added —
the registry is the only source of truth for which sync skills exist.

Run order matters: `update-docs` first so prose in `docs/` is
reconciled against the code before any downstream skill reads it;
`update-readme` next so the README picks up any docs-section renames
or content changes; `sync-design` runs after so it can react to
documentation drift exposed by the docs and README sweeps;
`sync-cross-browser` runs next so any property-level patches it
applies sit on top of a design-conformant tree (it never retunes
design tokens, only adds missing prefixes and standard pairs);
`sync-oss-spec` runs last as the residual-drift sweep that catches
any structural conformance gaps the per-artifact skills did not
touch (per `OSS_SPEC.md` §21.5).

## Tracking mechanism

The sibling `.last-updated` file records the hash of the last successful
sweep across all skills in the registry.

## Run procedure

1. For each skill in the registry, invoke it and capture the diff it
   produces.
2. After every skill has run cleanly, aggregate the combined diff and
   commit it with a conventional-commit message like
   `chore: sweep maintenance skills`.
3. Update `.agent/skills/maintenance/.last-updated` with the new `HEAD`
   commit hash.

## Verification

- `make fmt-check`
- `make lint`
- `make build`

All three must pass before the sweep is considered successful.
