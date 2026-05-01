import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Asserts WCAG 2.1 Level AA conformance via axe-core. Each homepage
// variant (en/sv × dark/light) is scanned independently so violations
// are reported per-variant instead of collapsing into one failure.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForLoadState("networkidle");
}

test.describe("homepage accessibility (WCAG 2.1 AA)", () => {
  for (const lang of ["en", "sv"] as const) {
    for (const theme of ["dark", "light"] as const) {
      test(`homepage — ${lang} / ${theme}`, async ({ page }) => {
        await page.goto(`/?lang=${lang}`);
        await page.evaluate((t) => {
          document.documentElement.dataset.theme = t;
        }, theme);
        await settle(page);

        const results = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze();

        expect(
          results.violations,
          `Accessibility violations on ${lang}/${theme}:\n${JSON.stringify(
            results.violations,
            null,
            2,
          )}`,
        ).toEqual([]);
      });
    }
  }
});
