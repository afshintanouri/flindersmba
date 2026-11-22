/**
 * Career Explorer search across the 48 curated Career Directions and the
 * official OSCA title index. Pure functions (unit-tested).
 *
 * Priority (lower tier first):
 *   1 exact curated Career Direction title
 *   2 curated Career Direction partial match (title, then cluster)
 *   3 exact official principal title
 *   4 exact official alternative title
 *   5 exact official specialisation
 *   6 exact official nec-included title
 *   7 broader official title match (principal, alternative, specialisation, nec)
 * Token-aware: every query token must match the start of a whole word, and
 * tokens shorter than 3 characters must match a whole word ("ai" never
 * matches "thai").
 */
import { careerClusters, careerDirections } from "@/content";
import type { CareerDirection, OscaTitleType } from "@/content/types";
import { normaliseSearchText } from "@/lib/osca/search";
import type { OscaOccupationIndexEntry } from "@/lib/osca/types";

/** "&" is read as "and", as in the reviewed official-title matching. */
export const normaliseQuery = (q: string) => normaliseSearchText(q.replace(/&/g, " and "));

const words = (normalised: string) => normalised.split(" ").filter(Boolean);

/** Token-aware prefix match of a normalised query against one normalised text. */
export function tokensMatch(queryTokens: string[], text: string): boolean {
  if (!queryTokens.length) return false;
  const w = words(text);
  return queryTokens.every((t) => w.some((x) => x === t || (t.length >= 3 && x.startsWith(t))));
}

export type CareerHit = { kind: "career"; tier: 1 | 2; direction: CareerDirection };
export type OscaHit = {
  kind: "osca";
  tier: 3 | 4 | 5 | 6 | 7;
  occupation: OscaOccupationIndexEntry;
  matchedTitle: string;
  matchedTitleType: OscaTitleType;
};
export type SearchHit = CareerHit | OscaHit;

const clusterLabel = new Map(careerClusters.map((c) => [c.id, normaliseQuery(c.label)]));

export function searchCareerDirections(query: string): CareerHit[] {
  const q = normaliseQuery(query);
  const tokens = words(q);
  if (!tokens.length) return [];
  const hits: (CareerHit & { rank: number })[] = [];
  for (const d of careerDirections) {
    const title = normaliseQuery(d.title);
    if (title === q) hits.push({ kind: "career", tier: 1, direction: d, rank: 0 });
    else if (tokensMatch(tokens, title)) hits.push({ kind: "career", tier: 2, direction: d, rank: 1 });
    else if (tokensMatch(tokens, clusterLabel.get(d.clusterId)!)) hits.push({ kind: "career", tier: 2, direction: d, rank: 2 });
  }
  return hits
    .sort((a, b) => a.rank - b.rank || a.direction.order - b.direction.order)
    .map(({ kind, tier, direction }) => ({ kind, tier, direction }));
}

const TITLE_TYPES: [OscaTitleType, (o: OscaOccupationIndexEntry) => string[], 3 | 4 | 5 | 6][] = [
  ["principal-title", (o) => [o.principalTitle], 3],
  ["alternative-title", (o) => o.alternativeTitles, 4],
  ["specialisation", (o) => o.specialisations, 5],
  ["nec-included-title", (o) => o.necIncludedTitles, 6],
];

/** Pre-normalised titles, built once per loaded index. */
export type OscaSearchIndex = { entry: OscaOccupationIndexEntry; titles: [OscaTitleType, string, string, 3 | 4 | 5 | 6][] }[];

export function buildOscaSearchIndex(entries: OscaOccupationIndexEntry[]): OscaSearchIndex {
  return entries.map((entry) => ({
    entry,
    titles: TITLE_TYPES.flatMap(([type, get, tier]) => get(entry).map((t) => [type, t, normaliseQuery(t), tier] as [OscaTitleType, string, string, 3 | 4 | 5 | 6])),
  }));
}

export function searchOsca(query: string, index: OscaSearchIndex): OscaHit[] {
  const q = normaliseQuery(query);
  const tokens = words(q);
  if (!tokens.length) return [];
  const hits: OscaHit[] = [];
  for (const { entry, titles } of index) {
    const exact = titles.find((t) => t[2] === q);
    if (exact) {
      hits.push({ kind: "osca", tier: exact[3], occupation: entry, matchedTitle: exact[1], matchedTitleType: exact[0] });
      continue;
    }
    const partial = titles.find((t) => tokensMatch(tokens, t[2]));
    if (partial) hits.push({ kind: "osca", tier: 7, occupation: entry, matchedTitle: partial[1], matchedTitleType: partial[0] });
  }
  const typeOrder: OscaTitleType[] = ["principal-title", "alternative-title", "specialisation", "nec-included-title"];
  return hits.sort(
    (a, b) =>
      a.tier - b.tier ||
      typeOrder.indexOf(a.matchedTitleType) - typeOrder.indexOf(b.matchedTitleType) ||
      a.matchedTitle.localeCompare(b.matchedTitle) ||
      a.occupation.code.localeCompare(b.occupation.code),
  );
}

/** Combined, prioritised results: curated Career Directions always first. */
export function searchCareers(query: string, index: OscaSearchIndex | null): SearchHit[] {
  return [...searchCareerDirections(query), ...(index ? searchOsca(query, index) : [])];
}
