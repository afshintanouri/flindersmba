import type { Certification, IndustryConnection, ProfessionalAccreditation } from "./types";
import { SPEC, withNote } from "./provenance";

/**
 * Reusable credential records. Programmes reference these by ID; the
 * programme lists are derived from `programIds` here (single source of truth).
 * Labels are neutral and editable; no certification detail beyond the
 * supplied specification is recorded.
 */
export const certifications: Certification[] = [
  {
    id: "fortinet-cybersecurity",
    label: "Fortinet cybersecurity certification",
    issuer: "Fortinet",
    programIds: ["mba-ai", "mba-business-analytics"],
    provenance: SPEC,
  },
  {
    id: "google-web-analytics",
    label: "Google web analytics certification",
    issuer: "Google",
    programIds: ["mba-business-analytics", "mba-marketing"],
    provenance: SPEC,
  },
  {
    id: "google-ai-powered-advertising",
    label: "Google AI-powered advertising certification",
    issuer: "Google",
    programIds: ["mba-marketing"],
    provenance: SPEC,
  },
  {
    id: "workday",
    label: "Workday certification",
    issuer: "Workday",
    programIds: ["mba-hrm"],
    provenance: withNote(SPEC, "Integrated into the MBA Human Resource Management."),
  },
];

export const professionalAccreditations: ProfessionalAccreditation[] = [
  {
    id: "ami",
    label: "AMI accreditation",
    body: "AMI",
    programIds: ["mba-marketing"],
    provenance: SPEC,
  },
  {
    id: "ahri",
    label: "AHRI accreditation",
    body: "AHRI",
    programIds: ["mba-hrm"],
    provenance: SPEC,
  },
];

/**
 * Industry / professional connections. These are NOT accreditations and
 * must never be presented as such.
 */
export const industryConnections: IndustryConnection[] = [
  {
    id: "achsm",
    name: "Australasian College of Health Service Management (ACHSM)",
    description:
      "Specialised intensive topics are delivered with experienced industry professionals, including ACHSM affiliates and fellows.",
    programIds: ["mba-health-management"],
    provenance: withNote(SPEC, "Industry/professional connection only. Not an accreditation."),
  },
  {
    id: "centre-for-social-impact",
    name: "Centre for Social Impact",
    description:
      "Teaching is informed by academics with substantial public-sector and social-impact experience and connections with the Centre for Social Impact.",
    programIds: ["mba-social-impact"],
    provenance: withNote(SPEC, "Academic connection only. Not an accreditation."),
  },
];
