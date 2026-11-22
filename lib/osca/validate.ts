/**
 * Build-time validation of the normalised OSCA dataset in public/data/osca/.
 *
 * Run during `next build` (app/page.tsx) and by the unit tests. Server/build
 * only: reads files with node:fs and uses Zod, so it never reaches the browser.
 * The importer (scripts/osca/import_osca.py) separately verifies the dataset
 * against the raw ABS workbooks; this checks the committed output itself.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { normaliseSearchText } from "./search";

export const OSCA_DIR = join(process.cwd(), "public", "data", "osca");

export const EXPECTED_OSCA_COUNTS = {
  majorGroups: 8,
  subMajorGroups: 53,
  minorGroups: 111,
  unitGroups: 421,
  groups: 593,
  occupations: 1156,
  groupDescriptions: 593,
  occupationDescriptions: 1156,
  indexTitles: 3338,
} as const;

const LEVEL_LENGTH = { major: 1, "sub-major": 2, minor: 3, unit: 4 } as const;
const PARENT_LEVEL = { major: null, "sub-major": "major", minor: "sub-major", unit: "minor" } as const;
const FORBIDDEN_KEY = /anzsco|isco|\bnol\b|correspondence/i;

const text = z.string().min(1).refine((s) => s === s.trim() && !s.includes("  ") && !s.includes(" "), "must be whitespace-normalised");
const skill = z.number().int().min(1).max(5);
const titleList = z.array(text).refine((a) => new Set(a).size === a.length, "duplicate titles");

const groupSchema = z
  .object({
    code: z.string().regex(/^\d{1,4}$/),
    level: z.enum(["major", "sub-major", "minor", "unit"]),
    title: text,
    parentCode: z.string().regex(/^\d{1,3}$/).nullable(),
    skillLevels: z.array(skill).min(1),
    leadStatement: text,
    inclusionExclusion: text.optional(),
  })
  .strict();

const indexSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "occupation codes are six-digit strings"),
    principalTitle: text,
    alternativeTitles: titleList,
    specialisations: titleList,
    isNec: z.boolean(),
    necIncludedTitles: titleList,
    skillLevel: skill,
    unitGroupCode: z.string().regex(/^\d{4}$/),
    minorGroupCode: z.string().regex(/^\d{3}$/),
    subMajorGroupCode: z.string().regex(/^\d{2}$/),
    majorGroupCode: z.string().regex(/^\d$/),
    searchText: z.string().min(1),
  })
  .strict();

const detailSchema = z
  .object({
    leadStatement: text,
    mainTasks: z.array(text),
    registrationOrLicensing: text.optional(),
    inclusionExclusion: text.optional(),
    skillAttributes: text.optional(),
    corrections: z.array(z.string().regex(/^C\d{4}$/)).optional(),
  })
  .strict();

const correctionSchema = z
  .object({
    id: z.string().regex(/^C\d{4}$/),
    type: z.enum(["whitespace-normalisation", "encoding-anomaly", "source-title-disagreement", "code-format-normalisation"]),
    code: z.string().regex(/^\d{1,6}$/).nullable(),
    field: text,
    source: z.enum(["structure", "descriptions", "index"]),
    table: text,
    original: z.string(),
    corrected: z.string(),
    reason: text,
  })
  .strict();

export type OscaIssue = { where: string; message: string };

export type OscaFiles = {
  metadata: unknown;
  groups: unknown;
  index: unknown;
  details: Record<string, unknown>;
  corrections: unknown;
  /** All file names present (relative), to detect unexpected outputs. */
  fileNames: string[];
};

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

export function readOscaFiles(dir = OSCA_DIR): OscaFiles {
  const detailNames = readdirSync(join(dir, "occupations-details")).filter((f) => f.endsWith(".json")).sort();
  return {
    metadata: readJson(join(dir, "metadata.json")),
    groups: readJson(join(dir, "groups.json")),
    index: readJson(join(dir, "occupations-index.json")),
    details: Object.fromEntries(detailNames.map((f) => [f.replace(/\.json$/, ""), readJson(join(dir, "occupations-details", f))])),
    corrections: readJson(join(dir, "corrections.json")),
    fileNames: [...readdirSync(dir).filter((f) => f.endsWith(".json")), ...detailNames.map((f) => `occupations-details/${f}`)].sort(),
  };
}

function scanKeys(value: unknown, path: string, issues: OscaIssue[]) {
  if (Array.isArray(value)) value.forEach((v, i) => scanKeys(v, `${path}[${i}]`, issues));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(k)) issues.push({ where: `${path}.${k}`, message: "correspondence data must not enter the V1 dataset" });
      scanKeys(v, `${path}.${k}`, issues);
    }
  else if (value === "xxxxxx") issues.push({ where: path, message: "correspondence placeholder 'xxxxxx' found" });
}

export function validateOscaDataset(f: OscaFiles = readOscaFiles()): OscaIssue[] {
  const issues: OscaIssue[] = [];
  const fail = (where: string, message: string) => issues.push({ where, message });
  const parse = <T,>(where: string, schema: z.ZodType<T>, items: unknown[]): T[] =>
    items.flatMap((item, i) => {
      const r = schema.safeParse(item);
      if (r.success) return [r.data];
      r.error.issues.forEach((e) => fail(`${where}[${i}]${(item as { code?: string })?.code ? ` (${(item as { code: string }).code})` : ""}.${e.path.join(".")}`, e.message));
      return [];
    });

  const meta = f.metadata as Record<string, unknown>;
  const groups = parse("groups", groupSchema, (f.groups as { groups?: unknown[] }).groups ?? []);
  const index = parse("occupations-index", indexSchema, (f.index as { occupations?: unknown[] }).occupations ?? []);
  const corrections = parse("corrections", correctionSchema, (f.corrections as { corrections?: unknown[] }).corrections ?? []);

  // ---- Metadata ----
  if (meta.classification !== "OSCA - Occupation Standard Classification for Australia") fail("metadata.classification", "unexpected classification");
  if (meta.classificationYear !== "2024" || meta.version !== "1.0") fail("metadata.version", "expected OSCA 2024 version 1.0");
  if (meta.publisher !== "Australian Bureau of Statistics") fail("metadata.publisher", "unexpected publisher");
  if (meta.licenceStatus !== "cc-by-4.0") fail("metadata.licenceStatus", "expected cc-by-4.0 (ABS Creative Commons Attribution 4.0)");
  const licence = meta.licence as { url?: string } | undefined;
  if (licence?.url !== "https://creativecommons.org/licenses/by/4.0/") fail("metadata.licence", "expected the CC BY 4.0 licence URL");
  if (JSON.stringify(meta.counts) !== JSON.stringify(EXPECTED_OSCA_COUNTS)) fail("metadata.counts", `expected ${JSON.stringify(EXPECTED_OSCA_COUNTS)}`);
  const sources = (meta.sources as { path: string; includedInDataset: boolean; sha256: string }[]) ?? [];
  if (sources.length !== 3 || sources.some((s) => /correspondence/i.test(s.path) || !s.includedInDataset || !/^[0-9a-f]{64}$/.test(s.sha256)))
    fail("metadata.sources", "must list exactly the three current source workbooks with SHA-256 values");

  // ---- Groups & hierarchy ----
  const byCode = new Map(groups.map((g) => [g.code, g]));
  if (byCode.size !== groups.length) fail("groups", "duplicate group codes");
  const levelCount = (l: string) => groups.filter((g) => g.level === l).length;
  const expectLevel = [["major", "majorGroups"], ["sub-major", "subMajorGroups"], ["minor", "minorGroups"], ["unit", "unitGroups"]] as const;
  for (const [level, key] of expectLevel)
    if (levelCount(level) !== EXPECTED_OSCA_COUNTS[key]) fail("groups", `expected ${EXPECTED_OSCA_COUNTS[key]} ${level} groups, found ${levelCount(level)}`);
  if (groups.length !== EXPECTED_OSCA_COUNTS.groups) fail("groups", `expected ${EXPECTED_OSCA_COUNTS.groups} groups, found ${groups.length}`);
  for (const g of groups) {
    if (g.code.length !== LEVEL_LENGTH[g.level]) fail(`groups(${g.code})`, `a ${g.level} code must have ${LEVEL_LENGTH[g.level]} digit(s)`);
    const parentLevel = PARENT_LEVEL[g.level];
    if (parentLevel === null) {
      if (g.parentCode !== null) fail(`groups(${g.code})`, "major groups have no parent");
    } else {
      const parent = g.parentCode ? byCode.get(g.parentCode) : undefined;
      if (!parent || parent.level !== parentLevel || !g.code.startsWith(parent.code)) fail(`groups(${g.code})`, `invalid parent ${g.parentCode}`);
    }
    if ([...g.skillLevels].sort().join() !== g.skillLevels.join()) fail(`groups(${g.code})`, "skillLevels must be sorted");
  }

  // ---- Occupations ----
  if (index.length !== EXPECTED_OSCA_COUNTS.occupations) fail("occupations-index", `expected ${EXPECTED_OSCA_COUNTS.occupations} occupations, found ${index.length}`);
  const codes = new Set(index.map((o) => o.code));
  if (codes.size !== index.length) fail("occupations-index", "duplicate occupation codes");
  let titleCount = 0;
  const allTitles = new Map<string, string>();
  for (const o of index) {
    const where = `occupations-index(${o.code})`;
    const refs = [
      [o.unitGroupCode, "unit", 4],
      [o.minorGroupCode, "minor", 3],
      [o.subMajorGroupCode, "sub-major", 2],
      [o.majorGroupCode, "major", 1],
    ] as const;
    for (const [code, level, len] of refs)
      if (code !== o.code.slice(0, len) || byCode.get(code)?.level !== level) fail(where, `invalid ${level} group reference ${code}`);
    if (o.isNec !== o.code.endsWith("99")) fail(where, "isNec must be true exactly for codes ending in 99");
    if (o.necIncludedTitles.length && !o.isNec) fail(where, "nec included titles belong only to nec occupations");
    const unit = byCode.get(o.unitGroupCode);
    if (unit && !unit.skillLevels.includes(o.skillLevel)) fail(where, `skill level ${o.skillLevel} not within unit group levels ${unit.skillLevels}`);
    const titles = [o.principalTitle, ...o.alternativeTitles, ...o.specialisations, ...o.necIncludedTitles];
    if (new Set(titles).size !== titles.length) fail(where, "a title appears more than once for this occupation");
    for (const t of titles) {
      if (allTitles.has(t)) fail(where, `title "${t}" also belongs to ${allTitles.get(t)}`);
      allTitles.set(t, o.code);
    }
    titleCount += titles.length;
    const expected = titles.map(normaliseSearchText).join(" | ");
    if (o.searchText !== expected) fail(where, "searchText does not match the normalised official titles");
    // Authoritative title rule: a title recorded as a disagreeing variant must not be used.
    for (const c of corrections)
      if (c.code === o.code && c.type === "source-title-disagreement" && c.original === o.principalTitle)
        fail(where, "principal title uses a non-authoritative source variant");
  }
  if (titleCount !== EXPECTED_OSCA_COUNTS.indexTitles) fail("occupations-index", `expected ${EXPECTED_OSCA_COUNTS.indexTitles} official titles, found ${titleCount}`);

  // ---- Details ----
  const majors = groups.filter((g) => g.level === "major").map((g) => g.code).sort();
  if (JSON.stringify(Object.keys(f.details).sort()) !== JSON.stringify(majors)) fail("occupations-details", `expected one file per major group ${majors}`);
  const correctionIds = new Set(corrections.map((c) => c.id));
  let detailCount = 0;
  for (const [major, file] of Object.entries(f.details)) {
    const d = file as { majorGroupCode?: string; occupations?: Record<string, unknown> };
    if (d.majorGroupCode !== major) fail(`occupations-details/${major}`, "majorGroupCode mismatch");
    for (const [code, raw] of Object.entries(d.occupations ?? {})) {
      const where = `occupations-details/${major}(${code})`;
      detailCount++;
      if (!codes.has(code) || !code.startsWith(major)) fail(where, "detail for an unknown occupation or in the wrong major-group file");
      const r = detailSchema.safeParse(raw);
      if (!r.success) {
        r.error.issues.forEach((e) => fail(`${where}.${e.path.join(".")}`, e.message));
        continue;
      }
      if (!Array.isArray(r.data.mainTasks)) fail(where, "mainTasks must be an array");
      if (!r.data.mainTasks.length && !code.endsWith("99")) fail(where, "only nec occupations may have no main tasks");
      for (const id of r.data.corrections ?? []) if (!correctionIds.has(id)) fail(where, `unknown correction ${id}`);
    }
  }
  if (detailCount !== EXPECTED_OSCA_COUNTS.occupations) fail("occupations-details", `expected ${EXPECTED_OSCA_COUNTS.occupations} detail records, found ${detailCount}`);

  // ---- Corrections ----
  if (correctionIds.size !== corrections.length) fail("corrections", "duplicate correction IDs");
  for (const c of corrections) if (c.original === c.corrected && c.type !== "code-format-normalisation") fail(`corrections(${c.id})`, "records no change");

  // ---- No correspondence data; no unexpected files ----
  scanKeys({ metadata: { ...meta, referenceOnly: undefined }, groups: f.groups, index: f.index, details: f.details }, "dataset", issues);
  const expectedFiles = ["corrections.json", "groups.json", "metadata.json", "occupations-index.json", ...majors.map((m) => `occupations-details/${m}.json`)].sort();
  if (JSON.stringify(f.fileNames) !== JSON.stringify(expectedFiles)) fail("public/data/osca", `unexpected files: ${f.fileNames.filter((n) => !expectedFiles.includes(n))}`);

  return issues;
}

export function assertValidOscaDataset(f?: OscaFiles) {
  const issues = validateOscaDataset(f);
  if (issues.length)
    throw new Error(`OSCA dataset validation failed (${issues.length} issue${issues.length > 1 ? "s" : ""}):\n${issues.slice(0, 50).map((i) => `  • ${i.where}: ${i.message}`).join("\n")}`);
}
