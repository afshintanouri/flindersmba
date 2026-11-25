import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { test, expect, seed, open } from "./fixtures";

/** SHA-256 of the Flinders University logo approved by Marketing and Compliance (25 Nov 2026). */
const APPROVED_LOGO_SHA256 = "d82a82782b70e3780e2883c1a65c8dce6805d3a9918a3e491b9b046d59a0b136";

/**
 * Public release: the header shows the approved Flinders University logo
 * (unmodified), and no template icons or excluded ABS material are distributed.
 */
test.describe("public release identity", () => {
  test("header shows the approved Flinders University logo, not a text-only override", async ({ page }) => {
    const logoResponses: number[] = [];
    page.on("response", (r) => {
      if (r.url().endsWith("/flindersmba/flinders.svg")) logoResponses.push(r.status());
    });
    await seed(page, null);
    await open(page, "home");
    const brand = page.locator("header .brand");
    await expect(brand).toHaveAccessibleName("Flinders MBA Future home");
    const logo = brand.locator('img[src="./flinders.svg"]');
    await expect(logo).toHaveAttribute("alt", "Flinders University");
    await expect(logo).toBeVisible();
    expect(await logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(logoResponses).toContain(200);
    await expect(page.locator(".brand-text, .brand-title, .brand-status")).toHaveCount(0);
    await expect(page.locator("header")).not.toContainText(/prototype/i);
    expect((await brand.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await brand.click();
    await expect(page).toHaveURL(/#home$/);
  });

  test("the approved logo ships unmodified; no template icons or ABS workbooks are distributed", () => {
    expect(createHash("sha256").update(readFileSync("public/flinders.svg")).digest("hex")).toBe(APPROVED_LOGO_SHA256);
    for (const f of ["public/icon.svg", "public/apple-icon.png", "public/icon-dark-32x32.png", "public/icon-light-32x32.png", "data/osca/raw"]) {
      expect(existsSync(f), f).toBe(false);
    }
  });
});
