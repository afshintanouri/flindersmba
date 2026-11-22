import jsQR from "jsqr";
import type { Page } from "@playwright/test";
import { test, expect, seed, open, COMPLETE, STORAGE_KEY, type Picks } from "./fixtures";
import { decodeShare, encodeShare } from "@/lib/share";
import { KIOSK_IDLE_RESET_MS, KIOSK_IDLE_WARNING_MS, KIOSK_STORAGE_KEY } from "@/lib/kiosk";
import type { Journey } from "@/lib/journey";

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
  visits: ["data-analyst", "brand-manager"],
  complete: true,
};

/** Opens a route with an optional query string (e.g. "?kiosk=1"). */
async function go(page: Page, route: string, query = "") {
  await page.goto("./" + query + "#" + route);
  await page.locator('main[data-ready="true"]').waitFor();
}

/** Reads the QR code drawn on the page (pixels → jsQR), like a phone camera would. */
async function scanQr(page: Page): Promise<string | null> {
  const img = await page.locator("svg.qr").evaluate(async (svg) => {
    const size = 420;
    const xml = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#fff";
    c.fillRect(0, 0, size, size);
    c.drawImage(image, 0, 0, size, size);
    return Array.from(c.getImageData(0, 0, size, size).data);
  });
  return jsQR(Uint8ClampedArray.from(img), 420, 420)?.data ?? null;
}

const expectedUrl = (base: string, j: Picks) => `${base}#share=${encodeShare(j as Journey)}`;

test.describe("kiosk mode", () => {
  test("detected from ?kiosk=1 / ?kiosk=true only", async ({ page }) => {
    await seed(page, null);
    await go(page, "home");
    await expect(page.locator("html")).not.toHaveClass(/kiosk/);
    await go(page, "home", "?kiosk=1");
    await expect(page.locator("html")).toHaveClass(/kiosk/);
    await go(page, "careers", "?kiosk=true");
    await expect(page.locator("html")).toHaveClass(/kiosk/);
    await expect(page.locator("h1")).toHaveText("Where could your MBA take you?");
  });

  test("a new kiosk visitor never inherits the device's saved journey, and the kiosk never writes it", async ({ page }) => {
    await seed(page, COMPLETE);
    await go(page, "journey", "?kiosk=1");
    await expect(page.locator("h1")).toHaveText("My journey.");
    await go(page, "q1", "?kiosk=1");
    await page.locator(".choice").first().click();
    const stored = await page.evaluate(
      ([k, kk]) => ({ local: localStorage.getItem(k), kiosk: sessionStorage.getItem(kk) }),
      [STORAGE_KEY, KIOSK_STORAGE_KEY],
    );
    expect(JSON.parse(stored.local!)).toEqual(COMPLETE);
    expect(JSON.parse(stored.kiosk!).ambitions).toHaveLength(1);
  });

  test("ordinary visitors keep their journey and never see the idle prompt", async ({ page }) => {
    await page.clock.install();
    await seed(page, COMPLETE);
    await go(page, "journey");
    await page.clock.fastForward(KIOSK_IDLE_WARNING_MS + KIOSK_IDLE_RESET_MS + 60_000);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator("h1")).toHaveText("My MBA future.");
    await page.reload();
    await page.locator('main[data-ready="true"]').waitFor();
    await expect(page.locator("h1")).toHaveText("My MBA future.");
  });

  async function kioskWithSelection(page: Page) {
    await page.clock.install();
    await seed(page, null);
    await go(page, "q1", "?kiosk=1");
    await page.locator(".choice").first().click();
    await expect(page.locator("#selection-status")).toContainText("1 of 3 selected");
  }

  test("idle warning after the configured time, then automatic reset", async ({ page }) => {
    await kioskWithSelection(page);
    await page.clock.fastForward(KIOSK_IDLE_WARNING_MS - 5_000);
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.clock.fastForward(10_000);
    const dialog = page.getByRole("dialog", { name: "Ready for the next MBA journey?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Continue my journey" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Start fresh" })).toBeVisible();

    await page.clock.fastForward(KIOSK_IDLE_RESET_MS + 1_000);
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\?kiosk=1#home$/);
    expect(JSON.parse((await page.evaluate((k) => sessionStorage.getItem(k), KIOSK_STORAGE_KEY))!).ambitions).toEqual([]);
    await go(page, "q1", "?kiosk=1");
    await expect(page.locator("#selection-status")).toContainText("0 of 3 selected");
  });

  test("continue keeps the journey and re-arms the timer", async ({ page }) => {
    await kioskWithSelection(page);
    await page.clock.fastForward(KIOSK_IDLE_WARNING_MS + 1_000);
    await page.getByRole("button", { name: "Continue my journey" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.clock.fastForward(KIOSK_IDLE_RESET_MS + 5_000);
    await expect(page).toHaveURL(/#q1$/);
    await expect(page.locator("#selection-status")).toContainText("1 of 3 selected");
    await page.clock.fastForward(KIOSK_IDLE_WARNING_MS);
    await expect(page.getByRole("dialog", { name: "Ready for the next MBA journey?" })).toBeVisible();
  });

  test("activity postpones the prompt; start fresh resets immediately", async ({ page }) => {
    await kioskWithSelection(page);
    await page.clock.fastForward(KIOSK_IDLE_WARNING_MS - 10_000);
    await page.mouse.click(5, 300);
    await page.clock.fastForward(20_000);
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.clock.fastForward(KIOSK_IDLE_WARNING_MS);
    await page.getByRole("button", { name: "Start fresh" }).click();
    await expect(page).toHaveURL(/#home$/);
    await go(page, "journey", "?kiosk=1");
    await expect(page.locator("h1")).toHaveText("My journey.");
  });

  test("an untouched kiosk Home screen is not interrupted", async ({ page }) => {
    await page.clock.install();
    await seed(page, null);
    await go(page, "home", "?kiosk=1");
    await page.clock.fastForward(3 * KIOSK_IDLE_WARNING_MS);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("kiosk My MBA Future prioritises the QR hand-off (no download to the shared device)", async ({ page }) => {
    await seed(page, null);
    await page.addInitScript(([k, j]) => sessionStorage.setItem(k, j), [KIOSK_STORAGE_KEY, JSON.stringify(COMPLETE)] as const);
    await go(page, "journey", "?kiosk=1");
    await expect(page.getByRole("heading", { name: "TAKE YOUR MBA FUTURE WITH YOU" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save my MBA future/ })).toHaveCount(0);
    const url = await page.locator("svg.qr").getAttribute("data-url");
    expect(url).not.toContain("kiosk");
    expect(url).toBe(expectedUrl(new URL(page.url()).origin + "/flindersmba/", COMPLETE));
  });
});

test.describe("QR hand-off", () => {
  for (const [name, j] of [["clear match", COMPLETE], ["two close matches", CLOSE], ["broad options with explored careers", BROAD]] as const) {
    test(`${name}: the scanned URL is the v2 share link under /flindersmba/`, async ({ page, browser }) => {
      await page.setViewportSize({ width: 1366, height: 1024 });
      await seed(page, j);
      await open(page, "journey");
      const svgUrl = await page.locator("svg.qr").getAttribute("data-url");
      const base = new URL(page.url()).origin + "/flindersmba/";
      expect(svgUrl).toBe(expectedUrl(base, j));
      const scanned = await scanQr(page);
      expect(scanned).toBe(svgUrl);
      const decoded = decodeShare(scanned!.split("#share=")[1])!;
      expect(decoded.version).toBe(2);
      expect(decoded.journey).toEqual({ ...j, complete: true });

      // A clean phone browser opens the shared result directly.
      const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await phone.newPage();
      await p.goto(scanned!);
      await p.locator('main[data-ready="true"]').waitFor();
      await expect(p).toHaveURL(/\/flindersmba\/#journey$/);
      await expect(p.locator("h1")).toHaveText("My MBA future.");
      await expect(p.getByRole("dialog")).toBeHidden();
      await phone.close();
    });
  }

  test("a phone with a different saved journey is asked before it is replaced", async ({ page, browser }) => {
    await page.setViewportSize({ width: 1366, height: 1024 });
    await seed(page, COMPLETE);
    await open(page, "journey");
    const url = (await page.locator("svg.qr").getAttribute("data-url"))!;
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await phone.newPage();
    await seed(p, BROAD);
    await p.goto(url);
    const dialog = p.getByRole("dialog", { name: "Open a shared journey" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Keep my journey" }).click();
    expect(JSON.parse((await p.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))!)).toEqual(BROAD);
    await phone.close();
  });

  test("phones prioritise Share / Save; no QR on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page, COMPLETE);
    await open(page, "journey");
    await expect(page.getByRole("button", { name: /Save my MBA future/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(page.locator("svg.qr")).toHaveCount(0);
  });
});

test.describe("share fallbacks and errors", () => {
  test("without Web Share or clipboard, the link is offered to copy", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await seed(page, COMPLETE);
    await open(page, "journey");
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Copy your personalised link below." })).toBeVisible();
    const field = page.getByRole("textbox", { name: "Copy your personalised link" });
    await expect(field).toHaveValue(/\/flindersmba\/#share=/);
    await expect(page.locator("main")).not.toContainText(/denied|Error/);
  });

  test("an invalid share link explains itself and returns home", async ({ page }) => {
    await seed(page, COMPLETE);
    await page.goto("./#share=not-a-valid-payload");
    await page.locator('main[data-ready="true"]').waitFor();
    const dialog = page.getByRole("dialog", { name: "This shared link could not be opened" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#home$/);
    await dialog.getByRole("button", { name: "Back to home" }).click();
    // The visitor's own journey is untouched.
    expect(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))!)).toEqual(COMPLETE);
  });

  test("Career Explorer stays usable when official OSCA data cannot load", async ({ page }) => {
    await page.route("**/data/osca/**", (r) => r.abort());
    await seed(page, null);
    await open(page, "careers");
    await page.getByRole("searchbox", { name: "Search careers" }).fill("data analyst");
    await expect(page.locator(".choice").first()).toContainText("Data Analyst");
    await expect(page.getByText("Official occupations could not be loaded right now.")).toBeVisible();
    await page.locator(".choice").first().click();
    await expect(page.locator("h1")).toHaveText("Data Analyst");
    await expect(page.locator(".career-mba .option").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/TypeError|Failed to fetch|HTTP/);
  });
});

test.describe("navigation accessibility", () => {
  test("document titles per route", async ({ page }) => {
    await seed(page, COMPLETE);
    const titles: [string, string][] = [
      ["home", "Flinders MBA Future"],
      ["q1", "Find My MBA | Flinders MBA Future"],
      ["mba/mba-ai", "MBA Artificial Intelligence | Flinders MBA Future"],
      ["careers", "Career Explorer | Flinders MBA Future"],
      ["careers/people-hr", "People & HR careers | Flinders MBA Future"],
      ["career/management-consultant", "Management Consultant | Flinders MBA Future"],
      ["journey", "My MBA Future | Flinders MBA Future"],
      ["experiences", "The Flinders difference | Flinders MBA Future"],
      ["occupation/223432", "Australian occupation 223432 | Flinders MBA Future"],
    ];
    for (const [route, title] of titles) {
      await open(page, route);
      await expect(page, route).toHaveTitle(title);
    }
  });

  test("route changes are announced and move focus to the main content", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    await page.getByRole("button", { name: /Explore careers/ }).first().click();
    await expect(page.locator("p[aria-live]").first()).toHaveText("Career Explorer page");
    await expect(page.locator("main")).toBeFocused();
  });

  test("menu button exposes its dialog state", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    const trigger = page.getByRole("button", { name: "Open navigation" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-controls", "site-dialog");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#site-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("capability accordion panels are labelled regions", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/management-consultant/bridge");
    const first = page.locator(".bridge-list button").first();
    const panel = page.locator("#" + (await first.getAttribute("aria-controls")));
    await expect(panel).toHaveAttribute("role", "region");
    await expect(page.getByRole("region", { name: "Strategic Thinking" })).toBeVisible();
  });

  test("compare table uses header scopes and a spoken alternative to the dash", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "compare");
    await expect(page.locator(".compare-table thead th[scope=col]")).toHaveCount(3);
    expect(await page.locator(".compare-table tbody th[scope=row]").count()).toBeGreaterThan(0);
    await expect(page.locator(".compare-table td .sr-only").first()).toHaveText("Not a listed specialist focus");
  });

  test("Matchmaker explains the selection limit and keeps choices reachable", async ({ page }) => {
    await seed(page, null);
    await open(page, "q1");
    const choices = page.locator(".choice");
    for (let i = 0; i < 3; i++) await choices.nth(i).click();
    await expect(page.locator("#selection-status")).toContainText("3 of 3 selected · Maximum reached");
    const fourth = choices.nth(3);
    await expect(fourth).toHaveAttribute("aria-disabled", "true");
    await expect(fourth).toHaveAttribute("aria-describedby", "selection-status");
    await fourth.focus();
    await expect(fourth).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(fourth).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#selection-status")).toContainText("Deselect one of your 3 choices");
    await choices.nth(0).click();
    await expect(fourth).not.toHaveAttribute("aria-disabled", "true");
  });
});

test.describe("Career Explorer keyboard and search announcements", () => {
  test("search results are announced once typing pauses", async ({ page }) => {
    await seed(page, null);
    await open(page, "careers");
    const status = page.locator("#career-search-status");
    await page.getByRole("searchbox", { name: "Search careers" }).pressSequentially("data analyst", { delay: 20 });
    await expect(status).toHaveText(/^\d+ career directions? and \d+ official occupations? found for “data analyst”\.$/);
    await expect(page.getByRole("list", { name: /CAREER DIRECTIONS/ })).toBeVisible();
    await expect(page.getByRole("list", { name: /OFFICIAL AUSTRALIAN OCCUPATIONS/ })).toBeVisible();
  });

  test("keyboard: search, tab to a curated direction, then to an official result", async ({ page }) => {
    await seed(page, null);
    await open(page, "careers");
    const box = page.getByRole("searchbox", { name: "Search careers" });
    await box.focus();
    await page.keyboard.type("brand manager");
    await expect(page.locator(".choice", { hasText: "OFFICIAL OSCA OCCUPATION" }).first()).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.locator(".choice").first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#career\/brand-manager$/);
    await page.goBack();
    await page.locator('main[data-ready="true"]').waitFor();
    await page.getByRole("searchbox", { name: "Search careers" }).fill("brand manager");
    const official = page.locator(".choice", { hasText: "OFFICIAL OSCA OCCUPATION" }).first();
    await official.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#occupation\/221534$/);
  });
});

test.describe("share wording", () => {
  for (const [kind, picks, names] of [
    ["clear", COMPLETE, 1],
    ["close", CLOSE, 2],
    ["broad", BROAD, 2],
  ] as const) {
    test(`${kind} result shares as "My MBA Future" with the unchanged link`, async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __shared: unknown[] }).__shared = [];
        Object.defineProperty(navigator, "share", {
          value: async (d: unknown) => void (window as unknown as { __shared: unknown[] }).__shared.push(d),
        });
      });
      await seed(page, picks);
      await open(page, "journey");
      await page.getByRole("button", { name: "Share", exact: true }).click();
      const [d] = await page.evaluate(() => (window as unknown as { __shared: { title: string; text: string; url: string }[] }).__shared);
      expect(d.title).toBe("My MBA Future");
      expect(d.text).toMatch(/^My MBA Future: MBA /);
      expect(d.text.split(", ").length).toBeGreaterThanOrEqual(names);
      expect(d.text).not.toMatch(/Flinders/);
      expect(d.url).toBe(`${new URL(page.url()).origin}/flindersmba/#share=${encodeShare(picks as Journey)}`);
    });
  }
});
