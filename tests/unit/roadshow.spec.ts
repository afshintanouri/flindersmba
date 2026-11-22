import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { prototypeStatus } from "@/content/prototype";
import { careerClusters, careerDirections, experiences, programs } from "@/content";
import { oscaAttribution } from "@/content/attribution";
import { isKioskSearch, KIOSK_IDLE_RESET_MS, KIOSK_IDLE_WARNING_MS, KIOSK_STORAGE_KEY } from "@/lib/kiosk";
import { STORAGE_KEY, emptyJourney, type Journey } from "@/lib/journey";
import { documentTitle, SITE_TITLE } from "@/lib/titles";
import { decodeShare, isShareHash, shareFromHash, shareUrl } from "@/lib/share";
import type { Route } from "@/lib/routes";

const J: Journey = {
  ambitions: ["lead-ai-emerging-technology"],
  interests: ["artificial-intelligence"],
  experiences: ["industry-placement"],
  visits: ["data-analyst"],
  complete: true,
};

test.describe("kiosk", () => {
  test("detection accepts only explicit kiosk values", () => {
    for (const s of ["?kiosk=1", "?kiosk=true", "?kiosk=TRUE", "?a=b&kiosk=1"]) expect(isKioskSearch(s), s).toBe(true);
    for (const s of ["", "?kiosk=0", "?kiosk=false", "?kiosk", "?kioskx=1", "?x=kiosk"]) expect(isKioskSearch(s), s).toBe(false);
  });

  test("idle thresholds are the approved defaults and use separate storage", () => {
    expect(KIOSK_IDLE_WARNING_MS).toBe(120_000);
    expect(KIOSK_IDLE_RESET_MS).toBe(30_000);
    expect(KIOSK_STORAGE_KEY).not.toBe(STORAGE_KEY);
  });
});

test.describe("share URL", () => {
  test("keeps the base path, drops the query (kiosk) and carries the v2 payload", () => {
    const url = shareUrl({ origin: "https://example.github.io", pathname: "/flindersmba/" }, J);
    expect(url).toMatch(/^https:\/\/example\.github\.io\/flindersmba\/#share=[A-Za-z0-9_-]+$/);
    expect(url).not.toContain("kiosk");
    const decoded = decodeShare(url.split("#share=")[1])!;
    expect(decoded).toEqual({ version: 2, journey: J });
    expect(shareFromHash(new URL(url).hash)!.journey).toEqual(J);
  });

  test("share hashes are recognised even when invalid; v1 links still decode", () => {
    expect(isShareHash("#share=garbage")).toBe(true);
    expect(isShareHash("#journey")).toBe(false);
    expect(shareFromHash("#share=garbage")).toBeNull();
    const v1 = Buffer.from(JSON.stringify({ a: [1, 2], i: [0, 1, 3], e: [4, 5], visits: [2], complete: true })).toString("base64");
    expect(decodeShare(v1)!.version).toBe(1);
    expect(decodeShare(v1)!.journey.visits).toEqual(["management-consultant"]);
  });

  test("an incomplete journey is not shareable", () => {
    const url = shareUrl({ origin: "https://x", pathname: "/flindersmba/" }, { ...emptyJourney, ambitions: ["financial-capability"] });
    expect(shareFromHash(new URL(url).hash)).toBeNull();
  });
});

test.describe("document titles", () => {
  test("concise titles for every route", () => {
    const routes: [Route, string][] = [
      [{ name: "home" }, SITE_TITLE],
      [{ name: "q", step: 2 }, "Find My MBA | Flinders MBA Future"],
      [{ name: "reveal" }, "Your MBA match | Flinders MBA Future"],
      [{ name: "mba", id: "mba-ai" }, "MBA Artificial Intelligence | Flinders MBA Future"],
      [{ name: "career", id: "management-consultant" }, "Management Consultant | Flinders MBA Future"],
      [{ name: "careers" }, "Career Explorer | Flinders MBA Future"],
    ];
    for (const [r, t] of routes) expect(documentTitle(r)).toBe(t);
    expect(documentTitle({ name: "journey" }, true)).toBe("My MBA Future | Flinders MBA Future");
    expect(documentTitle({ name: "journey" }, false)).toBe("My journey | Flinders MBA Future");
    for (const p of programs) expect(documentTitle({ name: "mba", id: p.id })).toBe(`${p.name} | Flinders MBA Future`);
    for (const d of careerDirections) expect(documentTitle({ name: "career", id: d.id }).length).toBeLessThan(80);
    for (const c of careerClusters) expect(documentTitle({ name: "cluster", id: c.id })).toContain(c.label);
    for (const x of experiences) expect(documentTitle({ name: "experience", id: x.id })).toContain(x.label);
  });
});

test.describe("source attribution (ABS CC BY 4.0)", () => {
  test("covers creator, copyright, licence link, source link, modification and no-endorsement", () => {
    const a = oscaAttribution;
    expect(a.creator).toBe("Australian Bureau of Statistics");
    expect(a.title).toBe("OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0");
    expect(a.copyright).toBe("© Commonwealth of Australia");
    expect(a.licence).toBe("CC BY 4.0");
    expect(a.licenceUrl).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(a.sourceUrl).toMatch(/^https:\/\/www\.abs\.gov\.au\/statistics\/classifications\/osca-occupation-standard-classification-australia\/2024-version-1-0$/);
    expect(a.disclaimerUrl).toBe("https://www.abs.gov.au/website-privacy-copyright-and-disclaimer");
    expect(a.modified).toMatch(/^Source material has been adapted for use in this prototype: codes and whitespace normalised, source tables combined and official text shown in brief\.$/);
    expect(a.notEndorsed).toBe("The ABS does not endorse this prototype.");
    const meta = JSON.parse(readFileSync("public/data/osca/metadata.json", "utf8"));
    expect(meta.licenceStatus).toBe(a.status);
    expect(meta.licence.url).toBe(a.licenceUrl);
  });

  test("no ABS logo, Coat of Arms or OSCA branding is shipped with the application", () => {
    const shipped = execSync("git ls-files public app components", { encoding: "utf8" });
    expect(shipped).not.toMatch(/abs[-_ ]?logo|coat[-_ ]?of[-_ ]?arms|osca[-_ ]?(logo|brand)/i);
  });
});

test.describe("prototype status and governance wording", () => {
  test("states the prototype status and separates ABS data from prototype interpretation", () => {
    expect(prototypeStatus.label).toBe("Prototype roadshow experience");
    expect(prototypeStatus.statement).toBe(
      "This is a prototype MBA discovery experience developed for roadshow and demonstration purposes. Official course information should be confirmed through Flinders University course pages.",
    );
    expect(prototypeStatus.careerAbout).toBe(
      "OSCA occupation data is sourced from the Australian Bureau of Statistics. Career directions, capability connections and MBA suggestions in this prototype are provided for exploratory purposes only and are not ABS classifications or recommendations.",
    );
  });

  test("no institutional-authority or migration wording in app copy or documentation", () => {
    const files = execSync("git ls-files content components app lib README.md data/osca/README.md", { encoding: "utf8" })
      .split("\n")
      .filter((f) => /\.(tsx?|md|json)$/.test(f) && !f.includes(".generated.") && !f.startsWith("content/careers/research"));
    const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
    expect(text).not.toMatch(/Flinders interpretations?|official Flinders (career|recommendation|match)|Flinders (University )?recommends|institutionally (approved|endorsed) (tool|product|mapping)/i);
    expect(text).not.toMatch(/visa eligib|migration outcome|residency pathway|skills assessment/i);
  });
});
