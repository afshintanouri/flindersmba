/**
 * Production MBA Matchmaker engine.
 *
 * A pure, deterministic function of the rules in content/matchmaker/rules.ts
 * and the visitor's selections. No array order is used to rank programmes.
 */
import { PROGRAM_IDS } from "@/content/ids";
import {
  experiences,
  getCapability,
  getProgram,
  matchmakerRules,
  programAccreditations,
  programCertifications,
  certifications,
  professionalAccreditations,
  industryConnections,
} from "@/content";
import type {
  AmbitionId,
  ContentStatus,
  ExperienceId,
  ExplanationSupport,
  InterestId,
  MatchClassification,
  MatchDimension,
  MatchWeight,
  MatchmakerRules,
  ProgramId,
  SignalCondition,
  SignalRef,
  SignalRule,
} from "@/content/types";

export type Selections = {
  ambitions: readonly AmbitionId[];
  interests: readonly InterestId[];
  experiences: readonly ExperienceId[];
};

export type MatchedSignal = {
  signal: SignalRef;
  dimension: MatchDimension;
  weight: MatchWeight;
  /** True when a conditional weight applied. */
  conditional: boolean;
};

export type ProgramScore = {
  programId: ProgramId;
  raw: Record<MatchDimension, number>;
  /** Maximum possible raw score for the visitor's selections. */
  max: Record<MatchDimension, number>;
  /** raw / max, 0–1 (0 when the dimension is inactive). */
  normalised: Record<MatchDimension, number>;
  /** Weighted total, 0–100. */
  total: number;
  matched: MatchedSignal[];
  /** Highest weight matched among ambitions and interests. */
  evidenceMax: MatchWeight;
  /** Number of matched ambition/interest signals with weight 3. */
  definingCount: number;
};

export type TieBreakNote = {
  winner: ProgramId;
  loser: ProgramId;
  reason: string;
};

export type Reason = {
  id: string;
  heading: string;
  text: string;
  /** Selected signals that triggered this explanation. */
  signals: SignalRef[];
  supports: ExplanationSupport[];
  status: ContentStatus;
};

export type Recommendation = {
  programId: ProgramId;
  label: string;
  reasons: Reason[];
};

export type SharedPersonalisation = { experienceId: ExperienceId; message: string };

export type MatchResult = {
  classification: MatchClassification;
  /** All programmes, strongest first. */
  ranked: ProgramScore[];
  recommendations: Recommendation[];
  /** Points between the first and second programme. */
  leadOverSecond: number;
  tieBreaks: TieBreakNote[];
  activeDimensions: MatchDimension[];
  /** Selected shared experiences (0 ranking points) with their messages. */
  shared: SharedPersonalisation[];
  signals: SignalRef[];
};

const DIMENSIONS: MatchDimension[] = ["ambitions", "interests", "preferences"];
const EPS = 1e-9;
const round = (n: number) => Math.round(n * 1e6) / 1e6;

const sharedIds = new Set(experiences.filter((e) => e.category === "shared").map((e) => e.id));

function holds(cond: SignalCondition, selected: Set<SignalRef>) {
  return cond.anyOf.filter((s) => selected.has(s)).length >= (cond.min ?? 1);
}

/** Selected signal references, including triggered compound signals. */
export function selectedSignals(sel: Selections, rules: MatchmakerRules = matchmakerRules): Set<SignalRef> {
  const set = new Set<SignalRef>([
    ...sel.ambitions.map((id) => `ambition:${id}` as const),
    ...sel.interests.map((id) => `interest:${id}` as const),
    ...sel.experiences.map((id) => `experience:${id}` as const),
  ]);
  for (const c of rules.compounds) {
    if (c.requires.every((cond) => holds(cond, set))) set.add(`compound:${c.id}`);
  }
  return set;
}

function weightFor(rule: { weights: Record<ProgramId, MatchWeight>; conditional?: SignalRule["conditional"] }, id: ProgramId, selected: Set<SignalRef>) {
  let weight = rule.weights[id];
  let conditional = false;
  for (const c of rule.conditional ?? []) {
    if (c.programId === id && c.weight > weight && holds(c.when, selected)) {
      weight = c.weight;
      conditional = true;
    }
  }
  return { weight, conditional };
}

/** Rules that apply to the visitor's selections, by dimension. */
function activeRules(selected: Set<SignalRef>, rules: MatchmakerRules) {
  const pick = (list: SignalRule[]) => list.filter((r) => selected.has(r.signal));
  return {
    ambitions: pick(rules.ambitions),
    interests: pick(rules.interests),
    preferences: [
      ...pick(rules.preferences),
      ...rules.compounds
        .filter((c) => selected.has(`compound:${c.id}`))
        .map((c) => ({ signal: `compound:${c.id}` as SignalRef, weights: c.weights })),
    ],
  } satisfies Record<MatchDimension, SignalRule[]>;
}

export function scorePrograms(
  sel: Selections,
  rules: MatchmakerRules = matchmakerRules,
  programIds: readonly ProgramId[] = PROGRAM_IDS,
): ProgramScore[] {
  const selected = selectedSignals(sel, rules);
  const active = activeRules(selected, rules);
  const activeWeight = DIMENSIONS.filter((d) => active[d].length).reduce((s, d) => s + rules.dimensionWeights[d], 0);
  return programIds.map((programId) => {
    const raw = { ambitions: 0, interests: 0, preferences: 0 };
    const max = { ambitions: 0, interests: 0, preferences: 0 };
    const normalised = { ambitions: 0, interests: 0, preferences: 0 };
    const matched: MatchedSignal[] = [];
    for (const d of DIMENSIONS) {
      for (const rule of active[d]) {
        const { weight, conditional } = weightFor(rule, programId, selected);
        raw[d] += weight;
        max[d] += 3;
        if (weight > 0) matched.push({ signal: rule.signal, dimension: d, weight, conditional });
      }
      normalised[d] = max[d] ? raw[d] / max[d] : 0;
    }
    const total = activeWeight
      ? round((DIMENSIONS.reduce((s, d) => s + rules.dimensionWeights[d] * normalised[d], 0) / activeWeight) * 100)
      : 0;
    const core = matched.filter((m) => m.dimension !== "preferences");
    return {
      programId,
      raw,
      max,
      normalised,
      total,
      matched,
      evidenceMax: core.reduce<MatchWeight>((m, x) => (x.weight > m ? x.weight : m), 0),
      definingCount: core.filter((m) => m.weight === 3).length,
    };
  });
}

/** Pairwise tie-break: >0 favours a, <0 favours b, 0 undecided. */
function pairwise(a: ProgramScore, b: ProgramScore, selected: Set<SignalRef>, rules: MatchmakerRules) {
  const rule = rules.tieBreaks.find(
    (r) => r.programs.includes(a.programId) && r.programs.includes(b.programId),
  );
  if (!rule) return { decision: 0, reason: "" };
  const count = (id: ProgramId) => (rule.favour[id] ?? []).filter((s) => selected.has(s)).length;
  const decision = count(a.programId) - count(b.programId);
  return { decision, reason: `tie-break rule "${rule.id}"` };
}

function exactTie(a: ProgramScore, b: ProgramScore) {
  return (
    b.definingCount - a.definingCount ||
    b.normalised.interests - a.normalised.interests ||
    b.normalised.ambitions - a.normalised.ambitions
  );
}

export function rankScores(
  scores: ProgramScore[],
  sel: Selections,
  rules: MatchmakerRules = matchmakerRules,
): { ranked: ProgramScore[]; tieBreaks: TieBreakNote[] } {
  const selected = selectedSignals(sel, rules);
  const tieBreaks: TieBreakNote[] = [];
  const name = (s: ProgramScore) => getProgram(s.programId).name;
  // 1. Score; exact ties by pairwise rule, then evidence; unresolved ties by
  //    name (display only: such ties are always reported as close matches).
  const ranked = [...scores].sort((a, b) => {
    if (Math.abs(a.total - b.total) > EPS) return b.total - a.total;
    const p = pairwise(a, b, selected, rules).decision;
    if (p) return -p;
    return exactTie(a, b) || name(a).localeCompare(name(b));
  });
  // 2. Near-ties within the tie-break margin are ordered by pairwise rules.
  for (let pass = 0; pass < ranked.length; pass++) {
    let swapped = false;
    for (let i = 0; i < ranked.length - 1; i++) {
      const a = ranked[i],
        b = ranked[i + 1];
      if (a.total - b.total > rules.thresholds.tieBreakMargin + EPS || b.total === 0) continue;
      const { decision, reason } = pairwise(a, b, selected, rules);
      if (decision < 0) {
        ranked[i] = b;
        ranked[i + 1] = a;
        swapped = true;
      }
      if (decision !== 0) {
        const [winner, loser] = decision < 0 ? [b, a] : [a, b];
        if (!tieBreaks.some((t) => t.winner === winner.programId && t.loser === loser.programId))
          tieBreaks.push({ winner: winner.programId, loser: loser.programId, reason });
      }
    }
    if (!swapped) break;
  }
  return { ranked, tieBreaks };
}

function supportStatus(s: ExplanationSupport): ContentStatus {
  switch (s.kind) {
    case "positioning":
      return getProgram(s.programId).positioning.provenance.status;
    case "structure":
      return getProgram(s.programId).structure?.provenance.status ?? "placeholder";
    case "capability":
      return getCapability(s.id).provenance.status;
    case "differentiator":
      return getProgram(s.programId).differentiators.find((d) => d.id === s.id)?.provenance.status ?? "placeholder";
    case "certification":
      return certifications.find((c) => c.id === s.id)?.provenance.status ?? "placeholder";
    case "accreditation":
      return professionalAccreditations.find((a) => a.id === s.id)?.provenance.status ?? "placeholder";
    case "connection":
      return industryConnections.find((c) => c.id === s.id)?.provenance.status ?? "placeholder";
  }
}

export function explanationStatus(supports: ExplanationSupport[]): ContentStatus {
  const statuses = supports.map(supportStatus);
  return statuses.includes("placeholder") ? "placeholder" : statuses.includes("draft") ? "draft" : "verified";
}

const joinList = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Up to three verified, signal-based reasons for a programme. */
export function explain(
  programId: ProgramId,
  selected: Set<SignalRef>,
  rules: MatchmakerRules = matchmakerRules,
): Reason[] {
  const credentials = joinList([
    ...programCertifications(programId).filter((c) => c.provenance.status === "verified").map((c) => c.label),
    ...programAccreditations(programId).filter((a) => a.provenance.status === "verified").map((a) => a.label),
  ]);
  const candidates = rules.explanations
    .filter((t) => t.programId === programId)
    .map((t, order) => ({ t, order, hits: t.triggers.filter((s) => selected.has(s)) }))
    .filter((c) => c.hits.length > 0 && explanationStatus(c.t.supports) === "verified")
    // Templates are authored in priority order within each programme.
    .sort((x, y) => x.order - y.order)
    .slice(0, 3);
  if (!candidates.length) {
    const program = getProgram(programId);
    return [
      {
        id: `${programId}-positioning`,
        heading: rules.fallbackExplanation.heading,
        text: program.positioning.value,
        signals: [],
        supports: [{ kind: "positioning", programId }],
        status: program.positioning.provenance.status,
      },
    ];
  }
  return candidates.map(({ t, hits }) => ({
    id: t.id,
    heading: t.heading,
    text: t.text.replace("{credentials}", credentials),
    signals: hits,
    supports: t.supports,
    status: "verified" as const,
  }));
}

/** Runs the Matchmaker. */
export function matchProgrammes(
  sel: Selections,
  rules: MatchmakerRules = matchmakerRules,
  programIds: readonly ProgramId[] = PROGRAM_IDS,
): MatchResult {
  const selected = selectedSignals(sel, rules);
  const { ranked, tieBreaks } = rankScores(scorePrograms(sel, rules, programIds), sel, rules);
  const t = rules.thresholds;
  const [first, second, third] = ranked;
  const meaningful = (s?: ProgramScore) => !!s && s.total > 0 && s.evidenceMax >= t.evidenceMinWeight;
  const relevant = (s: ProgramScore) => s.total >= t.alternativeMinScore && s.evidenceMax >= 1;
  const within = (s?: ProgramScore) => !!s && first.total - s.total <= t.closeMargin + EPS;
  const unresolvedTie = !!second && Math.abs(first.total - second.total) < EPS && !tieBreaks.some((x) => x.winner === first.programId);

  let classification: MatchClassification;
  if (!first || first.total <= 0) classification = "none";
  else if (first.total < t.primaryMinScore || !meaningful(first)) classification = "broad";
  else if ((within(second) && meaningful(second)) || unresolvedTie) {
    classification = within(third) && meaningful(third) ? "broad" : "close";
  } else classification = "clear";

  let picked: ProgramScore[] = [];
  if (classification === "clear") picked = [first, ...ranked.slice(1).filter(relevant).slice(0, t.maxAlternatives)];
  else if (classification === "close")
    picked = [first, second, ...ranked.slice(2).filter(relevant).slice(0, Math.max(0, t.maxAlternatives - 1))];
  else if (classification === "broad") picked = ranked.filter((s) => s.total > 0 && s.evidenceMax >= 1).slice(0, 1 + t.maxAlternatives);

  const label = (i: number) =>
    classification === "clear" ? rules.labels.clear[i] : classification === "close" ? rules.labels.close[i] : rules.labels.broad;

  return {
    classification,
    ranked,
    recommendations: picked.map((s, i) => ({ programId: s.programId, label: label(i), reasons: explain(s.programId, selected, rules) })),
    leadOverSecond: second ? round(first.total - second.total) : first?.total ?? 0,
    tieBreaks,
    activeDimensions: DIMENSIONS.filter((d) => (first?.max[d] ?? 0) > 0),
    shared: sel.experiences
      .filter((id) => sharedIds.has(id))
      .map((id) => ({ experienceId: id, message: rules.sharedMessages.find((m) => m.experienceId === id)?.message ?? "" }))
      .filter((m) => m.message),
    signals: [...selected],
  };
}

/** Programme IDs, strongest first. */
export const rankPrograms = (sel: Selections) => matchProgrammes(sel).ranked.map((s) => s.programId);

/** The programme shown on posters and cards (first ranked recommendation). */
export function leadingProgram(result: MatchResult): ProgramId {
  return result.recommendations[0]?.programId ?? result.ranked[0].programId;
}
