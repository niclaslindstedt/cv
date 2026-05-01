# WCAG 2.2 Success Criteria — quick index

Condensed index of every numbered WCAG 2.2 Success Criterion, organised
by principle and level. Use this as a routing table when verifying
accessibility manually; the canonical text lives in
[`wcag22.html`](./wcag22.html) (open the corresponding `#anchor`) and
the techniques / failures index is in
[`wcag22-techniques-index.html`](./wcag22-techniques-index.html).

The **Auto?** column records whether axe-core (the engine
`.github/workflows/a11y.yml` runs) checks the criterion. It's a coarse
mapping — axe rules often cover only part of a criterion (e.g. `1.1.1`
verifies that `alt` is present, not that it's meaningful). Anything
marked **partial** or **no** is the territory of the `verify-wcag`
skill: those are the criteria a human has to confirm.

## Principle 1 — Perceivable

| SC      | Title                                       | Level | Auto?       | Anchor                        |
| ------- | ------------------------------------------- | ----- | ----------- | ----------------------------- |
| 1.1.1   | Non-text Content                            | A     | partial     | `#non-text-content`           |
| 1.2.1   | Audio-only and Video-only (Prerecorded)     | A     | n/a         | `#audio-only-and-video-only-prerecorded` |
| 1.2.2   | Captions (Prerecorded)                      | A     | n/a         | `#captions-prerecorded`       |
| 1.2.3   | Audio Description or Media Alternative      | A     | n/a         | `#audio-description-or-media-alternative-prerecorded` |
| 1.2.4   | Captions (Live)                             | AA    | n/a         | `#captions-live`              |
| 1.2.5   | Audio Description (Prerecorded)             | AA    | n/a         | `#audio-description-prerecorded` |
| 1.3.1   | Info and Relationships                      | A     | partial     | `#info-and-relationships`     |
| 1.3.2   | Meaningful Sequence                         | A     | no          | `#meaningful-sequence`        |
| 1.3.3   | Sensory Characteristics                     | A     | no          | `#sensory-characteristics`    |
| 1.3.4   | Orientation                                 | AA    | partial     | `#orientation`                |
| 1.3.5   | Identify Input Purpose                      | AA    | partial     | `#identify-input-purpose`     |
| 1.4.1   | Use of Color                                | A     | partial     | `#use-of-color`               |
| 1.4.2   | Audio Control                               | A     | n/a         | `#audio-control`              |
| 1.4.3   | Contrast (Minimum)                          | AA    | yes         | `#contrast-minimum`           |
| 1.4.4   | Resize Text                                 | AA    | partial     | `#resize-text`                |
| 1.4.5   | Images of Text                              | AA    | no          | `#images-of-text`             |
| 1.4.10  | Reflow                                      | AA    | no          | `#reflow`                     |
| 1.4.11  | Non-text Contrast                           | AA    | partial     | `#non-text-contrast`          |
| 1.4.12  | Text Spacing                                | AA    | partial     | `#text-spacing`               |
| 1.4.13  | Content on Hover or Focus                   | AA    | no          | `#content-on-hover-or-focus`  |

## Principle 2 — Operable

| SC      | Title                                       | Level | Auto?       | Anchor                        |
| ------- | ------------------------------------------- | ----- | ----------- | ----------------------------- |
| 2.1.1   | Keyboard                                    | A     | partial     | `#keyboard`                   |
| 2.1.2   | No Keyboard Trap                            | A     | no          | `#no-keyboard-trap`           |
| 2.1.4   | Character Key Shortcuts                     | A     | no          | `#character-key-shortcuts`    |
| 2.2.1   | Timing Adjustable                           | A     | no          | `#timing-adjustable`          |
| 2.2.2   | Pause, Stop, Hide                           | A     | no          | `#pause-stop-hide`            |
| 2.3.1   | Three Flashes or Below Threshold            | A     | no          | `#three-flashes-or-below-threshold` |
| 2.4.1   | Bypass Blocks                               | A     | partial     | `#bypass-blocks`              |
| 2.4.2   | Page Titled                                 | A     | yes         | `#page-titled`                |
| 2.4.3   | Focus Order                                 | A     | no          | `#focus-order`                |
| 2.4.4   | Link Purpose (In Context)                   | A     | partial     | `#link-purpose-in-context`    |
| 2.4.5   | Multiple Ways                               | AA    | no          | `#multiple-ways`              |
| 2.4.6   | Headings and Labels                         | AA    | partial     | `#headings-and-labels`        |
| 2.4.7   | Focus Visible                               | AA    | no          | `#focus-visible`              |
| 2.4.11  | Focus Not Obscured (Minimum) ★ WCAG 2.2     | AA    | no          | `#focus-not-obscured-minimum` |
| 2.5.1   | Pointer Gestures                            | A     | no          | `#pointer-gestures`           |
| 2.5.2   | Pointer Cancellation                        | A     | no          | `#pointer-cancellation`       |
| 2.5.3   | Label in Name                               | A     | partial     | `#label-in-name`              |
| 2.5.4   | Motion Actuation                            | A     | no          | `#motion-actuation`           |
| 2.5.7   | Dragging Movements ★ WCAG 2.2               | AA    | no          | `#dragging-movements`         |
| 2.5.8   | Target Size (Minimum) ★ WCAG 2.2            | AA    | partial     | `#target-size-minimum`        |

## Principle 3 — Understandable

| SC      | Title                                       | Level | Auto?       | Anchor                        |
| ------- | ------------------------------------------- | ----- | ----------- | ----------------------------- |
| 3.1.1   | Language of Page                            | A     | yes         | `#language-of-page`           |
| 3.1.2   | Language of Parts                           | AA    | partial     | `#language-of-parts`          |
| 3.2.1   | On Focus                                    | A     | no          | `#on-focus`                   |
| 3.2.2   | On Input                                    | A     | no          | `#on-input`                   |
| 3.2.3   | Consistent Navigation                       | AA    | no          | `#consistent-navigation`      |
| 3.2.4   | Consistent Identification                   | AA    | no          | `#consistent-identification`  |
| 3.2.6   | Consistent Help ★ WCAG 2.2                  | A     | no          | `#consistent-help`            |
| 3.3.1   | Error Identification                        | A     | partial     | `#error-identification`       |
| 3.3.2   | Labels or Instructions                      | A     | partial     | `#labels-or-instructions`     |
| 3.3.3   | Error Suggestion                            | AA    | no          | `#error-suggestion`           |
| 3.3.4   | Error Prevention (Legal, Financial, Data)   | AA    | no          | `#error-prevention-legal-financial-data` |
| 3.3.7   | Redundant Entry ★ WCAG 2.2                  | A     | no          | `#redundant-entry`            |
| 3.3.8   | Accessible Authentication (Minimum) ★ WCAG 2.2 | AA | no          | `#accessible-authentication-minimum` |

## Principle 4 — Robust

| SC      | Title                                       | Level | Auto?       | Anchor                        |
| ------- | ------------------------------------------- | ----- | ----------- | ----------------------------- |
| 4.1.2   | Name, Role, Value                           | A     | yes         | `#name-role-value`            |
| 4.1.3   | Status Messages                             | AA    | partial     | `#status-messages`            |

## Notes

- ★ marks criteria new in WCAG 2.2.
- `4.1.1 Parsing` was removed in WCAG 2.2 and is intentionally absent.
- `1.2.*` and `1.4.2` (audio/video/audio-control) are marked **n/a** for
  this site because there is no time-based media. Re-enable them if a
  Talks / Media section is ever added.
- Level AAA criteria are not listed here — the workflow's AAA pass logs
  them advisorily (`tests/a11y/site.test.ts`). When the user wants AAA
  conformance audited manually, walk the spec's principle index in
  `wcag22.html` and apply the same routing logic as below.

## How to use this index

1. Pick a SC row marked **partial** or **no**.
2. Open the SKILL hazard catalogue's matching section.
3. Walk the audit steps; record findings.
4. For canonical wording or normative requirements, open the anchor in
   `wcag22.html` (e.g. `#focus-visible`).
