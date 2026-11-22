/**
 * Compatibility with the v0 prototype's index-based identities.
 * Uses each record's explicit `legacyIndex`, never current array positions.
 */
import { ambitions, careerClusters, experiences, interests, matchmakerRules, programs } from "@/content";
import type { CareerDirectionId } from "@/content/types";
import type { Journey } from "./journey";

function byLegacy<T extends { legacyIndex: number; id: string }>(items: T[]) {
  const map = new Map(items.map((x) => [x.legacyIndex, x.id as T["id"]]));
  return (i: unknown): T["id"] | undefined => (Number.isInteger(i) ? map.get(i as number) : undefined);
}

export const legacyProgram = byLegacy(programs);
export const legacyExperience = byLegacy(experiences);
export const legacyAmbition = byLegacy(ambitions);
export const legacyInterest = byLegacy(interests);
/** Prototype cluster index (#career-N, v1 visits) → its replacement Career Direction. */
export const legacyCareerDirection = (i: unknown): CareerDirectionId | undefined => {
  const cluster = byLegacy(careerClusters)(i);
  return cluster ? careerClusters.find((c) => c.id === cluster)!.legacyDirectionId : undefined;
};

/**
 * Prototype career profile IDs (saved v2 journeys, v2 share links and
 * #career/<id> routes from before the production Career Explorer) → the
 * approved Career Direction that replaces each one.
 */
export const LEGACY_CAREER_PROFILE_IDS: Record<string, CareerDirectionId> = {
  "digital-transformation-lead": "digital-transformation-manager",
  "business-intelligence-analyst": "business-intelligence",
  "business-manager": "general-manager",
  "marketing-strategist": "marketing-specialist",
  "commercial-analyst": "commercial-manager",
  "health-service-manager": "health-services-manager",
  "people-culture-adviser": "people-culture-manager",
  "international-business-development-manager": "international-business-development",
  "sustainability-adviser": "environment-sustainability-manager",
};

/** Replacement Career Direction for a prototype profile ID (own keys only). */
export const legacyProfileDirection = (id: unknown): CareerDirectionId | undefined =>
  typeof id === "string" && Object.prototype.hasOwnProperty.call(LEGACY_CAREER_PROFILE_IDS, id) ? LEGACY_CAREER_PROFILE_IDS[id] : undefined;

function mapList<T>(raw: unknown, f: (i: unknown) => T | undefined, cap?: number): T[] {
  if (!Array.isArray(raw)) return [];
  const out = [...new Set(raw.map(f).filter((x): x is T => x !== undefined))];
  return cap === undefined ? out : out.slice(0, cap);
}

/**
 * Converts a prototype (v1) journey `{a, i, e, visits, complete}` of indices
 * into an ID-based journey, with the prototype's sanitising rules.
 */
export function journeyFromV1(raw: unknown): Journey {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ambitionIds = mapList(o.a, legacyAmbition, matchmakerRules.limits.ambitions);
  const interestIds = mapList(o.i, legacyInterest, matchmakerRules.limits.interests);
  const experienceIds = mapList(o.e, legacyExperience);
  return {
    ambitions: ambitionIds,
    interests: interestIds,
    experiences: experienceIds,
    visits: mapList(o.visits, legacyCareerDirection),
    complete: o.complete === true && !!(ambitionIds.length && interestIds.length && experienceIds.length),
  };
}
