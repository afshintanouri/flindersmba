/**
 * Production Career Directions (typed).
 *
 * The data file is GENERATED from the approved review layer by
 * scripts/careers/build_production_careers.cjs (CI checks it is current).
 * Components must use this module, never the research review files.
 */
import data from "./career-directions.generated.json";
import type { CareerCapability, CareerCapabilityId, CareerDirection, ExperienceId, ProgramId } from "../types";

type GeneratedCareerData = {
  schemaVersion: 1;
  provenance: { status: "verified"; source: string; verifiedBy: string; verifiedOn: string; inputs: Record<string, string> };
  capabilities: CareerCapability[];
  capabilityEvidence: Record<string, string[]>;
  capabilityShared: Record<string, { experienceId: ExperienceId; text: string }[]>;
  directions: CareerDirection[];
};

const typed = data as unknown as GeneratedCareerData;

export const careerDataProvenance = typed.provenance;
export const careerCapabilityList: CareerCapability[] = typed.capabilities;
export const careerDirections: CareerDirection[] = typed.directions;

/** Verified specialist evidence / credential labels for a programme and capability. */
export const capabilityEvidenceLabels = (programId: ProgramId, capabilityId: CareerCapabilityId): string[] =>
  typed.capabilityEvidence[`${programId}|${capabilityId}`] ?? [];

/** Portfolio-wide shared experiences that support a capability (never scored). */
export const capabilityShared = (capabilityId: CareerCapabilityId) => typed.capabilityShared[capabilityId] ?? [];

/** Shown, visually restrained, at the bottom of career and occupation pages. */
export const careerDisclaimer =
  "OSCA occupations are shown only to illustrate potential connections between MBA capabilities and Australian occupations. They are provided for career exploration purposes only.";
