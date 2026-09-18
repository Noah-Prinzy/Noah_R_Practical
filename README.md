# R Programming and Data Web Extraction: Practical Exam Project

An end-to-end, reproducible data-science project in R. It extracts real country data from the
**World Bank World Development Indicators (WDI) API**, then cleans, checks, analyses and
visualises it. It writes a PDF report, and it exports machine-readable results that an optional
interactive dashboard presents.

**Research question:** How does life expectancy vary between countries, and how strongly is it
associated with national income?

> The R analysis is the source of truth. The dashboard in `frontend/` is a presentation layer that
> only displays files R generates; it does no statistics of its own.

---

## Quick start

| What | Command (run in this folder) | Needs |
| --- | --- | --- |
| **Everything** (analysis, report, dashboard build) | `run_project.bat` (Windows) | R 4.x, Edge or Chrome; Node.js 20+ for the dashboard |
| Analysis only | `Rscript main_analysis.R` | R 4.x, internet |
| Analysis **and** PDF report | `Rscript build_report.R` | R 4.x, internet, Edge or Chrome |
| Dashboard (development) | `cd frontend` → `npm install` → `npm run dev`, then open http://localhost:3000 | Node.js 20+ |

`build_report.R` runs `main_analysis.R` first, so `Rscript build_report.R` rebuilds every R output
in one step. Missing R packages are installed automatically on first run. In RStudio, open
`main_analysis.R` and click **Source**.

---

## Pipeline

```
World Bank API ─▶ Extraction ─▶ Raw CSV ─▶ Cleaning ─▶ QA checks ─▶ Analysis ─▶ Figures
      ─▶ Exports (CSV / JSON / PNG) ─▶ Automated summary ─▶ PDF report ─▶ Interactive dashboard
```

| Stage | Where | Output |
| --- | --- | --- |
| Section A: student dataframe task | `main_analysis.R` §3 | printed results, independently verified |
| Source documentation and extraction (8 API requests, retries) | §4–5 | `web_extracted_data.csv` (raw, 295 × 19) |
| Raw data inspection | §6 | console |
| Cleaning (aggregates, whitespace, duplicates, types, names, missing values) | §7–8 | `cleaned_data.csv` (209 × 13) |
| Descriptive, group + ANOVA, correlation, IQR outliers | §9–12 | console, JSON |
| Regression with diagnostics; sensitivity analysis *(additional)* | §12b–12c | console, JSON, Figure 5 |
| Four required figures + one diagnostic figure | §13 | `figures/figure1-4.png`, `figure5_regression_diagnostics.png` |
| Figure interpretations (data-driven text) | §13b | used by the report and the dashboard |
| Automated data QA (29 checks; stops on failure) | §14 | `output/qa_report.json` |
| Automated summary + limitations | §15 | console, JSON |
| Data dictionary, JSON results, manifest, dashboard data | §16 | `output/`, `frontend/public/project/` |
| PDF report, final QA check, exam compliance matrix | `build_report.R` | `final_report.pdf`, `output/exam_compliance.md` |

---

## Folder structure

```
Noah_R_Practical/
├── main_analysis.R              # the whole analysis pipeline (exam script)
├── build_report.R               # runs main_analysis.R, writes final_report.pdf, finalises QA
├── run_project.bat              # one-command build (Windows)
├── web_extracted_data.csv       # raw API extraction (exam deliverable)
├── cleaned_data.csv             # cleaned dataset (exam deliverable)
├── final_report.pdf             # final report (exam deliverable)
├── figures/
│   ├── figure1.png … figure4.png          # the four required figures
│   └── figure5_regression_diagnostics.png # additional
├── output/
│   ├── analysis_summary.json    # every statistic, interpretation and limitation (schema 1.0)
│   ├── qa_report.json           # all QA checks with PASS/FAIL/PENDING
│   ├── reproducibility_manifest.json
│   ├── data_dictionary.csv
│   └── exam_compliance.md       # requirement → location → evidence → status
├── frontend/                    # Next.js dashboard (presentation layer; see frontend/README.md)
├── README.md                    # this file
└── README_V2.md                 # what changed in version 2
```

The exam deliverables stay at the top level in the layout the exam specifies. New
machine-readable outputs live in `output/`.

---

## Data

- **Source:** World Bank Open Data, World Development Indicators API v2 (`https://api.worldbank.org/v2/`). It is public and needs no key or login.
- **Year:** 2022. When the source was selected, 2022 had the best joint coverage of the seven indicators among the 2021–2023 vintages. A fixed year keeps the extraction reproducible.
- **Indicators:** GDP per capita (`NY.GDP.PCAP.CD`), life expectancy (`SP.DYN.LE00.IN`), population (`SP.POP.TOTL`), urban population % (`SP.URB.TOTL.IN.ZS`), fertility rate (`SP.DYN.TFRT.IN`), health expenditure per capita (`SH.XPD.CHEX.PC.CD`) and CO₂ per capita (`EN.GHG.CO2.PC.CE.AR5`). Each country's World Bank region and income group come from the country endpoint.
- **Cleaning:** 78 aggregate rows (e.g. "World") are removed, text is trimmed, types are converted, and names become snake_case. 8 countries without 2022 GDP per capita are dropped rather than imputed. Missing values in secondary indicators are kept as NA. The full log is in the report, and every variable is described in `output/data_dictionary.csv`.

## Statistical methods

Descriptive statistics · group summaries by region and income group · one-way ANOVA with
η² and Welch's ANOVA · Pearson (raw and log GDP) and Spearman correlation · 1.5 × IQR outlier
detection, with outliers retained · *additional:* OLS regression of life expectancy on
log₁₀ GDP per capita (coefficients, SE, t, p, 95% CI, R², adjusted R²) with diagnostics
(residuals, Q-Q, Cook's distance, leverage, curvature test), and a four-scenario sensitivity analysis.

## Quality assurance

`main_analysis.R` checks its own output. The checks cover:

- dataset size and required columns
- ISO3 uniqueness and duplicates
- that no aggregates remain
- numeric types
- missingness
- documented plausibility ranges (e.g. urban % within 0–100)
- that the CSVs on disk match the analysed data
- finite statistical results
- that every output file exists and is non-empty

The script writes `output/qa_report.json`, then **stops with a list of failures** if any check fails.
`build_report.R` completes the final check (that the PDF exists) and writes
`output/exam_compliance.md`, where every status comes from a check on the actual files.

## Reproducibility

- Relative paths only; the scripts find the project folder themselves.
- Fixed random seed (`2026`, used only for the jitter in Figure 4).
- `output/reproducibility_manifest.json` records the R version, OS, package versions, seed, source endpoints, data year, extraction date, dataset dimensions and MD5 checksums of every output.
- **Live data caveat:** the code is reproducible, but the World Bank revises WDI values over time, so a later run may return slightly different numbers. The extraction date and checksums identify exactly which data vintage produced a given set of outputs.

## Dependencies

**R (tested with 4.6.1):** jsonlite 2.0.0, dplyr 1.2.1, tidyr 1.3.2, stringr 1.6.0, readr 2.2.0,
ggplot2 4.0.3, scales 1.4.0, plus base stats, graphics, grDevices and tools. The PDF step uses
headless Microsoft Edge or Google Chrome, so no LaTeX or pandoc is needed.

**Dashboard (Node.js 20+):** Next.js 16.2.9, React 19.2.4, TypeScript 5.9, Tailwind CSS 4.3,
framer-motion 12, lenis 1.3, lucide-react 1.21. It is based on the supplied Estate/Next.js template.

## Limitations (summary)

These are generated with the results; see Section 6 of the report.

- **Cross-sectional:** one year of data, so no temporal ordering or causal effects.
- **Ecological:** country averages, not individuals.
- **Missing data:** the 8 dropped countries are disproportionately low-income.
- **Confounding:** healthcare, education, infrastructure, demographics, environment and institutions are not modelled.
- **Outliers:** influential observations, notably the Central African Republic's volatile 18.8-year value, change the size (but not the direction) of the association.
- **Source revisions:** World Bank data change over time.

## Packaging for submission

Do not include `frontend/node_modules/` or `frontend/.next/`; both are recreated by `npm install` and `npm run build`. For example, in PowerShell from the parent folder:

```powershell
$src = "Noah_R_Practical"
$tmp = Join-Path $env:TEMP "Noah_R_Practical"
robocopy $src $tmp /E /XD node_modules .next .claude | Out-Null
Compress-Archive -Path $tmp -DestinationPath "Noah_R_Practical.zip" -Force
```
