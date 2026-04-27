import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{test,tests}.{ts,tsx,mts,mjs}"],
    // Visual regression specs run under Playwright, not Vitest.
    exclude: ["tests/visual/**", "node_modules/**", "dist/**"],
    environment: "node",
    reporters: process.env.CI ? ["default"] : ["verbose"],
    coverage: {
      provider: "v8",
      include: ["src/utils/**", "src/data/load-cv.mjs"],
      reporter: ["text", "html"],
    },
  },
});
