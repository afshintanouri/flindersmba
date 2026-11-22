import type { Capability } from "./types";
import { PROTOTYPE, SPEC, withNote } from "./provenance";

/**
 * Capability records shared by programmes, careers and the capability bridge.
 *
 * Provenance reflects whether the capability is named in the verified
 * programme specification ("verified") or only carried over from the v0
 * prototype ("draft"). Labels of capabilities displayed in the UI are kept
 * exactly as the approved prototype shows them.
 */
export const capabilities: Capability[] = [
  // Technical / analytical
  { id: "python", label: "Python", group: "technical", provenance: SPEC },
  { id: "neural-networks", label: "Neural networks", group: "technical", provenance: SPEC },
  { id: "data-analytics", label: "Data analytics", group: "technical", provenance: SPEC },
  { id: "artificial-intelligence", label: "Artificial intelligence", group: "technical", provenance: SPEC },
  { id: "power-bi", label: "Power BI", group: "technical", provenance: SPEC },
  { id: "advanced-excel", label: "Advanced Excel", group: "technical", provenance: SPEC },
  { id: "text-mining", label: "Text mining", group: "technical", provenance: SPEC },
  { id: "business-intelligence", label: "Business intelligence", group: "technical", provenance: SPEC },
  {
    id: "data-driven-decisions",
    label: "Data-driven decisions",
    group: "technical",
    description: "Data-driven decision-making.",
    provenance: SPEC,
  },
  {
    id: "evidence-based-decisions",
    label: "Evidence-based decision-making",
    group: "technical",
    provenance: SPEC,
  },

  // AI leadership
  { id: "ai-strategy", label: "AI strategy", group: "ai-leadership", provenance: SPEC },
  {
    id: "ai-governance-ethics",
    label: "AI governance & ethics",
    group: "ai-leadership",
    description: "AI governance, AI ethics and responsible AI.",
    provenance: SPEC,
  },
  {
    id: "leading-with-ai",
    label: "Leading with AI",
    group: "ai-leadership",
    description: "Leading organisations with AI.",
    provenance: SPEC,
  },
  {
    id: "organisational-ai-transformation",
    label: "Organisational AI transformation",
    group: "ai-leadership",
    provenance: SPEC,
  },

  // Finance (prototype only; Finance curriculum not yet supplied)
  { id: "financial-analysis", label: "Financial analysis", group: "finance", provenance: PROTOTYPE },
  { id: "commercial-strategy", label: "Commercial strategy", group: "finance", provenance: PROTOTYPE },
  { id: "risk-assessment", label: "Risk assessment", group: "finance", provenance: PROTOTYPE },

  // Health
  { id: "health-management", label: "Health management", group: "health", provenance: SPEC },
  {
    id: "health-leadership",
    label: "Health leadership",
    group: "health",
    description: "Health service leadership and leadership within healthcare environments.",
    provenance: SPEC,
  },
  {
    id: "health-organisational-management",
    label: "Health organisational management",
    group: "health",
    provenance: SPEC,
  },
  { id: "health-operations", label: "Health operations", group: "health", provenance: SPEC },
  { id: "service-planning", label: "Service planning", group: "health", provenance: PROTOTYPE },

  // People
  {
    id: "human-resource-management",
    label: "Human resource management",
    group: "people",
    provenance: SPEC,
  },
  { id: "people-strategy", label: "People strategy", group: "people", provenance: SPEC },
  {
    id: "hr-technology",
    label: "HR technology",
    group: "people",
    description: "Contemporary HR technology.",
    provenance: SPEC,
  },
  { id: "organisational-capability", label: "Organisational capability", group: "people", provenance: SPEC },
  { id: "people-culture", label: "People and culture", group: "people", provenance: SPEC },
  { id: "workforce-capability", label: "Workforce capability", group: "people", provenance: SPEC },

  // International
  { id: "international-business", label: "International business", group: "international", provenance: SPEC },
  { id: "international-strategy", label: "International strategy", group: "international", provenance: SPEC },
  { id: "international-markets", label: "International markets", group: "international", provenance: SPEC },
  { id: "market-entry", label: "Market entry", group: "international", provenance: PROTOTYPE },
  {
    id: "cross-cultural-leadership",
    label: "Cross-cultural leadership",
    group: "international",
    provenance: withNote(PROTOTYPE, "Specification names 'cross-cultural business'; prototype wording retained."),
  },
  { id: "global-management", label: "Global management", group: "international", provenance: SPEC },

  // Marketing
  { id: "marketing-strategy", label: "Marketing strategy", group: "marketing", provenance: SPEC },
  { id: "customer-strategy", label: "Customer strategy", group: "marketing", provenance: SPEC },
  { id: "customer-experience", label: "Customer experience", group: "marketing", provenance: SPEC },
  { id: "brand-strategy", label: "Brand strategy", group: "marketing", provenance: PROTOTYPE },
  { id: "digital-marketing", label: "Digital marketing", group: "marketing", provenance: SPEC },
  { id: "ai-powered-marketing", label: "AI-powered marketing", group: "marketing", provenance: SPEC },
  { id: "marketing-automation", label: "Marketing automation", group: "marketing", provenance: SPEC },
  { id: "martech", label: "MarTech", group: "marketing", provenance: SPEC },

  // Social impact
  { id: "impact-strategy", label: "Impact strategy", group: "social-impact", provenance: PROTOTYPE },
  {
    id: "leadership-for-social-impact",
    label: "Leadership for social impact",
    group: "social-impact",
    provenance: SPEC,
  },
  { id: "impact-measurement", label: "Impact measurement", group: "social-impact", provenance: SPEC },
  {
    id: "embedding-social-impact",
    label: "Embedding social impact in organisations",
    group: "social-impact",
    provenance: SPEC,
  },
  {
    id: "applied-social-impact",
    label: "Applying social-impact thinking across professional contexts",
    group: "social-impact",
    provenance: SPEC,
  },
  { id: "sustainability", label: "Sustainability", group: "social-impact", provenance: PROTOTYPE },

  // Broad business
  { id: "stakeholder-engagement", label: "Stakeholder engagement", group: "business", provenance: PROTOTYPE },
  { id: "strategic-thinking", label: "Strategic thinking", group: "business", provenance: PROTOTYPE },
  { id: "innovation", label: "Innovation", group: "business", provenance: PROTOTYPE },
  { id: "business-transformation", label: "Business transformation", group: "business", provenance: PROTOTYPE },
  { id: "leadership", label: "Leadership", group: "business", provenance: SPEC },
  { id: "operations", label: "Operations", group: "business", provenance: PROTOTYPE },
  { id: "industry-collaboration", label: "Industry collaboration", group: "business", provenance: PROTOTYPE },
  { id: "problem-solving", label: "Problem solving", group: "business", provenance: PROTOTYPE },
  { id: "business-analysis", label: "Business analysis", group: "business", provenance: PROTOTYPE },
  { id: "transformation", label: "Transformation", group: "business", provenance: PROTOTYPE },
  { id: "communication", label: "Communication", group: "business", provenance: PROTOTYPE },
  {
    id: "australian-workplace-understanding",
    label: "Understanding the Australian working environment",
    group: "business",
    provenance: SPEC,
  },
];
