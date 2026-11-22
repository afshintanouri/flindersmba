import type { AmbitionId, ExperienceId, InterestId, MatchClassification, ProgramId } from "@/content/types";

export type Persona = {
  name: string;
  ambitions: AmbitionId[];
  interests: InterestId[];
  experiences: ExperienceId[];
  /** Expected first programme (undefined when no single programme is expected). */
  top?: ProgramId;
  classification: MatchClassification | MatchClassification[];
  /** Programmes that must appear among the alternatives (in any order). */
  alternativesInclude?: ProgramId[];
  /** Programmes that must not rank above `top`. */
  mustNotBeat?: ProgramId[];
  /** Explanation IDs expected on the first recommendation. */
  reasons?: string[];
  /** Programmes expected to be the close pair (order free). */
  closePair?: [ProgramId, ProgramId];
};

export const personas: Persona[] = [
  {
    name: "1 Technical AI leader",
    ambitions: ["lead-ai-emerging-technology", "transform-organisations"],
    interests: ["artificial-intelligence", "python-coding", "ai-strategy", "responsible-ai"],
    experiences: ["ai-in-action", "technical-skills"],
    top: "mba-ai",
    classification: "clear",
    alternativesInclude: ["mba-future-business", "mba-business-analytics"],
    reasons: ["ai-lead-with-ai", "ai-technical", "ai-transformation"],
  },
  {
    name: "2 Data-driven analyst",
    ambitions: ["data-driven-decisions"],
    interests: ["data-analytics", "python-coding"],
    experiences: ["technical-skills", "professional-credentials"],
    top: "mba-business-analytics",
    classification: "clear",
    alternativesInclude: ["mba-ai"],
    reasons: ["ba-data-decisions", "ba-analytical-tools", "ba-credentials"],
  },
  {
    name: "3 AI-powered marketer",
    ambitions: ["brands-customer-experience", "transform-organisations"],
    interests: ["marketing", "martech-automation", "customer-experience", "artificial-intelligence"],
    experiences: ["professional-credentials"],
    top: "mba-marketing",
    classification: "clear",
    mustNotBeat: ["mba-ai"],
    reasons: ["mkt-ai-marketing", "mkt-customers-brands", "mkt-credentials"],
  },
  {
    name: "4 Finance-focused",
    ambitions: ["financial-capability"],
    interests: ["finance"],
    experiences: [],
    top: "mba-finance",
    classification: "clear",
    reasons: ["fin-capability"],
  },
  {
    name: "5 Health manager",
    ambitions: ["lead-health-care", "lead-people-organisations"],
    interests: ["health-management", "people-culture"],
    experiences: [],
    top: "mba-health-management",
    classification: "clear",
    alternativesInclude: ["mba-hrm"],
    reasons: ["hm-lead-health", "hm-industry-intensives"],
  },
  {
    name: "6 People and culture leader",
    ambitions: ["lead-people-organisations", "transform-organisations"],
    interests: ["people-culture"],
    experiences: ["professional-credentials"],
    top: "mba-hrm",
    classification: "clear",
    reasons: ["hrm-people", "hrm-professional"],
  },
  {
    name: "7 International business",
    ambitions: ["international-business-career"],
    interests: ["international-business"],
    experiences: [],
    top: "mba-international-business",
    classification: "clear",
    reasons: ["ib-international"],
  },
  {
    name: "8 Social-impact / public-sector leader",
    ambitions: ["social-impact", "lead-people-organisations"],
    interests: ["social-impact", "sustainability"],
    experiences: [],
    top: "mba-social-impact",
    classification: "clear",
    alternativesInclude: ["mba-future-business"],
    reasons: ["si-impact", "si-public-purpose"],
  },
  {
    name: "9 Broad generalist",
    ambitions: ["lead-people-organisations", "transform-organisations", "innovation-ventures"],
    interests: ["innovation", "entrepreneurship"],
    experiences: [],
    top: "mba-future-business",
    classification: "clear",
    reasons: ["fb-broad-leadership", "fb-innovation"],
  },
  {
    name: "10 Industry-exposure seeker",
    ambitions: ["industry-connected-career"],
    interests: [],
    experiences: ["industry-placement", "industry-challenges"],
    top: "mba-industry-focused",
    classification: "clear",
    reasons: ["ind-industry-exposure", "ind-double-placement", "ind-working-in-australia"],
  },
  {
    name: "11 Ambiguous AI / analytics",
    ambitions: ["lead-ai-emerging-technology", "data-driven-decisions"],
    interests: ["artificial-intelligence", "python-coding", "data-analytics"],
    experiences: ["technical-skills"],
    classification: ["close", "clear"],
    closePair: ["mba-ai", "mba-business-analytics"],
  },
  {
    name: "12 No specialist evidence",
    ambitions: [],
    interests: [],
    experiences: ["industry-placement", "alumni-mentorship", "gamified-learning"],
    classification: "none",
  },
];
