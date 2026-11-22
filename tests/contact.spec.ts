import { test, expect, seed, open, COMPLETE } from "./fixtures";
import { KIOSK_STORAGE_KEY } from "@/lib/kiosk";
import { encodeShare } from "@/lib/share";
import type { Journey } from "@/lib/journey";

const MAILTO = "mailto:afshin.tanouri@flinders.edu.au";
const LINKEDIN = "https://www.linkedin.com/in/afshin-tanouri/";

test.describe("MBA team contact", () => {
  test("footer prompt opens the contact panel (personal device)", async ({ page }) => {
    await seed(page, null);
    await open(page, "careers");
    const footer = page.locator("footer.site-footer");
    await expect(footer).toContainText("QUESTIONS ABOUT YOUR MBA?");
    await expect(footer).not.toContainText("Afshin");
    const trigger = footer.getByRole("button", { name: /Talk to the MBA team/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: "Talk to the MBA team" });
    await expect(dialog).toContainText("Dr Afshin Tanouri");
    await expect(dialog).toContainText("MBA Director, Flinders University");
    const email = dialog.getByRole("link", { name: "Email Dr Afshin Tanouri, MBA Director" });
    await expect(email).toHaveAttribute("href", MAILTO);
    await expect(email).toHaveText(/Email the MBA Director/);
    const linkedin = dialog.getByRole("link", { name: /Connect with Dr Afshin Tanouri on LinkedIn/ });
    await expect(linkedin).toHaveAttribute("href", LINKEDIN);
    await expect(linkedin).toHaveAttribute("target", "_blank");
    await expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
    await expect(linkedin).toHaveText(/Connect on LinkedIn/);
    for (const box of [await email.boundingBox(), await linkedin.boundingBox(), await trigger.boundingBox()]) {
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(dialog.locator("input, form, textarea")).toHaveCount(0);
  });

  test("footer shows the prototype status and opens About this prototype", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    const footer = page.locator("footer.site-footer");
    await expect(footer).toContainText("FLINDERS MBA FUTURE");
    await expect(footer).toContainText("Prototype roadshow experience");
    const about = footer.getByRole("button", { name: "About this prototype" });
    expect((await about.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await about.click();
    await expect(about).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: "About this prototype" });
    await expect(dialog).toContainText("developed for roadshow and demonstration purposes");
    await expect(dialog).toContainText("The ABS does not endorse this prototype.");
    await expect(dialog.locator("a[href]")).toHaveCount(0);
    await expect(page.locator("footer.site-footer [role=alert], #site-dialog [role=alert]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("career pages separate About this tool from the ABS attribution", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/brand-manager");
    const about = page.locator(".career-about");
    await expect(about.getByRole("heading", { name: "ABOUT THIS TOOL" })).toBeVisible();
    await expect(about).toContainText("are not ABS classifications or recommendations");
    await expect(about).toContainText("provided for career exploration purposes only");
    const source = page.locator(".osca-source");
    await expect(source).toContainText("Source material has been adapted for use in this prototype");
    await expect(source).toContainText("The ABS does not endorse this prototype.");
    await expect(about.locator(".osca-source")).toHaveCount(0);
  });

  test("keyboard: open with Enter, close with Escape", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    const trigger = page.getByRole("button", { name: /Talk to the MBA team/ });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Talk to the MBA team" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("My MBA Future ends with the contact section on a phone, after save and share", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page, COMPLETE);
    await open(page, "journey");
    const section = page.getByRole("region", { name: "READY TO TALK ABOUT YOUR MBA?" });
    await expect(section).toContainText("Dr Afshin Tanouri");
    await expect(section.getByRole("link", { name: /Email Dr Afshin Tanouri/ })).toHaveAttribute("href", MAILTO);
    await expect(section.getByRole("link", { name: /on LinkedIn/ })).toHaveAttribute("href", LINKEDIN);
    const order = await page.evaluate(() => {
      const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top;
      return { save: y(".frame .actions"), contact: y(".contact-section") };
    });
    expect(order.contact).toBeGreaterThan(order.save);
  });

  test("on large personal screens the contact section follows the QR hand-off", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 1024 });
    await seed(page, COMPLETE);
    await open(page, "journey");
    const qr = await page.locator(".handoff").boundingBox();
    const contact = await page.locator(".contact-section").boundingBox();
    expect(contact!.y).toBeGreaterThan(qr!.y);
  });

  test("kiosk keeps the QR hand-off primary and offers no email or LinkedIn links", async ({ page }) => {
    await seed(page, null);
    await page.addInitScript(([k, j]) => sessionStorage.setItem(k, j), [KIOSK_STORAGE_KEY, JSON.stringify(COMPLETE)] as const);
    await page.goto("./?kiosk=1#journey");
    await page.locator('main[data-ready="true"]').waitFor();
    await expect(page.getByRole("heading", { name: "TAKE YOUR MBA FUTURE WITH YOU" })).toBeVisible();
    const url = await page.locator("svg.qr").getAttribute("data-url");
    expect(url).toBe(`${new URL(page.url()).origin}/flindersmba/#share=${encodeShare(COMPLETE as Journey)}`);
    await expect(page.getByText("Your saved MBA Future also includes ways to connect with the Flinders MBA team.")).toBeVisible();
    await expect(page.locator(`a[href^="mailto:"], a[href*="linkedin.com"]`)).toHaveCount(0);
    await page.getByRole("button", { name: /Talk to the MBA team/ }).click();
    const dialog = page.getByRole("dialog", { name: "Talk to the MBA team" });
    await expect(dialog).toContainText("Dr Afshin Tanouri");
    await expect(dialog.locator(`a[href^="mailto:"], a[href*="linkedin.com"]`)).toHaveCount(0);
    await dialog.getByRole("button", { name: /Go to My MBA Future/ }).click();
    await expect(page).toHaveURL(/\?kiosk=1#journey$/);
  });

  test("kiosk About panel states the prototype status without external links", async ({ page }) => {
    await seed(page, null);
    await page.goto("./?kiosk=1#home");
    await page.locator('main[data-ready="true"]').waitFor();
    await page.getByRole("button", { name: "About this prototype" }).click();
    const dialog = page.getByRole("dialog", { name: "About this prototype" });
    await expect(dialog).toContainText("prototype MBA discovery experience");
    await expect(dialog.locator("a[href]")).toHaveCount(0);
  });

  test("opening the contact panel sends no network requests", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.getByRole("button", { name: /Talk to the MBA team/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(requests).toEqual([]);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("contact panel and section are visible immediately", async ({ page }) => {
      await seed(page, COMPLETE);
      await page.goto("./#journey");
      await page.locator('main[data-ready="true"]').waitFor();
      await expect(page.locator(".contact-section")).toHaveCSS("opacity", "1");
      await page.getByRole("button", { name: /Talk to the MBA team/ }).click();
      await expect(page.locator(".dialog-panel")).toHaveCSS("opacity", "1");
    });
  });
});
