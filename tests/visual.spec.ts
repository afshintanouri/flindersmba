import { test, expect, seed, open, COMPLETE, AFTER_Q1, AFTER_Q2, AFTER_Q3, type Picks } from "./fixtures";

/** Two close matches and a broad result (reveal states not covered by COMPLETE). */
const CLOSE: Picks = {
  ambitions: ["lead-ai-emerging-technology", "data-driven-decisions"],
  interests: ["artificial-intelligence", "python-coding", "data-analytics"],
  experiences: ["technical-skills"],
  visits: [],
  complete: true,
};
const BROAD: Picks = {
  ambitions: ["financial-capability", "lead-health-care", "international-business-career"],
  interests: ["marketing", "social-impact", "python-coding", "people-culture"],
  experiences: ["gamified-learning"],
  visits: [],
  complete: true,
};

/**
 * Visual safety net for the approved v0 design.
 * Each screen is captured full-page at phone / tablet / desktop / kiosk widths
 * (one Playwright project per width). Baselines are generated from a reference
 * build and are not committed; see README "Visual regression".
 */
test.use({ reducedMotion: "reduce" });

// Routes use the prototype's numeric form (#mba-0 …) on purpose: CI also runs
// these tests against OLDER builds to capture the baseline, and every build
// understands these routes (current builds rewrite them to semantic URLs).
// Semantic routes are covered by the smoke and unit tests.

const screens: [name: string, route: string, picks: Picks | null][] = [
  ["01-home", "home", null],
  ["02-matchmaker-q1", "q1", AFTER_Q1],
  ["03-matchmaker-q2", "q2", AFTER_Q2],
  ["04-matchmaker-q3", "q3", AFTER_Q3],
  ["05-matching", "matching", COMPLETE],
  ["06-reveal", "reveal", COMPLETE],
  ["06b-reveal-close", "reveal", CLOSE],
  ["06c-reveal-broad", "reveal", BROAD],
  ["07-options", "options", COMPLETE],
  ["08-compare", "compare", COMPLETE],
  ["09-programme-detail", "mba-0", COMPLETE],
  ["10-career-explorer", "careers", COMPLETE],
  ["11-career-profile", "career-2", COMPLETE],
  // Semantic route: the approved baseline already has the production Career Explorer.
  ["11b-career-contemporary", "career/digital-transformation-manager", COMPLETE],
  ["12-capability-bridge", "bridge-2", COMPLETE],
  ["13-experience-grid", "experiences", COMPLETE],
  ["14-experience-story", "story-0", COMPLETE],
  ["15-my-mba-future", "journey", COMPLETE],
];

for (const [name, route, picks] of screens) {
  test(name, async ({ page }, info) => {
    await seed(page, picks);
    await open(page, route);
    const width = info.project.name.replace("visual-", "");
    await expect(page).toHaveScreenshot(`${width}/${name}.png`, { fullPage: true });
  });
}
