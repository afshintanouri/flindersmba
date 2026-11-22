import { test, expect } from "@playwright/test";
import { PROGRAM_IDS } from "@/content/ids";
import { experiences, getProgram, matchmakerRules, programs } from "@/content";
import type { MatchmakerRules } from "@/content/types";
import { explain, matchProgrammes, scorePrograms, selectedSignals, type Selections } from "@/lib/matchmaker";
import { diagnose } from "@/lib/matchmaker-diagnostics";
import { currentContent, validateContent } from "@/content/validate";
import { personas } from "./personas";

const none: Selections = { ambitions: [], interests: [], experiences: [] };
const SHARED = experiences.filter((e) => e.category === "shared").map((e) => e.id);
const clone = (): MatchmakerRules => structuredClone(matchmakerRules);

test.describe("personas", () => {
  for (const p of personas) {
    test(p.name, () => {
      const r = matchProgrammes(p);
      const why = "\n" + diagnose(p, p.name);
      const classes = Array.isArray(p.classification) ? p.classification : [p.classification];
      expect(classes, why).toContain(r.classification);
      if (p.top) {
        expect(r.ranked[0].programId, why).toBe(p.top);
        expect(r.recommendations[0].programId, why).toBe(p.top);
      }
      if (p.alternativesInclude) {
        const alternatives = r.recommendations.slice(1).map((x) => x.programId);
        for (const a of p.alternativesInclude) expect(alternatives, why).toContain(a);
      }
      for (const other of p.mustNotBeat ?? []) {
        const pos = (id: string) => r.ranked.findIndex((s) => s.programId === id);
        expect(pos(other), why).toBeGreaterThan(pos(p.top!));
      }
      if (p.reasons) expect(r.recommendations[0].reasons.map((x) => x.id), why).toEqual(p.reasons);
      if (p.closePair) {
        expect(r.ranked.slice(0, 2).map((s) => s.programId).sort(), why).toEqual([...p.closePair].sort());
        expect(r.ranked[0].total - r.ranked[1].total, why).toBeLessThanOrEqual(matchmakerRules.thresholds.closeMargin + 1e-9);
      }
      // Matched evidence is recorded for the leading programme.
      if (r.classification !== "none") expect(r.ranked[0].matched.length, why).toBeGreaterThan(0);
      // Shared experiences never distort the ranking.
      const withShared = matchProgrammes({ ...p, experiences: [...p.experiences, ...SHARED] });
      const withoutShared = matchProgrammes({ ...p, experiences: p.experiences.filter((e) => !SHARED.includes(e)) });
      if (!p.experiences.includes("industry-placement")) {
        expect(withShared.ranked.map((s) => [s.programId, s.total])).toEqual(withoutShared.ranked.map((s) => [s.programId, s.total]));
      }
    });
  }

  test("every programme is reached by its reference profile", () => {
    for (const id of PROGRAM_IDS) {
      const r = matchProgrammes(matchmakerRules.referenceProfiles[id]);
      expect(r.ranked[0].programId, id).toBe(id);
    }
  });
});

test.describe("weighting and normalisation", () => {
  test("dimensions are 40 / 45 / 15 and totals are 0–100", () => {
    expect(matchmakerRules.dimensionWeights).toEqual({ ambitions: 40, interests: 45, preferences: 15 });
    for (const p of personas) for (const s of scorePrograms(p)) expect(s.total).toBeGreaterThanOrEqual(0), expect(s.total).toBeLessThanOrEqual(100);
  });

  test("a single perfect selection per dimension scores 100", () => {
    const s = scorePrograms({ ambitions: ["financial-capability"], interests: ["finance"], experiences: [] });
    expect(s.find((x) => x.programId === "mba-finance")!.total).toBe(100);
  });

  test("selecting more answers does not automatically raise the total", () => {
    const one = scorePrograms({ ambitions: ["financial-capability"], interests: ["finance"], experiences: [] });
    const more = scorePrograms({ ambitions: ["financial-capability"], interests: ["finance", "marketing", "innovation"], experiences: [] });
    const fin = (x: typeof one) => x.find((s) => s.programId === "mba-finance")!.total;
    expect(fin(more)).toBeLessThan(fin(one));
  });

  test("normalised dimension = raw / (3 × scorable selections)", () => {
    const s = scorePrograms({ ambitions: ["data-driven-decisions"], interests: ["data-analytics", "python-coding"], experiences: ["technical-skills"] });
    const ba = s.find((x) => x.programId === "mba-business-analytics")!;
    expect(ba.raw).toEqual({ ambitions: 3, interests: 6, preferences: 3 });
    expect(ba.max).toEqual({ ambitions: 3, interests: 6, preferences: 3 });
    expect(ba.total).toBe(100);
  });

  test("inactive dimensions are excluded from the denominator", () => {
    const s = scorePrograms({ ambitions: ["international-business-career"], interests: ["international-business"], experiences: [] });
    expect(s.find((x) => x.programId === "mba-international-business")!.total).toBe(100);
  });
});

test.describe("shared experiences", () => {
  test("contribute zero points to every programme", () => {
    for (const id of SHARED) {
      const s = scorePrograms({ ...none, experiences: [id] });
      for (const x of s) expect(x.total, `${id} → ${x.programId}`).toBe(0);
    }
  });

  test("are returned as personalisation messages that name no single MBA", () => {
    const r = matchProgrammes({ ambitions: ["financial-capability"], interests: ["finance"], experiences: [...SHARED] });
    expect(r.shared.map((s) => s.experienceId)).toEqual(SHARED);
    for (const s of r.shared) {
      for (const p of programs) expect(s.message, s.experienceId).not.toContain(p.name);
    }
    expect(r.shared[0].message).toContain("available across the Flinders MBA portfolio");
  });

  test("industry placement alone never makes Industry-focused the winner", () => {
    expect(matchProgrammes({ ...none, experiences: ["industry-placement"] }).classification).toBe("none");
    const withAmbition = matchProgrammes({ ambitions: ["industry-connected-career"], interests: [], experiences: ["industry-placement"] });
    expect(withAmbition.classification).not.toBe("clear");
    const specialist = matchProgrammes({ ambitions: ["data-driven-decisions"], interests: ["data-analytics"], experiences: ["industry-placement"] });
    expect(specialist.ranked[0].programId).toBe("mba-business-analytics");
  });

  test("the deeper-industry-exposure compound needs all of its signals", () => {
    const has = (sel: Selections) => selectedSignals(sel).has("compound:deeper-industry-exposure");
    expect(has({ ambitions: ["industry-connected-career"], interests: [], experiences: ["industry-placement", "industry-challenges"] })).toBe(true);
    expect(has({ ambitions: ["industry-connected-career"], interests: [], experiences: ["industry-placement", "factory-of-the-future"] })).toBe(true);
    expect(has({ ambitions: ["industry-connected-career"], interests: [], experiences: ["industry-placement"] })).toBe(false);
    expect(has({ ambitions: [], interests: [], experiences: ["industry-placement", "industry-challenges"] })).toBe(false);
  });

  test("a strong specialist preference beats the industry-connected ambition", () => {
    const r = matchProgrammes({
      ambitions: ["industry-connected-career", "financial-capability"],
      interests: ["finance"],
      experiences: ["industry-placement"],
    });
    expect(r.ranked[0].programId).toBe("mba-finance");
  });
});

test.describe("ties and determinism", () => {
  test("results are deterministic", () => {
    for (const p of personas) expect(matchProgrammes(p)).toEqual(matchProgrammes(p));
  });

  test("programme array order never decides the ranking", () => {
    for (const p of personas) {
      const a = matchProgrammes(p).ranked.map((s) => s.programId);
      const b = matchProgrammes(p, matchmakerRules, [...PROGRAM_IDS].reverse()).ranked.map((s) => s.programId);
      expect(b, p.name).toEqual(a);
    }
  });

  test("zero evidence never defaults to MBA AI", () => {
    const r = matchProgrammes(none);
    expect(r.classification).toBe("none");
    expect(r.recommendations).toEqual([]);
  });

  test("pairwise rules break near-ties (AI vs Marketing)", () => {
    // AI applied to marketing: Marketing must win.
    const r = matchProgrammes({
      ambitions: ["lead-ai-emerging-technology", "brands-customer-experience"],
      interests: ["artificial-intelligence", "marketing", "martech-automation"],
      experiences: ["ai-in-action"],
    });
    expect(r.ranked.findIndex((s) => s.programId === "mba-marketing")).toBeLessThan(r.ranked.findIndex((s) => s.programId === "mba-ai"));
  });

  test("HRM vs Health: health context decides", () => {
    const people = matchProgrammes({ ambitions: ["lead-people-organisations"], interests: ["people-culture"], experiences: [] });
    expect(people.ranked[0].programId).toBe("mba-hrm");
    const health = matchProgrammes({ ambitions: ["lead-people-organisations"], interests: ["health-management"], experiences: [] });
    expect(health.ranked[0].programId).toBe("mba-health-management");
  });

  test("Future Business vs Social Impact: explicit impact wins", () => {
    const r = matchProgrammes({ ambitions: ["social-impact", "transform-organisations"], interests: ["social-impact", "innovation"], experiences: [] });
    expect(r.ranked[0].programId).toBe("mba-social-impact");
  });

  test("Future Business vs International: explicit international markets win", () => {
    const r = matchProgrammes({ ambitions: ["lead-people-organisations", "international-business-career"], interests: ["international-business"], experiences: [] });
    expect(r.ranked[0].programId).toBe("mba-international-business");
  });
});

test.describe("classification", () => {
  test("close: the top two within the close margin are both strong matches", () => {
    const r = matchProgrammes(personas.find((p) => p.name.startsWith("11"))!);
    expect(r.classification).toBe("close");
    expect(r.recommendations.slice(0, 2).map((x) => x.label)).toEqual(["STRONG MATCH", "STRONG MATCH"]);
  });

  test("broad: answers spanning several pathways force no single strongest match", () => {
    const r = matchProgrammes({
      ambitions: ["financial-capability", "lead-health-care", "international-business-career"],
      interests: ["marketing", "social-impact", "python-coding", "people-culture"],
      experiences: ["gamified-learning"],
    });
    expect(r.classification).toBe("broad");
    expect(r.recommendations.length).toBeGreaterThan(1);
    expect(r.recommendations.length).toBeLessThanOrEqual(3);
    for (const x of r.recommendations) expect(x.label).toBe("WORTH EXPLORING");
  });

  test("clear: one strongest match and up to two relevant alternatives", () => {
    for (const p of personas.filter((x) => x.classification === "clear")) {
      const r = matchProgrammes(p);
      expect(r.recommendations[0].label).toBe("YOUR STRONGEST MATCH");
      expect(r.recommendations.length).toBeLessThanOrEqual(3);
      for (const alt of r.recommendations.slice(1)) {
        const score = r.ranked.find((s) => s.programId === alt.programId)!;
        expect(score.total).toBeGreaterThanOrEqual(matchmakerRules.thresholds.alternativeMinScore);
      }
    }
  });

  test("thresholds are configurable in the rules", () => {
    const rules = clone();
    rules.thresholds.closeMargin = 20;
    const p = personas.find((x) => x.name.startsWith("2"))!; // BA leads AI by ~13 points
    expect(matchProgrammes(p).classification).toBe("clear");
    expect(matchProgrammes(p, rules).classification).toBe("close");
  });
});

test.describe("explanations", () => {
  test("are generated only from matched signals", () => {
    for (const p of personas) {
      const r = matchProgrammes(p);
      const selected = selectedSignals(p);
      for (const rec of r.recommendations)
        for (const reason of rec.reasons) for (const s of reason.signals) expect(selected.has(s), `${reason.id}:${s}`).toBe(true);
    }
  });

  test("present only verified evidence, at most three per programme", () => {
    for (const p of personas) {
      for (const rec of matchProgrammes(p).recommendations) {
        expect(rec.reasons.length).toBeLessThanOrEqual(3);
        for (const reason of rec.reasons) expect(reason.status).toBe("verified");
      }
    }
  });

  test("never present draft Finance capabilities as evidence", () => {
    const reasons = explain("mba-finance", selectedSignals({ ambitions: ["financial-capability"], interests: ["finance"], experiences: [] }));
    for (const r of reasons) {
      for (const s of r.supports) expect(s.kind).not.toBe("capability");
      expect(r.text).not.toMatch(/risk assessment|commercial strategy|financial analysis/i);
    }
  });

  test("credentials text is filled from verified credential records", () => {
    const [r] = explain("mba-ai", selectedSignals({ ...none, experiences: ["professional-credentials"] }));
    expect(r.text).toBe("MBA Artificial Intelligence includes the Fortinet cybersecurity certification.");
  });

  test("ACHSM is described as a connection, not an accreditation", () => {
    const reasons = explain("mba-health-management", selectedSignals({ ambitions: ["lead-health-care"], interests: ["health-management"], experiences: [] }));
    for (const r of reasons) expect(r.text).not.toMatch(/accredit/i);
  });

  test("Future Business is never described as an emerging-technology specialism", () => {
    const reasons = explain("mba-future-business", selectedSignals(personas.find((p) => p.name.startsWith("9"))!));
    for (const r of reasons) expect(r.text).not.toMatch(/emerging|futur/i);
  });

  test("a programme without matched triggers falls back to its verified positioning", () => {
    const [r] = explain("mba-finance", selectedSignals(none));
    expect(r.text).toBe(getProgram("mba-finance").positioning.value);
    expect(r.status).toBe("verified");
  });
});

test.describe("rules validation", () => {
  const broken = (patch: (r: MatchmakerRules) => void) => {
    const c = structuredClone(currentContent);
    patch(c.matchmakerRules as MatchmakerRules);
    return validateContent(c);
  };

  test("the current rules are valid", () => {
    expect(validateContent()).toEqual([]);
  });

  test("weights outside 0–3 fail", () => {
    const issues = broken((r) => ((r.ambitions[0].weights as Record<string, number>)["mba-hrm"] = 4));
    expect(issues.some((i) => i.message.includes("0–3"))).toBe(true);
  });

  test("non-integer weights fail", () => {
    const issues = broken((r) => ((r.interests[0].weights as Record<string, number>)["mba-ai"] = 2.5));
    expect(issues.some((i) => i.message.includes("integers"))).toBe(true);
  });

  test("a missing programme weight fails", () => {
    const issues = broken((r) => delete (r.interests[0].weights as Partial<Record<string, number>>)["mba-ai"]);
    expect(issues.some((i) => i.where.startsWith("matchmakerRules.interests"))).toBe(true);
  });

  test("shared experiences cannot have specialist weights", () => {
    const issues = broken((r) =>
      r.preferences.push({ signal: "experience:industry-placement", weights: { ...r.preferences[0].weights } }),
    );
    expect(issues.some((i) => i.message.includes("must not have specialist score weights"))).toBe(true);
  });

  test("explanations backed by draft content fail", () => {
    const issues = broken((r) => r.explanations[0].supports.push({ kind: "capability", id: "risk-assessment" }));
    expect(issues.some((i) => i.message.includes("must be verified"))).toBe(true);
  });

  test("invalid tie-break programmes fail", () => {
    const issues = broken((r) => ((r.tieBreaks[0].programs as string[])[1] = "mba-unknown"));
    expect(issues.some((i) => i.where.includes("tieBreaks"))).toBe(true);
  });

  test("invalid thresholds fail", () => {
    const issues = broken((r) => (r.thresholds.alternativeMinScore = 90));
    expect(issues.some((i) => i.message.includes("alternativeMinScore"))).toBe(true);
  });

  test("an unreachable programme fails", () => {
    const issues = broken((r) => (r.referenceProfiles["mba-finance"] = { ambitions: ["data-driven-decisions"], interests: ["data-analytics"], experiences: [] }));
    expect(issues.some((i) => i.where.includes("referenceProfiles(mba-finance)"))).toBe(true);
  });
});
