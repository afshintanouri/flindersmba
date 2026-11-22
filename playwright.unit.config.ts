import { defineConfig } from "@playwright/test";

/** Unit tests for content, data and logic. No browser or web server needed. */
export default defineConfig({
  testDir: "./tests/unit",
  outputDir: "./test-results/unit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
});
