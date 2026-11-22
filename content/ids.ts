/**
 * Stable semantic identifiers.
 *
 * These are the ONLY identities used by the application, routes, saved
 * journeys and share links. Never use array positions as identity.
 * Adding an ID here makes it available to the typed content records;
 * removing one is a breaking change for saved journeys and share links.
 */

export const PROGRAM_IDS = [
  "mba-ai",
  "mba-business-analytics",
  "mba-finance",
  "mba-health-management",
  "mba-hrm",
  "mba-international-business",
  "mba-marketing",
  "mba-social-impact",
  "mba-future-business",
  "mba-industry-focused",
] as const;
export type ProgramId = (typeof PROGRAM_IDS)[number];

export const AMBITION_IDS = [
  "lead-people-organisations",
  "lead-ai-emerging-technology",
  "data-driven-decisions",
  "brands-customer-experience",
  "financial-capability",
  "lead-health-care",
  "international-business-career",
  "social-impact",
  "innovation-ventures",
  "transform-organisations",
  "industry-connected-career",
] as const;
export type AmbitionId = (typeof AMBITION_IDS)[number];

export const INTEREST_IDS = [
  "artificial-intelligence",
  "data-analytics",
  "python-coding",
  "ai-strategy",
  "responsible-ai",
  "marketing",
  "martech-automation",
  "customer-experience",
  "finance",
  "people-culture",
  "health-management",
  "international-business",
  "social-impact",
  "sustainability",
  "innovation",
  "entrepreneurship",
  "digital-transformation",
] as const;
export type InterestId = (typeof INTEREST_IDS)[number];

export const EXPERIENCE_IDS = [
  "industry-placement",
  "industry-challenges",
  "factory-of-the-future",
  "virtual-business-simulation",
  "ai-in-action",
  "technical-skills",
  "professional-credentials",
  "alumni-mentorship",
  "gamified-learning",
] as const;
export type ExperienceId = (typeof EXPERIENCE_IDS)[number];

export const CAPABILITY_IDS = [
  // Technical / analytical
  "python",
  "neural-networks",
  "data-analytics",
  "artificial-intelligence",
  "power-bi",
  "advanced-excel",
  "text-mining",
  "business-intelligence",
  "data-driven-decisions",
  "evidence-based-decisions",
  // AI leadership
  "ai-strategy",
  "ai-governance-ethics",
  "leading-with-ai",
  "organisational-ai-transformation",
  // Finance
  "financial-analysis",
  "commercial-strategy",
  "risk-assessment",
  // Health
  "health-management",
  "health-leadership",
  "health-organisational-management",
  "health-operations",
  "service-planning",
  // People
  "human-resource-management",
  "people-strategy",
  "hr-technology",
  "organisational-capability",
  "people-culture",
  "workforce-capability",
  // International
  "international-business",
  "international-strategy",
  "international-markets",
  "market-entry",
  "cross-cultural-leadership",
  "global-management",
  // Marketing
  "marketing-strategy",
  "customer-strategy",
  "customer-experience",
  "brand-strategy",
  "digital-marketing",
  "ai-powered-marketing",
  "marketing-automation",
  "martech",
  // Social impact
  "impact-strategy",
  "leadership-for-social-impact",
  "impact-measurement",
  "embedding-social-impact",
  "applied-social-impact",
  "sustainability",
  // Broad business
  "stakeholder-engagement",
  "strategic-thinking",
  "innovation",
  "business-transformation",
  "leadership",
  "operations",
  "industry-collaboration",
  "problem-solving",
  "business-analysis",
  "transformation",
  "communication",
  "australian-workplace-understanding",
] as const;
export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export const CERTIFICATION_IDS = [
  "fortinet-cybersecurity",
  "google-web-analytics",
  "google-ai-powered-advertising",
  "workday",
] as const;
export type CertificationId = (typeof CERTIFICATION_IDS)[number];

export const PROFESSIONAL_ACCREDITATION_IDS = ["ami", "ahri"] as const;
export type ProfessionalAccreditationId = (typeof PROFESSIONAL_ACCREDITATION_IDS)[number];

export const INDUSTRY_CONNECTION_IDS = ["achsm", "centre-for-social-impact"] as const;
export type IndustryConnectionId = (typeof INDUSTRY_CONNECTION_IDS)[number];

export const PROOF_IDS = [
  "aacsb",
  "ceo-magazine-tier-one",
  "mba-ai-first-only-australia",
  "industry-connected",
] as const;
export type ProofId = (typeof PROOF_IDS)[number];

export const CAREER_CLUSTER_IDS = [
  "ai-digital-transformation",
  "analytics-business-intelligence",
  "strategy-consulting",
  "management-leadership",
  "marketing-customer",
  "finance-commercial",
  "health-management",
  "people-hr",
  "international-business",
  "social-impact-sustainability",
  "innovation-entrepreneurship",
  "operations-industry",
] as const;
export type CareerClusterId = (typeof CAREER_CLUSTER_IDS)[number];

/** The 48 approved Career Directions (catalogue order). */
export const CAREER_DIRECTION_IDS = [
  "ai-strategy-lead",
  "digital-transformation-manager",
  "responsible-ai-specialist",
  "ai-ml-engineer",
  "data-analyst",
  "data-scientist",
  "business-analyst",
  "business-intelligence",
  "management-consultant",
  "business-consultant",
  "strategy-manager",
  "business-transformation-consultant",
  "general-manager",
  "business-development-manager",
  "program-manager",
  "operations-manager",
  "marketing-specialist",
  "brand-manager",
  "digital-marketing-manager",
  "customer-experience-manager",
  "finance-manager",
  "financial-analyst",
  "commercial-manager",
  "investment-analyst",
  "health-services-manager",
  "health-program-manager",
  "healthcare-operations-manager",
  "health-service-improvement",
  "human-resources-manager",
  "people-culture-manager",
  "organisational-development-manager",
  "workforce-capability-manager",
  "international-business-development",
  "export-market-development",
  "global-operations-manager",
  "international-marketing-manager",
  "social-impact-manager",
  "environment-sustainability-manager",
  "policy-planning-manager",
  "public-sector-program-manager",
  "entrepreneur-founder",
  "innovation-manager",
  "new-venture-manager",
  "commercialisation-manager",
  "business-improvement-manager",
  "project-manager",
  "supply-chain-operations-manager",
  "manufacturing-operations-manager",
] as const;
export type CareerDirectionId = (typeof CAREER_DIRECTION_IDS)[number];

/** The approved 18-capability career taxonomy (distinct from programme capability IDs). */
export const CAREER_CAPABILITY_IDS = [
  "strategic-leadership",
  "people-leadership",
  "strategic-thinking",
  "organisational-transformation",
  "innovation",
  "business-analysis",
  "data-analysis",
  "data-driven-decisions",
  "ai-digital-capability",
  "business-intelligence",
  "financial-decision-making",
  "customer-market-strategy",
  "commercial-thinking",
  "stakeholder-engagement",
  "communication-influence",
  "workforce-capability",
  "impact-responsible-leadership",
  "systems-operational-thinking",
] as const;
export type CareerCapabilityId = (typeof CAREER_CAPABILITY_IDS)[number];

/** Keys resolved to icon components by components/icons.ts. */
export const ICON_KEYS = [
  "award",
  "badge-check",
  "brain",
  "briefcase",
  "building",
  "chart",
  "code",
  "compass",
  "factory",
  "gamepad",
  "globe",
  "handshake",
  "heart-pulse",
  "landmark",
  "layers",
  "leaf",
  "lightbulb",
  "megaphone",
  "messages",
  "refresh",
  "settings",
  "target",
  "trophy",
  "users",
  "wallet",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

/** Background photographs available in public/ (as .webp). */
export const PHOTO_KEYS = ["campus", "city", "industry"] as const;
export type PhotoKey = (typeof PHOTO_KEYS)[number];
