/**
 * About / source wording approved by Flinders University Marketing and
 * Compliance (supplied 25 November 2026). Single source of truth: use the
 * approved sentences exactly and change them only with their approval.
 *
 * Restrained transparency, not a warning: shown in the About this experience
 * panel (opened from the footer) and, for career data, on Career Explorer pages.
 */

/** Official Flinders University homepage (named in the approved wording). */
export const OFFICIAL_FLINDERS_URL = "https://www.flinders.edu.au/";

export const aboutExperience = {
  product: "Flinders MBA Future",
  aboutAction: "About this experience",
  aboutHeading: "About this experience",
  /** Approved: ABOUT THIS EXPERIENCE. */
  about:
    "This interactive MBA discovery tool has been developed by Flinders University for demonstration purposes at the Vietnam Roadshow. It is designed to help prospective students explore MBA study options and potential career pathways.",
  /** Approved: OCCUPATION DATA (a summary; the full ABS attribution stays on Career Explorer pages). */
  occupationDataHeading: "Occupation data",
  occupationData:
    "Australian Bureau of Statistics (ABS), OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0 (CC BY 4.0, adapted). Full attribution is provided on the Career Explorer pages. The ABS does not endorse this tool.",
  /** Approved: CONTENT INFORMATION. The link text is linked to OFFICIAL_FLINDERS_URL (plain text on a shared kiosk). */
  contentHeading: "Content information",
  contentInfo: {
    before: "Content is indicative only. For current course details, entry requirements and eligibility, please refer to the ",
    linkText: "official Flinders University website",
    after: ".",
  },
  /** Career Explorer pages: shown above (and separate from) the formal ABS attribution. */
  careerAboutHeading: "About this tool",
  careerAbout:
    "Career directions, capability connections and MBA suggestions are curated interpretations for career exploration. They are not ABS classifications or recommendations.",
};

/** The approved content-information sentence as plain text. */
export const contentInfoText = (c = aboutExperience.contentInfo) => `${c.before}${c.linkText}${c.after}`;
