import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  careerClusters,
  careerDirections,
  careerDirectionsForCluster,
  getCareerDirection,
  getProgram,
} from "@/content";
import type { CareerDirection } from "@/content/types";
import { buildOscaSearchIndex, searchCareerDirections, searchCareers, searchOsca } from "@/lib/careers/search";
import {
  bandLabel,
  CAREER_DIRECTION_STATEMENT,
  CONTEMPORARY_STATEMENT,
  firstSentence,
  limitTasks,
  mbaSectionHeading,
  occupationConnection,
  VENTURE_STATEMENT,
} from "@/lib/careers/presentation";
import { readOscaFiles } from "@/lib/osca/validate";
import type { OscaOccupationIndexEntry } from "@/lib/osca/types";
import { decodeShare, encodeShare } from "@/lib/share";
import { emptyJourney, MAX_VISITS, sanitizeJourney, withVisit } from "@/lib/journey";

const osca = readOscaFiles();
const entries = (osca.index as { occupations: OscaOccupationIndexEntry[] }).occupations;
const byCode = new Map(entries.map((o) => [o.code, o]));
const index = buildOscaSearchIndex(entries);
/**
 * The research/review layer (data/careers/review/) and its generators are kept
 * in the private source repository only. The public release repository ships
 * the generated production data; there, the cross-checks against the research
 * layer are skipped (the production data itself is still fully validated, and
 * its checksum is verified against the private, reviewed build).
 */
const REVIEW_DIR = "data/careers/review";
const hasReview = existsSync(REVIEW_DIR);
const RESEARCH_ONLY = "research layer is kept in the private source repository";
const readReview = (f: string) => (hasReview ? JSON.parse(readFileSync(`${REVIEW_DIR}/${f}`, "utf8")) : null);
const review = readReview("career-osca-candidates.json");
const derived = readReview("career-mba-derived.json");
const d = getCareerDirection;

test.describe("production career catalogue", () => {
  test("48 approved directions with approved labels, four per cluster in 12 clusters", () => {
    expect(careerDirections).toHaveLength(48);
    expect(careerClusters).toHaveLength(12);
    if (hasReview) for (const r of review.careers) expect(d(r.careerId).title, r.careerId).toBe(r.careerTitle);
    for (const c of careerClusters) expect(careerDirectionsForCluster(c.id)).toHaveLength(4);
    expect(careerClusters.map((c) => c.label)).toEqual([
      "AI & Digital Transformation",
      "Analytics & Business Intelligence",
      "Strategy & Consulting",
      "Management & Leadership",
      "Marketing & Customer",
      "Finance & Commercial",
      "Health Management",
      "People & HR",
      "International Business & Growth",
      "Social Impact, Public Sector & Sustainability",
      "Innovation & Entrepreneurship",
      "Operations & Industry",
    ]);
  });

  test("generated production data is current (generator --check)", () => {
    test.skip(!hasReview, RESEARCH_ONLY);
    const out = execFileSync(process.execPath, ["scripts/careers/build_production_careers.cjs", "--check"], { encoding: "utf8" });
    expect(out).toContain("OK: 48 career directions");
  });

  test("every OSCA code is real and every official title is exact for its type", () => {
    for (const x of careerDirections) {
      if (x.primary) {
        const o = byCode.get(x.primary.code)!;
        expect(o, x.id).toBeTruthy();
        expect(o.principalTitle).toBe(x.primary.principalTitle);
        const titles = { "principal-title": [o.principalTitle], "alternative-title": o.alternativeTitles, specialisation: o.specialisations, "nec-included-title": o.necIncludedTitles }[x.primary.officialTitleType];
        expect(titles, x.id).toContain(x.primary.officialTitle);
        expect(o.majorGroupCode).toBe(x.primary.majorGroupCode);
      }
      for (const r of x.related) expect(byCode.get(r.code)?.principalTitle, `${x.id} → ${r.code}`).toBe(r.principalTitle);
      expect(JSON.stringify(x)).not.toMatch(/XXXXXX/i);
    }
  });

  test("only reviewed relationships are promoted: no pending, weak or not-approved candidate", () => {
    test.skip(!hasReview, RESEARCH_ONLY);
    for (const r of review.careers) {
      const x = d(r.careerId);
      const allowed = new Set([
        ...(r.candidateOscaOccupations ?? []).filter((c: { decision: string }) => c.decision === "related-for-exploration" || c.decision === "approved").map((c: { code: string }) => c.code),
        ...(r.explorationOnly ?? []).map((c: { code: string }) => c.code),
        ...(r.officialMatch ? [r.officialMatch.code] : []),
      ]);
      for (const code of [x.primary?.code, ...x.related.map((y) => y.code)].filter(Boolean)) expect(allowed, `${x.id}: ${code}`).toContain(code);
      if (r.reviewStatus !== "human-approved") expect(x.primary, x.id).toBeUndefined();
      expect(x.related.length).toBeLessThanOrEqual(3);
    }
  });

  test("no research scores in production data", () => {
    const text = readFileSync("content/careers/career-directions.generated.json", "utf8");
    expect(text).not.toMatch(/"score"|capabilityScore|"strength"/);
  });

  test("bands follow the approved research bands", () => {
    test.skip(!hasReview, RESEARCH_ONLY);
    for (const x of careerDirections) {
      const dc = derived.careers.find((c: { careerId: string }) => c.careerId === x.id);
      for (const c of x.mba.connections) {
        const s = dc.connections.find((k: { programmeId: string }) => k.programmeId === c.programId).score as number;
        expect(s, `${x.id}/${c.programId}`).toBeGreaterThanOrEqual(20);
        if (c.band === "strong") expect(s).toBeGreaterThanOrEqual(60);
        if (c.band === "relevant") expect(s).toBeGreaterThanOrEqual(40);
      }
      // Connections keep the derived (evidence) order; nothing is hand-ranked.
      const order = dc.connections.map((k: { programmeId: string }) => k.programmeId);
      const shown = x.mba.connections.map((c) => order.indexOf(c.programId));
      expect(shown, x.id).toEqual([...shown].sort((a, b) => a - b));
      expect(shown[0], x.id).toBe(0);
    }
  });

  test("every career direction has 4–7 capabilities", () => {
    for (const x of careerDirections) {
      expect(x.capabilityIds.length, x.id).toBeGreaterThanOrEqual(4);
      expect(x.capabilityIds.length, x.id).toBeLessThanOrEqual(7);
    }
  });

  test("capabilities are 4–7 approved IDs sorted core → supporting", () => {
    test.skip(!hasReview, RESEARCH_ONLY);
    const mappings = readReview("career-capability-mappings.json");
    for (const m of mappings.careers) {
      const x = d(m.careerId);
      const strengths = x.capabilityIds.map((id) => m.capabilities.find((c: { capabilityId: string }) => c.capabilityId === id).strength);
      expect(strengths, x.id).toEqual([...strengths].sort((a, b) => b - a));
      expect(x.capabilityIds.length).toBeGreaterThanOrEqual(4);
      expect(x.capabilityIds.length).toBeLessThanOrEqual(7);
    }
  });

  test("weak or evidence-limited careers are presented as pathways, not a ranking", () => {
    for (const id of [
      "management-consultant",
      "business-transformation-consultant",
      "entrepreneur-founder",
      "innovation-manager",
      "new-venture-manager",
      "commercialisation-manager",
      "manufacturing-operations-manager",
    ] as const) {
      expect(d(id).mba.mode, id).toBe("explore");
      expect(mbaSectionHeading(d(id))).toBe("MBAs worth exploring");
      for (const c of d(id).mba.connections) expect(bandLabel(c.band)).toBe("WORTH EXPLORING");
    }
  });

  test("Finance careers stay truthful to the evidence", () => {
    expect(d("finance-manager").mba.connections[0]).toMatchObject({ programId: "mba-finance", band: "relevant" });
    expect(d("finance-manager").mba.connections[0].capabilityIds).toContain("financial-decision-making");
    for (const id of ["financial-analyst", "investment-analyst"] as const) {
      const [first, second] = d(id).mba.connections;
      expect(first.programId, id).toBe("mba-business-analytics");
      expect(second.programId, id).toBe("mba-finance");
      expect(first.capabilityIds).toEqual(expect.arrayContaining(["data-analysis", "data-driven-decisions"]));
      expect(second.capabilityIds).toContain("financial-decision-making");
    }
  });

  test("Industry-focused is never strong on placement alone and is not an operations specialisation", () => {
    for (const x of careerDirections) {
      for (const c of x.mba.connections.filter((k) => k.programId === "mba-industry-focused")) {
        expect(c.evidence.every((e) => ["Double placement exposure", "Working in Australia", "Understanding the Australian working environment"].includes(e)), x.id).toBe(true);
      }
    }
    const strong = careerDirections.filter((x) => x.mba.connections.some((c) => c.programId === "mba-industry-focused" && c.band === "strong")).map((x) => x.id);
    expect(strong).toEqual(["project-manager"]);
    expect(d("manufacturing-operations-manager").mba.mode).toBe("explore");
  });

  test("shared experiences are verified, portfolio-wide and never presented as MBA evidence", () => {
    const shared = ["industry-placement", "virtual-business-simulation", "alumni-mentorship", "factory-of-the-future", "gamified-learning"];
    for (const x of careerDirections) {
      for (const s of x.sharedExperiences) expect(shared, x.id).toContain(s.experienceId);
      for (const c of x.mba.connections) for (const e of c.evidence) expect(e).not.toMatch(/placement$|simulation|mentorship|Factory of the Future|gamified learning/i);
    }
  });

  test("out-of-scope content never appears", () => {
    const text = readFileSync("content/careers/career-directions.generated.json", "utf8");
    expect(text).not.toMatch(/\bsalar(y|ies)\b|\bvisa\b|\bmigrat|\bresidency\b|\beligib|skills assessment|guarantee/i);
  });
});

test.describe("relationship presentation", () => {
  const conn = (id: Parameters<typeof d>[0]) => occupationConnection(d(id));

  test("direct: official occupation, not over-explained", () => {
    expect(conn("management-consultant")).toMatchObject({ occupation: { code: "223432", title: "Management Consultant" }, note: "This is an official OSCA occupation." });
    expect(conn("management-consultant").lead).toBeUndefined();
    expect(conn("manufacturing-operations-manager").occupation).toEqual({ code: "132232", title: "Production Manager (Manufacturing)" });
  });

  test("alternative title: never a separate six-digit occupation", () => {
    expect(conn("people-culture-manager")).toMatchObject({
      lead: "People and Culture Manager is an official alternative title of:",
      occupation: { code: "111331", title: "Human Resources Manager" },
    });
  });

  test("specialisation: the principal occupation is shown, never the specialisation as principal", () => {
    expect(conn("brand-manager")).toMatchObject({ lead: "Brand Manager is an official specialisation of:", occupation: { code: "221534", title: "Marketing Specialist" } });
    expect(conn("financial-analyst")).toMatchObject({ lead: "Financial Analyst is an official specialisation of:", occupation: { code: "211131", title: "Accountant (General)" } });
    expect(conn("business-analyst")).toMatchObject({ lead: "Business Analyst (non-ICT) is an official specialisation of:", occupation: { code: "223432", title: "Management Consultant" } });
  });

  test("nec-included: included within an nec category, not standalone", () => {
    const c = conn("business-intelligence");
    expect(c).toMatchObject({ lead: "ICT Business Intelligence Manager is an official title included within:", occupation: { code: "113299", title: "ICT Managers nec" } });
    expect(c.note).toMatch(/not elsewhere classified.*rather than being a standalone six-digit occupation/);
  });

  test("curated related: the career title is not claimed as an official title", () => {
    for (const [id, code] of [["international-business-development", "112132"], ["supply-chain-operations-manager", "133331"], ["business-transformation-consultant", "223432"]] as const) {
      expect(conn(id).occupation?.code, id).toBe(code);
      expect(conn(id).note).toMatch(/is not itself an official OSCA title/);
    }
  });

  test("contemporary: confident statement, no code, reviewed related occupations only", () => {
    for (const id of ["ai-strategy-lead", "digital-transformation-manager", "responsible-ai-specialist", "customer-experience-manager", "social-impact-manager", "innovation-manager", "workforce-capability-manager"] as const) {
      const c = conn(id);
      expect(c.tag, id).toBe("CONTEMPORARY CAREER DIRECTION");
      expect(c.note).toBe(CONTEMPORARY_STATEMENT);
      expect(c.occupation).toBeUndefined();
      expect(JSON.stringify(c)).not.toMatch(/no match|not found|incomplete/i);
    }
    expect(d("digital-transformation-manager").related.map((r) => r.code)).toEqual(["113131", "223433", "223432"]);
  });

  test("venture: no OSCA code; exploration links only", () => {
    const c = conn("entrepreneur-founder");
    expect(c.tag).toBe("VENTURE DIRECTION");
    expect(c.note).toBe(VENTURE_STATEMENT);
    expect(c.occupation).toBeUndefined();
    expect(d("entrepreneur-founder").primary).toBeUndefined();
    expect(d("entrepreneur-founder").related).toEqual([{ code: "121131", principalTitle: "Chief Executive or Managing Director" }]);
  });

  test("pending-review careers: capability-led direction with no related occupations", () => {
    for (const x of careerDirections.filter((y) => y.presentation === "career-direction")) {
      expect(occupationConnection(x).note).toBe(CAREER_DIRECTION_STATEMENT);
      expect(x.related, x.id).toEqual([]);
    }
  });

  test("restrained official reproduction", () => {
    expect(firstSentence("Plans things. Then more.")).toBe("Plans things.");
    expect(limitTasks(["a", "b", "c", "d", "e", "f"])).toEqual(["a", "b", "c", "d"]);
  });

  test("every MBA connection names an existing programme with verified positioning", () => {
    for (const x of careerDirections as CareerDirection[]) {
      for (const c of x.mba.connections) expect(getProgram(c.programId).positioning.provenance.status).toBe("verified");
    }
  });
});

test.describe("search", () => {
  const titles = (q: string) => searchCareerDirections(q).map((h) => h.direction.title);

  test("curated Career Directions come first; exact before partial", () => {
    expect(titles("management consultant")[0]).toBe("Management Consultant");
    expect(searchCareerDirections("management consultant")[0].tier).toBe(1);
    expect(titles("people and culture")[0]).toBe("People & Culture Manager");
    expect(titles("People & Culture Manager")[0]).toBe("People & Culture Manager");
    expect(titles("data analyst")[0]).toBe("Data Analyst");
    expect(titles("social impact")).toContain("Social Impact Manager");
    expect(titles("digital transformation")[0]).toBe("Digital Transformation Manager");
    const all = searchCareers("brand manager", index);
    expect(all[0]).toMatchObject({ kind: "career", tier: 1 });
    expect(all.findIndex((h) => h.kind === "osca")).toBeGreaterThan(all.findLastIndex((h) => h.kind === "career"));
  });

  test("official results are prioritised by title type", () => {
    const brand = searchOsca("brand manager", index)[0];
    expect(brand).toMatchObject({ tier: 5, matchedTitle: "Brand Manager", matchedTitleType: "specialisation" });
    expect(brand.occupation.code).toBe("221534");
    expect(searchOsca("management consultant", index)[0]).toMatchObject({ tier: 3, matchedTitleType: "principal-title" });
    expect(searchOsca("people and culture manager", index)[0]).toMatchObject({ tier: 4, matchedTitleType: "alternative-title" });
    expect(searchOsca("ict business intelligence manager", index)[0]).toMatchObject({ tier: 6, matchedTitleType: "nec-included-title" });
    const broad = searchOsca("business intelligence", index);
    expect(broad.length).toBeGreaterThan(0);
    const tiers = broad.map((h) => h.tier);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });

  test("short terms are token-aware: AI never matches Thai", () => {
    const official = searchOsca("AI", index).map((h) => h.matchedTitle);
    expect(official.some((t) => /thai/i.test(t))).toBe(false);
    expect(titles("AI")).toEqual(expect.arrayContaining(["AI Strategy Lead"]));
    expect(searchOsca("thai", index).some((h) => /thai/i.test(h.matchedTitle))).toBe(true);
  });
});

test.describe("journey integration", () => {
  test("explored careers are recorded once, most recent last, capped", () => {
    let j = withVisit(emptyJourney, "data-analyst");
    j = withVisit(j, "brand-manager");
    j = withVisit(j, "data-analyst");
    expect(j.visits).toEqual(["brand-manager", "data-analyst"]);
    for (const x of careerDirections) j = withVisit(j, x.id);
    expect(j.visits).toHaveLength(MAX_VISITS);
    expect(j.visits[MAX_VISITS - 1]).toBe(careerDirections[47].id);
  });

  test("prototype career profile IDs in saved journeys and v2 links map to replacements", () => {
    expect(sanitizeJourney({ visits: ["marketing-strategist", "management-consultant", "toString", "nope"] }).visits).toEqual([
      "marketing-specialist",
      "management-consultant",
    ]);
    const link = encodeShare({ ...emptyJourney, ambitions: ["financial-capability"], interests: ["finance"], experiences: ["industry-placement"], visits: ["brand-manager"] });
    expect(decodeShare(link)!.journey.visits).toEqual(["brand-manager"]);
    const old = Buffer.from(JSON.stringify({ v: 2, a: ["financial-capability"], i: ["finance"], e: ["industry-placement"], c: ["health-service-manager"] })).toString("base64url");
    expect(decodeShare(old)!.journey.visits).toEqual(["health-services-manager"]);
  });
});

test.describe("scope guards", () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  test("production code never imports the review files, and OSCA data is never bundled", () => {
    for (const f of ["app", "components", "content", "lib"].flatMap(walk).filter((f) => /\.(ts|tsx)$/.test(f))) {
      const text = readFileSync(f, "utf8");
      expect(text, f).not.toMatch(/data\/careers\/review/);
      expect(text, f).not.toMatch(/import[^;]*(public\/data\/osca|occupations-index|occupations-details|groups\.json)/);
    }
  });

  test("the prototype mock occupation panel is gone", () => {
    for (const f of ["components", "content", "lib"].flatMap(walk)) {
      const text = readFileSync(f, "utf8");
      expect(text, f).not.toMatch(/XXXXXX|occupationPlaceholder|Prototype placeholder|id === 2\b/);
    }
  });
});
