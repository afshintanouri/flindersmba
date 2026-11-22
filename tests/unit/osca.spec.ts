import { test, expect } from "@playwright/test";
import { EXPECTED_OSCA_COUNTS, readOscaFiles, validateOscaDataset, type OscaFiles } from "@/lib/osca/validate";
import { matchesTokens, normaliseSearchText } from "@/lib/osca/search";
import type { OscaCorrection, OscaGroup, OscaOccupationDetail, OscaOccupationIndexEntry } from "@/lib/osca/types";

const files = readOscaFiles();
const occupations = (files.index as { occupations: OscaOccupationIndexEntry[] }).occupations;
const groups = (files.groups as { groups: OscaGroup[] }).groups;
const corrections = (files.corrections as { corrections: OscaCorrection[] }).corrections;
const meta = files.metadata as Record<string, unknown>;
const occ = (code: string) => occupations.find((o) => o.code === code)!;
const detail = (code: string) =>
  (files.details[code[0]] as { occupations: Record<string, OscaOccupationDetail> }).occupations[code];

test.describe("OSCA dataset validation", () => {
  test("the committed dataset is valid", () => {
    expect(validateOscaDataset(files)).toEqual([]);
  });

  const broken = (patch: (f: OscaFiles) => void) => {
    const f = structuredClone(files);
    patch(f);
    return validateOscaDataset(f);
  };
  const idx = (f: OscaFiles) => (f.index as { occupations: Record<string, unknown>[] }).occupations;

  test("a non-six-digit occupation code fails", () => {
    expect(broken((f) => (idx(f)[0].code = "11113")).length).toBeGreaterThan(0);
  });
  test("an occupation code stored as a number fails", () => {
    expect(broken((f) => (idx(f)[0].code = 111131)).some((i) => i.where.includes("code"))).toBe(true);
  });
  test("duplicate occupation codes fail", () => {
    expect(broken((f) => idx(f).push(idx(f)[0])).some((i) => i.message.includes("duplicate"))).toBe(true);
  });
  test("an invalid group reference fails", () => {
    expect(broken((f) => (idx(f)[0].unitGroupCode = "9999")).some((i) => i.message.includes("group reference"))).toBe(true);
  });
  test("nec titles on a non-nec occupation fail", () => {
    expect(broken((f) => (idx(f)[0].necIncludedTitles = ["Something"])).some((i) => i.message.includes("nec"))).toBe(true);
  });
  test("a skill level outside 1–5 fails", () => {
    expect(broken((f) => (idx(f)[0].skillLevel = 6)).length).toBeGreaterThan(0);
  });
  test("duplicate alternative titles fail", () => {
    expect(broken((f) => (idx(f)[1].alternativeTitles = ["X", "X"])).some((i) => i.message.includes("duplicate"))).toBe(true);
  });
  test("a non-nec occupation without main tasks fails", () => {
    expect(
      broken((f) => ((f.details["1"] as { occupations: Record<string, { mainTasks: string[] }> }).occupations["111131"].mainTasks = [])).some((i) =>
        i.message.includes("main tasks"),
      ),
    ).toBe(true);
  });
  test("a missing group fails the hierarchy counts", () => {
    expect(broken((f) => (f.groups as { groups: unknown[] }).groups.pop()).some((i) => i.where === "groups")).toBe(true);
  });
  test("correspondence data entering the dataset fails", () => {
    expect(broken((f) => (idx(f)[0].anzscoCode = "132111")).some((i) => i.message.includes("correspondence"))).toBe(true);
  });
  test("un-normalised whitespace fails", () => {
    expect(broken((f) => (idx(f)[0].principalTitle = "Corporate Services Manager ")).some((i) => i.message.includes("whitespace"))).toBe(true);
  });
});

test.describe("OSCA counts, codes and hierarchy", () => {
  test("record counts match the official classification", () => {
    expect(occupations).toHaveLength(1156);
    expect(groups).toHaveLength(593);
    const by = (l: string) => groups.filter((g) => g.level === l).length;
    expect([by("major"), by("sub-major"), by("minor"), by("unit")]).toEqual([8, 53, 111, 421]);
    const titles = occupations.reduce((n, o) => n + 1 + o.alternativeTitles.length + o.specialisations.length + o.necIncludedTitles.length, 0);
    expect(titles).toBe(3338);
    expect(meta.counts).toEqual(EXPECTED_OSCA_COUNTS);
  });

  test("every code is a digit string of the right length", () => {
    for (const o of occupations) expect(o.code).toMatch(/^\d{6}$/);
    const len = { major: 1, "sub-major": 2, minor: 3, unit: 4 };
    for (const g of groups) expect(g.code).toHaveLength(len[g.level]);
  });

  test("each occupation references its official parent groups", () => {
    const o = occ("223432");
    expect([o.majorGroupCode, o.subMajorGroupCode, o.minorGroupCode, o.unitGroupCode]).toEqual(["2", "22", "223", "2234"]);
    const g = new Map(groups.map((x) => [x.code, x]));
    expect(g.get("2234")!.title).toBe("Management and Organisation Analysts");
    expect(g.get("2234")!.parentCode).toBe("223");
  });

  test("group descriptions stay at group level, not inside occupations", () => {
    expect(Object.keys(occ("223432"))).not.toContain("leadStatement");
    expect(groups.every((g) => g.leadStatement.length > 0)).toBe(true);
  });
});

test.describe("known official records", () => {
  test("Management Consultant is 223432", () => {
    const o = occ("223432");
    expect(o.principalTitle).toBe("Management Consultant");
    expect(o.alternativeTitles).toContain("Business Consultant");
    expect(o.specialisations).toContain("Business Analyst (non-ICT)");
    expect(o.isNec).toBe(false);
    expect(detail("223432").mainTasks.length).toBeGreaterThan(0);
  });
  test("Data Analyst is 223231 and Data Scientist is 223234", () => {
    expect(occ("223231").principalTitle).toBe("Data Analyst");
    expect(occ("223234").principalTitle).toBe("Data Scientist");
  });
  test("Human Resources Manager (111331) has People and Culture Manager as an alternative title", () => {
    expect(occ("111331").principalTitle).toBe("Human Resources Manager");
    expect(occ("111331").alternativeTitles).toEqual(expect.arrayContaining(["HR Manager", "People and Culture Manager"]));
  });
  test("Marketing Specialist (221534) has Brand Manager as a specialisation", () => {
    expect(occ("221534").principalTitle).toBe("Marketing Specialist");
    expect(occ("221534").specialisations).toContain("Brand Manager");
  });
  test("Environment and Sustainability Manager is a specialisation of Environmental Manager (149331)", () => {
    expect(occ("149331").principalTitle).toBe("Environmental Manager");
    expect(occ("149331").specialisations).toContain("Environment and Sustainability Manager");
  });
});

test.describe("nec semantics", () => {
  test("nec categories are flagged and carry their included titles", () => {
    const nec = occupations.filter((o) => o.isNec);
    expect(nec).toHaveLength(86);
    expect(nec.every((o) => o.code.endsWith("99"))).toBe(true);
    const ict = occ("113299");
    expect(ict.principalTitle).toBe("ICT Managers nec");
    expect(ict.necIncludedTitles).toContain("ICT Business Intelligence Manager");
  });
  test("nec included titles never become standalone occupations", () => {
    const principal = new Set(occupations.map((o) => o.principalTitle));
    for (const o of occupations) for (const t of o.necIncludedTitles) expect(principal.has(t), t).toBe(false);
  });
  test("only nec categories have no main tasks", () => {
    for (const o of occupations) expect(detail(o.code).mainTasks.length === 0).toBe(o.isNec ? detail(o.code).mainTasks.length === 0 : false);
  });
});

test.describe("normalisation and corrections log", () => {
  const find = (type: string, code: string) => corrections.filter((c) => c.type === type && c.code === code);

  test("2619 / 261999 use the Structure title and log the variants", () => {
    expect(groups.find((g) => g.code === "2619")!.title).toBe(
      "Other Allied Health Counselling, Psychology, Social Work and Creative Therapy Professionals",
    );
    expect(occ("261999").principalTitle).toBe("Allied Health Counselling, Psychology, Social Work and Creative Therapy Professionals nec");
    expect(find("source-title-disagreement", "2619").map((c) => c.source).sort()).toEqual(["descriptions", "structure"]);
    expect(find("source-title-disagreement", "261999")[0].original).toBe(
      "Allied Health Counsellors, Psychologists, Social Workers and Creative Therapy Professionals nec",
    );
  });

  test("the encoding-corrupted Repetiteur is replaced by the Titles Index form", () => {
    expect(occ("231699").necIncludedTitles).toContain("Repetiteur");
    const c = find("encoding-anomaly", "231699")[0];
    expect(c.original).toBe("RÃ©pÃ©titeur");
    expect(c.corrected).toBe("Repetiteur");
    // The corrupted original survives only in corrections.json, never in published records.
    expect(JSON.stringify({ i: files.index, d: files.details, g: files.groups })).not.toContain("Ã");
  });

  test("whitespace is normalised and logged (Set Designer)", () => {
    expect(occ("231437").specialisations).toContain("Set Designer");
    expect(find("whitespace-normalisation", "231437").some((c) => c.original === "Set Designer ")).toBe(true);
    expect(JSON.stringify({ i: files.index, d: files.details, g: files.groups })).not.toContain("\u00a0");
  });

  test("every correction has a type, source and reason, and details reference them", () => {
    const types = new Set(corrections.map((c) => c.type));
    expect([...types].sort()).toEqual(["code-format-normalisation", "encoding-anomaly", "source-title-disagreement", "whitespace-normalisation"]);
    expect(detail("231699").corrections).toContain(find("encoding-anomaly", "231699")[0].id);
  });

  test("list fields are split only on semicolons (commas inside titles survive)", () => {
    expect(occ("264635").alternativeTitles).toContain("Ear, Nose and Throat Specialist");
  });
});

test.describe("search index", () => {
  test("searchText is the normalised official titles", () => {
    const o = occ("111331");
    expect(o.searchText).toBe(
      [o.principalTitle, ...o.alternativeTitles, ...o.specialisations].map(normaliseSearchText).join(" | "),
    );
    expect(normaliseSearchText("Ear, Nose & Throat — Répétiteur")).toBe("ear nose throat repetiteur");
  });

  test("token matching: AI does not match Thai Massage Therapist", () => {
    expect(matchesTokens("AI", occ("441231").searchText)).toBe(false);
    expect(matchesTokens("artificial intelligence", occ("273333").searchText)).toBe(true);
    expect(matchesTokens("data sci", occ("223234").searchText)).toBe(true);
    expect(matchesTokens("people and culture", occ("111331").searchText)).toBe(true);
  });
});

test.describe("metadata and provenance", () => {
  test("records release, sources and the CC BY 4.0 licence", () => {
    expect(meta.classification).toBe("OSCA - Occupation Standard Classification for Australia");
    expect(meta.releases).toEqual({ structure: "2024-12-06", index: "2024-12-06", categoryDescriptions: "2025-07-28" });
    expect(meta.licenceStatus).toBe("cc-by-4.0");
    expect((meta.licence as { url: string }).url).toBe("https://creativecommons.org/licenses/by/4.0/");
    const sources = meta.sources as { path: string; sha256: string; statedRelease: string }[];
    expect(sources.map((s) => s.path.split("/").pop())).toEqual([
      "OSCA structure.xlsx",
      "OSCA Category Descriptions.xlsx",
      "OSCA index of principal titles alternative titles and specialisations.xlsx",
    ]);
    expect(sources[1].statedRelease).toBe("Released at 11:30am (Canberra time) 28 July 2025");
  });

  test("the correspondence workbook is reference-only", () => {
    const ref = meta.referenceOnly as { path: string }[];
    expect(ref.map((r) => r.path)).toEqual(["data/osca/raw/reference/OSCA correspondence tables v2.xlsx"]);
    expect(JSON.stringify({ i: files.index, d: files.details, g: files.groups })).not.toMatch(/ANZSCO|ISCO|xxxxxx/);
  });
});
