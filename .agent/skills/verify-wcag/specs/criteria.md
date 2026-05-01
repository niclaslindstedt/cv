# WCAG 2.2 Success Criteria — quick index

Condensed index of every numbered WCAG 2.2 Success Criterion, organised
by principle and level. Use this as a routing table when verifying
accessibility manually; the canonical text lives in
[`wcag22.md`](./wcag22.md) and the techniques / failures index is in
[`wcag22-techniques-index.md`](./wcag22-techniques-index.md). The
"How to Meet WCAG 2.2" guidance with sufficient & advisory techniques
per SC is in [`wcag22-quickref.md`](./wcag22-quickref.md).

To jump to a specific SC's normative text:

```sh
grep -n "^#### Success Criterion 2.4.11" .agent/skills/verify-wcag/specs/wcag22.md
# → 1339:#### Success Criterion 2.4.11 Focus Not Obscured (Minimum)
# Then Read with offset=1339 to see the rule and its notes.
```

The **Auto?** column records whether axe-core (the engine the
per-PR `Accessibility` workflow runs) checks the criterion. It's a
coarse mapping — axe rules often cover only part of a criterion (e.g.
`1.1.1` verifies that `alt` is present, not that it's meaningful).
Anything marked **partial** or **no** is the territory of the
`verify-wcag` skill: those are the criteria a human has to confirm.
The daily `Accessibility (deep)` workflow runs pa11y-ci (HTML
CodeSniffer) at WCAG 2.2 AAA as a second-engine cross-check; treat its
output as advisory.

## Principle 1 — Perceivable

| SC     | Title                                       | Level | Auto?       |
| ------ | ------------------------------------------- | ----- | ----------- |
| 1.1.1  | Non-text Content                            | A     | partial     |
| 1.2.1  | Audio-only and Video-only (Prerecorded)     | A     | n/a         |
| 1.2.2  | Captions (Prerecorded)                      | A     | n/a         |
| 1.2.3  | Audio Description or Media Alternative      | A     | n/a         |
| 1.2.4  | Captions (Live)                             | AA    | n/a         |
| 1.2.5  | Audio Description (Prerecorded)             | AA    | n/a         |
| 1.3.1  | Info and Relationships                      | A     | partial     |
| 1.3.2  | Meaningful Sequence                         | A     | no          |
| 1.3.3  | Sensory Characteristics                     | A     | no          |
| 1.3.4  | Orientation                                 | AA    | partial     |
| 1.3.5  | Identify Input Purpose                      | AA    | partial     |
| 1.4.1  | Use of Color                                | A     | partial     |
| 1.4.2  | Audio Control                               | A     | n/a         |
| 1.4.3  | Contrast (Minimum)                          | AA    | yes         |
| 1.4.4  | Resize Text                                 | AA    | partial     |
| 1.4.5  | Images of Text                              | AA    | no          |
| 1.4.10 | Reflow                                      | AA    | no          |
| 1.4.11 | Non-text Contrast                           | AA    | partial     |
| 1.4.12 | Text Spacing                                | AA    | partial     |
| 1.4.13 | Content on Hover or Focus                   | AA    | no          |

## Principle 2 — Operable

| SC     | Title                                          | Level | Auto?       |
| ------ | ---------------------------------------------- | ----- | ----------- |
| 2.1.1  | Keyboard                                       | A     | partial     |
| 2.1.2  | No Keyboard Trap                               | A     | no          |
| 2.1.4  | Character Key Shortcuts                        | A     | no          |
| 2.2.1  | Timing Adjustable                              | A     | no          |
| 2.2.2  | Pause, Stop, Hide                              | A     | no          |
| 2.3.1  | Three Flashes or Below Threshold               | A     | no          |
| 2.4.1  | Bypass Blocks                                  | A     | partial     |
| 2.4.2  | Page Titled                                    | A     | yes         |
| 2.4.3  | Focus Order                                    | A     | no          |
| 2.4.4  | Link Purpose (In Context)                      | A     | partial     |
| 2.4.5  | Multiple Ways                                  | AA    | no          |
| 2.4.6  | Headings and Labels                            | AA    | partial     |
| 2.4.7  | Focus Visible                                  | AA    | no          |
| 2.4.11 | Focus Not Obscured (Minimum) ★ WCAG 2.2        | AA    | no          |
| 2.5.1  | Pointer Gestures                               | A     | no          |
| 2.5.2  | Pointer Cancellation                           | A     | no          |
| 2.5.3  | Label in Name                                  | A     | partial     |
| 2.5.4  | Motion Actuation                               | A     | no          |
| 2.5.7  | Dragging Movements ★ WCAG 2.2                  | AA    | no          |
| 2.5.8  | Target Size (Minimum) ★ WCAG 2.2               | AA    | partial     |

## Principle 3 — Understandable

| SC     | Title                                            | Level | Auto?    |
| ------ | ------------------------------------------------ | ----- | -------- |
| 3.1.1  | Language of Page                                 | A     | yes      |
| 3.1.2  | Language of Parts                                | AA    | partial  |
| 3.2.1  | On Focus                                         | A     | no       |
| 3.2.2  | On Input                                         | A     | no       |
| 3.2.3  | Consistent Navigation                            | AA    | no       |
| 3.2.4  | Consistent Identification                        | AA    | no       |
| 3.2.6  | Consistent Help ★ WCAG 2.2                       | A     | no       |
| 3.3.1  | Error Identification                             | A     | partial  |
| 3.3.2  | Labels or Instructions                           | A     | partial  |
| 3.3.3  | Error Suggestion                                 | AA    | no       |
| 3.3.4  | Error Prevention (Legal, Financial, Data)        | AA    | no       |
| 3.3.7  | Redundant Entry ★ WCAG 2.2                       | A     | no       |
| 3.3.8  | Accessible Authentication (Minimum) ★ WCAG 2.2   | AA    | no       |

## Principle 4 — Robust

| SC    | Title              | Level | Auto?   |
| ----- | ------------------ | ----- | ------- |
| 4.1.2 | Name, Role, Value  | A     | yes     |
| 4.1.3 | Status Messages    | AA    | partial |

## Notes

- ★ marks criteria new in WCAG 2.2.
- `4.1.1 Parsing` was removed in WCAG 2.2 and is intentionally absent.
- `1.2.*` and `1.4.2` (audio/video/audio-control) are marked **n/a** for
  this site because there is no time-based media. Re-enable them if a
  Talks / Media section is ever added.
- Level AAA criteria are not listed here — the per-PR workflow's AAA
  axe pass logs them advisorily (`tests/a11y/site.test.ts`), and the
  daily `Accessibility (deep)` workflow runs pa11y at WCAG 2.2 AAA.
  When the user wants AAA conformance audited manually, walk the
  spec's principle index in `wcag22.md` and apply the same routing
  logic as below.

## How to use this index

1. Pick a SC row marked **partial** or **no**.
2. Open the SKILL hazard catalogue's matching section.
3. Walk the audit steps; record findings.
4. For canonical wording or normative requirements, jump to the SC in
   `wcag22.md`:

   ```sh
   grep -n "^#### Success Criterion 2.4.11" \
     .agent/skills/verify-wcag/specs/wcag22.md
   ```

   then Read the file from the matched line.
5. For sufficient techniques and failure techniques per SC, open
   `wcag22-quickref.md` and search for the same SC heading.
