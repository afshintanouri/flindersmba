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

  test("footer opens About this experience with the approved wording and official website link", async ({ page }) => {
    await seed(page, null);
    await open(page, "home");
    const footer = page.locator("footer.site-footer");
    await expect(footer).toContainText("FLINDERS MBA FUTURE");
    await expect(footer).not.toContainText(/prototype/i);
    const about = footer.getByRole("button", { name: "About this experience" });
    expect((await about.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await about.click();
    await expect(about).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: "About this experience" });
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(/About this experience/i);
    await expect(dialog).toContainText(
      "This interactive MBA discovery tool has been developed by Flinders University for demonstration purposes at the Vietnam Roadshow. It is designed to help prospective students explore MBA study options and potential career pathways.",
    );
    await expect(dialog.getByRole("heading", { name: "OCCUPATION DATA" })).toBeVisible();
    await expect(dialog).toContainText(
      "Australian Bureau of Statistics (ABS), OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0 (CC BY 4.0, adapted). Full attribution is provided on the Career Explorer pages. The ABS does not endorse this tool.",
    );
    await expect(dialog.getByRole("heading", { name: "CONTENT INFORMATION" })).toBeVisible();
    await expect(dialog).toContainText(
      "Content is indicative only. For current course details, entry requirements and eligibility, please refer to the official Flinders University website.",
    );
    const link = dialog.getByRole("link", { name: /official Flinders University website/ });
    await expect(link).toHaveAttribute("href", "https://www.flinders.edu.au/");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(dialog.locator("a[href]")).toHaveCount(1);
    await expect(page.locator("footer.site-footer [role=alert], #site-dialog [role=alert]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("career pages separate About this tool from the ABS attribution", async ({ page }) => {
    await seed(page, null);
    await open(page, "career/brand-manager");
    const about = page.locator(".career-about");
    await expect(about.getByRole("heading", { name: "ABOUT THIS TOOL" })).toBeVisible();
    await expect(about).toContainText("curated interpretations for career exploration");
    await expect(about).toContainText("are not ABS classifications or recommendations");
    await expect(about).toContainText("provided for career exploration purposes only");
    // The full ABS CC BY 4.0 attribution stays on Career Explorer pages.
    const source = page.locator(".osca-source");
    await expect(source).toContainText("Source: Australian Bureau of Statistics");
    await expect(source).toContainText("OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0");
    await expect(source).toContainText("© Commonwealth of Australia, licensed under CC BY 4.0");
    await expect(source).toContainText("Source material has been adapted for use in this tool");
    await expect(source).toContainText("The ABS does not endorse this tool.");
    await expect(source.getByRole("link", { name: /OSCA – Occupation Standard Classification/ })).toHaveAttribute("href", /^https:\/\/www\.abs\.gov\.au\/statistics\/classifications\/osca-/);
    await expect(source.getByRole("link", { name: "CC BY 4.0" })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
    await expect(source.getByRole("link", { name: "ABS copyright and disclaimer" })).toHaveAttribute("href", "https://www.abs.gov.au/website-privacy-copyright-and-disclaimer");
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

  test("kiosk About panel shows the approved wording without external links", async ({ page }) => {
    await seed(page, null);
    await page.goto("./?kiosk=1#home");
    await page.locator('main[data-ready="true"]').waitFor();
    await page.getByRole("button", { name: "About this experience" }).click();
    const dialog = page.getByRole("dialog", { name: "About this experience" });
    await expect(dialog).toContainText("developed by Flinders University for demonstration purposes at the Vietnam Roadshow");
    await expect(dialog).toContainText("please refer to the official Flinders University website.");
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
