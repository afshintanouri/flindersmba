import { test as base, expect, type Page } from "@playwright/test";
import { ambitions, careerClusters, experiences, interests } from "@/content";

/** localStorage key for the current (v2, ID-based) journey format. */
export const STORAGE_KEY = "flinders-mba-journey.v2";
/** localStorage key used by the v0 prototype (index-based). */
export const LEGACY_STORAGE_KEY = "flinders-mba-journey.v1";

export type Picks = {
  ambitions: string[];
  interests: string[];
  experiences: string[];
  visits: string[];
  complete: boolean;
};

/**
 * Deterministic journey used by all tests (stable IDs).
 * With the current prototype scoring these produce a clear (non-tied) top
 * match: MBA Artificial Intelligence (12), then Business Analytics (8).
 */
export const COMPLETE: Picks = {
  ambitions: ["lead-ai-emerging-technology", "data-driven-decisions"],
  interests: ["artificial-intelligence", "data-analytics", "ai-strategy"],
  experiences: ["ai-in-action", "technical-skills"],
  visits: ["management-consultant"],
  complete: true,
};
export const AFTER_Q1: Picks = { ...COMPLETE, interests: [], experiences: [], visits: [], complete: false };
export const AFTER_Q2: Picks = { ...COMPLETE, experiences: [], visits: [], complete: false };
export const AFTER_Q3: Picks = { ...COMPLETE, visits: [], complete: false };

/** The same journey as COMPLETE in the prototype's v1 index format. */
export const COMPLETE_V1 = { a: [1, 2], i: [0, 1, 3], e: [4, 5], visits: [2], complete: true };

/** Converts an ID-based journey to the prototype's v1 index format. */
export function toV1(p: Picks) {
  const idx = (list: { id: string; legacyIndex: number }[], ids: string[]) =>
    ids.map((id) => list.find((x) => x.id === id)!.legacyIndex);
  const clusters = careerClusters.map((c) => ({ id: c.legacyDirectionId as string, legacyIndex: c.legacyIndex }));
  return {
    a: idx(ambitions, p.ambitions),
    i: idx(interests, p.interests),
    e: idx(experiences, p.experiences),
    // Only prototype-era directions have a v1 index; newer ones are not representable.
    visits: idx(clusters, p.visits.filter((v) => clusters.some((c) => c.id === v))),
    complete: p.complete,
  };
}

/**
 * Seed saved state before the app boots (runs before any page script).
 *
 * Writes the journey in BOTH the current (v2, IDs) and prototype (v1,
 * indices) formats. CI screenshots the visual baseline by running these
 * tests against an OLDER build (the PR base or previous commit), which may
 * only understand v1; current builds prefer v2 and discard v1.
 */
export async function seed(page: Page, picks: Picks | null) {
  await page.addInitScript(
    ([k2, k1, v2, v1]) => {
      try {
        if (v2 === null) {
          localStorage.removeItem(k2);
          localStorage.removeItem(k1);
        } else {
          localStorage.setItem(k2, v2);
          localStorage.setItem(k1, v1!);
        }
      } catch {}
    },
    [
      STORAGE_KEY,
      LEGACY_STORAGE_KEY,
      picks === null ? null : JSON.stringify(picks),
      picks === null ? null : JSON.stringify(toV1(picks)),
    ] as const,
  );
}

/** Seed ONLY a prototype (v1, index-based) saved journey. */
export async function seedLegacy(page: Page, v1: object) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch {}
    },
    [LEGACY_STORAGE_KEY, JSON.stringify(v1)] as const,
  );
}

/**
 * Navigate to a hash route and wait until the screen is fully settled:
 * hydration, fonts, images, entrance animations and paint.
 */
export async function open(page: Page, route: string) {
  await page.goto("./#" + route);
  await page.locator('main[data-ready="true"]').waitFor();
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })),
      ),
    );
    // Screens remount with a CSS entrance animation (e.g. `.frame { animation: enter }`,
    // which starts at opacity 0). On a slow CPU a screenshot can otherwise be taken
    // before the animation's first frame, capturing invisible content.
    // Wait for every running animation to finish, then for two painted frames.
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined)),
    );
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** Fail any test that throws an uncaught page error. */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await use(errors);
      expect(errors, "uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
