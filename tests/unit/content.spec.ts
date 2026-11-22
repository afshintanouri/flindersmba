import { test, expect } from "@playwright/test";
import * as ids from "@/content/ids";
import {
  ambitions,
  experiences,
  getProgram,
  interests,
  matchmakerRules,
  programAccreditations,
  programCertifications,
  programCourseUrl,
  programCredentialLabels,
  programIndustryConnections,
  programPromo,
  programs,
  programSpecialistExperiences,
  sharedExperiences,
  careerCapabilityList,
  careerClusters,
  careerDirections,
  careerDirectionsForCluster,
  experienceAvailability,
  getCapability,
} from "@/content";
import { currentContent, validateContent, type ContentSet } from "@/content/validate";

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

test.describe("stable IDs", () => {
  test("the ten programme IDs are exactly as specified", () => {
    expect(programs.map((p) => p.id).sort()).toEqual(
      [
        "mba-ai",
        "mba-business-analytics",
        "mba-finance",
        "mba-health-management",
        "mba-hrm",
        "mba-international-business",
        "mba-marketing",
        "mba-social-impact",
        "mba-future-business",
        "mba-industry-focused",
      ].sort(),
    );
  });

  test("ambition, interest and experience IDs are semantic, not numeric", () => {
    for (const list of [ambitions, interests, experiences]) {
      for (const x of list) {
        expect(x.id).toMatch(kebab);
        expect(x.id).not.toMatch(/^\d+$/);
      }
    }
    expect(ambitions.map((a) => a.id)).toContain("lead-ai-emerging-technology");
    expect(interests.map((i) => i.id)).toEqual(expect.arrayContaining(["artificial-intelligence", "python-coding", "martech-automation"]));
    expect(experiences.map((e) => e.id)).toEqual(
      expect.arrayContaining(["industry-placement", "virtual-business-simulation", "alumni-mentorship", "factory-of-the-future", "gamified-learning"]),
    );
  });

  test("every registered ID set is kebab-case and unique", () => {
    for (const [name, list] of Object.entries(ids)) {
      if (!Array.isArray(list)) continue;
      expect(new Set(list).size, name).toBe(list.length);
      list.forEach((id: string) => expect(id, name).toMatch(kebab));
    }
  });

  test("legacy indices are preserved from the prototype order", () => {
    expect(programs.map((p) => p.legacyIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(ambitions.map((p) => p.legacyIndex)).toEqual([...Array(11).keys()]);
    expect(interests.map((p) => p.legacyIndex)).toEqual([...Array(17).keys()]);
    expect(experiences.map((p) => p.legacyIndex)).toEqual([...Array(9).keys()]);
  });
});

test.describe("content validation", () => {
  test("the current content is valid", () => {
    expect(validateContent()).toEqual([]);
  });

  const broken = (patch: (c: ContentSet) => ContentSet) => validateContent(patch(structuredClone(currentContent)));

  test("a dangling capability reference fails clearly", () => {
    const issues = broken((c) => {
      (c.programs[0] as { capabilities: { featured: string[] } }).capabilities.featured.push("not-a-capability");
      return c;
    });
    expect(issues.some((i) => i.where.includes("programs[0] (mba-ai)") && i.message.includes("not-a-capability"))).toBe(true);
  });

  test("a dangling programme mapping on a credential fails", () => {
    const issues = broken((c) => {
      (c.certifications[0] as { programIds: string[] }).programIds.push("mba-unknown");
      return c;
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  test("duplicate programme IDs fail", () => {
    const issues = broken((c) => ({ ...c, programs: [...c.programs, c.programs[0]] }));
    expect(issues.some((i) => i.message.includes('duplicate ID "mba-ai"'))).toBe(true);
  });

  test("a missing programme record fails", () => {
    const issues = broken((c) => ({ ...c, programs: c.programs.slice(1) }));
    expect(issues.some((i) => i.message.includes('no record for registered ID "mba-ai"'))).toBe(true);
  });

  test("invalid status values fail", () => {
    const issues = broken((c) => {
      (c.programs[0] as { provenance: { status: string } }).provenance.status = "approved";
      return c;
    });
    expect(issues.some((i) => i.where.startsWith("programs[0]") && i.where.includes("provenance.status"))).toBe(true);
  });

  test("verified content without verifiedBy fails", () => {
    const issues = broken((c) => {
      delete (c.programs[0] as { provenance: { verifiedBy?: string } }).provenance.verifiedBy;
      return c;
    });
    expect(issues.some((i) => i.message.includes("verifiedBy"))).toBe(true);
  });

  test("invalid course URLs fail", () => {
    const issues = broken((c) => {
      (c.programs[2] as { courseUrl: { value: string } }).courseUrl.value = "flinders.edu.au/finance";
      return c;
    });
    expect(issues.some((i) => i.where.includes("courseUrl"))).toBe(true);
  });

  test("an unknown signal in Matchmaker rules fails", () => {
    const issues = broken((c) => {
      (c.matchmakerRules as { ambitions: { signal: string }[] }).ambitions[0].signal = "ambition:space-travel";
      return c;
    });
    expect(issues.some((i) => i.where.startsWith("matchmakerRules"))).toBe(true);
  });

  test("a shared experience listing programmes fails", () => {
    const issues = broken((c) => {
      (c.experiences[0] as { programIds?: string[] }).programIds = ["mba-ai"];
      return c;
    });
    expect(issues.some((i) => i.message.includes("shared experiences"))).toBe(true);
  });

  test("a venture direction may never be given an OSCA code", () => {
    const issues = broken((c) => {
      const d = (c.careerDirections as { presentation: string; primary?: unknown }[]).find((x) => x.presentation === "venture")!;
      d.primary = { code: "121131", principalTitle: "Chief Executive or Managing Director", officialTitle: "Chief Executive or Managing Director", officialTitleType: "principal-title", isNec: false, majorGroupCode: "1" };
      return c;
    });
    expect(issues.some((i) => i.message.includes("venture"))).toBe(true);
  });

  test("explore-mode MBA connections may not be ranked", () => {
    const issues = broken((c) => {
      const d = (c.careerDirections as { mba: { mode: string; connections: { band: string }[] } }[]).find((x) => x.mba.mode === "explore")!;
      d.mba.connections[0].band = "strong";
      return c;
    });
    expect(issues.some((i) => i.message.includes("explore mode"))).toBe(true);
  });
});

test.describe("credentials, accreditations and connections", () => {
  test("certification mappings match the specification", () => {
    const certs = (id: Parameters<typeof programCertifications>[0]) => programCertifications(id).map((c) => c.id);
    expect(certs("mba-ai")).toEqual(["fortinet-cybersecurity"]);
    expect(certs("mba-business-analytics")).toEqual(["fortinet-cybersecurity", "google-web-analytics"]);
    expect(certs("mba-marketing")).toEqual(["google-web-analytics", "google-ai-powered-advertising"]);
    expect(certs("mba-hrm")).toEqual(["workday"]);
    for (const id of ["mba-finance", "mba-health-management", "mba-international-business", "mba-social-impact", "mba-future-business", "mba-industry-focused"] as const) {
      expect(certs(id), id).toEqual([]);
    }
  });

  test("professional accreditation mappings match the specification", () => {
    expect(programAccreditations("mba-marketing").map((a) => a.id)).toEqual(["ami"]);
    expect(programAccreditations("mba-hrm").map((a) => a.id)).toEqual(["ahri"]);
    const others = programs.filter((p) => !["mba-marketing", "mba-hrm"].includes(p.id));
    others.forEach((p) => expect(programAccreditations(p.id), p.id).toEqual([]));
  });

  test("ACHSM is an industry connection for Health Management, not an accreditation", () => {
    expect(programIndustryConnections("mba-health-management").map((c) => c.id)).toEqual(["achsm"]);
    expect(programAccreditations("mba-health-management")).toEqual([]);
  });

  test("professional edge labels are unchanged from the approved UI", () => {
    expect(programCredentialLabels("mba-marketing")).toEqual([
      "Google web analytics certification",
      "Google AI-powered advertising certification",
      "AMI accreditation",
    ]);
    expect(programCredentialLabels("mba-hrm")).toEqual(["Workday certification", "AHRI accreditation"]);
  });

  test("the MBA AI claim is editable content attached to mba-ai", () => {
    expect(programPromo("mba-ai")).toBe("Australia’s first and only MBA Artificial Intelligence");
    programs.filter((p) => p.id !== "mba-ai").forEach((p) => expect(programPromo(p.id)).toBeUndefined());
  });

  test("Finance uses the supplied official course URL", () => {
    expect(programCourseUrl("mba-finance")).toBe(
      "https://www.flinders.edu.au/study/courses/master-business-administration-finance",
    );
    expect(getProgram("mba-finance").courseUrl.provenance.status).toBe("verified");
  });
});

test.describe("shared vs specialist experiences", () => {
  test("the five portfolio experiences are shared", () => {
    expect(sharedExperiences().map((e) => e.id).sort()).toEqual(
      ["alumni-mentorship", "factory-of-the-future", "gamified-learning", "industry-placement", "virtual-business-simulation"].sort(),
    );
  });

  test("shared experiences never appear as a programme's specialist experience", () => {
    for (const p of programs) {
      programSpecialistExperiences(p.id).forEach((e) => expect(e.category).toBe("specialist"));
    }
  });

  test("subject codes are recorded for shared experiences where supplied", () => {
    const codes = Object.fromEntries(experiences.map((e) => [e.id, e.subjectCodes]));
    expect(codes["virtual-business-simulation"]).toEqual(["BUSN9148"]);
    expect(codes["alumni-mentorship"]).toEqual(["BUSN8008"]);
    expect(codes["factory-of-the-future"]).toEqual(["BUSN9128"]);
  });

  test("specialist differentiators are held separately from shared experiences", () => {
    const diff = (id: Parameters<typeof getProgram>[0]) => getProgram(id).differentiators.map((d) => d.id);
    expect(diff("mba-industry-focused")).toEqual(["double-placement", "working-in-australia"]);
    expect(diff("mba-marketing")).toEqual(expect.arrayContaining(["additional-gamified-topic", "two-industry-projects"]));
    expect(getProgram("mba-business-analytics").capabilities.additional).toEqual(
      expect.arrayContaining(["power-bi", "advanced-excel", "text-mining"]),
    );
    expect(getProgram("mba-ai").capabilities.featured).toEqual(
      expect.arrayContaining(["python", "neural-networks", "ai-strategy", "ai-governance-ethics"]),
    );
  });

  test("programme profiles reflect the specification", () => {
    expect(getProgram("mba-future-business").profile).toBe("generalist");
    expect(getProgram("mba-social-impact").profile).toBe("combined");
    expect(getProgram("mba-industry-focused").profile).toBe("industry");
  });
});

test.describe("careers (production)", () => {
  test("48 Career Directions, four per cluster, and the 18-capability taxonomy", () => {
    expect(careerDirections).toHaveLength(48);
    for (const c of careerClusters) expect(careerDirectionsForCluster(c.id), c.id).toHaveLength(4);
    expect(careerCapabilityList).toHaveLength(18);
  });
});

/** Approved positioning statements (verified content correction pass). */
export const APPROVED_POSITIONING: Record<string, string> = {
  "mba-ai": "Understand AI technically and lead its responsible use across organisations.",
  "mba-business-analytics": "Turn data, analytical tools and insights into better business decisions.",
  "mba-finance": "Build the financial capability to make stronger business and investment decisions.",
  "mba-health-management": "Lead the business and management of health.",
  "mba-hrm": "Build people, workforce and organisational capability.",
  "mba-international-business":
    "Build the capability to work across international markets, organisations and business environments.",
  "mba-marketing": "Lead customers, brands and marketing in an AI-powered world.",
  "mba-social-impact": "Lead organisations with social impact at the centre of decision-making.",
  "mba-future-business":
    "Build broad contemporary business and leadership capability through a fast-track general MBA.",
  "mba-industry-focused":
    "Build broad business capability with deeper exposure to industry and the Australian working environment.",
};

test.describe("verified positioning and availability", () => {
  test("every programme's positioning is the approved, verified statement", () => {
    expect(Object.keys(APPROVED_POSITIONING).sort()).toEqual(programs.map((p) => p.id).sort());
    for (const p of programs) {
      expect(p.positioning.value, p.id).toBe(APPROVED_POSITIONING[p.id]);
      expect(p.positioning.provenance.status, p.id).toBe("verified");
    }
  });

  test("there is no separate prototype tagline field any more", () => {
    for (const p of programs) expect("tagline" in p, p.id).toBe(false);
  });

  test("MBA Future Business is a fast-track general MBA, not a specialist emerging-business programme", () => {
    const fb = getProgram("mba-future-business");
    expect(fb.profile).toBe("generalist");
    expect(fb.positioning.value).toContain("fast-track general MBA");
    expect(fb.positioning.value).not.toMatch(/emerging business models/i);
  });

  test("shared experiences display the portfolio-wide availability statement", () => {
    for (const e of sharedExperiences()) {
      expect(experienceAvailability(e.id), e.id).toBe("AVAILABLE ACROSS OUR MBA PORTFOLIO");
    }
  });

  test("specialist experiences do not automatically receive the shared statement", () => {
    const specialist = experiences.filter((e) => e.category === "specialist");
    expect(specialist.map((e) => e.id).sort()).toEqual(["ai-in-action", "professional-credentials", "technical-skills"]);
    for (const e of specialist) expect(experienceAvailability(e.id), e.id).not.toBe("AVAILABLE ACROSS OUR MBA PORTFOLIO");
  });

  test("the unconfirmed industry-challenges experience is not represented as portfolio-wide", () => {
    const x = experiences.find((e) => e.id === "industry-challenges")!;
    expect(x.category).toBe("unconfirmed");
    expect(experienceAvailability("industry-challenges")).not.toBe("AVAILABLE ACROSS OUR MBA PORTFOLIO");
    expect(x.provenance.status).toBe("draft");
  });

  test("Finance draft capabilities remain marked draft", () => {
    const finance = getProgram("mba-finance").capabilities;
    expect(finance.featured).toEqual(["financial-analysis", "commercial-strategy", "risk-assessment"]);
    expect(finance.additional).toEqual([]);
    for (const id of finance.featured) expect(getCapability(id).provenance.status, id).toBe("draft");
  });

  test("programme headlines remain draft (no headlines invented)", () => {
    for (const p of programs) expect(p.headline.provenance.status, p.id).toBe("draft");
  });
});
