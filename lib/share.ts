/**
 * Share-link payloads (the part after "#share=").
 *
 * Version 2 (current): base64url-encoded JSON with stable IDs:
 *   { v: 2, a: AmbitionId[], i: InterestId[], e: ExperienceId[], c: CareerDirectionId[] }
 *   a = ambitions, i = interests, e = experiences, c = Career Directions explored
 *   (prototype career profile IDs in older links are mapped to their replacements).
 * Contains no personal data.
 *
 * Version 1 (prototype, decode only): base64 JSON of array indices
 *   { a: number[], i: number[], e: number[], visits: number[], complete: boolean }
 */
import { journeyFromV1 } from "./legacy";
import { isMatchable, sanitizeJourney, type Journey } from "./journey";

export const SHARE_PREFIX = "share=";
/** Hash payloads longer than this are ignored. */
export const MAX_SHARE_LENGTH = 3000;

function toBase64Url(s: string) {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Any(s: string) {
  const std = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(std + "=".repeat((4 - (std.length % 4)) % 4));
}

export function encodeShare(j: Journey): string {
  return toBase64Url(
    JSON.stringify({ v: 2, a: j.ambitions, i: j.interests, e: j.experiences, c: j.visits }),
  );
}

/**
 * The share URL for a journey: the current origin and path (keeps the GitHub
 * Pages base path, e.g. /flindersmba/) plus "#share=<v2 payload>". The query
 * string is dropped, so a kiosk's ?kiosk=1 never travels to a visitor's phone.
 */
export function shareUrl(location: { origin: string; pathname: string }, j: Journey): string {
  return `${location.origin}${location.pathname}#${SHARE_PREFIX}${encodeShare(j)}`;
}

/** True when a hash carries a share payload (valid or not). */
export const isShareHash = (hash: string) => hash.replace(/^#/, "").startsWith(SHARE_PREFIX);

export type DecodedShare = { version: 1 | 2; journey: Journey };

/** Decodes a v2 or v1 payload. Returns null if it is invalid or unknown. */
export function decodeShare(payload: string): DecodedShare | null {
  if (!payload || payload.length > MAX_SHARE_LENGTH) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Any(payload));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v === 2) {
    const draft = sanitizeJourney({ ambitions: o.a, interests: o.i, experiences: o.e, visits: o.c });
    return { version: 2, journey: { ...draft, complete: isMatchable(draft) } };
  }
  if (o.v === undefined && ("a" in o || "i" in o || "e" in o)) {
    return { version: 1, journey: journeyFromV1(o) };
  }
  return null;
}

/** Reads a shareable journey from a location hash, if present and complete. */
export function shareFromHash(hash: string): DecodedShare | null {
  const h = hash.replace(/^#/, "");
  if (!h.startsWith(SHARE_PREFIX)) return null;
  const decoded = decodeShare(h.slice(SHARE_PREFIX.length));
  return decoded && decoded.journey.complete ? decoded : null;
}
