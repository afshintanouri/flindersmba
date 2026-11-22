import type { Page } from "@playwright/test";
import { test, expect, seed, open, COMPLETE, AFTER_Q2, type Picks } from "./fixtures";
import { getInterest } from "@/content";

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

/** Latest end time (delay + duration, ms) of any animation running in <main>. */
const animationEnd = (page: Page) =>
  page.evaluate(() =>
    Math.max(
      0,
      ...document
        .querySelector("main")!
        .getAnimations({ subtree: true })
        .map((a) => {
          const t = a.effect!.getTiming();
          return Number(t.delay ?? 0) + Number(t.duration ?? 0);
        }),
    ),
  );

/**
 * Elements in <main> that are still invisible (opacity < 1) and not deliberately hidden.
 * Sampled once the animations already running in <main> have finished. Their timing is
 * asserted separately (animationEnd), so this wait is bounded by that budget; it only
 * removes a race where a just-created animation (≈0.01ms under reduced motion) has not
 * yet been ticked by a heavily loaded browser when opacity is read.
 */
const hiddenContent = (page: Page) =>
  page.evaluate(async () => {
    const running = document.querySelector("main")!.getAnimations({ subtree: true });
    await Promise.race([
      Promise.all(running.map((a) => a.finished.catch(() => undefined))),
      new Promise((r) => setTimeout(r, 2000)),
    ]);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return [...document.querySelectorAll("main *")]
      .filter((e) => (e as HTMLElement).offsetParent && !e.closest(".sr-only") && e.textContent?.trim())
      .filter((e) => {
        let n: Element | null = e;
        while (n && n.tagName !== "MAIN") {
          const s = getComputedStyle(n);
          if (Number(s.opacity) < 1 && !n.matches(".choice[aria-disabled], .action:disabled")) return true;
          n = n.parentElement;
        }
        return false;
      })
      .map((e) => e.tagName + "." + (e as HTMLElement).className)
      .slice(0, 5);
  });

const ROUTES: [string, Picks | null][] = [
  ["q2", AFTER_Q2],
  ["matching", COMPLETE],
  ["reveal", COMPLETE],
  ["career/brand-manager", null],
  ["career/digital-transformation-manager/bridge", null],
  ["experience/industry-placement", null],
  ["journey", COMPLETE],
];

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const [route, picks] of ROUTES) {
    test(`${route}: everything is visible immediately, with no reveal delay`, async ({ page }) => {
      await seed(page, picks);
      await page.goto("./#" + route);
      await page.locator('main[data-ready="true"]').waitFor();
      expect(await animationEnd(page)).toBeLessThanOrEqual(1);
      expect(await hiddenContent(page)).toEqual([]);
    });
  }

  test("CTAs work at once and the Matchmaker reveal skips its delay", async ({ page }) => {
    await seed(page, COMPLETE);
    await page.goto("./#matching");
    await page.locator('main[data-ready="true"]').waitFor();
    await page.getByRole("button", { name: /Reveal my MBA/ }).click();
    await expect(page).toHaveURL(/#reveal$/);
    await page.getByRole("button", { name: "Explore my MBA" }).click();
    await expect(page).toHaveURL(/#mba\/mba-ai$/);
  });
});

test.describe("motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the clear-match reveal finishes within 1.5s and leaves nothing hidden", async ({ page }) => {
    await seed(page, COMPLETE);
    await page.goto("./#reveal");
    await page.locator('main[data-ready="true"]').waitFor();
    const end = await animationEnd(page);
    expect(end).toBeGreaterThan(0);
    expect(end).toBeLessThanOrEqual(1500);
    await page.waitForTimeout(end + 100);
    expect(await hiddenContent(page)).toEqual([]);
  });

  test("visitors can proceed immediately during the reveal", async ({ page }) => {
    await seed(page, COMPLETE);
    await page.goto("./#reveal");
    await page.locator('main[data-ready="true"]').waitFor();
    await page.getByRole("button", { name: "Explore my MBA" }).click();
    await expect(page).toHaveURL(/#mba\/mba-ai$/);
  });

  test("recap uses the visitor's real selections", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "reveal");
    await expect(page.locator(".reveal-recap span")).toHaveText(COMPLETE.interests.map((i) => getInterest(i as never).label));
    await expect(page.locator(".reveal-bridge")).toHaveText("THAT POINTS TO…");
  });

  test("close matches are revealed with equal status", async ({ page }) => {
    await seed(page, CLOSE);
    await open(page, "reveal");
    await expect(page.locator(".reveal-bridge")).toHaveText("YOUR CHOICES POINT IN TWO STRONG DIRECTIONS");
    const peers = page.locator(".match-headline .peer");
    await expect(peers).toHaveCount(2);
    const styles = await peers.evaluateAll((els) =>
      els.map((e) => {
        const s = getComputedStyle(e);
        return [s.animationName, s.animationDelay, s.animationDuration, s.fontSize, s.fontWeight, s.color].join("|");
      }),
    );
    expect(styles[0]).toBe(styles[1]);
  });

  test("broad options share one treatment, revealed progressively", async ({ page }) => {
    await seed(page, BROAD);
    await open(page, "reveal");
    await expect(page.locator(".reveal-bridge")).toHaveText("YOUR INTERESTS CROSS SEVERAL MBA PATHWAYS");
    const peers = await page.locator(".match-headline .peer").evaluateAll((els) =>
      els.map((e) => {
        const s = getComputedStyle(e);
        return { look: [s.animationName, s.animationDuration, s.fontSize, s.fontWeight, s.color].join("|"), delay: parseFloat(s.animationDelay) };
      }),
    );
    expect(peers.length).toBeGreaterThanOrEqual(2);
    expect(new Set(peers.map((p) => p.look)).size).toBe(1);
    for (let i = 1; i < peers.length; i++) expect(peers[i].delay).toBeGreaterThan(peers[i - 1].delay);
  });

  test("matching sequence: three inputs, then a result line matching the classification", async ({ page }) => {
    for (const [j, line] of [[COMPLETE, "We’ve found your MBA direction."], [CLOSE, "We’ve found your MBA matches."], [BROAD, "We’ve found your MBA options."]] as const) {
      await seed(page, j);
      await open(page, "matching");
      await expect(page.locator(".match-checks li")).toHaveText(["Your ambitions", "Your interests", "Your ideal experience"]);
      await expect(page.locator(".match-cue")).toHaveText(line);
      await expect(page.locator(".matching")).not.toContainText(/\bAI (algorithm|analysis)|machine learning/i);
      await page.goto("about:blank");
    }
  });

  test("selecting a card gives feedback without layout shift", async ({ page }) => {
    await seed(page, null);
    await open(page, "q1");
    const rects = () => page.locator(".choice").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(","); }));
    const before = await rects();
    await page.locator(".choice").nth(1).click();
    await page.waitForTimeout(400);
    expect(await rects()).toEqual(before);
    await expect(page.locator(".choice").nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".choice").nth(1)).toHaveCSS("transform", "none");
    // Keyboard selection gets the same state change.
    await page.locator(".choice").nth(2).focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".choice").nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".steps .current")).toHaveCount(1);
  });

  test("My MBA Future finale plays on the first arrival only; the QR code is never animated", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 1024 });
    await seed(page, COMPLETE);
    await open(page, "journey");
    await expect(page.locator(".frame.finale")).toHaveCount(1);
    const qrAnimated = await page.locator("svg.qr").evaluate((svg) => {
      for (let n: Element | null = svg; n; n = n.parentElement) if (n.getAnimations().length) return true;
      return false;
    });
    expect(qrAnimated).toBe(false);
    await expect(page.locator("svg.qr")).toHaveCSS("opacity", "1");
    await open(page, "home");
    await open(page, "journey");
    await expect(page.locator(".frame.finale")).toHaveCount(0);
    await expect(page.locator(".frame.journey-page")).toHaveCount(1);
  });

  test("career pages stay calm and complete; bridge reveals capabilities then MBAs", async ({ page }) => {
    await seed(page, null);
    await page.goto("./#career/brand-manager");
    await page.locator('main[data-ready="true"]').waitFor();
    expect(await animationEnd(page)).toBeLessThanOrEqual(1100);
    await page.waitForTimeout(1200);
    await expect(page.locator(".info-panel")).toContainText("Brand Manager is an official specialisation of:");
    await expect(page.locator(".info-panel")).toContainText("OSCA 221534");
    expect(await hiddenContent(page)).toEqual([]);
    await open(page, "career/brand-manager/bridge");
    expect(await hiddenContent(page)).toEqual([]);
    await expect(page.locator(".bridge-list button").first()).toHaveAttribute("aria-expanded", "true");
  });
});
