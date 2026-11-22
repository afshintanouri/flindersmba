import type { Program } from "./types";
import { PLACEHOLDER, PROTOTYPE, SPEC, withNote } from "./provenance";

const COURSES = "https://www.flinders.edu.au/study/courses/";

/** Course URL carried over from the prototype; not yet re-confirmed as current. */
const prototypeUrl = (slug: string) => ({
  value: COURSES + slug,
  provenance: withNote(PROTOTYPE, "Course URL from the prototype; not yet confirmed as current."),
});

/** The general Flinders MBA page used when a programme has no known course URL. */
export const PORTFOLIO_URL = {
  value: "https://www.flinders.edu.au/study/business/master-business-administration",
  provenance: withNote(PROTOTYPE, "Fallback MBA page from the prototype; not yet confirmed as current."),
};

/**
 * The ten Flinders MBA specialisations.
 *
 * `positioning` is the verified positioning statement and the single source of
 * the visible programme description. `headline` is prototype copy (draft),
 * still shown on the result screen until approved headlines are supplied.
 *
 * Array order is the prototype's display and tie-break order. Identity is `id`.
 */
export const programs: Program[] = [
  {
    id: "mba-ai",
    name: "MBA Artificial Intelligence",
    shortName: "Artificial Intelligence",
    profile: "specialist",
    positioning: {
      value: "Understand AI technically and lead its responsible use across organisations.",
      provenance: SPEC,
    },
    headline: { value: "You’re ready to lead with AI.", provenance: PROTOTYPE },
    accent: "#ac9aef",
    icon: "brain",
    capabilities: {
      featured: [
        "python",
        "neural-networks",
        "data-analytics",
        "ai-strategy",
        "ai-governance-ethics",
        "leading-with-ai",
      ],
      additional: ["artificial-intelligence", "organisational-ai-transformation"],
    },
    differentiators: [
      {
        id: "technical-and-strategic",
        kind: "capability-focus",
        label: "Technical and strategic AI",
        description:
          "Combines technical AI and data capability (Python, neural networks, data analytics) with AI strategy, governance, ethics and organisational AI transformation. Not simply an AI course for managers.",
        provenance: SPEC,
      },
    ],
    promoProofId: "mba-ai-first-only-australia",
    courseUrl: prototypeUrl("master-business-administration-artificial-intelligence"),
    legacyIndex: 0,
    provenance: SPEC,
  },
  {
    id: "mba-business-analytics",
    name: "MBA Business Analytics",
    shortName: "Business Analytics",
    profile: "specialist",
    positioning: {
      value: "Turn data, analytical tools and insights into better business decisions.",
      provenance: SPEC,
    },
    headline: { value: "You see the story in the data.", provenance: PROTOTYPE },
    accent: "#77c7ee",
    icon: "chart",
    capabilities: {
      featured: ["python", "data-analytics", "business-intelligence", "data-driven-decisions"],
      additional: ["power-bi", "advanced-excel", "text-mining", "evidence-based-decisions"],
    },
    differentiators: [
      {
        id: "analytics-tools",
        kind: "capability-focus",
        label: "Analytical tools",
        description: "Power BI, Advanced Excel and text mining.",
        provenance: SPEC,
      },
      {
        id: "analytics-vs-ai",
        kind: "capability-focus",
        label: "Analytics and decision-making focus",
        description:
          "More focused on analytics, analytical tools, business intelligence, interpreting data and decision-making than the MBA Artificial Intelligence.",
        provenance: SPEC,
      },
    ],
    courseUrl: prototypeUrl("master-business-administration-business-analytics"),
    legacyIndex: 1,
    provenance: SPEC,
  },
  {
    id: "mba-finance",
    name: "MBA Finance",
    shortName: "Finance",
    profile: "specialist",
    positioning: {
      value: "Build the financial capability to make stronger business and investment decisions.",
      provenance: SPEC,
    },
    headline: { value: "You think in financial futures.", provenance: PROTOTYPE },
    accent: "#88cfb0",
    icon: "wallet",
    capabilities: {
      // Prototype capabilities; Finance curriculum detail not yet supplied.
      featured: ["financial-analysis", "commercial-strategy", "risk-assessment"],
      additional: [],
    },
    differentiators: [],
    courseUrl: {
      value: COURSES + "master-business-administration-finance",
      provenance: SPEC,
    },
    legacyIndex: 2,
    provenance: withNote(SPEC, "Programme record and positioning verified; specialist capabilities are prototype drafts."),
  },
  {
    id: "mba-health-management",
    name: "MBA Health Management",
    shortName: "Health Management",
    profile: "specialist",
    positioning: { value: "Lead the business and management of health.", provenance: SPEC },
    headline: { value: "You’re ready to lead in care.", provenance: PROTOTYPE },
    accent: "#81cabb",
    icon: "heart-pulse",
    capabilities: {
      featured: ["health-leadership", "service-planning", "stakeholder-engagement"],
      additional: ["health-management", "health-organisational-management", "health-operations"],
    },
    differentiators: [
      {
        id: "health-industry-intensives",
        kind: "connection",
        label: "Industry-led intensive topics",
        description:
          "Specialised intensive topics delivered with experienced industry professionals, including affiliates and fellows of ACHSM.",
        provenance: SPEC,
      },
      {
        id: "management-not-clinical",
        kind: "capability-focus",
        label: "Managing health organisations",
        description:
          "For people building careers managing health organisations and services and the business side of healthcare, not training as medical practitioners.",
        provenance: SPEC,
      },
    ],
    courseUrl: prototypeUrl("postgraduate-business-administration-health-management"),
    legacyIndex: 3,
    provenance: SPEC,
  },
  {
    id: "mba-hrm",
    name: "MBA Human Resource Management",
    shortName: "Human Resource Management",
    profile: "specialist",
    positioning: { value: "Build people, workforce and organisational capability.", provenance: SPEC },
    headline: { value: "You put people at the centre.", provenance: PROTOTYPE },
    accent: "#e9b184",
    icon: "users",
    capabilities: {
      featured: ["people-strategy", "hr-technology", "organisational-capability"],
      additional: ["human-resource-management", "people-culture", "workforce-capability"],
    },
    differentiators: [
      {
        id: "workday-integrated",
        kind: "credential",
        label: "Workday certification integrated into the MBA",
        provenance: SPEC,
      },
      { id: "ahri-accredited", kind: "credential", label: "AHRI accreditation", provenance: SPEC },
    ],
    courseUrl: prototypeUrl("postgraduate-business-administration-human-resource-management"),
    legacyIndex: 4,
    provenance: SPEC,
  },
  {
    id: "mba-international-business",
    name: "MBA International Business",
    shortName: "International Business",
    profile: "specialist",
    positioning: {
      value:
        "Build the capability to work across international markets, organisations and business environments.",
      provenance: SPEC,
    },
    headline: { value: "You see opportunity across borders.", provenance: PROTOTYPE },
    accent: "#9abced",
    icon: "globe",
    capabilities: {
      featured: ["international-strategy", "market-entry", "cross-cultural-leadership"],
      additional: ["international-business", "international-markets", "global-management"],
    },
    differentiators: [],
    courseUrl: prototypeUrl("postgraduate-business-administration-international-business"),
    legacyIndex: 5,
    provenance: SPEC,
  },
  {
    id: "mba-marketing",
    name: "MBA Marketing",
    shortName: "Marketing",
    profile: "specialist",
    positioning: {
      value: "Lead customers, brands and marketing in an AI-powered world.",
      provenance: SPEC,
    },
    headline: { value: "You’re ready to shape brands.", provenance: PROTOTYPE },
    accent: "#eda5ad",
    icon: "megaphone",
    capabilities: {
      featured: ["customer-experience", "brand-strategy", "marketing-automation", "martech"],
      additional: ["marketing-strategy", "customer-strategy", "digital-marketing", "ai-powered-marketing"],
    },
    differentiators: [
      {
        id: "additional-gamified-topic",
        kind: "experience",
        label: "Additional gamified topic",
        description: "An additional gamified topic beyond the portfolio-wide gamified learning.",
        provenance: SPEC,
      },
      {
        id: "two-industry-projects",
        kind: "experience",
        label: "Two industry-project topics",
        provenance: SPEC,
      },
      {
        id: "ai-marketing-transformation",
        kind: "capability-focus",
        label: "AI-powered marketing",
        description:
          "MarTech, marketing automation, AI-powered marketing and how AI-powered marketing can transform organisations.",
        provenance: SPEC,
      },
    ],
    courseUrl: prototypeUrl("postgraduate-business-administration-marketing"),
    legacyIndex: 6,
    provenance: SPEC,
  },
  {
    id: "mba-social-impact",
    name: "MBA Social Impact",
    shortName: "Social Impact",
    profile: "combined",
    positioning: {
      value: "Lead organisations with social impact at the centre of decision-making.",
      provenance: SPEC,
    },
    headline: { value: "You want business to make a difference.", provenance: PROTOTYPE },
    accent: "#a7d39c",
    icon: "leaf",
    capabilities: {
      featured: ["impact-strategy", "sustainability", "stakeholder-engagement"],
      additional: [
        "leadership-for-social-impact",
        "impact-measurement",
        "embedding-social-impact",
        "applied-social-impact",
      ],
    },
    differentiators: [
      {
        id: "public-sector-informed-teaching",
        kind: "connection",
        label: "Public-sector and social-impact informed teaching",
        description:
          "Taught by academics with substantial public-sector and social-impact experience and connections with the Centre for Social Impact.",
        provenance: SPEC,
      },
    ],
    structure: {
      value: "Combines the MBA Future Business component with specialist Social Impact study.",
      provenance: SPEC,
    },
    courseUrl: {
      value: undefined,
      provenance: withNote(PLACEHOLDER, "No course URL known. The general MBA page is linked instead."),
    },
    legacyIndex: 7,
    provenance: SPEC,
  },
  {
    id: "mba-future-business",
    name: "MBA Future Business",
    shortName: "Future Business",
    profile: "generalist",
    positioning: {
      value: "Build broad contemporary business and leadership capability through a fast-track general MBA.",
      provenance: SPEC,
    },
    headline: { value: "You’re ready to build what’s next.", provenance: PROTOTYPE },
    accent: "#a9ade6",
    icon: "lightbulb",
    capabilities: {
      featured: ["strategic-thinking", "innovation", "business-transformation"],
      additional: ["leadership"],
    },
    differentiators: [
      {
        id: "general-mba",
        kind: "structure",
        label: "General MBA",
        description: "The broad, generalist MBA option.",
        provenance: SPEC,
      },
    ],
    structure: {
      value: "Fast-track general MBA; one-year programme. Not emphasised in the roadshow Matchmaker.",
      provenance: SPEC,
    },
    courseUrl: prototypeUrl("master-business-administration-future-business"),
    legacyIndex: 8,
    provenance: SPEC,
  },
  {
    id: "mba-industry-focused",
    name: "MBA Industry-focused",
    shortName: "Industry-focused",
    profile: "industry",
    positioning: {
      value:
        "Build broad business capability with deeper exposure to industry and the Australian working environment.",
      provenance: SPEC,
    },
    headline: { value: "You learn by stepping into industry.", provenance: PROTOTYPE },
    accent: "#9eb6cc",
    icon: "layers",
    capabilities: {
      featured: ["operations", "industry-collaboration", "problem-solving"],
      additional: ["australian-workplace-understanding"],
    },
    differentiators: [
      {
        id: "double-placement",
        kind: "experience",
        label: "Double placement exposure",
        description:
          "Up to approximately 300 hours of placement, compared with up to 150 hours across the other MBA pathways.",
        provenance: SPEC,
      },
      {
        id: "working-in-australia",
        kind: "experience",
        label: "Working in Australia",
        description:
          "Specialist topic building understanding of Australian workplaces, professional experience, industry connection and workplace networks.",
        provenance: SPEC,
      },
    ],
    courseUrl: prototypeUrl("postgraduate-business-administration-industry-focused"),
    legacyIndex: 9,
    provenance: withNote(SPEC, "Frame around Australian workplace exposure and industry connection, not migration or residency."),
  },
];
