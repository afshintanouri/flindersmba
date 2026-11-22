import { defineConfig } from "@playwright/test";

// Tests run against the static export (out/) served under the GitHub Pages
// base path, so they exercise exactly what will be deployed.
const port = Number(process.env.PW_PORT || 4173);
const basePath = process.env.PW_BASE_PATH ?? "/flindersmba";
const serveDir = process.env.PW_SERVE_DIR || "out";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  // Baseline screenshots are NOT committed; see README "Visual regression".
  snapshotPathTemplate:
    process.env.PW_SNAPSHOT_DIR
      ? `${process.env.PW_SNAPSHOT_DIR}/{arg}{ext}`
      : "./tests/__screenshots__/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${port}${basePath}/`,
    trace: "off",
    launchOptions: {
      // Make every presented frame fully rasterised before it is drawn.
      // Without this, on slow/CPU-starved machines (e.g. GitHub runners) a large
      // (3840px) screenshot can capture a frame whose content tiles are not yet
      // rasterised, i.e. a blank page body, even though the DOM is fully rendered.
      args: ["--run-all-compositor-stages-before-draw"],
      // Only use the pre-installed browser path when explicitly provided.
      ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
    },
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      threshold: 0.01,
      // Absolute limit (not a ratio): a ratio would let thousands of changed
      // pixels through on 3840px screenshots. 100 px is far smaller than any
      // changed word, but absorbs rare anti-aliasing variance.
      maxDiffPixels: 100,
    },
  },
  projects: [
    { name: "smoke", testMatch: /(smoke|careers|roadshow|motion|contact)\.spec\.ts/, use: { viewport: { width: 1280, height: 900 } } },
    { name: "visual-phone", testMatch: /visual\.spec\.ts/, use: { viewport: { width: 360, height: 740 } } },
    { name: "visual-tablet", testMatch: /visual\.spec\.ts/, use: { viewport: { width: 768, height: 1024 } } },
    { name: "visual-desktop", testMatch: /visual\.spec\.ts/, use: { viewport: { width: 1920, height: 1080 } } },
    { name: "visual-kiosk", testMatch: /visual\.spec\.ts/, use: { viewport: { width: 3840, height: 2160 } } },
  ],
  webServer: {
    command: `node scripts/serve-static.mjs ${serveDir} ${port} ${basePath}`,
    url: `http://localhost:${port}${basePath}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
