import { test, expect } from "@playwright/test";
import { decodeShare, encodeShare, shareFromHash } from "@/lib/share";
import { formatRoute, parseRoute, paths, type Route } from "@/lib/routes";
import { emptyJourney, LEGACY_STORAGE_KEY, loadJourney, sanitizeJourney, saveJourney, STORAGE_KEY, type Journey } from "@/lib/journey";
import { journeyFromV1 } from "@/lib/legacy";
import { rankPrograms } from "@/lib/matchmaker";
import { programs, careerClusters, careerDirections, experiences } from "@/content";
void emptyJourney;

const J: Journey = {
  ambitions: ["lead-ai-emerging-technology", "data-driven-decisions"],
  interests: ["artificial-intelligence", "data-analytics", "ai-strategy"],
  experiences: ["ai-in-action", "technical-skills"],
  visits: ["management-consultant"],
  complete: true,
};
const V1 = { a: [1, 2], i: [0, 1, 3], e: [4, 5], visits: [2], complete: true };
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64");

test.describe("share payload v2", () => {
  test("encodes stable IDs with a version and round-trips", () => {
    const payload = encodeShare(J);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/); // URL-safe
    const raw = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    expect(raw).toEqual({ v: 2, a: J.ambitions, i: J.interests, e: J.experiences, c: J.visits });
    expect(decodeShare(payload)).toEqual({ version: 2, journey: J });
  });

  test("contains no personal data fields", () => {
    const raw = JSON.parse(Buffer.from(encodeShare(J).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    expect(Object.keys(raw).sort()).toEqual(["a", "c", "e", "i", "v"]);
  });

  test("drops unknown IDs and enforces limits", () => {
    const payload = b64({ v: 2, a: ["lead-ai-emerging-technology", "hack", "data-driven-decisions", "social-impact", "lead-health-care"], i: ["finance"], e: ["industry-placement", 7], c: ["nope"] });
    const d = decodeShare(payload)!;
    expect(d.journey.ambitions).toEqual(["lead-ai-emerging-technology", "data-driven-decisions", "social-impact"]);
    expect(d.journey.experiences).toEqual(["industry-placement"]);
    expect(d.journey.visits).toEqual([]);
  });

  test("rejects garbage, unknown versions and oversize payloads", () => {
    expect(decodeShare("%%%")).toBeNull();
    expect(decodeShare(b64({ v: 9, a: [] }))).toBeNull();
    expect(decodeShare("A".repeat(4000))).toBeNull();
  });

  test("only complete journeys are importable from a hash", () => {
    expect(shareFromHash("#share=" + encodeShare(J))?.journey).toEqual(J);
    expect(shareFromHash("#share=" + encodeShare({ ...J, experiences: [] }))).toBeNull();
    expect(shareFromHash("#journey")).toBeNull();
  });
});

test.describe("share payload v1 (prototype) compatibility", () => {
  test("v1 index payloads decode to the equivalent ID journey", () => {
    expect(decodeShare(b64(V1))).toEqual({ version: 1, journey: J });
  });

  test("v1 decoding applies the prototype sanitising rules", () => {
    const j = journeyFromV1({ a: [0, 1, 2, 3, 99, -1, 1.5], i: [0, 0, 1], e: [8], visits: [11, 12], complete: true });
    expect(j.ambitions).toEqual(["lead-people-organisations", "lead-ai-emerging-technology", "data-driven-decisions"]);
    expect(j.interests).toEqual(["artificial-intelligence", "data-analytics"]);
    expect(j.experiences).toEqual(["gamified-learning"]);
    expect(j.visits).toEqual(["operations-manager"]);
    expect(j.complete).toBe(true);
  });
});

test.describe("saved journey storage", () => {
  const memory = (init: Record<string, string> = {}) => {
    const s = new Map(Object.entries(init));
    return {
      getItem: (k: string) => s.get(k) ?? null,
      setItem: (k: string, v: string) => void s.set(k, v),
      removeItem: (k: string) => void s.delete(k),
      dump: () => Object.fromEntries(s),
    };
  };

  test("migrates a v1 saved journey and removes the legacy key on save", () => {
    const store = memory({ [LEGACY_STORAGE_KEY]: JSON.stringify(V1) });
    const j = loadJourney(store);
    expect(j).toEqual(J);
    saveJourney(store, j);
    expect(store.dump()).toEqual({ [STORAGE_KEY]: JSON.stringify(J) });
  });

  test("prefers v2 storage and survives corrupt data", () => {
    expect(loadJourney(memory({ [STORAGE_KEY]: JSON.stringify(J), [LEGACY_STORAGE_KEY]: "{}" }))).toEqual(J);
    expect(loadJourney(memory({ [STORAGE_KEY]: "not json" }))).toEqual(emptyJourney);
  });

  test("sanitising marks incomplete journeys as not complete", () => {
    expect(sanitizeJourney({ ...J, interests: [] }).complete).toBe(false);
  });
});

test.describe("routes", () => {
  test("semantic routes parse and format symmetrically", () => {
    const all: Route[] = [
      { name: "home" },
      { name: "q", step: 1 },
      { name: "q", step: 3 },
      { name: "matching" },
      { name: "reveal" },
      { name: "options" },
      { name: "compare" },
      { name: "careers" },
      { name: "experiences" },
      { name: "journey" },
      ...programs.map((p) => ({ name: "mba" as const, id: p.id })),
      ...experiences.map((x) => ({ name: "experience" as const, id: x.id })),
      ...careerClusters.map((c) => ({ name: "cluster" as const, id: c.id })),
      ...careerDirections.map((c) => ({ name: "career" as const, id: c.id })),
      ...careerDirections.map((c) => ({ name: "bridge" as const, id: c.id })),
      { name: "occupation", code: "223432" },
    ];
    for (const r of all) expect(parseRoute("#" + formatRoute(r))).toEqual(r);
  });

  test("prototype career profile routes open their replacement Career Direction", () => {
    expect(parseRoute("career/marketing-strategist")).toEqual({ name: "career", id: "marketing-specialist" });
    expect(parseRoute("career/health-service-manager/bridge")).toEqual({ name: "bridge", id: "health-services-manager" });
    expect(parseRoute("career-6")).toEqual({ name: "career", id: "health-services-manager" });
    expect(formatRoute(parseRoute("career/business-manager"))).toBe("career/general-manager");
  });

  test("preferred semantic forms", () => {
    expect(paths.mba("mba-ai")).toBe("mba/mba-ai");
    expect(paths.career("management-consultant")).toBe("career/management-consultant");
    expect(paths.experience("industry-placement")).toBe("experience/industry-placement");
    expect(parseRoute("#mba/mba-marketing")).toEqual({ name: "mba", id: "mba-marketing" });
  });

  test("legacy numerical routes map through legacyIndex", () => {
    expect(parseRoute("mba-0")).toEqual({ name: "mba", id: "mba-ai" });
    expect(parseRoute("mba-6")).toEqual({ name: "mba", id: "mba-marketing" });
    expect(parseRoute("mba-9")).toEqual({ name: "mba", id: "mba-industry-focused" });
    expect(parseRoute("story-3")).toEqual({ name: "experience", id: "virtual-business-simulation" });
    expect(parseRoute("career-2")).toEqual({ name: "career", id: "management-consultant" });
    expect(parseRoute("bridge-11")).toEqual({ name: "bridge", id: "operations-manager" });
  });

  test("unknown or malformed routes fall back to home", () => {
    for (const h of ["", "#", "nope", "mba-10", "story-9", "career-12", "mba/", "mba/mba-unknown", "mba/mba-ai/extra", "career/x/bridge", "q4", "career/constructor", "career/toString/bridge", "careers/nope", "occupation/12345", "occupation/2234321", "occupation/abcdef", "occupation/223432/x"]) {
      expect(parseRoute(h), h).toEqual({ name: "home" });
    }
  });
});

test.describe("journeys still load into the production Matchmaker", () => {
  test("v1 and v2 journeys produce the same result", () => {
    const fromV1 = decodeShare(b64(V1))!.journey;
    const fromV2 = decodeShare(encodeShare(J))!.journey;
    expect(rankPrograms(fromV1)).toEqual(rankPrograms(fromV2));
    expect(rankPrograms(J)[0]).toBe("mba-ai");
  });
});
