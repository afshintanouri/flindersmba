import { PROGRAM_IDS } from "../ids";
import { certifications, professionalAccreditations } from "../credentials";
import type { MatchWeight, MatchmakerRules, ProgramId, ProgramWeights } from "../types";

/**
 * PRODUCTION MATCHMAKER RULES
 *
 * Every number used by the Matchmaker lives here; the engine (lib/matchmaker.ts)
 * is a pure function of these rules and the visitor's selections.
 *
 * Scale: 3 defining/direct, 2 strong, 1 some meaningful relevance, 0 none.
 * Each weight row is completed with explicit zeros for every programme.
 *
 * Shared portfolio experiences (industry placement, virtual business
 * simulation, alumni mentorship, Factory of the Future, gamified learning)
 * have NO weights: they personalise the result but never rank programmes.
 */

const w = (partial: Partial<Record<ProgramId, MatchWeight>>): ProgramWeights =>
  Object.fromEntries(PROGRAM_IDS.map((id) => [id, partial[id] ?? 0])) as ProgramWeights;

/** Programmes with confirmed certifications or professional accreditations. */
const credentialProgrammes = new Set<ProgramId>([
  ...certifications.flatMap((c) => c.programIds),
  ...professionalAccreditations.flatMap((a) => a.programIds),
]);

const AI_INTERESTS = ["interest:artificial-intelligence", "interest:ai-strategy", "interest:responsible-ai"] as const;

export const matchmakerRules: MatchmakerRules = {
  version: "1.0.0",
  status: "draft",
  description:
    "Transparent rules-based Matchmaker: ambitions 40%, specialist interests 45%, differentiating preferences 15%. Each dimension is the average weight of the visitor's selections in it (0–1) before weighting. Weights reviewed against the verified programme specification; status remains draft until signed off.",
  dimensionWeights: { ambitions: 40, interests: 45, preferences: 15 },
  limits: { ambitions: 3, interests: 4 },

  /* ---------------- A. Career ambitions (40%) ---------------- */
  ambitions: [
    {
      signal: "ambition:lead-people-organisations",
      weights: w({
        "mba-hrm": 3,
        "mba-future-business": 3,
        "mba-health-management": 1,
        "mba-international-business": 1,
        "mba-industry-focused": 1,
        "mba-social-impact": 1,
        "mba-marketing": 1,
      }),
      conditional: [
        {
          programId: "mba-health-management",
          weight: 3,
          when: { anyOf: ["interest:health-management", "ambition:lead-health-care"] },
          note: "Leading people within health is a defining Health Management signal.",
        },
      ],
    },
    {
      signal: "ambition:lead-ai-emerging-technology",
      weights: w({ "mba-ai": 3, "mba-business-analytics": 2, "mba-future-business": 2, "mba-marketing": 1 }),
      conditional: [
        {
          programId: "mba-marketing",
          weight: 2,
          when: { anyOf: ["interest:marketing", "interest:martech-automation"] },
          note: "AI leadership applied to marketing.",
        },
      ],
    },
    {
      signal: "ambition:data-driven-decisions",
      weights: w({
        "mba-business-analytics": 3,
        "mba-ai": 2,
        "mba-finance": 1,
        "mba-marketing": 1,
        "mba-future-business": 1,
      }),
    },
    {
      signal: "ambition:brands-customer-experience",
      weights: w({
        "mba-marketing": 3,
        "mba-international-business": 1,
        "mba-business-analytics": 1,
        "mba-future-business": 1,
      }),
    },
    {
      signal: "ambition:financial-capability",
      weights: w({ "mba-finance": 3, "mba-business-analytics": 1, "mba-future-business": 1 }),
    },
    {
      signal: "ambition:lead-health-care",
      weights: w({ "mba-health-management": 3, "mba-hrm": 1, "mba-social-impact": 1 }),
    },
    {
      signal: "ambition:international-business-career",
      weights: w({
        "mba-international-business": 3,
        "mba-marketing": 1,
        "mba-finance": 1,
        "mba-future-business": 1,
      }),
    },
    {
      signal: "ambition:social-impact",
      weights: w({ "mba-social-impact": 3, "mba-future-business": 1, "mba-health-management": 1, "mba-hrm": 1 }),
    },
    {
      signal: "ambition:innovation-ventures",
      weights: w({
        "mba-future-business": 3,
        "mba-ai": 1,
        "mba-marketing": 1,
        "mba-social-impact": 1,
        "mba-international-business": 1,
      }),
    },
    {
      signal: "ambition:transform-organisations",
      weights: w({
        "mba-future-business": 3,
        "mba-ai": 1,
        "mba-hrm": 1,
        "mba-business-analytics": 1,
        "mba-health-management": 1,
        "mba-social-impact": 1,
        "mba-marketing": 1,
      }),
      conditional: [
        {
          programId: "mba-ai",
          weight: 3,
          when: { anyOf: [...AI_INTERESTS], min: 2 },
          note: "Transformation is defining for MBA AI when AI interests are strong (two or more AI interests).",
        },
      ],
    },
    {
      signal: "ambition:industry-connected-career",
      // Valued by every programme (practical learning), so on its own it does not differentiate.
      weights: w(Object.fromEntries(PROGRAM_IDS.map((id) => [id, 1]))),
      conditional: [
        {
          programId: "mba-industry-focused",
          weight: 3,
          when: { anyOf: ["compound:deeper-industry-exposure"] },
          note: "Defining for Industry-focused only with the deeper-industry-exposure compound signal.",
        },
      ],
    },
  ],

  /* ---------------- B. Specialist interests (45%) ---------------- */
  interests: [
    {
      signal: "interest:artificial-intelligence",
      weights: w({ "mba-ai": 3, "mba-business-analytics": 2, "mba-marketing": 1, "mba-future-business": 1 }),
    },
    {
      signal: "interest:python-coding",
      weights: w({ "mba-ai": 3, "mba-business-analytics": 3 }),
      note: "Equal for AI and Business Analytics; accompanying interests decide between them.",
    },
    {
      signal: "interest:data-analytics",
      weights: w({
        "mba-business-analytics": 3,
        "mba-ai": 3,
        "mba-finance": 1,
        "mba-marketing": 1,
        "mba-future-business": 1,
      }),
    },
    {
      signal: "interest:ai-strategy",
      weights: w({ "mba-ai": 3, "mba-future-business": 2, "mba-marketing": 1 }),
    },
    {
      signal: "interest:responsible-ai",
      weights: w({ "mba-ai": 3, "mba-social-impact": 1, "mba-future-business": 1 }),
    },
    {
      signal: "interest:marketing",
      weights: w({ "mba-marketing": 3, "mba-international-business": 1, "mba-future-business": 1 }),
    },
    {
      signal: "interest:martech-automation",
      weights: w({ "mba-marketing": 3, "mba-ai": 1, "mba-business-analytics": 1, "mba-future-business": 1 }),
    },
    {
      signal: "interest:customer-experience",
      weights: w({
        "mba-marketing": 3,
        "mba-health-management": 1,
        "mba-international-business": 1,
        "mba-social-impact": 1,
      }),
    },
    {
      signal: "interest:finance",
      weights: w({
        "mba-finance": 3,
        "mba-business-analytics": 1,
        "mba-future-business": 1,
        "mba-international-business": 1,
      }),
    },
    {
      signal: "interest:people-culture",
      weights: w({ "mba-hrm": 3, "mba-health-management": 1, "mba-future-business": 1, "mba-social-impact": 1 }),
    },
    {
      signal: "interest:health-management",
      weights: w({ "mba-health-management": 3, "mba-hrm": 1, "mba-social-impact": 1 }),
    },
    {
      signal: "interest:international-business",
      weights: w({
        "mba-international-business": 3,
        "mba-marketing": 1,
        "mba-finance": 1,
        "mba-future-business": 1,
      }),
    },
    {
      signal: "interest:social-impact",
      weights: w({ "mba-social-impact": 3, "mba-future-business": 1, "mba-health-management": 1, "mba-hrm": 1 }),
    },
    {
      signal: "interest:sustainability",
      weights: w({ "mba-social-impact": 3, "mba-future-business": 1, "mba-international-business": 1 }),
    },
    {
      signal: "interest:innovation",
      weights: w({ "mba-future-business": 3, "mba-ai": 1, "mba-marketing": 1, "mba-social-impact": 1 }),
    },
    {
      signal: "interest:entrepreneurship",
      weights: w({
        "mba-future-business": 3,
        "mba-marketing": 1,
        "mba-finance": 1,
        "mba-international-business": 1,
        "mba-social-impact": 1,
      }),
    },
    {
      signal: "interest:digital-transformation",
      weights: w({
        "mba-future-business": 2,
        "mba-ai": 1,
        "mba-business-analytics": 1,
        "mba-marketing": 1,
        "mba-industry-focused": 1,
      }),
      conditional: [
        {
          programId: "mba-ai",
          weight: 3,
          when: { anyOf: ["interest:artificial-intelligence"] },
          note: "Digital transformation is defining for MBA AI when AI is also selected.",
        },
      ],
    },
  ],

  /* ---------------- C. Differentiating preferences (15%) ---------------- */
  preferences: [
    {
      signal: "experience:ai-in-action",
      weights: w({ "mba-ai": 3, "mba-business-analytics": 1, "mba-marketing": 1, "mba-future-business": 1 }),
    },
    {
      signal: "experience:technical-skills",
      weights: w({ "mba-ai": 3, "mba-business-analytics": 3, "mba-finance": 1, "mba-marketing": 1 }),
    },
    {
      signal: "experience:professional-credentials",
      // Derived from the verified credential and accreditation records.
      weights: w(Object.fromEntries([...credentialProgrammes].map((id) => [id, 2]))),
      note: "Only programmes with confirmed credentials or professional accreditations.",
    },
    {
      signal: "experience:industry-challenges",
      weights: w({ "mba-industry-focused": 1 }),
      note: "Unconfirmed experience: weak applied-learning preference only, never verified evidence.",
    },
  ],

  compounds: [
    {
      id: "deeper-industry-exposure",
      dimension: "preferences",
      description:
        "Deeper industry exposure = the ambition 'Build an industry-connected career' AND the experience 'Step into industry' (industry placement) AND at least one further applied preference: 'Solve real business problems' or 'Experience the Factory of the Future'. Industry placement alone never triggers it.",
      requires: [
        { anyOf: ["ambition:industry-connected-career"] },
        { anyOf: ["experience:industry-placement"] },
        { anyOf: ["experience:industry-challenges", "experience:factory-of-the-future"] },
      ],
      weights: w({ "mba-industry-focused": 3 }),
    },
  ],

  thresholds: {
    primaryMinScore: 55,
    closeMargin: 5,
    alternativeMinScore: 25,
    evidenceMinWeight: 2,
    tieBreakMargin: 2,
    maxAlternatives: 2,
  },

  /* ---------------- Tie-breaks (never array order) ---------------- */
  tieBreaks: [
    {
      id: "ai-vs-analytics",
      programs: ["mba-ai", "mba-business-analytics"],
      favour: {
        "mba-ai": [
          "ambition:lead-ai-emerging-technology",
          "interest:ai-strategy",
          "interest:responsible-ai",
          "interest:artificial-intelligence",
          "experience:ai-in-action",
          "ambition:transform-organisations",
        ],
        "mba-business-analytics": ["ambition:data-driven-decisions"],
      },
      note: "AI for AI strategy, governance and AI-led transformation; Analytics for data-driven decisions. Python and data analytics alone do not decide.",
    },
    {
      id: "ai-vs-marketing",
      programs: ["mba-ai", "mba-marketing"],
      favour: {
        "mba-ai": ["interest:ai-strategy", "interest:responsible-ai", "interest:python-coding", "experience:ai-in-action", "experience:technical-skills"],
        "mba-marketing": [
          "interest:marketing",
          "interest:martech-automation",
          "interest:customer-experience",
          "ambition:brands-customer-experience",
        ],
      },
      note: "Marketing when AI is applied to customers, brands, MarTech and automation.",
    },
    {
      id: "marketing-vs-analytics",
      programs: ["mba-marketing", "mba-business-analytics"],
      favour: {
        "mba-marketing": [
          "interest:marketing",
          "interest:martech-automation",
          "interest:customer-experience",
          "ambition:brands-customer-experience",
        ],
        "mba-business-analytics": ["ambition:data-driven-decisions", "interest:data-analytics", "interest:python-coding"],
      },
      note: "Marketing when data serves markets and customers; Analytics for broader decision-making.",
    },
    {
      id: "future-business-vs-industry",
      programs: ["mba-future-business", "mba-industry-focused"],
      favour: {
        "mba-industry-focused": ["compound:deeper-industry-exposure"],
        "mba-future-business": [
          "ambition:lead-people-organisations",
          "ambition:transform-organisations",
          "ambition:innovation-ventures",
          "interest:innovation",
          "interest:entrepreneurship",
        ],
      },
      note: "Industry-focused only when deeper workplace exposure is clearly prioritised.",
    },
    {
      id: "future-business-vs-international",
      programs: ["mba-future-business", "mba-international-business"],
      favour: {
        "mba-international-business": ["ambition:international-business-career", "interest:international-business"],
      },
      note: "International Business when international markets are explicit; otherwise Future Business leads through its broad leadership weights.",
    },
    {
      id: "future-business-vs-social-impact",
      programs: ["mba-future-business", "mba-social-impact"],
      favour: {
        "mba-social-impact": ["ambition:social-impact", "interest:social-impact", "interest:sustainability", "interest:responsible-ai"],
      },
      note: "Social Impact when purpose, sustainability or impact is explicit; otherwise Future Business leads through its broad leadership weights.",
    },
    {
      id: "hrm-vs-health",
      programs: ["mba-hrm", "mba-health-management"],
      favour: {
        "mba-health-management": ["ambition:lead-health-care", "interest:health-management"],
        "mba-hrm": ["interest:people-culture", "experience:professional-credentials"],
      },
      note: "Health Management when leadership is explicitly within health.",
    },
  ],

  /* ---------------- Explanations (verified evidence only) ---------------- */
  explanations: [
    {
      id: "ai-lead-with-ai",
      programId: "mba-ai",
      heading: "You want to lead with AI",
      text: "Your choices point towards AI as an organisational capability, combining technical understanding with strategy, governance and responsible adoption.",
      triggers: ["ambition:lead-ai-emerging-technology", "interest:ai-strategy", "interest:responsible-ai"],
      supports: [
        { kind: "capability", id: "leading-with-ai" },
        { kind: "capability", id: "ai-strategy" },
        { kind: "capability", id: "ai-governance-ethics" },
        { kind: "differentiator", programId: "mba-ai", id: "technical-and-strategic" },
      ],
    },
    {
      id: "ai-technical",
      programId: "mba-ai",
      heading: "You want technical AI capability",
      text: "Your interest in AI, coding and hands-on work connects with technical study in Python, neural networks and data analytics.",
      triggers: [
        "interest:artificial-intelligence",
        "interest:python-coding",
        "interest:data-analytics",
        "experience:ai-in-action",
        "experience:technical-skills",
      ],
      supports: [
        { kind: "capability", id: "python" },
        { kind: "capability", id: "neural-networks" },
        { kind: "capability", id: "data-analytics" },
      ],
    },
    {
      id: "ai-transformation",
      programId: "mba-ai",
      heading: "You want to lead AI-enabled change",
      text: "You paired AI with transformation, which connects with organisational AI transformation and responsible AI governance.",
      triggers: ["ambition:transform-organisations", "interest:digital-transformation"],
      supports: [
        { kind: "capability", id: "organisational-ai-transformation" },
        { kind: "capability", id: "ai-governance-ethics" },
      ],
    },
    {
      id: "ai-credentials",
      programId: "mba-ai",
      heading: "You value professional credentials",
      text: "MBA Artificial Intelligence includes the {credentials}.",
      triggers: ["experience:professional-credentials"],
      supports: [{ kind: "certification", id: "fortinet-cybersecurity" }],
    },
    {
      id: "ba-data-decisions",
      programId: "mba-business-analytics",
      heading: "You want to turn data into decisions",
      text: "Your profile emphasises analytics, business intelligence and using evidence to improve business decisions.",
      triggers: ["ambition:data-driven-decisions", "interest:data-analytics"],
      supports: [
        { kind: "capability", id: "business-intelligence" },
        { kind: "capability", id: "data-driven-decisions" },
        { kind: "capability", id: "evidence-based-decisions" },
      ],
    },
    {
      id: "ba-analytical-tools",
      programId: "mba-business-analytics",
      heading: "You want hands-on analytical tools",
      text: "Your choices point to practical analytics, with tools such as Python, Power BI, Advanced Excel and text mining.",
      triggers: ["interest:python-coding", "experience:technical-skills", "interest:data-analytics"],
      supports: [
        { kind: "capability", id: "python" },
        { kind: "capability", id: "power-bi" },
        { kind: "capability", id: "advanced-excel" },
        { kind: "capability", id: "text-mining" },
      ],
    },
    {
      id: "ba-credentials",
      programId: "mba-business-analytics",
      heading: "You value professional credentials",
      text: "MBA Business Analytics includes the {credentials}.",
      triggers: ["experience:professional-credentials"],
      supports: [
        { kind: "certification", id: "fortinet-cybersecurity" },
        { kind: "certification", id: "google-web-analytics" },
      ],
    },
    {
      id: "mkt-ai-marketing",
      programId: "mba-marketing",
      heading: "You want to lead marketing in an AI-powered world",
      text: "Your interests in customers, MarTech, automation and AI-powered marketing align strongly with MBA Marketing.",
      triggers: ["interest:martech-automation", "interest:marketing", "interest:artificial-intelligence"],
      supports: [
        { kind: "capability", id: "ai-powered-marketing" },
        { kind: "capability", id: "martech" },
        { kind: "capability", id: "marketing-automation" },
      ],
    },
    {
      id: "mkt-customers-brands",
      programId: "mba-marketing",
      heading: "You want to lead customers and brands",
      text: "Your choices centre on customers, brands and customer experience, at the heart of MBA Marketing.",
      triggers: ["ambition:brands-customer-experience", "interest:customer-experience", "interest:marketing"],
      supports: [
        { kind: "capability", id: "customer-strategy" },
        { kind: "capability", id: "customer-experience" },
        { kind: "capability", id: "marketing-strategy" },
      ],
    },
    {
      id: "mkt-applied",
      programId: "mba-marketing",
      heading: "You learn by doing",
      text: "MBA Marketing adds an extra gamified topic and two industry-project topics to the shared Flinders MBA experience.",
      triggers: ["experience:industry-challenges", "experience:gamified-learning", "experience:virtual-business-simulation"],
      supports: [
        { kind: "differentiator", programId: "mba-marketing", id: "additional-gamified-topic" },
        { kind: "differentiator", programId: "mba-marketing", id: "two-industry-projects" },
      ],
    },
    {
      id: "mkt-credentials",
      programId: "mba-marketing",
      heading: "You value professional credentials",
      text: "MBA Marketing includes the {credentials}.",
      triggers: ["experience:professional-credentials"],
      supports: [
        { kind: "certification", id: "google-web-analytics" },
        { kind: "certification", id: "google-ai-powered-advertising" },
        { kind: "accreditation", id: "ami" },
      ],
    },
    {
      id: "fin-capability",
      programId: "mba-finance",
      heading: "You want stronger financial capability",
      text: "MBA Finance builds the financial capability to make stronger business and investment decisions.",
      triggers: ["ambition:financial-capability", "interest:finance"],
      supports: [{ kind: "positioning", programId: "mba-finance" }],
    },
    {
      id: "hm-lead-health",
      programId: "mba-health-management",
      heading: "You want to lead in health",
      text: "MBA Health Management focuses on the business and management of health, for people leading health organisations and services.",
      triggers: ["ambition:lead-health-care", "interest:health-management"],
      supports: [
        { kind: "positioning", programId: "mba-health-management" },
        { kind: "differentiator", programId: "mba-health-management", id: "management-not-clinical" },
        { kind: "capability", id: "health-leadership" },
      ],
    },
    {
      id: "hm-industry-intensives",
      programId: "mba-health-management",
      heading: "You want to learn from health professionals",
      text: "Specialised intensive topics are delivered with experienced industry professionals, including affiliates and fellows of the Australasian College of Health Service Management.",
      triggers: ["interest:health-management", "ambition:lead-health-care", "ambition:lead-people-organisations"],
      supports: [
        { kind: "differentiator", programId: "mba-health-management", id: "health-industry-intensives" },
        { kind: "connection", id: "achsm" },
      ],
    },
    {
      id: "hrm-people",
      programId: "mba-hrm",
      heading: "You want to put people at the centre",
      text: "Your choices focus on people, culture and workforce capability, building people and organisational capability.",
      triggers: ["interest:people-culture", "ambition:lead-people-organisations"],
      supports: [
        { kind: "capability", id: "people-strategy" },
        { kind: "capability", id: "workforce-capability" },
        { kind: "capability", id: "organisational-capability" },
      ],
    },
    {
      id: "hrm-professional",
      programId: "mba-hrm",
      heading: "You want recognised HR credentials",
      text: "MBA Human Resource Management integrates Workday certification and is connected with AHRI accreditation.",
      triggers: ["experience:professional-credentials", "experience:technical-skills"],
      supports: [
        { kind: "certification", id: "workday" },
        { kind: "accreditation", id: "ahri" },
        { kind: "capability", id: "hr-technology" },
      ],
    },
    {
      id: "ib-international",
      programId: "mba-international-business",
      heading: "You want an international business career",
      text: "Your choices point to working across international markets, organisations and business environments.",
      triggers: ["ambition:international-business-career", "interest:international-business"],
      supports: [
        { kind: "positioning", programId: "mba-international-business" },
        { kind: "capability", id: "international-markets" },
        { kind: "capability", id: "global-management" },
      ],
    },
    {
      id: "si-impact",
      programId: "mba-social-impact",
      heading: "You want social impact at the centre",
      text: "MBA Social Impact builds leadership for social impact, impact measurement and ways to embed social impact in organisations.",
      triggers: ["ambition:social-impact", "interest:social-impact", "interest:sustainability"],
      supports: [
        { kind: "capability", id: "leadership-for-social-impact" },
        { kind: "capability", id: "impact-measurement" },
        { kind: "capability", id: "embedding-social-impact" },
      ],
    },
    {
      id: "si-public-purpose",
      programId: "mba-social-impact",
      heading: "You want purpose-led leadership",
      text: "Teaching is informed by academics with substantial public-sector and social-impact experience and connections with the Centre for Social Impact.",
      triggers: ["ambition:social-impact", "interest:social-impact", "ambition:lead-people-organisations"],
      supports: [
        { kind: "differentiator", programId: "mba-social-impact", id: "public-sector-informed-teaching" },
        { kind: "connection", id: "centre-for-social-impact" },
      ],
    },
    {
      id: "si-broad-foundation",
      programId: "mba-social-impact",
      heading: "You also want broad business capability",
      text: "MBA Social Impact combines the MBA Future Business component with specialist Social Impact study.",
      triggers: ["ambition:transform-organisations", "ambition:innovation-ventures", "interest:innovation", "interest:entrepreneurship"],
      supports: [{ kind: "structure", programId: "mba-social-impact" }],
    },
    {
      id: "fb-broad-leadership",
      programId: "mba-future-business",
      heading: "You want broad leadership capability",
      text: "Your choices span leadership, management and transformation, which suits a fast-track general MBA.",
      triggers: ["ambition:lead-people-organisations", "ambition:transform-organisations", "ambition:innovation-ventures"],
      supports: [
        { kind: "positioning", programId: "mba-future-business" },
        { kind: "differentiator", programId: "mba-future-business", id: "general-mba" },
        { kind: "capability", id: "leadership" },
      ],
    },
    {
      id: "fb-innovation",
      programId: "mba-future-business",
      heading: "You want to innovate across business",
      text: "Your interest in innovation and entrepreneurship fits broad, contemporary business and leadership capability.",
      triggers: ["interest:innovation", "interest:entrepreneurship", "ambition:innovation-ventures"],
      supports: [{ kind: "positioning", programId: "mba-future-business" }],
    },
    {
      id: "ind-industry-exposure",
      programId: "mba-industry-focused",
      heading: "You want deeper industry exposure",
      text: "Your choices consistently prioritise workplace experience, applied learning and understanding the Australian working environment.",
      triggers: ["compound:deeper-industry-exposure"],
      supports: [
        { kind: "capability", id: "australian-workplace-understanding" },
        { kind: "differentiator", programId: "mba-industry-focused", id: "working-in-australia" },
      ],
    },
    {
      id: "ind-double-placement",
      programId: "mba-industry-focused",
      heading: "You want more time in industry",
      text: "MBA Industry-focused offers up to approximately 300 hours of placement, compared with up to 150 hours across the other MBA pathways.",
      triggers: ["compound:deeper-industry-exposure"],
      supports: [{ kind: "differentiator", programId: "mba-industry-focused", id: "double-placement" }],
    },
    {
      id: "ind-working-in-australia",
      programId: "mba-industry-focused",
      heading: "You want to understand Australian workplaces",
      text: "The Working in Australia topic builds understanding of Australian workplaces, professional experience and workplace networks.",
      triggers: ["compound:deeper-industry-exposure", "ambition:industry-connected-career"],
      supports: [{ kind: "differentiator", programId: "mba-industry-focused", id: "working-in-australia" }],
    },
  ],
  fallbackExplanation: { heading: "A pathway worth exploring" },

  /* ---------------- Shared-experience personalisation (0 points) ---------------- */
  sharedMessages: [
    {
      experienceId: "industry-placement",
      message:
        "You told us industry experience matters to you. Industry placement opportunities are available across the Flinders MBA portfolio.",
    },
    {
      experienceId: "virtual-business-simulation",
      message:
        "You want to learn by making decisions. In BUSN9148 Marketing in a Digital Age, students run a virtual business and experience the consequences of their decisions.",
    },
    {
      experienceId: "alumni-mentorship",
      message:
        "You value learning from experienced professionals. BUSN8008 includes the MBA mentorship programme, connecting students with alumni mentors.",
    },
    {
      experienceId: "factory-of-the-future",
      message:
        "You are curious about advanced industry. Students across the MBA portfolio have the option to undertake BUSN9128 Advanced Industry Practicum, connected with the Factory of the Future.",
    },
    {
      experienceId: "gamified-learning",
      message:
        "You enjoy learning through play. Gamified and interactive learning is used across the Flinders MBA portfolio.",
    },
  ],

  labels: {
    clear: ["YOUR STRONGEST MATCH", "ALSO WORTH EXPLORING", "ANOTHER POSSIBILITY"],
    close: ["STRONG MATCH", "STRONG MATCH", "ALSO WORTH EXPLORING"],
    broad: "WORTH EXPLORING",
  },

  referenceProfiles: {
    "mba-ai": {
      ambitions: ["lead-ai-emerging-technology", "transform-organisations"],
      interests: ["artificial-intelligence", "python-coding", "ai-strategy", "responsible-ai"],
      experiences: ["ai-in-action", "technical-skills"],
    },
    "mba-business-analytics": {
      ambitions: ["data-driven-decisions"],
      interests: ["data-analytics", "python-coding"],
      experiences: ["technical-skills", "professional-credentials"],
    },
    "mba-marketing": {
      ambitions: ["brands-customer-experience", "transform-organisations"],
      interests: ["marketing", "martech-automation", "customer-experience", "artificial-intelligence"],
      experiences: ["professional-credentials"],
    },
    "mba-finance": { ambitions: ["financial-capability"], interests: ["finance"], experiences: [] },
    "mba-health-management": {
      ambitions: ["lead-health-care", "lead-people-organisations"],
      interests: ["health-management", "people-culture"],
      experiences: [],
    },
    "mba-hrm": {
      ambitions: ["lead-people-organisations", "transform-organisations"],
      interests: ["people-culture"],
      experiences: ["professional-credentials"],
    },
    "mba-international-business": {
      ambitions: ["international-business-career"],
      interests: ["international-business"],
      experiences: [],
    },
    "mba-social-impact": {
      ambitions: ["social-impact", "lead-people-organisations"],
      interests: ["social-impact", "sustainability"],
      experiences: [],
    },
    "mba-future-business": {
      ambitions: ["lead-people-organisations", "transform-organisations", "innovation-ventures"],
      interests: ["innovation", "entrepreneurship"],
      experiences: [],
    },
    "mba-industry-focused": {
      ambitions: ["industry-connected-career"],
      interests: [],
      experiences: ["industry-placement", "industry-challenges"],
    },
  },
};
