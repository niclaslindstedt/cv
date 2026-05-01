import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Two-pass scan per variant:
//   - AA pass: WCAG 2.0 / 2.1 / 2.2 Level A and AA. Failures gate CI.
//   - AAA pass: WCAG 2.0 / 2.1 / 2.2 Level AAA. Findings are logged and
//     attached to the test report as advisory only — they never fail
//     the test, so the badge stays green when AA passes.
const AA_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
];
const AAA_TAGS = ["wcag2aaa", "wcag21aaa", "wcag22aaa"];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForLoadState("networkidle");
}

test.describe("homepage accessibility (WCAG 2.2 AA)", () => {
  for (const lang of ["en", "sv"] as const) {
    for (const theme of ["dark", "light"] as const) {
      test(`homepage — ${lang} / ${theme}`, async ({ page }, testInfo) => {
        await page.goto(`/?lang=${lang}`);
        await page.evaluate((t) => {
          document.documentElement.dataset.theme = t;
        }, theme);
        await settle(page);

        const aa = await new AxeBuilder({ page }).withTags(AA_TAGS).analyze();
        expect(
          aa.violations,
          `Accessibility violations on ${lang}/${theme}:\n${JSON.stringify(
            aa.violations,
            null,
            2,
          )}`,
        ).toEqual([]);

        const aaa = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
        if (aaa.violations.length > 0) {
          const summary = aaa.violations
            .map(
              (v) =>
                `- [${v.id}] ${v.help} (${v.nodes.length} node${
                  v.nodes.length === 1 ? "" : "s"
                }) — ${v.helpUrl}`,
            )
            .join("\n");
          console.log(
            `\n[WCAG AAA — ${lang}/${theme}] ${aaa.violations.length} advisory violation(s):\n${summary}\n`,
          );
          testInfo.annotations.push({
            type: "wcag-aaa",
            description: `${aaa.violations.length} advisory violation(s) on ${lang}/${theme}`,
          });
          await testInfo.attach(`wcag-aaa-${lang}-${theme}.json`, {
            body: JSON.stringify(aaa.violations, null, 2),
            contentType: "application/json",
          });
        }
      });
    }
  }
});
