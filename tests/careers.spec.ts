import { test, expect, seed, open, COMPLETE, STORAGE_KEY } from "./fixtures";
import { careerDirections, getCareerCapability } from "@/content";

/** [career id, h1 title, text expected in the occupation panel, text that must NOT appear there] */
const CAREERS: [string, string, (string | RegExp)[], (string | RegExp)[]][] = [
  ["management-consultant", "Management Consultant", ["Management Consultant", "OSCA 223432", "This is an official OSCA occupation."], [/XXXXXX/]],
  ["data-analyst", "Data Analyst", ["Data Analyst", "OSCA 223231", "This is an official OSCA occupation."], []],
  ["business-analyst", "Business Analyst", ["Business Analyst (non-ICT) is an official specialisation of:", "Management Consultant", "OSCA 223432"], ["This is an official OSCA occupation."]],
  ["business-intelligence", "Business Intelligence Manager", ["ICT Business Intelligence Manager is an official title included within:", "ICT Managers nec", "OSCA 113299", "standalone six-digit occupation"], []],
  ["ai-strategy-lead", "AI Strategy Lead", ["This is a contemporary career direction rather than a single official OSCA occupation."], [/OSCA \d{6}/, /no match/i]],
  ["digital-transformation-manager", "Digital Transformation Manager", ["This is a contemporary career direction rather than a single official OSCA occupation."], [/OSCA \d{6}/]],
  ["marketing-specialist", "Marketing Specialist", ["Marketing Specialist", "OSCA 221534", "This is an official OSCA occupation."], []],
  ["brand-manager", "Brand Manager", ["Brand Manager is an official specialisation of:", "Marketing Specialist", "OSCA 221534"], ["This is an official OSCA occupation."]],
  ["financial-analyst", "Financial Analyst", ["Financial Analyst is an official specialisation of:", "Accountant (General)", "OSCA 211131"], ["This is an official OSCA occupation."]],
  ["finance-manager", "Finance Manager / Chief Financial Officer", ["Finance Manager", "OSCA 111231", "This is an official OSCA occupation."], []],
  ["health-services-manager", "Health Services Manager", ["explored through the capabilities connected with it"], [/OSCA \d{6}/]],
  ["human-resources-manager", "Human Resources Manager", ["Human Resources Manager", "OSCA 111331", "This is an official OSCA occupation."], []],
  ["people-culture-manager", "People & Culture Manager", ["People and Culture Manager is an official alternative title of:", "Human Resources Manager", "OSCA 111331"], ["This is an official OSCA occupation."]],
  ["international-business-development", "International Business Development", ["Business Development Manager", "OSCA 112132", "is not itself an official OSCA title"], []],
  ["social-impact-manager", "Social Impact Manager", ["This is a contemporary career direction rather than a single official OSCA occupation."], [/OSCA \d{6}/]],
  ["environment-sustainability-manager", "Environment & Sustainability Manager", ["Environment and Sustainability Manager is an official specialisation of:", "Environmental Manager", "OSCA 149331"], []],
  ["entrepreneur-founder", "Entrepreneur / Founder", ["Entrepreneurship is presented as a venture pathway rather than a single OSCA occupation."], [/OSCA \d{6}/]],
  ["supply-chain-operations-manager", "Supply Chain & Operations Manager", ["Supply and Distribution Manager", "OSCA 133331", "is not itself an official OSCA title"], []],
  ["manufacturing-operations-manager", "Production Manager (Manufacturing)", ["Production Manager (Manufacturing)", "OSCA 132232", "This is an official OSCA occupation."], []],
];

const FORBIDDEN = /\d+(\.\d+)?\s*%|\bscore\b|\bsalar(y|ies)\b|\bvisa\b|\bmigrat|\bresidency\b|skills assessment|guarantee|OSCA requirement|required skills|mandatory|XXXXXX|No match found/i;

test.describe("Career Explorer integration", () => {
  for (const [id, title, expected, absent] of CAREERS) {
    test(`${title}: occupation relationship, capabilities and MBA connections`, async ({ page }) => {
      await seed(page, null);
      await open(page, "career/" + id);
      await expect(page.locator("h1")).toHaveText(title);
      const panel = page.locator(".info-panel");
      for (const t of expected) await expect(panel).toContainText(t);
      for (const t of absent) await expect(panel).not.toContainText(t);

      const d = careerDirections.find((x) => x.id === id)!;
      await expect(page.locator(".frame > .chips span")).toHaveText(d.capabilityIds.map((c) => getCareerCapability(c).label));
      const cards = page.locator(".career-mba .option");
      await expect(cards).toHaveCount(d.mba.connections.length);
      if (d.mba.mode === "explore") {
        await expect(page.getByRole("heading", { name: "MBAs worth exploring" })).toBeVisible();
        await expect(page.locator(".career-mba")).not.toContainText(/STRONG CONNECTION|RELEVANT CONNECTION/);
      } else await expect(page.getByRole("heading", { name: "How Flinders MBAs connect" })).toBeVisible();

      // What this career can involve: official (restrained) or curated (never attributed to ABS).
      if (d.primary) {
        await expect(page.locator(".lead-statement")).toContainText(`OSCA ${d.primary.code}`);
        expect(await page.locator(".frame > .rows li").count()).toBeLessThanOrEqual(4);
      } else {
        await expect(page.getByText("It is not an official ABS description.")).toBeVisible();
      }
      await expect(page.getByText(/OSCA occupations are shown only to illustrate potential connections/)).toBeVisible();
      expect(await page.locator("main").innerText()).not.toMatch(FORBIDDEN);
    });
  }

  test("every Career Direction and bridge renders without forbidden content", async ({ page }) => {
    test.setTimeout(180_000);
    await seed(page, null);
    for (const d of careerDirections) {
      await open(page, "career/" + d.id);
      await expect(page.locator("h1")).toHaveText(d.title);
      expect(await page.locator("main").innerText(), d.id).not.toMatch(FORBIDDEN);
      expect(await page.locator(".career-mba .option").count()).toBeLessThanOrEqual(3);
    }
  });

  test("Finance: analyst careers show the analytical and the financial angle honestly", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/financial-analyst");
    const cards = page.locator(".career-mba .option");
    await expect(cards.nth(0).locator("h2")).toHaveText("MBA Business Analytics");
    await expect(cards.nth(0)).toContainText("Data Analysis");
    await expect(cards.nth(1).locator("h2")).toHaveText("MBA Finance");
    await expect(cards.nth(1)).toContainText("Financial Decision-making");
    await open(page, "career/finance-manager");
    await expect(page.locator(".career-mba .option").first().locator("h2")).toHaveText("MBA Finance");
    await expect(page.locator(".career-mba .option").first()).toContainText("RELEVANT CONNECTION");
  });

  test("MBA connection cards open the existing programme page", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/data-analyst");
    await page.getByRole("button", { name: "Explore MBA Business Analytics" }).click();
    await expect(page).toHaveURL(/#mba\/mba-business-analytics$/);
    await expect(page.locator("h1")).toHaveText("MBA Business Analytics");
  });

  test("shared Flinders experiences are portfolio-wide and link to their stories", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/management-consultant");
    await expect(page.getByRole("heading", { name: "Across your Flinders MBA" })).toBeVisible();
    await expect(page.getByText("AVAILABLE ACROSS OUR MBA PORTFOLIO")).toBeVisible();
    await page.getByRole("button", { name: /Business simulation \(BUSN9148\)/ }).click();
    await expect(page).toHaveURL(/#experience\/virtual-business-simulation$/);
  });

  test("capability bridge: expand/collapse semantics and verified evidence", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/data-analyst/bridge");
    const buttons = page.locator(".bridge-list button");
    await expect(buttons.first()).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".bridge-panel")).toContainText("MBA Business Analytics");
    await buttons.nth(1).click();
    await expect(buttons.first()).toHaveAttribute("aria-expanded", "false");
    await expect(buttons.nth(1)).toHaveAttribute("aria-expanded", "true");
    const panelId = await buttons.nth(1).getAttribute("aria-controls");
    await expect(page.locator(`#${panelId}`)).toBeVisible();
  });
});

test.describe("Career Explorer search", () => {
  test("search returns curated directions first, then official occupations, clearly labelled", async ({ page }) => {
    await seed(page, null);
    await open(page, "careers");
    const box = page.getByRole("searchbox", { name: "Search careers" });
    await box.fill("brand manager");
    await expect(page.locator(".choice").first()).toContainText("CAREER DIRECTION");
    await expect(page.locator(".choice").first()).toContainText("Brand Manager");
    const official = page.locator(".choice", { hasText: "OFFICIAL OSCA OCCUPATION" });
    await expect(official.first()).toContainText("Official specialisation of Marketing Specialist · OSCA 221534");
    await expect(page.getByRole("status").filter({ hasText: "found for" })).toContainText(/career direction.*official occupation/);

    for (const [q, first] of [
      ["management consultant", "Management Consultant"],
      ["people and culture", "People & Culture Manager"],
      ["data analyst", "Data Analyst"],
      ["business intelligence", "Business Intelligence Manager"],
      ["social impact", "Social Impact Manager"],
      ["digital transformation", "Digital Transformation Manager"],
    ]) {
      await box.fill(q);
      await expect(page.locator(".choice").first(), q).toContainText(first);
    }
  });

  test("AI uses token-aware matching (never Thai Massage Therapist)", async ({ page }) => {
    await seed(page, null);
    await open(page, "careers");
    await page.getByRole("searchbox", { name: "Search careers" }).fill("AI");
    await expect(page.locator(".choice").first()).toContainText("AI Strategy Lead");
    await expect(page.getByRole("status").filter({ hasText: "found for" })).toContainText("official occupation");
    await expect(page.locator("main")).not.toContainText(/Thai/i);
  });

  test("an official occupation outside the curated 48 gets no MBA recommendations", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "careers");
    await page.getByRole("searchbox", { name: "Search careers" }).fill("thai massage");
    await page.locator(".choice", { hasText: "OFFICIAL OSCA OCCUPATION" }).first().click();
    await expect(page).toHaveURL(/#occupation\/\d{6}$/);
    await expect(page.locator(".frame > .eyebrow")).toHaveText("OFFICIAL AUSTRALIAN OCCUPATION");
    await expect(page.getByText("Explore our curated career directions for MBA connections.")).toBeVisible();
    await expect(page.locator(".career-mba")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Where it sits in OSCA" })).toBeVisible();
    expect(await page.locator(".frame > .rows:not(.hierarchy) li").count()).toBeLessThanOrEqual(4);
    // Official browsing is never recorded in the journey.
    const saved = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))!);
    expect(saved.visits).toEqual(COMPLETE.visits);
  });
});

test.describe("OSCA loading and journey", () => {
  test("OSCA files load lazily: nothing on home; only the needed detail file on a career page", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/data/osca/")) requested.push(r.url().split("/data/osca/")[1]);
    });
    await seed(page, null);
    await open(page, "home");
    expect(requested).toEqual([]);
    await open(page, "career/management-consultant");
    await expect(page.locator(".lead-statement")).toBeVisible();
    expect(requested).toEqual(["occupations-details/2.json"]);
    await page.goto("about:blank");
    requested.length = 0;
    await open(page, "careers");
    await expect.poll(() => requested).toContain("occupations-index.json");
    expect(requested.some((r) => r.startsWith("occupations-details/"))).toBe(false);
  });

  test("a failed OSCA fetch degrades gracefully with a retry", async ({ page }) => {
    await page.route("**/data/osca/occupations-details/**", (r) => r.abort());
    await seed(page, null);
    await open(page, "career/management-consultant");
    await expect(page.getByText("Official occupation information could not be loaded right now.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.locator(".info-panel")).toContainText("OSCA 223432");
  });

  test("explored Career Directions are recorded and shown on My MBA Future", async ({ page }) => {
    await seed(page, COMPLETE);
    await open(page, "career/brand-manager");
    await open(page, "career/data-analyst");
    const saved = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY))!);
    expect(saved.visits).toEqual(["management-consultant", "brand-manager", "data-analyst"]);
    await open(page, "journey");
    await expect(page.locator(".frame .chips").last()).toContainText("Data Analyst");
    await expect(page.locator(".frame .chips").last()).toContainText("Brand Manager");
  });

  test("route changes still move focus to the main content", async ({ page }) => {
    await seed(page, null);
    await open(page, "careers/people-hr");
    await page.getByRole("button", { name: /^Human Resources Manager/ }).click();
    await expect(page.locator("h1")).toHaveText("Human Resources Manager");
    await expect(page.locator("main")).toBeFocused();
  });
});
