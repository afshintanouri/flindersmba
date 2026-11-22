import type { InstitutionalProof, ProofId } from "./types";
import { PROTOTYPE, SPEC } from "./provenance";

/**
 * Institutional and programme claims. Display text is editable here;
 * components must not hard-code these statements.
 */
export const proof: InstitutionalProof[] = [
  {
    id: "aacsb",
    kind: "accreditation",
    label: "AACSB-accredited Business School",
    meaning: "The Flinders Business School is AACSB accredited.",
    icon: "badge-check",
    provenance: SPEC,
  },
  {
    id: "ceo-magazine-tier-one",
    kind: "ranking",
    label: "Tier One MBA · CEO Magazine",
    meaning: "The Flinders MBA is ranked Tier One globally by CEO Magazine.",
    icon: "trophy",
    provenance: SPEC,
  },
  {
    id: "mba-ai-first-only-australia",
    kind: "programme-claim",
    label: "Australia’s first and only MBA Artificial Intelligence",
    meaning: "Programme claim for the MBA Artificial Intelligence. Editable.",
    programId: "mba-ai",
    provenance: SPEC,
  },
  {
    id: "industry-connected",
    kind: "statement",
    label: "Industry connected",
    meaning: "General statement about industry connection across the MBA portfolio.",
    icon: "handshake",
    provenance: PROTOTYPE,
  },
];

/** Proof items shown in the landing-page proof strip, in order. */
export const landingProofIds: ProofId[] = ["aacsb", "ceo-magazine-tier-one", "industry-connected"];

/** Proof items shown under "Recognition" on every programme page, in order. */
export const programRecognitionProofIds: ProofId[] = ["aacsb", "ceo-magazine-tier-one"];
