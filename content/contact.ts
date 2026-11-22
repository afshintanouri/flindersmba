/**
 * MBA team contact (the single source of truth for contact details).
 * Supplied and approved by the MBA Director. No forms, no data collection:
 * the experience only offers a mailto: link and a LinkedIn profile link.
 */
import type { ContentProvenance } from "./types";

export type MbaContact = {
  name: string;
  role: string;
  organisation: string;
  email: string;
  linkedinUrl: string;
  provenance: ContentProvenance;
};

export const mbaContact: MbaContact = {
  name: "Dr Afshin Tanouri",
  role: "MBA Director",
  organisation: "Flinders University",
  email: "afshin.tanouri@flinders.edu.au",
  linkedinUrl: "https://www.linkedin.com/in/afshin-tanouri/",
  provenance: {
    status: "verified",
    source: "Contact details supplied by the MBA Director for the Flinders MBA Future application",
    verifiedBy: "Afshin Tanouri",
    verifiedOn: "2026-11-21",
  },
};

/** Supporting copy (no admission advice or guarantees). */
export const contactCopy = {
  footerPrompt: "Questions about your MBA?",
  footerAction: "Talk to the MBA team",
  panelHeading: "Talk to the MBA team",
  journeyHeading: "Ready to talk about your MBA?",
  intro:
    "Have a question about the MBA, your study options or which pathway might suit you? Connect directly with the Flinders MBA team.",
  journeyIntro:
    "Have a question about your MBA options or which pathway might suit you? Connect directly with the Flinders MBA team.",
  kiosk: "Your saved MBA Future also includes ways to connect with the Flinders MBA team.",
  kioskPanel:
    "Scan the QR code on My MBA Future to take your result to your phone. It includes ways to connect with the Flinders MBA team.",
};

/** mailto: link for the configured address (no tracking parameters). */
export const contactMailto = (c: MbaContact = mbaContact) => `mailto:${c.email}`;
