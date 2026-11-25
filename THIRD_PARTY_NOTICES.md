# Third-party notices

Flinders MBA Future application code is **not** open-source licensed (there is no `LICENSE` file). The material
below is third-party material that keeps its own terms. Nothing here licenses the application.

## Australian Bureau of Statistics: OSCA data

`public/data/osca/` is adapted from Australian Bureau of Statistics, *OSCA – Occupation Standard Classification for
Australia, 2024, Version 1.0*
(https://www.abs.gov.au/statistics/classifications/osca-occupation-standard-classification-australia/2024-version-1-0),
© Commonwealth of Australia, licensed under Creative Commons Attribution 4.0 International (CC BY 4.0,
https://creativecommons.org/licenses/by/4.0/). Source material has been adapted (codes and whitespace normalised,
source tables combined and restructured into static files, recorded source anomalies corrected; official text is
shown in brief). The ABS does not endorse this tool. ABS copyright and disclaimer:
https://www.abs.gov.au/website-privacy-copyright-and-disclaimer. The CC BY 4.0 licence applies to this ABS-derived
material only, not to the rest of the application.

## Barlow fonts

`public/body.ttf` (Barlow Regular), `public/semibold.ttf` (Barlow SemiBold) and `public/display.ttf` (Barlow
Condensed Bold), version 1.408. Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow).
Licensed under the SIL Open Font License, Version 1.1: see [`third-party/barlow/OFL.txt`](third-party/barlow/OFL.txt).
The files are renamed but unmodified.

## Flinders University logo

`public/flinders.svg` is the Flinders University logo, a trademark of Flinders University. Flinders University
Marketing and Compliance approved its use in this demonstration application (25 November 2026). It is not licensed
for any other use and must not be modified or redrawn.

## Illustrative imagery

`public/hero.webp`, `public/campus.webp`, `public/city.webp` and `public/industry.webp` are AI-generated images
(generated with Google AI; the original files carried the "Made with Google AI" C2PA/IPTC provenance marking, which
the WebP conversion did not keep). They were generated for this application during its design and are not photographs
of actual Flinders University facilities, students, staff or locations.

## npm dependencies

Runtime and build dependencies (Next.js, React, lucide-react, uqr, Tailwind CSS and others) are installed from npm
and are not stored in this repository; each is distributed under its own licence (see `package.json` and each
package's licence in `node_modules/`). Icons in the interface come from lucide-react (ISC licence). The LinkedIn mark
in `components/contact.tsx` is LinkedIn's trademark, used only to identify the link to a LinkedIn profile.
