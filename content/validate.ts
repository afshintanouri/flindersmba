/**
 * Build-time content validation.
 *
 * Run automatically during `next build` (app/page.tsx calls
 * `assertValidContent()` while the page is pre-rendered) and by the unit tests
 * (`pnpm test:unit`). A malformed record or dangling mapping fails the build.
 *
 * Not imported by client code, so Zod is not shipped to the browser.
 */
import { z } from "zod";
import * as ids from "./ids";
import {
  ambitions,
  capabilities,
  careerCapabilityList,
  careerClusters,
  careerDirections,
  certifications,
  experienceGridOrder,
  experiences,
  industryConnections,
  interests,
  landingProofIds,
  matchmakerRules,
  PORTFOLIO_URL,
  professionalAccreditations,
  programPageExperienceIds,
  programRecognitionProofIds,
  programs,
  proof,
} from "./index";
import { programAccreditations, programCertifications } from "./index";
import type { Experience, MatchmakerRules, Program, ProgramId, SignalRule } from "./types";
import { explanationStatus, matchProgrammes } from "@/lib/matchmaker";

/* ---------------- Schemas ---------------- */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date (YYYY-MM-DD)");

const provenance = z
  .object({
    status: z.enum(["verified", "draft", "placeholder"]),
    source: z.string().min(1).optional(),
    verifiedBy: z.string().min(1).optional(),
    verifiedOn: isoDate.optional(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.status === "verified" && (!p.source || !p.verifiedBy || !p.verifiedOn)) {
      ctx.addIssue({ code: "custom", message: "verified content needs source, verifiedBy and verifiedOn" });
    }
  });

const sourced = <T extends z.ZodTypeAny>(value: T) => z.object({ value, provenance }).strict();
const httpsUrl = z.string().url().startsWith("https://");
const text = z.string().trim().min(1);
const legacyIndex = z.number().int().nonnegative();

const programId = z.enum(ids.PROGRAM_IDS);
const capabilityId = z.enum(ids.CAPABILITY_IDS);
const iconKey = z.enum(ids.ICON_KEYS);

const programSchema = z
  .object({
    id: programId,
    name: text.startsWith("MBA "),
    shortName: text,
    profile: z.enum(["specialist", "generalist", "combined", "industry"]),
    positioning: sourced(text),
    headline: sourced(text),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i, "must be a hex colour"),
    icon: iconKey,
    capabilities: z.object({ featured: z.array(capabilityId).min(1), additional: z.array(capabilityId) }).strict(),
    differentiators: z.array(
      z
        .object({
          id: text,
          kind: z.enum(["capability-focus", "experience", "structure", "credential", "connection"]),
          label: text,
          description: text.optional(),
          provenance,
        })
        .strict(),
    ),
    promoProofId: z.enum(ids.PROOF_IDS).optional(),
    structure: sourced(text).optional(),
    courseUrl: sourced(httpsUrl.optional()),
    legacyIndex,
    provenance,
  })
  .strict()
  .refine((p) => p.name === `MBA ${p.shortName}`, "name must be 'MBA ' + shortName");

const ambitionSchema = z.object({ id: z.enum(ids.AMBITION_IDS), label: text, icon: iconKey, legacyIndex }).strict();
const interestSchema = z.object({ id: z.enum(ids.INTEREST_IDS), label: text, legacyIndex }).strict();

const experienceSchema = z
  .object({
    id: z.enum(ids.EXPERIENCE_IDS),
    category: z.enum(["shared", "specialist", "unconfirmed"]),
    programIds: z.array(programId).min(1).optional(),
    title: text,
    summary: text,
    label: text,
    story: text,
    icon: iconKey,
    photo: z.enum(ids.PHOTO_KEYS).optional(),
    subjectCodes: z.array(z.string().regex(/^[A-Z]{4}\d{4}$/, "must be a subject code like BUSN9148")).optional(),
    legacyIndex,
    provenance,
  })
  .strict()
  .superRefine((x, ctx) => {
    if (x.category === "specialist" && !x.programIds?.length)
      ctx.addIssue({ code: "custom", message: "specialist experiences must list programIds" });
    if (x.category === "shared" && x.programIds)
      ctx.addIssue({ code: "custom", message: "shared experiences apply to the whole portfolio and must not list programIds" });
  });

const capabilitySchema = z
  .object({
    id: capabilityId,
    label: text,
    group: z.enum(["technical", "ai-leadership", "business", "finance", "health", "people", "international", "marketing", "social-impact"]),
    description: text.optional(),
    provenance,
  })
  .strict();

const certificationSchema = z
  .object({ id: z.enum(ids.CERTIFICATION_IDS), label: text, issuer: text, programIds: z.array(programId).min(1), provenance })
  .strict();
const accreditationSchema = z
  .object({
    id: z.enum(ids.PROFESSIONAL_ACCREDITATION_IDS),
    label: text,
    body: text,
    programIds: z.array(programId).min(1),
    provenance,
  })
  .strict();
const connectionSchema = z
  .object({
    id: z.enum(ids.INDUSTRY_CONNECTION_IDS),
    name: text,
    description: text,
    programIds: z.array(programId).min(1),
    provenance,
  })
  .strict();
const proofSchema = z
  .object({
    id: z.enum(ids.PROOF_IDS),
    kind: z.enum(["accreditation", "ranking", "programme-claim", "statement"]),
    label: text,
    meaning: text,
    programId: programId.optional(),
    icon: iconKey.optional(),
    provenance,
  })
  .strict();

const clusterSchema = z
  .object({
    id: z.enum(ids.CAREER_CLUSTER_IDS),
    label: text,
    icon: iconKey,
    legacyIndex,
    legacyDirectionId: z.enum(ids.CAREER_DIRECTION_IDS),
    provenance,
  })
  .strict();
const careerCapabilityId = z.enum(ids.CAREER_CAPABILITY_IDS);
const oscaCode = z.string().regex(/^\d{6}$/, "must be a six-digit OSCA code");
const careerCapabilitySchema = z
  .object({ id: careerCapabilityId, label: text, group: text, definition: text })
  .strict();
const careerDirectionSchema = z
  .object({
    id: z.enum(ids.CAREER_DIRECTION_IDS),
    title: text,
    clusterId: z.enum(ids.CAREER_CLUSTER_IDS),
    order: z.number().int().min(0),
    relationshipType: z.enum(["direct", "alternative-title", "specialisation", "nec-included", "curated-related", "venture-direction"]),
    presentation: z.enum(["official", "related-official", "contemporary", "career-direction", "venture"]),
    primary: z
      .object({
        code: oscaCode,
        principalTitle: text,
        officialTitle: text,
        officialTitleType: z.enum(["principal-title", "alternative-title", "specialisation", "nec-included-title"]),
        isNec: z.boolean(),
        majorGroupCode: z.string().regex(/^[1-8]$/),
      })
      .strict()
      .optional(),
    related: z.array(z.object({ code: oscaCode, principalTitle: text }).strict()).max(3),
    overview: z.array(text).min(1).max(4).optional(),
    capabilityIds: z.array(careerCapabilityId).min(4).max(7),
    mba: z
      .object({
        mode: z.enum(["ranked", "explore"]),
        reason: text.optional(),
        connections: z
          .array(
            z
              .object({
                programId,
                band: z.enum(["strong", "relevant", "worth-exploring"]),
                capabilityIds: z.array(careerCapabilityId).min(1).max(4),
                evidence: z.array(text),
                credentials: z.array(text),
              })
              .strict(),
          )
          .min(1)
          .max(3),
      })
      .strict(),
    bridge: z.array(
      z
        .object({
          capabilityId: careerCapabilityId,
          programmes: z.array(z.object({ programId, band: z.enum(["strong", "relevant"]) }).strict()).max(3),
        })
        .strict(),
    ),
    sharedExperiences: z
      .array(z.object({ experienceId: z.enum(ids.EXPERIENCE_IDS), capabilityId: careerCapabilityId }).strict())
      .max(3),
  })
  .strict()
  .refine((d) => (d.presentation === "venture" ? !d.primary : true), "a venture direction must not have a primary OSCA code")
  .refine((d) => (d.presentation === "official" || d.presentation === "related-official") === !!d.primary, "only official / related-official directions have a primary OSCA occupation")
  .refine((d) => (d.primary ? !d.overview : !!d.overview), "curated overview only (and always) for directions without a primary occupation")
  .refine((d) => d.mba.mode === "ranked" || d.mba.connections.every((c) => c.band === "worth-exploring"), "explore mode never ranks connections");

const SIGNAL_KINDS: Record<string, readonly string[]> = {
  ambition: ids.AMBITION_IDS,
  interest: ids.INTEREST_IDS,
  experience: ids.EXPERIENCE_IDS,
  compound: ["deeper-industry-exposure"],
};
const signalRef = z.string().refine((v) => {
  const [kind, id, extra] = v.split(":");
  return extra === undefined && !!SIGNAL_KINDS[kind]?.includes(id);
}, "must reference a real stable ID, e.g. 'interest:finance'");
const weight = z.number().int("weights must be integers").min(0, "weights are 0–3").max(3, "weights are 0–3");
/** Every programme must have an explicit weight. */
const weightRow = z.object(Object.fromEntries(ids.PROGRAM_IDS.map((id) => [id, weight])) as Record<(typeof ids.PROGRAM_IDS)[number], typeof weight>).strict();
const condition = z.object({ anyOf: z.array(signalRef).min(1), min: z.number().int().positive().optional() }).strict();
const signalRule = z
  .object({
    signal: signalRef,
    weights: weightRow,
    conditional: z
      .array(z.object({ programId, weight, when: condition, note: text }).strict())
      .optional(),
    note: text.optional(),
  })
  .strict();
const support = z.union([
  z.object({ kind: z.enum(["positioning", "structure"]), programId }).strict(),
  z.object({ kind: z.literal("capability"), id: capabilityId }).strict(),
  z.object({ kind: z.literal("differentiator"), programId, id: text }).strict(),
  z.object({ kind: z.literal("certification"), id: z.enum(ids.CERTIFICATION_IDS) }).strict(),
  z.object({ kind: z.literal("accreditation"), id: z.enum(ids.PROFESSIONAL_ACCREDITATION_IDS) }).strict(),
  z.object({ kind: z.literal("connection"), id: z.enum(ids.INDUSTRY_CONNECTION_IDS) }).strict(),
]);
const profile = z
  .object({
    ambitions: z.array(z.enum(ids.AMBITION_IDS)),
    interests: z.array(z.enum(ids.INTEREST_IDS)),
    experiences: z.array(z.enum(ids.EXPERIENCE_IDS)),
  })
  .strict();

const rulesSchema = z
  .object({
    version: text,
    status: z.enum(["verified", "draft", "placeholder"]),
    description: text,
    dimensionWeights: z
      .object({ ambitions: z.number().positive(), interests: z.number().positive(), preferences: z.number().positive() })
      .strict()
      .refine((d) => d.ambitions + d.interests + d.preferences === 100, "dimension weights must sum to 100"),
    limits: z.object({ ambitions: z.number().int().positive(), interests: z.number().int().positive() }).strict(),
    ambitions: z.array(signalRule),
    interests: z.array(signalRule),
    preferences: z.array(signalRule),
    compounds: z.array(
      z
        .object({
          id: z.literal("deeper-industry-exposure"),
          dimension: z.literal("preferences"),
          description: text,
          requires: z.array(condition).min(2, "a compound signal needs several aligned signals"),
          weights: weightRow,
        })
        .strict(),
    ),
    thresholds: z
      .object({
        primaryMinScore: z.number().min(0).max(100),
        closeMargin: z.number().positive().max(50),
        alternativeMinScore: z.number().min(0).max(100),
        evidenceMinWeight: z.number().int().min(1).max(3),
        tieBreakMargin: z.number().min(0),
        maxAlternatives: z.number().int().min(0).max(2),
      })
      .strict()
      .refine((t) => t.alternativeMinScore < t.primaryMinScore, "alternativeMinScore must be below primaryMinScore")
      .refine((t) => t.tieBreakMargin <= t.closeMargin, "tieBreakMargin must not exceed closeMargin"),
    tieBreaks: z.array(
      z
        .object({
          id: text,
          programs: z.tuple([programId, programId]).refine(([a, b]) => a !== b, "tie-break needs two different programmes"),
          favour: z.record(programId, z.array(signalRef).min(1)),
          note: text,
        })
        .strict(),
    ),
    explanations: z.array(
      z
        .object({
          id: text,
          programId,
          heading: text,
          text,
          triggers: z.array(signalRef).min(1),
          supports: z.array(support).min(1),
        })
        .strict(),
    ),
    fallbackExplanation: z.object({ heading: text }).strict(),
    sharedMessages: z.array(z.object({ experienceId: z.enum(ids.EXPERIENCE_IDS), message: text }).strict()),
    labels: z.object({ clear: z.tuple([text, text, text]), close: z.tuple([text, text, text]), broad: text }).strict(),
    referenceProfiles: z.object(Object.fromEntries(ids.PROGRAM_IDS.map((id) => [id, profile])) as Record<(typeof ids.PROGRAM_IDS)[number], typeof profile>).strict(),
  })
  .strict();

/* ---------------- Validation ---------------- */

export type ContentIssue = { where: string; message: string };

/** Input to validate; defaults to the real content. Overridable in tests. */
export type ContentSet = {
  programs: unknown[];
  ambitions: unknown[];
  interests: unknown[];
  experiences: unknown[];
  capabilities: unknown[];
  certifications: unknown[];
  professionalAccreditations: unknown[];
  industryConnections: unknown[];
  proof: unknown[];
  careerClusters: unknown[];
  careerCapabilities: unknown[];
  careerDirections: unknown[];
  matchmakerRules: unknown;
  experienceGridOrder: string[];
  programPageExperienceIds: string[];
  landingProofIds: string[];
  programRecognitionProofIds: string[];
  portfolioUrl: unknown;
};

export const currentContent: ContentSet = {
  programs,
  ambitions,
  interests,
  experiences,
  capabilities,
  certifications,
  professionalAccreditations,
  industryConnections,
  proof,
  careerClusters,
  careerCapabilities: careerCapabilityList,
  careerDirections,
  matchmakerRules,
  experienceGridOrder,
  programPageExperienceIds,
  landingProofIds,
  programRecognitionProofIds,
  portfolioUrl: PORTFOLIO_URL,
};

export function validateContent(c: ContentSet = currentContent): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const fail = (where: string, message: string) => issues.push({ where, message });

  function check<T>(name: string, schema: z.ZodType<T>, items: unknown[]): T[] {
    const ok: T[] = [];
    items.forEach((item, i) => {
      const r = schema.safeParse(item);
      const label = `${name}[${i}]${(item as { id?: string })?.id ? ` (${(item as { id: string }).id})` : ""}`;
      if (r.success) ok.push(r.data);
      else r.error.issues.forEach((e) => fail(label + (e.path.length ? "." + e.path.join(".") : ""), e.message));
    });
    return ok;
  }

  /** Records as given (before schema checks), so one invalid field does not cascade. */
  const raw = (items: unknown[]) =>
    items.filter((x): x is { id: string; legacyIndex?: number } => !!x && typeof (x as { id?: unknown }).id === "string");

  /** Every registered ID has exactly one record; no duplicates; unique legacy indices. */
  function registry(name: string, items: { id: string; legacyIndex?: number }[], registered: readonly string[]) {
    const seen = new Set<string>();
    for (const x of items) {
      if (seen.has(x.id)) fail(name, `duplicate ID "${x.id}"`);
      seen.add(x.id);
    }
    for (const id of registered) if (!seen.has(id)) fail(name, `no record for registered ID "${id}"`);
    const legacy = items.filter((x) => x.legacyIndex !== undefined).map((x) => x.legacyIndex);
    if (new Set(legacy).size !== legacy.length) fail(name, "duplicate legacyIndex");
  }

  const P = check("programs", programSchema, c.programs);
  const A = check("ambitions", ambitionSchema, c.ambitions);
  const I = check("interests", interestSchema, c.interests);
  const X = check("experiences", experienceSchema, c.experiences);
  const C = check("capabilities", capabilitySchema, c.capabilities);
  const CE = check("certifications", certificationSchema, c.certifications);
  const PA = check("professionalAccreditations", accreditationSchema, c.professionalAccreditations);
  const IC = check("industryConnections", connectionSchema, c.industryConnections);
  const PR = check("proof", proofSchema, c.proof);
  const CL = check("careerClusters", clusterSchema, c.careerClusters);
  const CC = check("careerCapabilities", careerCapabilitySchema, c.careerCapabilities);
  const CD = check("careerDirections", careerDirectionSchema, c.careerDirections);
  const rules = rulesSchema.safeParse(c.matchmakerRules);
  if (!rules.success) rules.error.issues.forEach((e) => fail("matchmakerRules." + e.path.join("."), e.message));
  const portfolio = sourced(httpsUrl).safeParse(c.portfolioUrl);
  if (!portfolio.success) fail("PORTFOLIO_URL", "must be a valid https URL with provenance");

  registry("programs", raw(c.programs), ids.PROGRAM_IDS);
  registry("ambitions", raw(c.ambitions), ids.AMBITION_IDS);
  registry("interests", raw(c.interests), ids.INTEREST_IDS);
  registry("experiences", raw(c.experiences), ids.EXPERIENCE_IDS);
  registry("capabilities", raw(c.capabilities), ids.CAPABILITY_IDS);
  registry("certifications", raw(c.certifications), ids.CERTIFICATION_IDS);
  registry("professionalAccreditations", raw(c.professionalAccreditations), ids.PROFESSIONAL_ACCREDITATION_IDS);
  registry("industryConnections", raw(c.industryConnections), ids.INDUSTRY_CONNECTION_IDS);
  registry("proof", raw(c.proof), ids.PROOF_IDS);
  registry("careerClusters", raw(c.careerClusters), ids.CAREER_CLUSTER_IDS);
  registry("careerCapabilities", raw(c.careerCapabilities), ids.CAREER_CAPABILITY_IDS);
  registry("careerDirections", raw(c.careerDirections), ids.CAREER_DIRECTION_IDS);

  const has = (items: unknown[]) => new Set(raw(items).map((x) => x.id));
  const programIds = has(c.programs),
    capabilityIds = has(c.capabilities),
    experienceIds = has(c.experiences),
    proofIds = has(c.proof),
    directionIds = has(c.careerDirections),
    clusterIds = has(c.careerClusters);
  const ref = (where: string, kind: string, id: string, set: Set<string>) => {
    if (!set.has(id)) fail(where, `unknown ${kind} "${id}"`);
  };

  for (const p of P) {
    const all = [...p.capabilities.featured, ...p.capabilities.additional];
    all.forEach((id) => ref(`programs(${p.id}).capabilities`, "capability", id, capabilityIds));
    if (new Set(all).size !== all.length) fail(`programs(${p.id}).capabilities`, "a capability is listed twice");
    const diffIds = p.differentiators.map((d) => d.id);
    if (new Set(diffIds).size !== diffIds.length) fail(`programs(${p.id}).differentiators`, "duplicate differentiator ID");
    if (p.promoProofId) {
      ref(`programs(${p.id}).promoProofId`, "proof", p.promoProofId, proofIds);
      const claim = PR.find((x) => x.id === p.promoProofId);
      if (claim && claim.programId !== p.id) fail(`programs(${p.id}).promoProofId`, `proof "${claim.id}" belongs to another programme`);
    }
  }

  const programRefs = (name: string, items: { id: string; programIds?: string[] }[]) =>
    items.forEach((x) => x.programIds?.forEach((id) => ref(`${name}(${x.id}).programIds`, "programme", id, programIds)));
  programRefs("certifications", CE);
  programRefs("professionalAccreditations", PA);
  programRefs("industryConnections", IC);
  programRefs("experiences", X);
  PR.forEach((x) => x.programId && ref(`proof(${x.id}).programId`, "programme", x.programId, programIds));

  const sameSet = (where: string, list: string[], expected: Set<string>, exact: boolean) => {
    list.forEach((id) => ref(where, "ID", id, expected));
    if (new Set(list).size !== list.length) fail(where, "duplicate entry");
    if (exact && list.length !== expected.size) fail(where, `must list each of the ${expected.size} records exactly once`);
  };
  sameSet("experienceGridOrder", c.experienceGridOrder, experienceIds, true);
  sameSet("programPageExperienceIds", c.programPageExperienceIds, experienceIds, false);
  sameSet("landingProofIds", c.landingProofIds, proofIds, false);
  sameSet("programRecognitionProofIds", c.programRecognitionProofIds, proofIds, false);

  if (rules.success) validateRules(rules.data as unknown as MatchmakerRules, X as Experience[], P as Program[], fail);

  for (const cl of CL) ref(`careerClusters(${cl.id}).legacyDirectionId`, "career direction", cl.legacyDirectionId, directionIds);
  if (CC.length !== 18) fail("careerCapabilities", "the career taxonomy must have exactly 18 capabilities");
  const sharedIds = new Set(X.filter((x) => x.category === "shared" && x.provenance.status === "verified").map((x) => x.id));
  for (const d of CD) {
    ref(`careerDirections(${d.id}).clusterId`, "career cluster", d.clusterId, clusterIds);
    const conn = d.mba.connections.map((x) => x.programId);
    conn.forEach((id) => ref(`careerDirections(${d.id}).mba`, "programme", id, programIds));
    if (new Set(conn).size !== conn.length) fail(`careerDirections(${d.id}).mba`, "a programme is listed twice");
    if (new Set(d.capabilityIds).size !== d.capabilityIds.length) fail(`careerDirections(${d.id}).capabilityIds`, "duplicate capability");
    d.mba.connections.forEach((x) =>
      x.capabilityIds.forEach((cid) => {
        if (!d.capabilityIds.includes(cid)) fail(`careerDirections(${d.id}).mba(${x.programId})`, `capability "${cid}" is not connected with this career`);
      }),
    );
    d.sharedExperiences.forEach((s) => {
      if (!sharedIds.has(s.experienceId)) fail(`careerDirections(${d.id}).sharedExperiences`, `"${s.experienceId}" is not a verified shared experience`);
    });
  }
  for (const cl of CL) {
    const n = CD.filter((d) => d.clusterId === cl.id).length;
    if (n !== 4) fail(`careerClusters(${cl.id})`, `must have exactly 4 career directions (has ${n})`);
  }

  return issues;
}

/* ---------------- Matchmaker rules ---------------- */

function validateRules(r: MatchmakerRules, X: Experience[], P: Program[], fail: (where: string, message: string) => void) {
  const where = (s: string) => `matchmakerRules.${s}`;
  const shared = new Set(X.filter((x) => x.category === "shared").map((x) => `experience:${x.id}`));
  const nonShared = X.filter((x) => x.category !== "shared").map((x) => `experience:${x.id}`);

  // Each dimension covers its signals exactly once.
  const covers = (dim: string, rules: SignalRule[], expected: string[]) => {
    const list = rules.map((x) => x.signal as string);
    if (new Set(list).size !== list.length) fail(where(dim), "a signal has more than one rule");
    for (const e of expected) if (!list.includes(e)) fail(where(dim), `no weights for "${e}"`);
    for (const l of list) if (!expected.includes(l)) fail(where(dim), `"${l}" does not belong in ${dim}`);
  };
  covers("ambitions", r.ambitions, ids.AMBITION_IDS.map((id) => `ambition:${id}`));
  covers("interests", r.interests, ids.INTEREST_IDS.map((id) => `interest:${id}`));
  covers("preferences", r.preferences, nonShared);
  for (const rule of r.preferences)
    if (shared.has(rule.signal)) fail(where("preferences"), `shared experience "${rule.signal}" must not have specialist score weights`);
  for (const c of r.compounds)
    if (Object.values(c.weights).every((x) => x === 0)) fail(where(`compounds(${c.id})`), "has no programme weights");

  // Every programme has ambition and interest weights, and at least one strong (2–3) signal.
  for (const id of ids.PROGRAM_IDS) {
    const best = (dim: "ambitions" | "interests") =>
      Math.max(...r[dim].flatMap((x) => [x.weights[id], ...(x.conditional ?? []).filter((c) => c.programId === id).map((c) => c.weight)]));
    for (const dim of ["ambitions", "interests"] as const)
      if (best(dim) < 1) fail(where(dim), `programme "${id}" has no ${dim} weight`);
    if (Math.max(best("ambitions"), best("interests")) < 2)
      fail(where("ambitions"), `programme "${id}" has no strong (2–3) ambition or interest signal`);
  }
  // Conditional weights must raise the base weight.
  for (const rule of [...r.ambitions, ...r.interests, ...r.preferences])
    for (const c of rule.conditional ?? [])
      if (c.weight <= rule.weights[c.programId]) fail(where(rule.signal), `conditional weight for ${c.programId} must exceed its base weight`);

  // Tie-breaks: valid, unique pairs, favour only their own programmes.
  const pairs = new Set<string>();
  for (const t of r.tieBreaks) {
    const key = [...t.programs].sort().join("|");
    if (pairs.has(key)) fail(where(`tieBreaks(${t.id})`), "duplicate programme pair");
    pairs.add(key);
    for (const id of Object.keys(t.favour))
      if (!t.programs.includes(id as ProgramId)) fail(where(`tieBreaks(${t.id})`), `favours "${id}", which is not in the pair`);
  }

  // Explanations: verified supporting records only; credentials only where verified credentials exist.
  for (const e of r.explanations) {
    for (const s of e.supports) {
      if (s.kind === "differentiator" && !P.find((p) => p.id === s.programId)?.differentiators.some((d) => d.id === s.id))
        fail(where(`explanations(${e.id})`), `unknown differentiator "${s.programId}/${s.id}"`);
      if (s.kind === "structure" && !P.find((p) => p.id === s.programId)?.structure)
        fail(where(`explanations(${e.id})`), `programme "${s.programId}" has no structure record`);
    }
    const status = explanationStatus(e.supports);
    if (status !== "verified") fail(where(`explanations(${e.id})`), `supporting evidence must be verified (is ${status})`);
    if (e.text.includes("{credentials}") && !(programCertifications(e.programId).length + programAccreditations(e.programId).length))
      fail(where(`explanations(${e.id})`), "uses {credentials} but the programme has no credentials");
  }
  for (const id of ids.PROGRAM_IDS)
    if (!r.explanations.some((e) => e.programId === id)) fail(where("explanations"), `no explanation template for "${id}"`);

  // Shared messages: exactly one per shared experience, never for specialist ones.
  const msgs = r.sharedMessages.map((m) => `experience:${m.experienceId}`);
  for (const s of shared) if (msgs.filter((m) => m === s).length !== 1) fail(where("sharedMessages"), `need exactly one message for "${s}"`);
  for (const m of msgs) if (!shared.has(m)) fail(where("sharedMessages"), `"${m}" is not a shared experience`);

  // Reachability and array-order independence.
  for (const id of ids.PROGRAM_IDS) {
    const prof = r.referenceProfiles[id];
    const forward = matchProgrammes(prof, r);
    if (forward.ranked[0].programId !== id || !["clear", "close"].includes(forward.classification))
      fail(where(`referenceProfiles(${id})`), `profile does not make "${id}" the leading recommendation (got ${forward.ranked[0].programId}, ${forward.classification})`);
    const reversed = matchProgrammes(prof, r, [...ids.PROGRAM_IDS].reverse());
    if (reversed.ranked.map((x) => x.programId).join() !== forward.ranked.map((x) => x.programId).join())
      fail(where(`referenceProfiles(${id})`), "ranking depends on programme array order");
  }
}

export function formatIssues(issues: ContentIssue[]) {
  return issues.map((i) => `  • ${i.where}: ${i.message}`).join("\n");
}

/** Throws with a readable report if the content is invalid. */
export function assertValidContent(c: ContentSet = currentContent) {
  const issues = validateContent(c);
  if (issues.length) {
    throw new Error(`Content validation failed (${issues.length} issue${issues.length > 1 ? "s" : ""}):\n${formatIssues(issues)}`);
  }
}
