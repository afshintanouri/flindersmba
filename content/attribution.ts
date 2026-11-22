/**
 * Source attribution for official occupation data (OSCA).
 *
 * The ABS provides its material under Creative Commons Attribution 4.0
 * International (CC BY 4.0), with stated exceptions (including the
 * Commonwealth Coat of Arms, the ABS logo and OSCA branding and artwork,
 * none of which this application uses):
 * https://www.abs.gov.au/website-privacy-copyright-and-disclaimer#copyright-and-creative-commons
 * (checked 21 November 2026).
 *
 * The record covers CC BY 4.0 section 3(a): creator, copyright notice,
 * licence notice and link, a reference to the disclaimer, a link to the
 * material, and an indication that it has been modified. It also states that
 * the ABS does not endorse this prototype (CC BY 4.0 s2(a)(6)).
 * Change it here only: every screen showing official OSCA information
 * renders it through components/careers.tsx (OscaSource).
 */
export const oscaAttribution = {
  creator: "Australian Bureau of Statistics",
  title: "OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0",
  sourceUrl:
    "https://www.abs.gov.au/statistics/classifications/osca-occupation-standard-classification-australia/2024-version-1-0",
  copyright: "© Commonwealth of Australia",
  licence: "CC BY 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  disclaimerUrl: "https://www.abs.gov.au/website-privacy-copyright-and-disclaimer",
  /** Indication of modification (CC BY 4.0 s3(a)(1)(B)). */
  modified:
    "Source material has been adapted for use in this prototype: codes and whitespace normalised, source tables combined and official text shown in brief.",
  /**
   * No endorsement (CC BY 4.0 s2(a)(6)). The prototype's career, capability and
   * MBA layers are described separately (content/prototype.ts, careerAbout).
   */
  notEndorsed: "The ABS does not endorse this prototype.",
  status: "cc-by-4.0" as const,
};
