# Exam compliance matrix

Generated automatically by `build_report.R` on 2026-09-18 11:49 from the outputs of this run. Each status is derived from a check on the actual files and R objects; `ADDITIONAL` marks work beyond the exam requirements. The dashboard build (`npm run build`) is not verified by R.

| Section | Requirement | Location | Evidence | Status |
| --- | --- | --- | --- | --- |
| A | Exact student dataset as a dataframe (10 x 6) | main_analysis.R section 3 (A1) | 10 rows x 6 columns; values verified by independent recomputation | PASS |
| A | Structure displayed (str) | main_analysis.R section 3 (A2) | str(students) printed | PASS |
| A | Summary displayed (summary) | main_analysis.R section 3 (A2) | summary(students) printed | PASS |
| A | Missing values checked | main_analysis.R section 3 (A3) | 0 missing values | PASS |
| A | Grade variable (A-F rules) | main_analysis.R section 3 (A4) | A=3, B=3, C=2, D=1, F=1 | PASS |
| A | Mean, median, highest, lowest, SD of Score | main_analysis.R section 3 (A5) | mean 71.5, median 73.0, max 91, min 48, SD 14.18 | PASS |
| A | Average score by programme | main_analysis.R section 3 (A6) | Data Science 73.33; Computer Science 71.25; Information Systems 70.00 | PASS |
| A | Students above the overall average | main_analysis.R section 3 (A7) | 6 students above 71.5 | PASS |
| B | Public web data source (World Bank WDI API) | main_analysis.R sections 4-5 | https://api.worldbank.org/v2/ | PASS |
| B | Source, URL and extraction date documented | main_analysis.R section 4; final_report.pdf Table 1 | extracted 2026-09-18, data year 2022 | PASS |
| B | 50+ observations | cleaned_data.csv | 209 countries | PASS |
| B | 5+ useful variables | cleaned_data.csv | 7 numeric indicators | PASS |
| B | Raw data inspected | main_analysis.R section 6 | head/str/summary/dim/names + issue scan | PASS |
| B | Raw export | web_extracted_data.csv | 295 x 19 | PASS |
| B | Cleaning: duplicates, missing values, types, names, unnecessary columns | main_analysis.R section 7 | 78 aggregates, 0 duplicates, 8 incomplete rows removed | PASS |
| B | Cleaned export | cleaned_data.csv | 209 x 13 | PASS |
| B | Extraction reproducible from code | main_analysis.R section 5 | fixed year, recorded endpoints, retries | PASS |
| C | Descriptive statistics for 3+ numeric variables | main_analysis.R section 9 | 6 variables | PASS |
| C | Group analysis by category | main_analysis.R section 10 | by region (7) and income group (4) | PASS |
| C | One-way ANOVA | main_analysis.R section 10 | F = 34.0, p = 3.4e-28 | PASS |
| C | Correlation calculated and interpreted | main_analysis.R section 11 | Pearson r = 0.792 (log GDP) | PASS |
| C | Outlier analysis (IQR) | main_analysis.R section 12 | 3 variables, 23 flagged | PASS |
| C | Regression with diagnostics (additional) | main_analysis.R section 12b; figures/figure5_regression_diagnostics.png | slope 9.86, R2 0.627 | PASS |
| C | Sensitivity analysis (additional) | main_analysis.R section 12c | 4 scenarios | PASS |
| D | Bar chart | figures/figure1.png | PNG exists and is non-empty | PASS |
| D | Histogram | figures/figure2.png | PNG exists and is non-empty | PASS |
| D | Scatter plot | figures/figure3.png | PNG exists and is non-empty | PASS |
| D | Boxplot | figures/figure4.png | PNG exists and is non-empty | PASS |
| D | 2-3 sentence interpretation per figure | final_report.pdf section 5; output/analysis_summary.json (figures) | 4 of 4 required figures have interpretations | PASS |
| E | Single integrated pipeline (website to export) | main_analysis.R (sections 4-17) | one script, relative paths | PASS |
| E | Two+ statistical analyses and two+ visualisations | main_analysis.R sections 9-13 | 7 analyses, 4 required figures | PASS |
| E | Automated summary from calculated values | main_analysis.R section 15; output/analysis_summary.json | 10 generated statements | PASS |
| E | Final report with required sections | final_report.pdf | Introduction, Data Extraction, Data Cleaning, Analysis, Visualisation, Limitations, Conclusion | PASS |
| Extra | Automated QA | main_analysis.R section 14; output/qa_report.json | 29 checks, status PASS | PASS |
| Extra | Data dictionary | output/data_dictionary.csv | 13 variables | PASS |
| Extra | Reproducibility manifest | output/reproducibility_manifest.json | R version, packages, seed, source, checksums | PASS |
| Extra | Interactive dashboard | frontend/ | Next.js app reading exported JSON | ADDITIONAL |

**Overall:** 36 PASS, 0 FAIL, 1 additional/not verified.
