import type { Experience, ExperienceCategory, ExperienceId } from "./types";
import { PROTOTYPE, SPEC, withNote } from "./provenance";

/**
 * Availability line shown on an experience story, derived from its category.
 * - shared: portfolio-wide (verified).
 * - specialist: availability depends on the specialisation.
 * - unconfirmed: no portfolio-wide claim is made; the existing neutral
 *   prototype wording is kept until the scope is confirmed.
 */
export const availabilityLabels: Record<ExperienceCategory, string> = {
  shared: "AVAILABLE ACROSS OUR MBA PORTFOLIO",
  specialist: "EXPERIENCE AVAILABILITY VARIES BY PROGRAM",
  unconfirmed: "EXPERIENCE AVAILABILITY VARIES BY PROGRAM",
};

/**
 * Flinders MBA experiences.
 *
 * `category` separates SHARED portfolio-wide experiences (which must never
 * give one MBA an artificial Matchmaker advantage) from SPECIALIST ones.
 *
 * Display copy (title/summary/label/story) is the approved prototype wording.
 * The story's availability line is derived from `category`.
 *
 * Display order of the Matchmaker step-3 list = array order.
 */
export const experiences: Experience[] = [
  {
    id: "industry-placement",
    category: "shared",
    title: "Step into industry",
    summary: "Build experience through an industry placement.",
    label: "Industry placement",
    story:
      "Connect classroom learning with a professional setting. Explore the decisions, people and processes behind a working organisation.",
    icon: "briefcase",
    photo: "city",
    legacyIndex: 0,
    provenance: withNote(
      SPEC,
      "Available across the MBA portfolio (up to 150 hours; up to 300 hours in MBA Industry-focused).",
    ),
  },
  {
    id: "industry-challenges",
    category: "unconfirmed",
    title: "Solve real business problems",
    summary: "Work on challenges connected with industry.",
    label: "Industry challenges",
    story:
      "Move from a business brief to an evidence-based recommendation. Consider what an industry partner needs and how a solution could work in practice.",
    icon: "handshake",
    photo: "campus",
    legacyIndex: 1,
    provenance: withNote(PROTOTYPE, "Portfolio scope not confirmed. MBA Marketing includes two industry-project topics."),
  },
  {
    id: "factory-of-the-future",
    category: "shared",
    title: "Experience the Factory of the Future",
    summary: "Explore the Advanced Industry Practicum option.",
    label: "Factory of the Future",
    story:
      "Explore where advanced manufacturing, technology and business meet through an Advanced Industry Practicum option.",
    icon: "factory",
    photo: "industry",
    subjectCodes: ["BUSN9128"],
    legacyIndex: 2,
    provenance: withNote(
      SPEC,
      "Optional BUSN9128 Advanced Industry Practicum, available across the MBA portfolio.",
    ),
  },
  {
    id: "virtual-business-simulation",
    category: "shared",
    title: "Run a virtual business",
    summary: "Make decisions and experience their consequences.",
    label: "Business simulation",
    story:
      "In BUSN9148 Marketing in a Digital Age, students don’t just discuss business decisions. They run a virtual business and experience the consequences of those decisions.",
    icon: "gamepad",
    subjectCodes: ["BUSN9148"],
    legacyIndex: 3,
    provenance: SPEC,
  },
  {
    id: "ai-in-action",
    category: "specialist",
    programIds: ["mba-ai"],
    title: "Work hands-on with AI",
    summary: "Explore how emerging technologies change organisations.",
    label: "AI in action",
    story:
      "Connect the possibilities of AI with the decisions leaders face: when to adopt it, what to measure and how to use it responsibly.",
    icon: "brain",
    legacyIndex: 4,
    provenance: PROTOTYPE,
  },
  {
    id: "technical-skills",
    category: "specialist",
    programIds: ["mba-ai", "mba-business-analytics"],
    title: "Build technical skills",
    summary: "Get hands-on with technology and analytical tools.",
    label: "Technical skills",
    story:
      "Work with data and contemporary tools to turn a business question into an analysis you can explain.",
    icon: "code",
    legacyIndex: 5,
    provenance: PROTOTYPE,
  },
  {
    id: "professional-credentials",
    category: "specialist",
    programIds: ["mba-ai", "mba-business-analytics", "mba-marketing", "mba-hrm"],
    title: "Earn industry credentials",
    summary: "Build professional credentials alongside your MBA.",
    label: "Professional edge",
    story:
      "Explore credentials from Google, Fortinet or Workday and relevant professional accreditation. Options depend on the specialisation.",
    icon: "award",
    legacyIndex: 6,
    provenance: withNote(SPEC, "Programmes derived from the credential and accreditation records."),
  },
  {
    id: "alumni-mentorship",
    category: "shared",
    title: "Connect with an alumni mentor",
    summary: "Learn from an experienced professional.",
    label: "MBA mentorship",
    story:
      "Bring your career questions to a conversation with an MBA alumnus and discover how learning can translate into professional practice.",
    icon: "messages",
    subjectCodes: ["BUSN8008"],
    legacyIndex: 7,
    provenance: withNote(
      SPEC,
      "BUSN8008 includes the MBA mentorship programme.",
    ),
  },
  {
    id: "gamified-learning",
    category: "shared",
    title: "Learn through games & challenges",
    summary: "Experience learning beyond conventional lectures.",
    label: "Learn through play",
    story:
      "Test a decision in a simulation, reflect on what happened and try a different approach. Practice gives business ideas a practical context.",
    icon: "target",
    legacyIndex: 8,
    provenance: withNote(
      SPEC,
      "Gamified and interactive learning is used across the MBA portfolio.",
    ),
  },
];

/** Order of tiles on the experiences grid (approved bento layout). */
export const experienceGridOrder: ExperienceId[] = [
  "industry-placement",
  "factory-of-the-future",
  "virtual-business-simulation",
  "ai-in-action",
  "industry-challenges",
  "alumni-mentorship",
  "professional-credentials",
  "gamified-learning",
  "technical-skills",
];

/** Experiences listed under "Your Flinders MBA experience" on every programme page. */
export const programPageExperienceIds: ExperienceId[] = [
  "industry-placement",
  "virtual-business-simulation",
  "alumni-mentorship",
  "factory-of-the-future",
  "gamified-learning",
  "industry-challenges",
];
