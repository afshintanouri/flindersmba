import type { ContentProvenance } from "./types";

/** Date on which the programme specification was supplied and recorded. */
export const SPEC_DATE = "2026-11-20";

/** Information supplied in the project's verified programme specification. */
export const SPEC: ContentProvenance = {
  status: "verified",
  source: "Flinders MBA programme specification supplied to the project",
  verifiedBy: "Afshin Tanouri",
  verifiedOn: SPEC_DATE,
};

/** Wording or mappings carried over from the v0 prototype, awaiting review. */
export const PROTOTYPE: ContentProvenance = {
  status: "draft",
  source: "v0 prototype (lib/discovery.ts, commit c5b2b5e)",
};

/** Illustrative-only prototype content that must not be presented as fact. */
export const PLACEHOLDER: ContentProvenance = {
  status: "placeholder",
  source: "v0 prototype (lib/discovery.ts, commit c5b2b5e)",
};

export function withNote(base: ContentProvenance, note: string): ContentProvenance {
  return { ...base, note };
}
