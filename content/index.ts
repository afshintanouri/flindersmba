/**
 * Content access layer: typed lookups and derived mappings.
 * Components should read content through these helpers rather than
 * indexing arrays directly.
 */
import { ambitions } from "./ambitions";
import { capabilities } from "./capabilities";
import { careerClusters } from "./careers/clusters";
import {
  capabilityEvidenceLabels,
  capabilityShared,
  careerCapabilityList,
  careerDataProvenance,
  careerDirections,
  careerDisclaimer,
} from "./careers/directions";
import { certifications, industryConnections, professionalAccreditations } from "./credentials";
import { availabilityLabels, experienceGridOrder, experiences, programPageExperienceIds } from "./experiences";
import { interests } from "./interests";
import { matchmakerRules } from "./matchmaker/rules";
import { PORTFOLIO_URL, programs } from "./programs";
import { landingProofIds, programRecognitionProofIds, proof } from "./proof";
import type {
  AmbitionId,
  CapabilityId,
  CareerCapabilityId,
  CareerClusterId,
  CareerDirectionId,
  ExperienceId,
  InterestId,
  ProgramId,
  ProofId,
} from "./types";

export {
  ambitions,
  capabilities,
  capabilityEvidenceLabels,
  capabilityShared,
  careerCapabilityList,
  careerClusters,
  careerDataProvenance,
  careerDirections,
  careerDisclaimer,
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
};

function lookup<T extends { id: string }>(items: T[], kind: string) {
  const map = new Map(items.map((x) => [x.id, x]));
  return (id: string): T => {
    const found = map.get(id);
    if (!found) throw new Error(`Unknown ${kind} ID: ${id}`);
    return found;
  };
}

export const getProgram = lookup(programs, "programme") as (id: ProgramId) => (typeof programs)[number];
export const getAmbition = lookup(ambitions, "ambition") as (id: AmbitionId) => (typeof ambitions)[number];
export const getInterest = lookup(interests, "interest") as (id: InterestId) => (typeof interests)[number];
export const getExperience = lookup(experiences, "experience") as (id: ExperienceId) => (typeof experiences)[number];
export const getCapability = lookup(capabilities, "capability") as (id: CapabilityId) => (typeof capabilities)[number];
export const getProof = lookup(proof, "proof") as (id: ProofId) => (typeof proof)[number];
export const getCareerCluster = lookup(careerClusters, "career cluster") as (
  id: CareerClusterId,
) => (typeof careerClusters)[number];
export const getCareerDirection = lookup(careerDirections, "career direction") as (
  id: CareerDirectionId,
) => (typeof careerDirections)[number];
export const getCareerCapability = lookup(careerCapabilityList, "career capability") as (
  id: CareerCapabilityId,
) => (typeof careerCapabilityList)[number];

/* ---------------- Programme-derived lists ---------------- */

export const programCertifications = (id: ProgramId) =>
  certifications.filter((c) => c.programIds.includes(id));

export const programAccreditations = (id: ProgramId) =>
  professionalAccreditations.filter((a) => a.programIds.includes(id));

export const programIndustryConnections = (id: ProgramId) =>
  industryConnections.filter((c) => c.programIds.includes(id));

/** Specialist experiences linked to a programme (never shared ones). */
export const programSpecialistExperiences = (id: ProgramId) =>
  experiences.filter((e) => e.category === "specialist" && e.programIds?.includes(id));

/** "Professional edge" labels: certifications first, then accreditations. */
export const programCredentialLabels = (id: ProgramId) => [
  ...programCertifications(id).map((c) => c.label),
  ...programAccreditations(id).map((a) => a.label),
];

export const featuredCapabilityLabels = (id: ProgramId) =>
  getProgram(id).capabilities.featured.map((c) => getCapability(c).label);

export const programPromo = (id: ProgramId) => {
  const promoId = getProgram(id).promoProofId;
  return promoId ? getProof(promoId).label : undefined;
};

export const programCourseUrl = (id: ProgramId) =>
  getProgram(id).courseUrl.value ?? PORTFOLIO_URL.value;

export const sharedExperiences = () => experiences.filter((e) => e.category === "shared");

/** Availability line for an experience story, derived from its category. */
export const experienceAvailability = (id: ExperienceId) => availabilityLabels[getExperience(id).category];

/* ---------------- Careers ---------------- */

/** The four Career Directions of a cluster, in catalogue order. */
export const careerDirectionsForCluster = (id: CareerClusterId) =>
  careerDirections.filter((d) => d.clusterId === id).sort((a, b) => a.order - b.order);

/** Career Directions whose approved primary official occupation is this OSCA code. */
export const careerDirectionsForOccupation = (code: string) =>
  careerDirections.filter((d) => d.primary?.code === code);
