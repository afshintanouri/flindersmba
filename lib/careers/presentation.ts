/**
 * Visitor-facing wording for Career Direction ↔ OSCA relationships.
 * Pure functions so every relationship type is unit-tested.
 */
import type { CareerDirection, CareerMbaBand } from "@/content/types";

export type OccupationConnection = {
  /** Small label above the career title. */
  tag: string;
  /** Heading of the occupation panel. */
  heading: string;
  /** Sentence introducing the official occupation (ends with ":" when followed by it). */
  lead?: string;
  /** The official occupation shown (never the career title unless it IS the principal title). */
  occupation?: { code: string; title: string };
  /** Short supporting note. */
  note?: string;
  /** Heading for reviewed related occupations, if any are shown. */
  relatedHeading?: string;
};

export const CONTEMPORARY_STATEMENT =
  "This is a contemporary career direction rather than a single official OSCA occupation.";
export const VENTURE_STATEMENT =
  "Entrepreneurship is presented as a venture pathway rather than a single OSCA occupation.";
export const CAREER_DIRECTION_STATEMENT =
  "This career direction is explored through the capabilities connected with it rather than through a single official OSCA occupation.";

export function occupationConnection(d: CareerDirection): OccupationConnection {
  const p = d.primary;
  switch (d.presentation) {
    case "official": {
      const occupation = { code: p!.code, title: p!.principalTitle };
      if (p!.officialTitleType === "principal-title")
        return { tag: "CAREER DIRECTION", heading: "Australian occupation connection", occupation, note: "This is an official OSCA occupation." };
      if (p!.officialTitleType === "alternative-title")
        return { tag: "CAREER DIRECTION", heading: "Australian occupation connection", lead: `${p!.officialTitle} is an official alternative title of:`, occupation };
      if (p!.officialTitleType === "specialisation")
        return { tag: "CAREER DIRECTION", heading: "Australian occupation connection", lead: `${p!.officialTitle} is an official specialisation of:`, occupation };
      return necConnection(d);
    }
    case "related-official": {
      if (p!.officialTitleType === "nec-included-title") return necConnection(d);
      const occupation = { code: p!.code, title: p!.principalTitle };
      const base = { tag: "CAREER DIRECTION", heading: "Australian occupation connection", occupation, relatedHeading: d.related.length ? "Related Australian occupation profiles" : undefined };
      if (p!.officialTitleType === "specialisation")
        return { ...base, lead: `${p!.officialTitle} is an official specialisation of:`, note: `“${d.title}” is broader than the official specialisation title.` };
      return { ...base, lead: "This career direction connects with the official occupation:", note: `“${d.title}” is not itself an official OSCA title.` };
    }
    case "contemporary":
      return { tag: "CONTEMPORARY CAREER DIRECTION", heading: "Australian occupation connection", note: CONTEMPORARY_STATEMENT, relatedHeading: d.related.length ? "Related Australian occupation profiles" : undefined };
    case "venture":
      return { tag: "VENTURE DIRECTION", heading: "A venture pathway", note: VENTURE_STATEMENT, relatedHeading: d.related.length ? "Occupations you could also explore" : undefined };
    default:
      return { tag: "CAREER DIRECTION", heading: "Australian occupation connection", note: CAREER_DIRECTION_STATEMENT };
  }
}

function necConnection(d: CareerDirection): OccupationConnection {
  const p = d.primary!;
  return {
    tag: "CAREER DIRECTION",
    heading: "Australian occupation connection",
    lead: `${p.officialTitle} is an official title included within:`,
    occupation: { code: p.code, title: p.principalTitle },
    note: "This title is included within a “not elsewhere classified” (nec) category rather than being a standalone six-digit occupation.",
    relatedHeading: d.related.length ? "Related Australian occupation profiles" : undefined,
  };
}

export const bandLabel = (band: CareerMbaBand) =>
  band === "strong" ? "STRONG CONNECTION" : band === "relevant" ? "RELEVANT CONNECTION" : "WORTH EXPLORING";

export const mbaSectionHeading = (d: CareerDirection) =>
  d.mba.mode === "explore" ? "MBAs worth exploring" : "How Flinders MBAs connect";

export const EXPLORE_INTRO =
  "Different MBA pathways can develop capabilities relevant to different aspects of this career direction.";

/** First sentence of an official lead statement (restrained reproduction). */
export function firstSentence(text: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(text.trim());
  return (m ? m[1] : text).trim();
}

/** Up to four official main tasks (restrained reproduction). */
export const MAX_TASKS = 4;
export const limitTasks = (tasks: string[]) => tasks.slice(0, MAX_TASKS);
