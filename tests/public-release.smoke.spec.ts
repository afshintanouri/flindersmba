import { existsSync } from "node:fs";
import { test, expect, seed, open } from "./fixtures";

/**
 * Public prototype release: the header uses a typographic product title and
 * no university brand artwork is distributed.
 */
test.describe("public prototype identity", () => {
  test("header shows the product title and prototype status, with no logo image", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (r) => requested.push(r.url()));
    await seed(page, null);
    await open(page, "home");
    const brand = page.locator("header .brand");
    await expect(brand).toHaveAccessibleName("Flinders MBA Future home");
    await expect(brand.locator(".brand-title")).toHaveText("FLINDERS MBA FUTURE");
    await expect(brand.locator(".brand-status")).toHaveText("Prototype roadshow experience");
    await expect(page.locator("header img")).toHaveCount(0);
    expect((await brand.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await brand.click();
    await expect(page).toHaveURL(/#home$/);
    expect(requested.filter((u) => /flinders\.svg|icon\.svg|apple-icon|icon-(dark|light)/.test(u))).toEqual([]);
  });

  test("no university logo or template icons are distributed", () => {
    for (const f of ["public/flinders.svg", "public/icon.svg", "public/apple-icon.png", "public/icon-dark-32x32.png", "public/icon-light-32x32.png"]) {
      expect(existsSync(f), f).toBe(false);
    }
  });
});
