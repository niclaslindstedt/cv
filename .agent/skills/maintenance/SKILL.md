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

| Order | Skill           | Target                                               |
| ----- | --------------- | ---------------------------------------------------- |
| 1     | `update-readme` | `README.md`                                          |
| 2     | `sync-design`   | `src/styles/` + `src/components/` ↔ `docs/DESIGN.md` |

Add a row every time a new `update-*` or `sync-*` skill is added —
the registry is the only source of truth for which sync skills exist.

Run order matters: `update-readme` first so any upstream documentation
moves are reconciled before downstream skills read them; `sync-design`
runs after so it can react to documentation drift exposed by the
README sweep.

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
