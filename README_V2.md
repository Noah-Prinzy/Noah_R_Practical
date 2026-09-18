# Version 2: what changed

Version 2 builds on the working V1 submission; it is not a rewrite. All V1 requirements and outputs
are preserved. See `README.md` for how to run the project and `output/exam_compliance.md` for the
requirement-by-requirement audit.

## Preserved from V1

- Section A: exact student dataset, `str`/`summary`, missing-value check, Grade, score statistics, programme averages, above-average students, and independent verification.
- World Bank WDI API source, the 2022 data year, and the extraction, inspection and cleaning steps.
- `web_extracted_data.csv` (raw, 295 × 19) and `cleaned_data.csv` (209 × 13), identical in structure to V1.
- The four required figures (`figures/figure1.png`–`figure4.png`) and every V1 analysis: descriptives, group summaries, ANOVA, Pearson/Spearman correlation, IQR outliers, sensitivity and the plausibility history check.
- The PDF report's required sections, now extended.

## Added in V2

**R analysis (`main_analysis.R`)**
- Robust project-root detection, so the script works via Rscript, `source()` or `build_report.R` from any folder.
- Stronger error handling:
  - detects World Bank error payloads and empty responses
  - checks that required columns are present
  - explains what failed and what to check
- Welch's ANOVA and η² alongside the classic ANOVA.
- §12b **Regression**: `life_expectancy_years ~ log10_gdp_per_capita`.
  - Reports coefficients, SE, t, p, 95% CI, R², adjusted R² and F.
  - Diagnostics: Cook's distance, leverage, standardised residuals, Shapiro-Wilk and a curvature test.
- §12c **Sensitivity**: four scenarios (baseline; excluding life-expectancy outliers; excluding GDP outliers; excluding influential points), with a data-driven conclusion.
- `figures/figure5_regression_diagnostics.png`: an additional figure; the required figures are unchanged.
- §13b **Figure interpretations** are generated from the data, so every qualitative claim (skew direction, "rises at every step", etc.) is checked before it is written. The report and dashboard share the same text.
- §14 **Automated QA**: 29 checks with documented plausibility ranges, written to `output/qa_report.json`. The script stops loudly on any failure.
- §15 Improved **automated summary**, covering missingness, regression, Welch's ANOVA and sensitivity. Also generated **limitations**.
- §16 **Exports**: `output/data_dictionary.csv`, `output/analysis_summary.json`, `output/reproducibility_manifest.json` (packages, seed, checksums), and the dashboard data in `frontend/public/project/`.

**Report (`build_report.R`)**
- New content: a QA subsection, regression and diagnostics, sensitivity analysis, Figure 5, a Limitations section, and pipeline documentation.
- Hard-coded wording was replaced with values computed from the analysis.
- After the PDF is built, the script finalises the QA report and manifest, copies the PDF to the dashboard, and writes `output/exam_compliance.md`.

**Dashboard (`frontend/`)**
- The real-estate template content is removed, and the dashboard is rebuilt on an R → JSON → Next.js data contract. No numbers are typed into the frontend.
- It includes a hero, pipeline, key indicators, the four required figures with a full-screen view, advanced analysis, a country explorer (search, filters, sorting, detail panel), data quality, methodology, limitations, and report and reproducibility sections.

**Workflow and documentation**
- `run_project.bat` runs the whole project with one command.
- `README.md` explains how to run, the pipeline, data, methods, QA, reproducibility, dependencies, limitations and packaging.
- `frontend/README.md` documents the data contract.

---

# Version 2.1: premium motion and data-story frontend

The R pipeline, data, statistics, QA and report are **unchanged** in V2.1 (verified: all result
fingerprints and `cleaned_data.csv` are byte-identical before and after). Only `frontend/` changed.

- **Story structure:** 9 chapters / 14 scenes. New scenes: *The short answer*, *Relationship*
  (Figure 5 pinned beside eight analytical steps), *Group differences*, *Robustness*, a dedicated
  *Exam Section A* scene and a *Closing* scene.
- **Motion system:** central tokens in `frontend/lib/motion.ts`; three levels (global / section /
  micro); Motion (framer-motion) is the only animation engine; no GSAP.
- **Progressive enhancement:** content is visible in the server HTML; animations apply only once
  scripts run (fixes the V2 hero that was invisible until JavaScript loaded).
- **Accessibility:** full reduced-motion experience, skip link, `aria-current` chapter navigation,
  reading-progress bar, Radix dialogs (focus trap, focus return, Escape, scroll lock), 44 px touch
  targets, contrast fixes.
- **Static build:** the page is rendered once at build time from the R outputs, so the deployed
  site is plain static files and never needs R. A production build fails if the R outputs are missing.
- **One new dependency:** `@radix-ui/react-dialog` (MIT).
- **Git:** repository initialised locally (no remote); `.gitattributes` keeps generated data files
  byte-identical so the manifest checksums stay valid.

See `frontend/README.md` for the motion system, scene list and adapted open-source patterns.
