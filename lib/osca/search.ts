/**
 * Search normalisation for official OSCA titles.
 * Must stay identical to search_normalise() in scripts/osca/import_osca.py
 * (verified by a unit test against the generated searchText).
 */
export function normaliseSearchText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Token-aware matching: every query token must match the START of a whole
 * word in the text. Never raw substring matching, so "ai" does not match
 * "thai massage therapist", while "data sci" still matches "data scientist".
 * (Reference behaviour for the future Career Explorer search; no UI yet.)
 */
export function matchesTokens(query: string, searchText: string): boolean {
  const q = normaliseSearchText(query).split(" ").filter(Boolean);
  if (!q.length) return false;
  const words = new Set(searchText.split(/[ |]+/).filter(Boolean));
  return q.every((t) => [...words].some((w) => w === t || (t.length >= 3 && w.startsWith(t))));
}
