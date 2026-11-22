import { AMBITION_IDS, CAREER_DIRECTION_IDS, EXPERIENCE_IDS, INTEREST_IDS } from "@/content/ids";
import { matchmakerRules } from "@/content";
import type { AmbitionId, CareerDirectionId, ExperienceId, InterestId } from "@/content/types";
import { journeyFromV1, legacyProfileDirection } from "./legacy";

/** A visitor's journey. Holds stable IDs only, never array positions. */
export type Journey = {
  ambitions: AmbitionId[];
  interests: InterestId[];
  experiences: ExperienceId[];
  /** Curated Career Directions the visitor has explored (most recent last). */
  visits: CareerDirectionId[];
  complete: boolean;
};

export const emptyJourney: Journey = { ambitions: [], interests: [], experiences: [], visits: [], complete: false };

/** Most explored Career Directions kept (oldest dropped first); keeps share links short. */
export const MAX_VISITS = 12;

export const STORAGE_KEY = "flinders-mba-journey.v2";
/** Prototype storage key (index-based). Migrated on load, then removed. */
export const LEGACY_STORAGE_KEY = "flinders-mba-journey.v1";

function ids<T extends string>(raw: unknown, allowed: readonly T[], cap = allowed.length): T[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<string>(allowed);
  return [...new Set(raw.filter((x): x is T => typeof x === "string" && set.has(x)))].slice(0, cap);
}

/** Accepts untrusted input and returns a valid journey (unknown IDs dropped). */
export function sanitizeJourney(raw: unknown): Journey {
  if (!raw || typeof raw !== "object") return emptyJourney;
  const o = raw as Record<string, unknown>;
  const ambitions = ids(o.ambitions, AMBITION_IDS, matchmakerRules.limits.ambitions);
  const interests = ids(o.interests, INTEREST_IDS, matchmakerRules.limits.interests);
  const experiences = ids(o.experiences, EXPERIENCE_IDS);
  return {
    ambitions,
    interests,
    experiences,
    visits: careerVisits(o.visits),
    complete: o.complete === true && isMatchable({ ambitions, interests, experiences }),
  };
}

/** Career Directions explored; prototype profile IDs are mapped to their replacements. */
function careerVisits(raw: unknown): CareerDirectionId[] {
  if (!Array.isArray(raw)) return [];
  const mapped = raw.map((x) => legacyProfileDirection(x) ?? x);
  return ids(mapped, CAREER_DIRECTION_IDS).slice(-MAX_VISITS);
}

/** Records an explored Career Direction (moved to the end if already present). */
export function withVisit(j: Journey, id: CareerDirectionId): Journey {
  if (j.visits[j.visits.length - 1] === id) return j;
  return { ...j, visits: [...j.visits.filter((v) => v !== id), id].slice(-MAX_VISITS) };
}

export function isMatchable(j: Pick<Journey, "ambitions" | "interests" | "experiences">) {
  return j.ambitions.length > 0 && j.interests.length > 0 && j.experiences.length > 0;
}

export function isEmptyJourney(j: Journey) {
  return !j.ambitions.length && !j.interests.length && !j.experiences.length && !j.visits.length;
}

export function journeysEqual(a: Journey, b: Journey) {
  return JSON.stringify(sanitizeJourney(a)) === JSON.stringify(sanitizeJourney(b));
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Loads the saved journey, migrating a prototype (v1) journey if present. */
export function loadJourney(storage: StorageLike, key = STORAGE_KEY): Journey {
  try {
    const current = storage.getItem(key);
    if (current) return sanitizeJourney(JSON.parse(current));
    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return journeyFromV1(JSON.parse(legacy));
  } catch {}
  return emptyJourney;
}

export function saveJourney(storage: StorageLike, j: Journey, key = STORAGE_KEY) {
  try {
    storage.setItem(key, JSON.stringify(j));
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
}
