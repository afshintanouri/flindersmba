import { test, expect, seed, seedLegacy, open, COMPLETE, COMPLETE_V1, STORAGE_KEY, LEGACY_STORAGE_KEY } from "./fixtures";
import { encodeShare } from "@/lib/share";
import type { Journey } from "@/lib/journey";
import { experiences, programs } from "@/content";

test.describe("smoke", () => {
  test("application loads under the base path", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    await expect(page).toHaveTitle(/Flinders MBA Future/);
    await expect(page.locator("h1")).toContainText("BUILD YOUR");
    await expect(page.getByRole("button", { name: /Find my MBA/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Explore careers/ })).toBeVisible();
    // Static assets resolve under /flindersmba/
    const css = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
    expect(css).toMatch(/^\/flindersmba\/_next\//);
  });

  test("Matchmaker: three stages → result → options → programme detail", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    await page.getByRole("button", { name: /Find my MBA/ }).click();

    await expect(page).toHaveURL(/#q1$/);
    await page.getByRole("button", { name: "Lead with AI & emerging technology" }).click();
    await page.getByRole("button", { name: "Turn data into better decisions" }).click();
    await expect(page.getByText("2 of 3 selected")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/#q2$/);
    await page.getByRole("button", { name: "Artificial Intelligence", exact: true }).click();
    await page.getByRole("button", { name: "Data & Analytics", exact: true }).click();
    await page.getByRole("button", { name: "AI Strategy", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/#q3$/);
    await page.getByRole("button", { name: /Work hands-on with AI/ }).click();
    await page.getByRole("button", { name: /Build technical skills/ }).click();
    await page.getByRole("button", { name: /Build my MBA future/ }).click();

    await expect(page).toHaveURL(/#matching$/);
    await page.getByRole("button", { name: /Reveal my MBA/ }).click();

    await expect(page).toHaveURL(/#reveal$/);
    await expect(page.locator(".reveal h1")).toHaveText(/MBA\s*Artificial Intelligence/);
    await expect(page.getByRole("heading", { name: "Why it fits you" })).toBeVisible();

    await page.getByRole("button", { name: /See my other matches/ }).click();
    await expect(page).toHaveURL(/#options$/);
    await expect(page.locator(".option")).toHaveCount(3);
    await expect(page.locator(".option").nth(1)).toContainText("MBA Business Analytics");

    await page.locator(".option").first().click();
    await expect(page).toHaveURL(/#mba\/mba-ai$/);
    await expect(page.locator("h1")).toHaveText("MBA Artificial Intelligence");
    await expect(page.getByRole("heading", { name: "Your specialist edge" })).toBeVisible();

    // Selections persist to localStorage as stable IDs (v2 format).
    const saved = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(JSON.parse(saved!)).toMatchObject({
      ambitions: COMPLETE.ambitions,
      interests: COMPLETE.interests,
      experiences: COMPLETE.experiences,
      complete: true,
    });
  });

  test("MBA comparison opens", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "compare");
    await expect(page.locator("h1")).toHaveText("Compare your MBAs.");
    await expect(page.locator(".compare-table thead")).toContainText("Artificial Intelligence");
    await expect(page.locator(".compare-table thead")).toContainText("Business Analytics");
  });

  test("Career Explorer → cluster → career page → capability bridge", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    await page.getByRole("button", { name: /Explore careers/ }).first().click();
    await expect(page).toHaveURL(/#careers$/);
    await expect(page.locator(".choices .choice")).toHaveCount(12);

    await page.getByRole("button", { name: /^Strategy & Consulting/ }).click();
    await expect(page).toHaveURL(/#careers\/strategy-consulting$/);
    await expect(page.locator(".choices .choice")).toHaveCount(4);
    await page.getByRole("button", { name: /^Management Consultant/ }).click();

    await expect(page).toHaveURL(/#career\/management-consultant$/);
    await expect(page.locator("h1")).toHaveText("Management Consultant");
    await expect(page.locator(".info-panel")).toContainText("OSCA 223432");
    await page.getByRole("button", { name: /See how these capabilities connect/ }).click();

    await expect(page).toHaveURL(/#career\/management-consultant\/bridge$/);
    await expect(page.locator("h1")).toHaveText("From MBA to career capability.");
    await expect(page.getByRole("heading", { name: "MBAs worth exploring" })).toBeVisible();
  });

  test("Experience section and an experience story open", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    await page.getByRole("button", { name: /See what makes our MBA different/ }).click();
    await expect(page).toHaveURL(/#experiences$/);
    await expect(page.locator(".bento-tile")).toHaveCount(9);
    await page.locator(".bento-tile.story-0").click();
    await expect(page).toHaveURL(/#experience\/industry-placement$/);
    await expect(page.locator("h1")).toHaveText("Step into industry");
  });

  test("My MBA Future opens with PNG export control", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "journey");
    await expect(page.locator("h1")).toHaveText("My MBA future.");
    await expect(page.locator(".poster h2")).toContainText("Artificial Intelligence");
    const save = page.getByRole("button", { name: /Save my MBA future/ });
    await expect(save).toBeVisible();
    const download = page.waitForEvent("download");
    await save.click();
    expect((await download).suggestedFilename()).toBe("my-flinders-mba-future.png");
    await expect(page.getByRole("status")).toHaveText("Your personalised PNG is ready to download.");
  });

  test("Share uses Web Share API when available", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: unknown) => {
          (window as unknown as { __shared: unknown[] }).__shared.push(data);
        },
      });
    });
    await seed(page, COMPLETE);
    await open(page, "journey");
    await page.getByRole("button", { name: "Share" }).click();
    const shared = await page.evaluate(() => (window as unknown as { __shared: { url: string }[] }).__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toMatch(/\/flindersmba\/#share=/);
  });

  test("Share falls back without crashing when Web Share is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await seed(page, COMPLETE);
    await open(page, "journey");
    await page.getByRole("button", { name: "Share" }).click();
    // Either the clipboard succeeded or the manual copy field is shown.
    await expect(
      page.getByRole("status").filter({ hasText: "copied" }).or(page.locator(".share-input")),
    ).toBeVisible();
  });

  test("Share link (v2, stable IDs) round-trips into the journey view", async ({ page }) => {
    await seed(page, null);
    await page.goto("./#share=" + encodeShare(COMPLETE as Journey));
    await expect(page).toHaveURL(/#journey$/);
    await expect(page.locator("h1")).toHaveText("My MBA future.");
    await expect(page.locator(".poster h2")).toContainText("Artificial Intelligence");
    await expect(page.locator(".summary")).toContainText("Management Consultant");
  });

  test("generated share link uses the v2 ID-based payload", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (d: { url: string }) => ((window as unknown as { __url: string }).__url = d.url),
      });
    });
    await seed(page, COMPLETE);
    await open(page, "journey");
    await page.getByRole("button", { name: "Share" }).click();
    const url = await page.evaluate(() => (window as unknown as { __url: string }).__url);
    const payload = url.split("#share=")[1];
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    expect(json).toEqual({ v: 2, a: COMPLETE.ambitions, i: COMPLETE.interests, e: COMPLETE.experiences, c: COMPLETE.visits });
  });

  test("prototype v1 share links still open", async ({ page }) => {
    await seed(page, null);
    const v1 = Buffer.from(JSON.stringify(COMPLETE_V1)).toString("base64");
    await page.goto("./#share=" + v1);
    await expect(page).toHaveURL(/#journey$/);
    await expect(page.locator(".poster h2")).toContainText("Artificial Intelligence");
    await expect(page.locator(".summary")).toContainText("Management Consultant");
  });

  test("a shared journey does not silently overwrite a saved journey", async ({ page }) => {
    const mine = {
      ambitions: ["brands-customer-experience"],
      interests: ["marketing"],
      experiences: ["virtual-business-simulation"],
      visits: [],
      complete: true,
    };
    await seed(page, mine);
    await page.goto("./#share=" + encodeShare(COMPLETE as Journey));
    const dialog = page.getByRole("dialog", { name: "Open a shared journey" });
    await expect(dialog).toBeVisible();
    // Keeping my journey leaves my result in place.
    await dialog.getByRole("button", { name: "Keep my journey" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".poster h2")).toContainText("Marketing");
    // Opening the link again and accepting replaces it.
    await page.goto("./#share=" + encodeShare(COMPLETE as Journey));
    await page.getByRole("dialog", { name: "Open a shared journey" }).getByRole("button", { name: "Open shared journey" }).click();
    await expect(page.locator(".poster h2")).toContainText("Artificial Intelligence");
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), STORAGE_KEY);
    expect(saved.ambitions).toEqual(COMPLETE.ambitions);
  });

  test("prototype v1 saved journey is migrated to stable IDs", async ({ page }) => {
    await seedLegacy(page, COMPLETE_V1);
    await open(page, "journey");
    await expect(page.locator(".poster h2")).toContainText("Artificial Intelligence");
    const storage = await page.evaluate(
      ([k2, k1]) => [localStorage.getItem(k2), localStorage.getItem(k1)],
      [STORAGE_KEY, LEGACY_STORAGE_KEY],
    );
    expect(JSON.parse(storage[0]!)).toEqual(COMPLETE);
    expect(storage[1]).toBeNull();
  });

  test("semantic hash routes deep-link directly", async ({ page }) => {
    await seed(page, COMPLETE);
    const routes: [string, RegExp | string][] = [
      ["q1", "Where do you want to go?"],
      ["mba/mba-marketing", "MBA Marketing"],
      ["mba/mba-industry-focused", "MBA Industry-focused"],
      ["career/health-services-manager", "Health Services Manager"],
      ["career/health-services-manager/bridge", "From MBA to career capability."],
      ["careers/people-hr", "People & HR"],
      ["occupation/223432", "Management Consultant"],
      ["experience/virtual-business-simulation", "Run a virtual business"],
      ["experiences", "Experience the Flinders MBA."],
      ["not-a-route", /BUILD YOUR/],
      ["mba/not-an-mba", /BUILD YOUR/],
    ];
    for (const [route, heading] of routes) {
      await open(page, route);
      await expect(page.locator("h1").first()).toHaveText(heading);
    }
  });

  test("legacy numerical routes still work and are canonicalised", async ({ page }) => {
    await seed(page, COMPLETE);
    const routes: [string, string, RegExp][] = [
      ["mba-6", "MBA Marketing", /#mba\/mba-marketing$/],
      ["mba-0", "MBA Artificial Intelligence", /#mba\/mba-ai$/],
      ["career-6", "Health Services Manager", /#career\/health-services-manager$/],
      ["career/health-service-manager", "Health Services Manager", /#career\/health-services-manager$/],
      ["bridge-2", "From MBA to career capability.", /#career\/management-consultant\/bridge$/],
      ["story-3", "Run a virtual business", /#experience\/virtual-business-simulation$/],
    ];
    for (const [route, heading, url] of routes) {
      await open(page, route);
      await expect(page.locator("h1").first()).toHaveText(heading);
      await expect(page).toHaveURL(url);
    }
  });

  test("every programme, career and experience page renders", async ({ page }) => {
    test.setTimeout(240_000);
    await seed(page, COMPLETE);
    const { programs, careerDirections, experiences } = await import("@/content");
    for (const p of programs) {
      await open(page, "mba/" + p.id);
      await expect(page.locator("h1")).toHaveText(p.name);
    }
    for (const c of careerDirections) {
      await open(page, "career/" + c.id);
      await expect(page.locator("h1")).toHaveText(c.title);
      await open(page, "career/" + c.id + "/bridge");
      await expect(page.locator(".bridge-heading h2")).toHaveText(c.title);
    }
    for (const x of experiences) {
      await open(page, "experience/" + x.id);
      await expect(page.locator("h1")).toHaveText(x.title);
    }
  });

  test("navigation menu opens and routes", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "home");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const dialog = page.getByRole("dialog", { name: "Your discovery paths" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Explore careers/ }).click();
    await expect(page).toHaveURL(/#careers$/);
  });

  test("each programme page displays its approved positioning statement", async ({ page }) => {
    await seed(page, COMPLETE);
    for (const p of programs) {
      await open(page, "mba/" + p.id);
      await expect(page.locator("h1")).toHaveText(p.name);
      await expect(page.locator(".frame > .lead")).toHaveText(p.positioning.value);
    }
  });

  test("result, options, poster and bridge show approved positioning", async ({ page }) => {
    await seed(page, COMPLETE);
    const ai = programs.find((p) => p.id === "mba-ai")!.positioning.value;
    const ba = programs.find((p) => p.id === "mba-business-analytics")!.positioning.value;

    await open(page, "reveal");
    await expect(page.locator(".frame > .lead")).toHaveText(ai);
    await open(page, "options");
    await expect(page.locator(".option").nth(1).locator("p")).toHaveText(ba);
    await open(page, "journey");
    await expect(page.locator(".poster > p")).toHaveText(ai);
    await open(page, "career/management-consultant/bridge");
    await expect(page.locator(".story-links small").first()).toHaveText(ba);
  });

  test("experience stories show availability derived from their category", async ({ page }) => {
    await seed(page, null);
    for (const x of experiences) {
      await open(page, "experience/" + x.id);
      const line = page.locator(".frame > .micro");
      if (x.category === "shared") await expect(line).toHaveText("AVAILABLE ACROSS OUR MBA PORTFOLIO");
      else await expect(line).toHaveText("EXPERIENCE AVAILABILITY VARIES BY PROGRAM");
    }
  });

  const CLOSE = {
    ambitions: ["lead-ai-emerging-technology", "data-driven-decisions"],
    interests: ["artificial-intelligence", "python-coding", "data-analytics"],
    experiences: ["technical-skills"],
    visits: [],
    complete: true,
  };
  const BROAD = {
    ambitions: ["financial-capability", "lead-health-care", "international-business-career"],
    interests: ["marketing", "social-impact", "python-coding", "people-culture"],
    experiences: ["gamified-learning"],
    visits: [],
    complete: true,
  };

  test("close-match state shows two strong matches and leads to Compare", async ({ page }) => {
    await seed(page, CLOSE);
    await open(page, "reveal");
    await expect(page.locator(".reveal .eyebrow")).toHaveText("YOUR STRONG MATCHES");
    await expect(page.locator(".reveal h1")).toHaveText(/YOU HAVE\s*TWO STRONG MATCHES\./);
    await expect(page.locator(".frame h3").nth(0)).toHaveText("MBA Artificial Intelligence");
    await expect(page.locator(".frame h3").nth(1)).toHaveText("MBA Business Analytics");
    await page.getByRole("button", { name: /Compare my matches/ }).click();
    await expect(page).toHaveURL(/#compare$/);
    await expect(page.locator(".compare-table thead")).toContainText("Artificial Intelligence");
    await expect(page.locator(".compare-table thead")).toContainText("Business Analytics");
    await open(page, "options");
    await expect(page.locator(".option .micro").nth(0)).toHaveText("STRONG MATCH");
    await expect(page.locator(".option .micro").nth(1)).toHaveText("STRONG MATCH");
  });

  test("broad state offers options without a single strongest match", async ({ page }) => {
    await seed(page, BROAD);
    await open(page, "reveal");
    await expect(page.locator(".reveal h1")).toHaveText(/OPTIONS\./);
    await expect(page.locator(".reveal")).not.toContainText("STRONGEST");
    await open(page, "options");
    const labels = await page.locator(".option .micro").allTextContents();
    expect(labels.length).toBeGreaterThan(1);
    for (const l of labels) expect(l).toBe("WORTH EXPLORING");
  });

  test("shared experiences personalise the result without changing it", async ({ page }) => {
    await seed(page, { ...COMPLETE, experiences: [...COMPLETE.experiences, "industry-placement"] });
    await open(page, "reveal");
    await expect(page.locator(".reveal h1")).toHaveText(/Artificial Intelligence/);
    await expect(page.locator(".reason-list")).toContainText("Industry placement opportunities are available across the Flinders MBA portfolio.");
    await open(page, "journey");
    await expect(page.locator(".summary")).toContainText("ACROSS YOUR FLINDERS MBA");
  });

  test("no scores or percentages are displayed", async ({ page }) => {
    for (const j of [COMPLETE, CLOSE, BROAD]) {
      await seed(page, j);
      for (const r of ["reveal", "options", "journey"]) {
        await page.goto("about:blank");
        await open(page, r);
        const text = await page.locator("main").innerText();
        expect(text, r).not.toMatch(/\d+(\.\d+)?\s*%|\bscore\b/i);
      }
    }
  });

  test("PNG export and share still work for two close matches", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (d: { text: string }) => ((window as unknown as { __text: string }).__text = d.text),
      });
    });
    await seed(page, CLOSE);
    await open(page, "journey");
    await expect(page.locator(".poster .micro").nth(1)).toHaveText("MY STRONG MATCHES");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Save my MBA future/ }).click();
    expect((await download).suggestedFilename()).toBe("my-flinders-mba-future.png");
    await page.getByRole("button", { name: "Share" }).click();
    expect(await page.evaluate(() => (window as unknown as { __text: string }).__text)).toContain("MBA Business Analytics");
  });
});
