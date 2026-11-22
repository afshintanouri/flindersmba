import type {
  AmbitionId,
  CapabilityId,
  CareerClusterId,
  CareerCapabilityId,
  CareerDirectionId,
  CertificationId,
  ExperienceId,
  IconKey,
  IndustryConnectionId,
  InterestId,
  PhotoKey,
  ProfessionalAccreditationId,
  ProgramId,
  ProofId,
} from "./ids";

export type {
  AmbitionId,
  CapabilityId,
  CareerClusterId,
  CareerCapabilityId,
  CareerDirectionId,
  CertificationId,
  ExperienceId,
  IconKey,
  IndustryConnectionId,
  InterestId,
  PhotoKey,
  ProfessionalAccreditationId,
  ProgramId,
  ProofId,
};

/* ------------------------------------------------------------------ */
/* Provenance                                                          */
/* ------------------------------------------------------------------ */

/**
 * - verified:    confirmed by a named person or official source
 * - draft:       believed correct / carried over from the prototype, awaiting confirmation
 * - placeholder: illustrative only; must not be presented as fact
 */
export type ContentStatus = "verified" | "draft" | "placeholder";

/** Internal data-quality metadata. Not displayed in the UI. */
export type ContentProvenance = {
  status: ContentStatus;
  /** URL, document name or description of where the content came from. */
  source?: string;
  verifiedBy?: string;
  /** ISO date (YYYY-MM-DD). */
  verifiedOn?: string;
  note?: string;
};

/** A single value with its own provenance (e.g. a URL or a claim). */
export type Sourced<T> = { value: T; provenance: ContentProvenance };

/**
 * The prototype's original position of a record (0-based). Used ONLY for:
 * decoding version-1 share links / saved journeys, legacy numerical hash
 * routes (#mba-0, #story-3 …), and the prototype's numbered labels and
 * CSS layout hooks (e.g. `.story-0`). It is never used as identity.
 */
export type LegacyIndex = number;

/* ------------------------------------------------------------------ */
/* Matchmaker inputs                                                   */
/* ------------------------------------------------------------------ */

export type Ambition = {
  id: AmbitionId;
  label: string;
  icon: IconKey;
  legacyIndex: LegacyIndex;
};

export type Interest = {
  id: InterestId;
  label: string;
  legacyIndex: LegacyIndex;
};

/**
 * - shared:      available across the MBA portfolio. Personalises the result and
 *                communicates the Flinders MBA experience; must NOT give any one
 *                MBA an artificial Matchmaker advantage.
 * - specialist:  tied to particular specialisations (see `programIds`).
 * - unconfirmed: prototype experience whose scope has not yet been confirmed.
 *
 * The availability line shown on an experience story is derived from the
 * category (see `availabilityLabels` in content/experiences.ts).
 */
export type ExperienceCategory = "shared" | "specialist" | "unconfirmed";

export type Experience = {
  id: ExperienceId;
  category: ExperienceCategory;
  /** For specialist experiences: the programmes they relate to. */
  programIds?: ProgramId[];
  /** Matchmaker choice title, e.g. "Step into industry". */
  title: string;
  /** One-line summary shown under the title. */
  summary: string;
  /** Short name used on tiles and story pages, e.g. "Industry placement". */
  label: string;
  /** Story page body text. */
  story: string;
  icon: IconKey;
  photo?: PhotoKey;
  /** Related subject codes, where known. */
  subjectCodes?: string[];
  legacyIndex: LegacyIndex;
  provenance: ContentProvenance;
};

/* ------------------------------------------------------------------ */
/* Capabilities, credentials, accreditations, proof                    */
/* ------------------------------------------------------------------ */

export type CapabilityGroup =
  | "technical"
  | "ai-leadership"
  | "business"
  | "finance"
  | "health"
  | "people"
  | "international"
  | "marketing"
  | "social-impact";

export type Capability = {
  id: CapabilityId;
  /** Display label. Labels shown in the UI must not change without review. */
  label: string;
  group: CapabilityGroup;
  description?: string;
  provenance: ContentProvenance;
};

export type Certification = {
  id: CertificationId;
  /** Neutral, editable display name. */
  label: string;
  issuer: string;
  programIds: ProgramId[];
  provenance: ContentProvenance;
};

export type ProfessionalAccreditation = {
  id: ProfessionalAccreditationId;
  label: string;
  body: string;
  programIds: ProgramId[];
  provenance: ContentProvenance;
};

/** An industry or professional connection that is NOT an accreditation. */
export type IndustryConnection = {
  id: IndustryConnectionId;
  name: string;
  description: string;
  programIds: ProgramId[];
  provenance: ContentProvenance;
};

export type InstitutionalProofKind = "accreditation" | "ranking" | "programme-claim" | "statement";

export type InstitutionalProof = {
  id: ProofId;
  kind: InstitutionalProofKind;
  /** Editable display text. */
  label: string;
  /** What the claim means, for internal reference. */
  meaning: string;
  /** Set when the claim relates to one programme. */
  programId?: ProgramId;
  icon?: IconKey;
  provenance: ContentProvenance;
};

/* ------------------------------------------------------------------ */
/* Programmes                                                          */
/* ------------------------------------------------------------------ */

/**
 * A specialisation-specific feature (as distinct from a shared portfolio
 * experience), e.g. "double placement exposure" or "Working in Australia".
 */
export type Differentiator = {
  id: string;
  kind: "capability-focus" | "experience" | "structure" | "credential" | "connection";
  label: string;
  description?: string;
  provenance: ContentProvenance;
};

/**
 * - specialist:  a focused specialisation
 * - generalist:  the broad / general MBA option (MBA Future Business)
 * - combined:    general MBA component plus specialist study (MBA Social Impact)
 * - industry:    broad business capability with deeper industry exposure
 */
export type ProgramProfile = "specialist" | "generalist" | "combined" | "industry";

export type Program = {
  id: ProgramId;
  /** Full name, e.g. "MBA Artificial Intelligence". */
  name: string;
  /** Name without the "MBA" prefix, as used by the current UI. */
  shortName: string;
  profile: ProgramProfile;
  /** Verified positioning statement; the visible programme description. */
  positioning: Sourced<string>;
  /** Prototype result headline, e.g. "You're ready to lead with AI." (draft) */
  headline: Sourced<string>;
  /** Programme accent colour used by the approved design. */
  accent: string;
  icon: IconKey;
  capabilities: {
    /** Shown in "Your specialist edge" and comparisons, in display order. */
    featured: CapabilityId[];
    /** Further specialist areas held in data but not currently displayed. */
    additional: CapabilityId[];
  };
  /**
   * Specialisation-specific differentiators. Credentials, accreditations,
   * industry connections and specialist experiences are linked from their own
   * records (`programIds`), which are the single source of truth for those
   * mappings; see content/index.ts for the derived per-programme lists.
   */
  differentiators: Differentiator[];
  /** Programme-specific claim shown as a promo banner, if any. */
  promoProofId?: ProofId;
  /** Structural notes, e.g. composition or duration. */
  structure?: Sourced<string>;
  /** Official course page. `value` is undefined when unknown. */
  courseUrl: Sourced<string | undefined>;
  legacyIndex: LegacyIndex;
  provenance: ContentProvenance;
};

/* ------------------------------------------------------------------ */
/* Matchmaker rules                                                    */
/* ------------------------------------------------------------------ */

/**
 * 3 = defining or direct alignment, 2 = strong relevance,
 * 1 = some meaningful relevance, 0 = no useful differentiating relevance.
 */
export type MatchWeight = 0 | 1 | 2 | 3;

/** A complete weight row: every programme has an explicit weight. */
export type ProgramWeights = Record<ProgramId, MatchWeight>;

export type MatchDimension = "ambitions" | "interests" | "preferences";

/** Derived signals computed from combinations of selections. */
export type CompoundSignalId = "deeper-industry-exposure";

/**
 * Dimension-qualified reference to a visitor selection or derived signal.
 * (Ambition and interest IDs can coincide, e.g. "social-impact".)
 */
export type SignalRef =
  | `ambition:${AmbitionId}`
  | `interest:${InterestId}`
  | `experience:${ExperienceId}`
  | `compound:${CompoundSignalId}`;

export type SignalCondition = {
  /** At least `min` (default 1) of these signals must be selected. */
  anyOf: SignalRef[];
  min?: number;
};

/** Raises a programme's weight for a signal when a condition holds. */
export type ConditionalWeight = {
  programId: ProgramId;
  weight: MatchWeight;
  when: SignalCondition;
  note: string;
};

export type SignalRule = {
  signal: SignalRef;
  weights: ProgramWeights;
  conditional?: ConditionalWeight[];
  note?: string;
};

export type CompoundSignalRule = {
  id: CompoundSignalId;
  dimension: "preferences";
  description: string;
  /** Every group must be satisfied. */
  requires: SignalCondition[];
  weights: ProgramWeights;
};

/** Pairwise preference used only to order near-tied programmes. */
export type TieBreakRule = {
  id: string;
  programs: [ProgramId, ProgramId];
  /** Signals that favour each programme of the pair. */
  favour: Partial<Record<ProgramId, SignalRef[]>>;
  note: string;
};

export type ExplanationSupport =
  | { kind: "positioning" | "structure"; programId: ProgramId }
  | { kind: "capability"; id: CapabilityId }
  | { kind: "differentiator"; programId: ProgramId; id: string }
  | { kind: "certification"; id: CertificationId }
  | { kind: "accreditation"; id: ProfessionalAccreditationId }
  | { kind: "connection"; id: IndustryConnectionId };

/** Deterministic "why it fits" explanation template. */
export type ExplanationTemplate = {
  id: string;
  programId: ProgramId;
  heading: string;
  /** May contain {credentials}, filled from verified credential records. */
  text: string;
  /** Shown when at least one of these signals is selected. */
  triggers: SignalRef[];
  supports: ExplanationSupport[];
};

/** Personalisation message for a shared (portfolio-wide) experience. */
export type SharedExperienceMessage = {
  experienceId: ExperienceId;
  message: string;
};

export type MatchClassification = "clear" | "close" | "broad" | "none";

export type MatchmakerRules = {
  version: string;
  status: ContentStatus;
  description: string;
  /** Percentage weights of each dimension; must sum to 100. */
  dimensionWeights: Record<MatchDimension, number>;
  limits: { ambitions: number; interests: number };
  ambitions: SignalRule[];
  interests: SignalRule[];
  /** Differentiating preferences (non-shared experiences). */
  preferences: SignalRule[];
  compounds: CompoundSignalRule[];
  thresholds: {
    /** Minimum total (0–100) for a single strongest match. */
    primaryMinScore: number;
    /** Top two within this many points → two close matches. */
    closeMargin: number;
    /** Minimum total for a programme to be offered as an alternative. */
    alternativeMinScore: number;
    /** A recommended programme needs a matched ambition/interest of at least this weight. */
    evidenceMinWeight: MatchWeight;
    /** Near-ties within this many points are ordered by tie-break rules. */
    tieBreakMargin: number;
    maxAlternatives: number;
  };
  tieBreaks: TieBreakRule[];
  explanations: ExplanationTemplate[];
  /** Used when no template's triggers match. */
  fallbackExplanation: { heading: string };
  sharedMessages: SharedExperienceMessage[];
  /** Public labels for recommendation cards. */
  labels: {
    clear: [string, string, string];
    close: [string, string, string];
    broad: string;
  };
  /** Profiles that must make each programme the leading recommendation. */
  referenceProfiles: Record<
    ProgramId,
    { ambitions: AmbitionId[]; interests: InterestId[]; experiences: ExperienceId[] }
  >;
};

/* ------------------------------------------------------------------ */
/* Careers                                                             */
/* ------------------------------------------------------------------ */

export type CareerCluster = {
  id: CareerClusterId;
  label: string;
  icon: IconKey;
  /** Prototype index (#career-N routes, v1 journeys) and the direction it now opens. */
  legacyIndex: LegacyIndex;
  legacyDirectionId: CareerDirectionId;
  provenance: ContentProvenance;
};

/** One of the 18 curated capabilities connected with careers (not OSCA requirements). */
export type CareerCapability = {
  id: CareerCapabilityId;
  label: string;
  group: string;
  definition: string;
};

export type OscaTitleType = "principal-title" | "alternative-title" | "specialisation" | "nec-included-title";

/**
 * How a Career Direction relates to OSCA (from the reviewed relationships):
 * - official:          the career title is an official OSCA title (direct, alternative title, specialisation, nec)
 * - related-official:  curated direction with an approved related official occupation
 * - contemporary:      contemporary direction, reviewed as having no single OSCA occupation
 * - career-direction:  curated direction presented through its capabilities
 * - venture:           venture pathway; never assigned an OSCA code
 */
export type CareerPresentation = "official" | "related-official" | "contemporary" | "career-direction" | "venture";
export type CareerRelationshipType =
  | "direct"
  | "alternative-title"
  | "specialisation"
  | "nec-included"
  | "curated-related"
  | "venture-direction";

export type CareerMbaBand = "strong" | "relevant" | "worth-exploring";

export type CareerMbaConnection = {
  programId: ProgramId;
  band: CareerMbaBand;
  /** 2–4 capabilities producing the connection. */
  capabilityIds: CareerCapabilityId[];
  /** Verified specialist evidence labels. */
  evidence: string[];
  /** Verified certifications / accreditations directly involved. */
  credentials: string[];
};

export type CareerDirection = {
  id: CareerDirectionId;
  title: string;
  clusterId: CareerClusterId;
  order: number;
  relationshipType: CareerRelationshipType;
  presentation: CareerPresentation;
  primary?: {
    code: string;
    principalTitle: string;
    officialTitle: string;
    officialTitleType: OscaTitleType;
    isNec: boolean;
    majorGroupCode: string;
  };
  /** Reviewed related occupations for exploration only (max 3). */
  related: { code: string; principalTitle: string }[];
  /** Curated (non-OSCA) overview, only for directions without a primary occupation. */
  overview?: string[];
  /** Sorted core → supporting; strengths are never exposed. */
  capabilityIds: CareerCapabilityId[];
  mba: { mode: "ranked" | "explore"; reason?: string; connections: CareerMbaConnection[] };
  bridge: { capabilityId: CareerCapabilityId; programmes: { programId: ProgramId; band: "strong" | "relevant" }[] }[];
  sharedExperiences: { experienceId: ExperienceId; capabilityId: CareerCapabilityId }[];
};
