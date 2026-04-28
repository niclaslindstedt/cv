import { expect, test, type Page } from "@playwright/test";

// Freeze time so the footer year ("© <year> Name") and any "since" /
// "X years" computations stay deterministic across CI runs.
const FIXED_TIME = "2026-04-27T12:00:00Z";

const STABILIZE_CSS = `
  *, *::before, *::after {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
    animation-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
  /* The CelestialSky canvas paints on RAF — hide it for stable pixels. */
  .celestial-sky, canvas { visibility: hidden !important; }
`;

async function preparePage(page: Page) {
  await page.clock.install({ time: new Date(FIXED_TIME) });
  await page.addStyleTag({ content: STABILIZE_CSS });
  await page.evaluate(() => document.fonts?.ready);
  // Settle one frame so any RAF-scheduled layout finishes.
  await page.waitForTimeout(50);
}

test.describe("homepage layout", () => {
  for (const lang of ["en", "sv"] as const) {
    for (const theme of ["dark", "light"] as const) {
      test(`hero — ${lang} / ${theme}`, async ({ page }) => {
        await page.goto(`/?lang=${lang}`);
        await page.evaluate((t) => {
          document.documentElement.dataset.theme = t;
        }, theme);
        await preparePage(page);
        const hero = page.locator(".hero").first();
        await expect(hero).toBeVisible();
        await expect(hero).toHaveScreenshot(`hero-${lang}-${theme}.png`);
      });
    }
  }

  test("focus section — en / dark", async ({ page }) => {
    await page.goto("/?lang=en");
    await preparePage(page);
    const section = page.locator("#focus, [data-section='focus']").first();
    await expect(section).toBeVisible();
    await expect(section).toHaveScreenshot("focus-en-dark.png");
  });

  test("full page — en / dark (above the fold)", async ({ page }) => {
    await page.goto("/?lang=en");
    await preparePage(page);
    await expect(page).toHaveScreenshot("homepage-en-dark.png", {
      fullPage: false,
    });
  });
});
