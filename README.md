# Flinders MBA Future

**Status: Prototype roadshow experience**

An interactive prototype for exploring:

- **MBA directions**: the MBA Matchmaker matches a visitor's ambitions, interests and preferred experiences to the
  Flinders MBA specialisations;
- **student experiences**: the experiences shared across the Flinders MBA and those specific to a specialisation;
- **career directions**: 48 curated career directions, the capabilities connected with them and how Flinders MBAs
  connect;
- **Australian OSCA occupation connections**: the official Australian occupation classification (OSCA) behind each
  career direction;
- **My MBA Future**: a personal result to save or share, without an account or backend.

It is a fully static, client-side site deployed to GitHub Pages at https://afshintanouri.github.io/flindersmba/.

## Prototype governance

- This repository contains a **prototype / demonstration** application, developed for roadshow and demonstration
  purposes.
- It is **not** presented as an approved institutional production system, career-advice service,
  occupation-classification tool or recommendation engine. If it is adopted more broadly, the relevant Flinders
  University areas may review it.
- **Official course information should be confirmed through official Flinders University sources** (the Flinders
  University course pages).
- Verified, factual programme information (programme names, credentials, accreditations) relates to the Flinders
  University MBA offerings. **Matchmaker results, career directions, career→capability mappings and capability→MBA connections are
  curated prototype interpretation layers** for exploration only. They are not ABS classifications or
  recommendations, and they are not formally approved institutional mappings.
- The app shows this status in its footer ("Prototype roadshow experience", *About this prototype*) and, on Career
  Explorer pages, an *About this tool* note kept separate from the ABS attribution.

## ABS / OSCA source data and attribution

Occupation data is adapted from:

> Australian Bureau of Statistics, *OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0*,
> https://www.abs.gov.au/statistics/classifications/osca-occupation-standard-classification-australia/2024-version-1-0
> (Structure and Index released 6 December 2024; Category Descriptions released 28 July 2025).
> © Commonwealth of Australia, licensed under
> [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

- **Adaptation.** Source material has been adapted for use in this prototype: codes and whitespace normalised, source
  tables combined and restructured into static files, recorded source anomalies corrected
  (`public/data/osca/corrections.json`), and official text shown in brief.
- **No endorsement.** The ABS does not endorse this prototype. The career directions, capability connections and MBA
  suggestions are not ABS outputs.
- **Copyright and disclaimer:** https://www.abs.gov.au/website-privacy-copyright-and-disclaimer (the ABS excludes,
  among others, the Commonwealth Coat of Arms, the ABS logo and OSCA branding and artwork from its licence; none of
  these are included in this repository or the application).
- In the app, the full attribution is shown on every screen that displays OSCA information (`content/attribution.ts`,
  rendered by `OscaSource` in `components/careers.tsx`).

See [`data/osca/README.md`](data/osca/README.md) for how the dataset was produced and is validated here.

## Licensing

- **No open-source licence is granted for the Flinders MBA Future application code.** There is no `LICENSE` file:
  the source code, content and imagery are not licensed for reuse unless explicitly authorised later.
- The **ABS CC BY 4.0 terms apply to the relevant ABS-derived material** (`public/data/osca/`), not to the whole
  application.
- **Third-party assets keep their own licences**: see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) (Barlow
  fonts under the SIL Open Font License 1.1; npm dependencies under their own licences).
- **Brand.** This public prototype does not distribute official Flinders University brand artwork: the header uses a
  plain typographic product title ("FLINDERS MBA FUTURE · Prototype roadshow experience"). References to Flinders
  University, the Flinders MBA and its programmes are factual. The Flinders University name is a trademark of
  Flinders University and is not licensed by this repository; no formal institutional production or brand approval is
  implied.
- **Imagery.** The illustrative images (`public/*.webp`) are AI-generated (Google AI) for this prototype. They are not
  photographs of actual Flinders University facilities, students, staff or locations.

## Technical summary

- Next.js 16 (App Router) static export (`output: "export"`), React 19, TypeScript
- Hand-written CSS (`app/globals.css`); Tailwind CSS 4 is used only for its base reset
- Hash-based routing (`#q1`, `#mba/<id>`, `#career/<id>` …), so no server rewrites are needed
- Static GitHub Pages deployment under the base path `/flindersmba`
- Playwright unit, smoke and visual-regression tests; pnpm 12.3.4, Node.js 22

```
app/            layout, single page, global CSS (design system)
components/     screens and shared UI
content/        typed content records, provenance and validation; generated career data
lib/            routes, journey state and storage, share codec, Matchmaker, OSCA loading and validation
public/         fonts, AI-generated illustrative images, .nojekyll, generated OSCA dataset (public/data/osca/)
data/           OSCA dataset notes; checksums of the generated data
scripts/        local static server; generated-data checksum verification
tests/          Playwright smoke, visual and unit tests
third-party/    third-party licence texts
```

## Local setup and build

```bash
pnpm install --frozen-lockfile
pnpm dev
```

GitHub Pages serves the site at `/flindersmba`, so production builds must set the base path
(`pnpm build:pages` is a shortcut):

```bash
NEXT_PUBLIC_BASE_PATH=/flindersmba pnpm build
```

The static site is written to `out/` (git-ignored). `public/.nojekyll` is copied into `out/` so GitHub Pages keeps
the `_next/` directory. Serve it locally under the same base path at http://localhost:4173/flindersmba/:

```bash
pnpm serve
```

## Data and content validation

- **Content** (programmes, Matchmaker rules, experiences, credentials, career directions) is typed and validated with
  Zod and referential checks during `pnpm build` (the page fails to pre-render on invalid content) and in
  `pnpm test:unit`.
- **OSCA dataset** (`public/data/osca/`) is validated structurally during the build and in `pnpm validate:osca`.
- **Generated data integrity.** The OSCA dataset and the production career data
  (`content/careers/career-directions.generated.json`) are generated from the official ABS workbooks and a reviewed
  research layer that are maintained outside this repository. `pnpm verify:generated-data` checks them against
  `data/generated-data.sha256`, so they cannot drift from the reviewed release. Changes to them are made at source
  and released as a whole.

## Tests

Tests run against the built `out/` directory, served under `/flindersmba`. Build first, then:

```bash
pnpm test:unit     # content, IDs, mappings, routes, share format, OSCA dataset (no build needed)
pnpm test          # smoke and integration tests in Chromium
```

If Playwright's browser is not installed: `pnpm exec playwright install chromium`.

### Visual regression

`tests/visual.spec.ts` captures 18 key screens at 360px, 768px, 1920px and 3840px wide (72 screenshots). Baseline
screenshots are not committed. The approved baseline is recorded in `tests/visual-baseline.json`; the `Validate`
workflow builds that commit and the current commit on the same runner and fails on any difference.
`"approvedCommit": "initial"` means the repository's first commit, the approved release snapshot. To approve an
intentional visual change, review the diff images from the failing run, then set `approvedCommit` to the commit that
introduced the change and add a history entry. Locally:

```bash
# on the known-good commit, after building:
PW_SNAPSHOT_DIR=visual-baseline pnpm test:visual:update
# after your change, rebuild, then:
PW_SNAPSHOT_DIR=visual-baseline pnpm test:visual
```

## Roadshow kiosk mode

Launch a shared touchscreen with `?kiosk=1` (no separate build), e.g.
`https://afshintanouri.github.io/flindersmba/?kiosk=1#careers`. The visitor's journey lives only in this tab's
`sessionStorage`; after two minutes without activity the screen offers *Continue my journey* / *Start fresh* and
resets 30 seconds later. My MBA Future leads with a QR hand-off that encodes the share link (with the base path,
without `?kiosk`). No personal data, account or backend is involved.

Share links use `#share=<payload>`: a versioned, URL-safe payload of stable IDs with no personal data.

## Deployment (GitHub Pages)

| Workflow | Triggers | Deploys? |
|---|---|---|
| `validate.yml` | push to `main`, pull requests, manual | **Never** |
| `deploy-pages.yml` | **manual only** (type `deploy` to confirm) | Yes, after validation, build and smoke tests pass |

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Contact

Questions about the MBA: Dr Afshin Tanouri, MBA Director, Flinders University (contact options are in the app's
*Talk to the MBA team* panel).
