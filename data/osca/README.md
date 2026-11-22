# OSCA data

The Career Explorer uses **OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0**,
published by the Australian Bureau of Statistics (© Commonwealth of Australia).

## Official ABS material vs prototype interpretation

- **Official ABS material (adapted):** only the OSCA classification in `public/data/osca/`.
- **Prototype interpretation:** career directions, the OSCA occupations connected with them for exploration,
  career→capability mappings, capability→MBA connections and Matchmaker suggestions are curated prototype
  interpretation layers of Flinders MBA Future. They are not ABS classifications, outputs or recommendations, and
  they are not formally approved institutional mappings. In the app they are described in a separate *About this
  tool* note, shown before the ABS attribution.

## Source

Australian Bureau of Statistics (2024) *OSCA – Occupation Standard Classification for Australia, 2024, Version 1.0*
[https://www.abs.gov.au/statistics/classifications/osca-occupation-standard-classification-australia/2024-version-1-0],
accessed 20 November 2026. Structure and Titles Index released 6 December 2024; Category Descriptions released
28 July 2025.

| ABS workbook | Stated release | Used |
|---|---|---|
| OSCA structure | 6 December 2024 | Tables 1–5: hierarchy, authoritative titles, skill levels |
| OSCA Category Descriptions | 28 July 2025 | Table 1 (occupations), Table 2 (groups) |
| OSCA index of principal titles, alternative titles and specialisations | 6 December 2024 | Table 2 (Table 1 cross-checked) |
| OSCA correspondence tables v2 | 6 December 2024 | Reference only, not used |

The workbooks themselves are **not** included in this repository: they embed the ABS logo with the Commonwealth Coat
of Arms, which the ABS excludes from its Creative Commons licence. They are available from the ABS release page
above. `public/data/osca/metadata.json` records each workbook's SHA-256 and stated release, so the dataset can be
traced to the exact official files.

## Copyright, licence and attribution

© Commonwealth of Australia. ABS material is licensed under Creative Commons Attribution 4.0 International
(CC BY 4.0, https://creativecommons.org/licenses/by/4.0/), except, among others, the Commonwealth Coat of Arms, the
ABS logo and "Occupation Standard Classification for Australia (OSCA) branding and artwork"
(https://www.abs.gov.au/website-privacy-copyright-and-disclaimer#copyright-and-creative-commons, checked
21 November 2026). None of these are used in this repository or the application.

- **Adapted material.** `public/data/osca/` is an adaptation of the ABS workbooks: codes are normalised as strings,
  whitespace is normalised, official tables are combined, a search index is added, files are split by major group,
  and source anomalies are corrected and logged in `corrections.json`. Wording is not otherwise changed.
- **Attribution in the application** is configured in `content/attribution.ts` and shown, restrained, on every
  screen that displays OSCA information (creator, title and link, copyright notice, CC BY 4.0 link, modification
  notice, no-endorsement statement, link to the ABS copyright and disclaimer page).
- **No endorsement.** The ABS does not endorse this prototype. OSCA is not used to indicate migration or employment
  eligibility.
- The CC BY 4.0 licence covers this ABS-derived material only, not the Flinders MBA Future application.

## Dataset: `public/data/osca/` (static assets, fetched on demand, never bundled into JavaScript)

| File | Contents |
|---|---|
| `occupations-index.json` | 1,156 lightweight search records: titles, nec semantics, skill level, hierarchy codes, `searchText` |
| `occupations-details/{1–8}.json` | Occupation-level text (lead statement, main tasks, statements) split by major group |
| `groups.json` | 593 major / sub-major / minor / unit groups with group-level descriptions |
| `corrections.json` | Every normalisation and source anomaly |
| `metadata.json` | Classification, version, publisher, source workbooks with SHA-256 and release, counts, licence |

Normalisation rules, all logged in `corrections.json`:

- **Codes** become digit strings; occupation codes keep all six digits.
- **Whitespace**: non-breaking spaces become spaces, repeated spaces are collapsed, leading/trailing spaces are
  trimmed. Wording and punctuation are never changed.
- **Lists** (alternative titles, specialisations, nec titles, main tasks) are split only on `;`.
- **Titles**: OSCA Structure Table 5 is authoritative and the Titles Index confirms every principal title; other
  variants are logged as `source-title-disagreement` and not used.
- **Encoding**: one corrupted source string is replaced by the Titles Index form and logged as `encoding-anomaly`.

**nec categories** (codes ending `99`) have `isNec: true` and `necIncludedTitles`; those titles illustrate the
category's scope and are not standalone occupations. **Search** matches whole tokens (`lib/osca/search.ts`), so "AI"
does not match "Thai Massage Therapist".

## How the dataset is produced and validated

The dataset is generated by a deterministic importer from the checksummed official workbooks. The importer and the
workbooks are maintained outside this repository (the workbooks cannot be redistributed here; see above). This
repository validates the committed dataset itself:

```bash
pnpm verify:generated-data  # SHA-256 of every generated file matches data/generated-data.sha256
pnpm validate:osca          # structure, counts, codes, hierarchy and metadata (also run during `pnpm build`)
```
