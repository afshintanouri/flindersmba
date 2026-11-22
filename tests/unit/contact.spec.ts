import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { contactCopy, contactMailto, mbaContact } from "@/content/contact";
import { PORTFOLIO_URL } from "@/content";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const source = ["app", "components", "content", "lib"].flatMap(walk).filter((f) => /\.(ts|tsx)$/.test(f));

test.describe("MBA team contact configuration", () => {
  test("approved details, verified provenance", () => {
    expect(mbaContact).toMatchObject({
      name: "Dr Afshin Tanouri",
      role: "MBA Director",
      organisation: "Flinders University",
      email: "afshin.tanouri@flinders.edu.au",
      linkedinUrl: "https://www.linkedin.com/in/afshin-tanouri/",
    });
    expect(mbaContact.provenance).toMatchObject({ status: "verified", verifiedBy: "Afshin Tanouri" });
  });

  test("contact details are defined once (content/contact.ts only)", () => {
    for (const needle of ["afshin.tanouri@flinders.edu.au", "linkedin.com/in/afshin-tanouri", "Dr Afshin Tanouri"]) {
      const files = source.filter((f) => readFileSync(f, "utf8").includes(needle));
      expect(files, needle).toEqual([join("content", "contact.ts")]);
    }
  });

  test("plain mailto with no tracking parameters", () => {
    expect(contactMailto()).toBe("mailto:afshin.tanouri@flinders.edu.au");
    expect(contactMailto()).not.toMatch(/[?&]/);
  });

  test("no forms or visitor-data collection; no admission guarantees", () => {
    const contactUi = readFileSync("components/contact.tsx", "utf8");
    expect(contactUi).not.toMatch(/<form|<input|type="email"|fetch\(|navigator\.sendBeacon/);
    expect(JSON.stringify(contactCopy)).not.toMatch(/guarantee|eligib|admission offer|visa|migrat/i);
  });

  test("the official MBA link stays omitted while no portfolio URL is verified", () => {
    expect(PORTFOLIO_URL.provenance.status).not.toBe("verified");
    expect(readFileSync("components/contact.tsx", "utf8")).not.toMatch(/Explore official MBA information|PORTFOLIO_URL/);
  });
});
