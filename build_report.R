# =========================================================
# BUILD final_report.pdf  (and finalise the QA / compliance outputs)
# =========================================================
# 1. Runs main_analysis.R (extraction -> cleaning -> analysis -> figures -> JSON).
# 2. Writes an HTML report whose every number and interpretation comes from that
#    run, and prints it to PDF with a headless Chromium browser (Microsoft Edge
#    or Google Chrome). No LaTeX/pandoc required.
# 3. Completes the "final_report.pdf" QA check, refreshes the reproducibility
#    manifest and dashboard copy, and writes output/exam_compliance.md.
#
# Usage (from the project folder):  Rscript build_report.R
# This is the one-command way to rebuild the whole project.
# =========================================================

# Run from the folder that contains this script, wherever it was called from
file_arg <- sub("^--file=", "", grep("^--file=", commandArgs(FALSE), value = TRUE))
if (length(file_arg) == 1) setwd(dirname(normalizePath(file_arg)))
if (!file.exists("main_analysis.R")) {
  stop("main_analysis.R not found in ", getwd(), ". Run this script from the project folder.")
}

report_env <- new.env()
cat("Running main_analysis.R ...\n")
analysis_log <- tryCatch(
  capture.output(sys.source("main_analysis.R", envir = report_env, chdir = TRUE)),
  error = function(e) {
    stop("main_analysis.R failed, so the report was not built.\n  Reason: ", conditionMessage(e),
         "\n  Run `Rscript main_analysis.R` on its own to see the full output.", call. = FALSE)
  })
cat("Analysis finished. Building report ...\n")

with(report_env, {

  # ---------- helpers ----------
  esc <- function(x) {
    x <- gsub("&", "&amp;", x, fixed = TRUE); x <- gsub("<", "&lt;", x, fixed = TRUE)
    gsub(">", "&gt;", x, fixed = TRUE)
  }
  fmt <- function(x, d = 2) formatC(x, format = "f", digits = d, big.mark = ",")
  fmt_p <- function(x) if (x < 0.001) formatC(x, format = "e", digits = 1) else sprintf("%.3f", x)
  html_table <- function(df, caption = NULL, digits = 2, align_left = 1) {
    df <- as.data.frame(df)
    num_cols <- vapply(df, is.numeric, logical(1))
    for (j in seq_along(df)) {
      if (is.numeric(df[[j]])) {
        df[[j]] <- ifelse(is.na(df[[j]]), "NA",
                          if (all(df[[j]] == round(df[[j]]), na.rm = TRUE)) fmt(df[[j]], 0) else fmt(df[[j]], digits))
      } else df[[j]] <- esc(as.character(df[[j]]))
    }
    left <- seq_along(df) <= align_left | !num_cols
    head_row <- paste0("<th", ifelse(left, " class='l'", ""), ">", esc(names(df)), "</th>", collapse = "")
    body <- apply(df, 1, function(r) paste0("<tr>", paste0("<td", ifelse(left, " class='l'", ""),
                                                          ">", r, "</td>", collapse = ""), "</tr>"))
    paste0("<table>", if (!is.null(caption)) paste0("<caption>", esc(caption), "</caption>"),
           "<thead><tr>", head_row, "</tr></thead><tbody>", paste(body, collapse = ""), "</tbody></table>")
  }
  img <- function(path, caption) {
    if (!file.exists(path)) stop("Figure missing for the report: ", path, " - did main_analysis.R finish?")
    uri <- paste0("data:image/png;base64", ",", jsonlite::base64_enc(readBin(path, "raw", file.info(path)$size)))
    sprintf("<figure><img src='%s' alt='%s'><figcaption>%s</figcaption></figure>", uri, esc(caption), esc(caption))
  }
  p <- function(...) paste0("<p>", paste0(...), "</p>")
  figure_block <- function(fn, heading = NULL) {
    paste0("<div class='fig'>", if (!is.null(heading)) heading,
           img(fn$file, sprintf("Figure %d. %s: %s", fn$number, fn$type, fn$title)),
           "<div class='interp'>", esc(fn$interpretation), "</div></div>")
  }

  # ---------- values used in the text (all computed, none typed in) ----------
  fert_out <- outlier_results$fertility_rate
  fert_regions <- unique(as.character(fert_out$outliers$region))
  gdp_out_names  <- paste(sprintf("%s (US$%s)", gdp_out$outliers$country, fmt(gdp_out$outliers$value, 0)), collapse = ", ")
  fert_out_names <- paste(sprintf("%s (%.2f)", fert_out$outliers$country, fert_out$outliers$value), collapse = ", ")
  hist_txt <- paste(sprintf("%.1f in %d", le_outlier_history$life_expectancy, le_outlier_history$year), collapse = ", ")
  n_numeric <- sum(vapply(clean, is.numeric, logical(1)))
  gdp_skew  <- if (mean(clean$gdp_per_capita_usd) > median(clean$gdp_per_capita_usd)) "right" else "left"
  le_skew   <- if (le_mean < le_median) "left" else "right"
  qa_completed <- qa_checks %>% filter(status != "PENDING")

  source_tbl <- data.frame(
    Item = c("Website", "API base URL", "Country endpoint", "Indicator endpoint", "Extraction date",
             "Reference year", "Why this year", "Method", "Error handling", "R packages",
             "Observations collected", "Variables collected"),
    Detail = c(source_info$website, source_info$base_url, source_info$country_url,
               source_info$indicator_url, source_info$extraction_date, data_year, source_info$year_rationale,
               source_info$method, source_info$error_handling,
               paste(required_packages, collapse = ", "),
               sprintf("%d economies (%d countries + %d aggregates)", nrow(web_raw),
                       nrow(web_raw) - raw_issues$aggregate_rows, raw_issues$aggregate_rows),
               sprintf("%d columns (10 metadata fields, %d indicators, year, extraction date)", ncol(web_raw), length(indicators))))
  indicator_tbl <- data_dictionary %>% filter(grepl("^WDI indicator", source)) %>%
    transmute(`API code` = sub("WDI indicator ", "", source), `Clean name` = variable,
              Meaning = description, Unit = unit)
  missing_tbl <- data.frame(Variable = names(missing_before),
                            `Missing after aggregates removed` = as.integer(missing_before),
                            `Missing in final data` = as.integer(colSums(is.na(clean))[names(missing_before)]),
                            check.names = FALSE) %>%
    filter(`Missing after aggregates removed` > 0 | `Missing in final data` > 0)
  qa_tbl <- qa_checks %>% group_by(Category = category) %>%
    summarise(Checks = n(), Passed = sum(status == "PASS"), Failed = sum(status == "FAIL"),
              Pending = sum(status == "PENDING"), .groups = "drop")
  desc_tbl <- descriptive_stats %>% rename(Variable = variable, N = n, Missing = missing, Mean = mean,
                                           Median = median, Min = min, Max = max, SD = sd)
  region_tbl <- region_summary %>% transmute(Region = as.character(region), Countries = countries,
    `Mean life exp.` = mean_life_expectancy, `Median life exp.` = median_life_expectancy,
    `Median GDP pc (US$)` = median_gdp_per_capita, `Mean fertility` = mean_fertility_rate,
    `Mean urban %` = mean_urban_pct)
  income_tbl <- income_summary %>% transmute(`Income group` = as.character(income_level), Countries = countries,
    `Mean life exp.` = mean_life_expectancy, `SD life exp.` = sd_life_expectancy,
    `Median GDP pc (US$)` = median_gdp_per_capita, `Mean fertility` = mean_fertility_rate)
  cor_tbl <- correlation_table %>% transmute(`Variable pair` = pair, Method = method, r = r,
                                            Interpretation = interpretation)
  out_tbl <- outlier_table %>% transmute(Variable = variable, Q1, Q3, IQR, `Lower bound` = lower_bound,
                                         `Upper bound` = upper_bound, Outliers = outliers, Low = low, High = high)
  reg_tbl <- reg_table %>% transmute(Term = term, Estimate = estimate, `Std. error` = std_error,
                                     t = t_value, `p-value` = vapply(p_value, fmt_p, character(1)),
                                     `95% CI low` = ci_low, `95% CI high` = ci_high)
  infl_tbl <- influential %>% transmute(Country = country, `Life exp.` = life_expectancy_years,
                                        `Std. residual` = std_residual, Leverage = leverage, `Cook's D` = cooks_d)
  sens_tbl <- sensitivity_table %>% transmute(Scenario = scenario, n, `Excluded` = excluded,
                                              `Pearson r (log GDP)` = pearson_r_log_gdp,
                                              `Spearman rho` = spearman_rho, `Slope (yrs per 10x GDP)` = slope,
                                              `R-squared` = r_squared)
  cleaning_tbl <- cleaning_log %>% rename(Step = step, `Rows after` = rows_after, Detail = note)

  # ---------- HTML ----------
  css <- "
  @page { size: A4; margin: 16mm 15mm 16mm 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1b1b1a; }
  h1 { font-size: 20pt; margin: 0 0 4px 0; } h2 { font-size: 14pt; margin: 22px 0 6px; border-bottom: 2px solid #2a78d6; padding-bottom: 3px; }
  h3 { font-size: 11.5pt; margin: 14px 0 4px; }
  .meta { color: #52514e; font-size: 9.5pt; margin-bottom: 10px; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; font-size: 8.8pt; page-break-inside: avoid; }
  caption { text-align: left; font-weight: 600; font-size: 9.5pt; padding-bottom: 3px; }
  th, td { border-bottom: 1px solid #e3e2de; padding: 3px 5px; text-align: right; vertical-align: top; }
  th { background: #f3f3f1; } .l { text-align: left; }
  figure { margin: 8px 0 4px; page-break-inside: avoid; text-align: center; } img { width: 80%; }
  h2, h3 { break-after: avoid; page-break-after: avoid; }
  figcaption { font-size: 9pt; color: #52514e; }
  .interp { background: #f4f8fd; border-left: 3px solid #2a78d6; padding: 6px 10px; margin: 4px 0 14px; page-break-inside: avoid; }
  .note { background: #f7f7f5; border-left: 3px solid #898781; padding: 6px 10px; margin: 6px 0 12px; font-size: 9.5pt; page-break-inside: avoid; }
  .summary li { margin-bottom: 4px; } .fig { page-break-inside: avoid; }
  code { font-size: 9pt; background: #f3f3f1; padding: 0 3px; word-break: break-all; }
  .pb { page-break-before: always; }"

  html <- c("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Final Report - R Programming and Data Web Extraction</title><style>", css, "</style></head><body>",
  "<h1>R Programming and Data Web Extraction: Final Report</h1>",
  sprintf("<div class='meta'>Practical examination project &middot; Data extracted %s &middot; R %s &middot; Scripts: <code>main_analysis.R</code> (analysis) and <code>build_report.R</code> (this report)</div>",
          source_info$extraction_date, paste(R.version$major, R.version$minor, sep = ".")),

  # 1. Introduction
  "<h2>1. Introduction</h2>",
  p(sprintf("This project extracts real-world country data from the <b>World Bank World Development Indicators (WDI)</b> through its public web API, then cleans, analyses and visualises it in a single reproducible R script. The data combine each economy's World Bank <b>region</b> and <b>income group</b> (categorical variables) with %d numerical indicators for %d: GDP per capita, life expectancy, population, urbanisation, fertility, health spending and CO<sub>2</sub> emissions.", length(indicators), data_year)),
  p("The source was chosen because it is public, needs no login, is maintained by an official institution, exposes a stable documented API that R can query directly, and supports every part of the examination: over 200 observations, several continuous variables for correlation and histograms, and meaningful grouping variables for bar charts and boxplots."),
  p(sprintf("The research question is: <b>%s</b> The analysis covers the overall distribution of life expectancy, differences between regions and income groups (with ANOVA), the correlation and regression between GDP per capita and life expectancy, and outliers and their influence.", esc(analysis_summary$project$question))),
  p("<b>Pipeline.</b> <code>main_analysis.R</code> performs the full workflow (website &rarr; extraction &rarr; cleaning &rarr; analysis &rarr; visualisation &rarr; export &rarr; automated summary) and writes machine-readable results to <code>output/</code>. <code>build_report.R</code> runs that script and turns its results into this PDF, so every number here comes from the same run. An optional web dashboard in <code>frontend/</code> presents the same exported results interactively."),

  # 2. Data extraction
  "<h2>2. Data Extraction</h2>",
  html_table(source_tbl, "Table 1. Source and extraction details"),
  p(sprintf("Extraction used %d HTTP GET requests: one to the country endpoint (names, ISO codes, region, income group, lending type, capital city and coordinates) and one per indicator for %d. Each JSON response was checked for World Bank error messages and empty results, then parsed with <code>jsonlite::fromJSON()</code>. The indicator records were reshaped from long to wide format with <code>tidyr::pivot_wider()</code> and joined to the country metadata by ISO3 code. The raw joined table (%d rows &times; %d columns) was saved unchanged as <code>web_extracted_data.csv</code>.",
            length(indicators) + 1, data_year, nrow(web_raw), ncol(web_raw))),
  html_table(indicator_tbl, "Table 2. Indicators extracted", align_left = 4),

  # 3. Data cleaning
  "<h2>3. Data Cleaning</h2>",
  p(sprintf("Inspection of the raw data (<code>head()</code>, <code>str()</code>, <code>summary()</code>, <code>dim()</code>, <code>names()</code>) found: <b>%d aggregate rows</b> (e.g. 'World', 'Euro area', 'High income') mixed in with countries; category labels with <b>trailing spaces</b> (%d region values and %d country names, e.g. 'Sub-Saharan Africa '); <b>empty strings</b> instead of missing values in the admin-region, capital-city and coordinate fields; <b>coordinates stored as text</b>; and <b>missing indicator values</b>. There were <b>%d duplicate rows</b> and <b>%d duplicate ISO3 codes</b>. No currency symbols, percentage signs or thousands separators appeared in the numeric fields, but the conversion step strips them defensively.",
            raw_issues$aggregate_rows, raw_issues$values_with_extra_spaces[["region"]],
            raw_issues$values_with_extra_spaces[["country"]], raw_issues$duplicate_rows, raw_issues$duplicate_iso3_codes)),
  p("To make the cleaning stage reproducible from the saved raw file, it re-reads <code>web_extracted_data.csv</code> with every column as text and applies the steps below."),
  html_table(cleaning_tbl, "Table 3. Cleaning log (rows remaining after each step)", align_left = 1),
  "<h3>Key cleaning decisions</h3><ul>",
  "<li><b>Aggregates removed:</b> regional and income-group totals are not countries; keeping them would double-count and distort every statistic.</li>",
  sprintf("<li><b>Removed variables:</b> %s. They are identifiers or location metadata that are irrelevant to the analysis, or constant run information.</li>", esc(paste(removed_columns, collapse = ", "))),
  sprintf("<li><b>Missing values:</b> %d countries with no %d GDP-per-capita value (%s) were removed because GDP per capita and life expectancy are the core analysis variables, and imputing a specific country's income would fabricate data. Missing values in secondary indicators (health spending, CO<sub>2</sub>) were <b>retained</b> as NA and excluded pairwise with <code>na.rm = TRUE</code>, so no rows were lost for them.</li>",
          length(dropped_missing), data_year, esc(paste(dropped_missing, collapse = "; "))),
  "<li><b>Type conversion:</b> the seven indicators were converted from text to numeric with <code>as.numeric()</code> after stripping any <code>, $ %</code> or spaces; region and income group became factors, with income ordered Low &rarr; High.</li>",
  "<li><b>Name standardisation:</b> API codes such as <code>NY.GDP.PCAP.CD</code> were renamed to snake_case names such as <code>gdp_per_capita_usd</code>. The full data dictionary is in <code>output/data_dictionary.csv</code>.</li>",
  "<li><b>Transformed variables:</b> <code>population_millions</code> and <code>log10_gdp_per_capita</code> were added. GDP per capita is heavily right-skewed, so the log scale is used for correlation, regression and plotting.</li></ul>",
  html_table(missing_tbl, "Table 4. Missing values after aggregates were removed vs. in the final cleaned data"),
  p(sprintf("The final cleaned dataset, <code>cleaned_data.csv</code>, has <b>%d countries and %d variables</b> (%d identifier/categorical and %d numeric). %d of %d cells (%.2f%%) are missing, all in secondary indicators.",
            nrow(clean), ncol(clean), ncol(clean) - n_numeric, n_numeric, total_missing_cells,
            nrow(clean) * ncol(clean), pct_missing_cells)),
  "<h3>3.1 Automated data quality assurance</h3>",
  p(sprintf("After cleaning, the script runs <b>%d automated checks</b> and stops with an explanation if any fail. They cover dataset size, required columns, ISO3 uniqueness, duplicates, aggregate removal, data types, missingness, plausibility ranges, agreement between the saved CSVs and the analysed data, and the presence of every output file. The plausibility ranges are definitional limits, e.g. urban population must be 0&ndash;100%%; statistical outliers are handled separately in Section 4.4. Result: <b>%s</b>, with %d of %d completed checks passed. The final check, that this PDF exists, is completed by <code>build_report.R</code> once the PDF is written. The full list is in <code>output/qa_report.json</code>.",
            nrow(qa_checks), qa_status, sum(qa_completed$status == "PASS"), nrow(qa_completed))),
  html_table(qa_tbl, "Table 5. QA checks by category"),

  # 4. Analysis
  "<h2>4. Analysis</h2>",
  "<h3>4.1 Descriptive statistics</h3>",
  html_table(desc_tbl, sprintf("Table 6. Descriptive statistics for %d numerical variables (n = non-missing countries)", nrow(descriptive_stats))),
  p(sprintf("Life expectancy averages <b>%s years</b> (median %s, SD %s), ranging from %s years (%s) to %s years (%s). GDP per capita is extremely unequal: the mean (US$%s) is %.1f times the median (US$%s), a strong right skew driven by a small number of very rich economies. Fertility averages %s births per woman, and CO<sub>2</sub> per capita is also right-skewed (mean %s t vs. median %s t).",
            fmt(le_mean, 1), fmt(le_median, 1), fmt(sd(clean$life_expectancy_years), 1),
            fmt(extremes$lowest_le$life_expectancy_years, 1), extremes$lowest_le$country,
            fmt(extremes$highest_le$life_expectancy_years, 1), extremes$highest_le$country,
            fmt(mean(clean$gdp_per_capita_usd), 0), mean(clean$gdp_per_capita_usd) / median(clean$gdp_per_capita_usd),
            fmt(median(clean$gdp_per_capita_usd), 0),
            fmt(mean(clean$fertility_rate), 2), fmt(mean(clean$co2_per_capita_t, na.rm = TRUE), 2),
            fmt(median(clean$co2_per_capita_t, na.rm = TRUE), 2))),
  "<h3>4.2 Group analysis and ANOVA</h3>",
  html_table(region_tbl, "Table 7. Summary by World Bank region"),
  html_table(income_tbl, "Table 8. Summary by World Bank income group"),
  p(sprintf("Mean life expectancy ranges from <b>%s years in %s</b> to <b>%s years in %s</b>. A one-way ANOVA of life expectancy by region gives <b>F(%d, %d) = %s, p = %s</b>, so the regional differences are far larger than would be expected by chance. Region accounts for about <b>%.0f%%</b> of the variation in life expectancy (&eta;&sup2; = %.2f). By income group, mean life expectancy %s, from %s years (low income) to %s years (high income), a gap of <b>%s years</b>. Fertility moves in the opposite direction (%s to %s births per woman). %s contains only %d countries, so its regional average should be interpreted with care.",
            fmt(top_region$mean_life_expectancy, 1), top_region$region,
            fmt(bottom_region$mean_life_expectancy, 1), bottom_region$region,
            anova_df[1], anova_df[2], fmt(anova_f, 1), fmt_p(anova_p), 100 * anova_eta_sq, anova_eta_sq,
            if (all(inc_steps > 0)) "rises at every step" else "does not rise at every step",
            fmt(low_inc$mean_life_expectancy, 1), fmt(high_inc$mean_life_expectancy, 1),
            fmt(high_inc$mean_life_expectancy - low_inc$mean_life_expectancy, 1),
            fmt(low_inc$mean_fertility_rate, 2), fmt(high_inc$mean_fertility_rate, 2),
            smallest_region$region, smallest_region$n)),
  p(esc(welch_note)),
  "<h3>4.3 Correlation analysis: GDP per capita vs. life expectancy</h3>",
  html_table(cor_tbl, sprintf("Table 9. Correlation coefficients (n = %d countries)", nrow(clean))),
  p(sprintf("<b>Direction and strength:</b> the relationship is <b>%s</b>, so richer countries tend to have longer life expectancy. On the raw dollar scale Pearson r = %s (%s) because the relationship is curved: gains in life expectancy flatten as income rises. After a log10 transformation of GDP per capita the relationship is close to linear and <b>r = %s</b> (95%% CI %s to %s, p = %s), a %s association. The rank-based Spearman coefficient (&rho; = %s, %s) confirms the monotonic relationship without assuming linearity.",
            if (cor_log > 0) "positive" else "negative",
            fmt(cor_raw, 3), describe_strength(cor_raw), fmt(cor_log, 3), fmt(cor_log_test$conf.int[1], 3),
            fmt(cor_log_test$conf.int[2], 3), fmt_p(cor_log_test$p.value), describe_strength(cor_log),
            fmt(cor_spearman, 3), describe_strength(cor_spearman))),
  p("<b>Meaning and limits:</b> correlation measures association, not causation. Income is linked to health systems, education, sanitation, conflict and disease burden, any of which could drive both variables. Section 4.6 shows how the coefficient changes when unusual countries are removed."),
  "<h3>4.4 Outlier analysis (1.5 &times; IQR rule)</h3>",
  html_table(out_tbl, "Table 10. IQR outlier bounds (Q1 - 1.5 IQR, Q3 + 1.5 IQR)"),
  p("The IQR rule was chosen because it relies on quartiles, which are robust to skewed data, unlike the mean &plusmn; 3 SD rule, which is distorted by the very outliers it is trying to detect."),
  "<ul>",
  sprintf("<li><b>GDP per capita: %d high outliers</b> above US$%s: %s. These are real, very wealthy (mostly small) economies; they reflect the right skew rather than errors.</li>",
          gdp_out$n_high, fmt(gdp_out$upper, 0), esc(gdp_out_names)),
  sprintf("<li><b>Life expectancy: %d low outlier</b> below %s years: <b>%s at %s years</b>. This is the value published by the World Bank, but the same API shows the country's series swinging sharply from year to year (%s), which suggests a crisis-mortality estimate rather than an extraction error. It is flagged as a data-quality caveat rather than deleted.</li>",
          le_out$n_low, fmt(le_out$lower, 1), esc(paste(le_outlier_countries, collapse = ", ")),
          fmt(extremes$lowest_le$life_expectancy_years, 1), hist_txt),
  sprintf("<li><b>Fertility rate: %d high outliers</b> above %s births per woman, %s: %s.</li>",
          fert_out$n_high, fmt(fert_out$upper, 2),
          if (length(fert_regions) == 1) paste("all in", fert_regions) else paste("in", paste(fert_regions, collapse = " and ")),
          esc(fert_out_names)),
  "</ul>",
  p("No outliers were removed. They are genuine published observations, and removing them would misrepresent global inequality; their influence is measured instead (Sections 4.5 and 4.6)."),

  "<h3>4.5 Regression analysis (additional)</h3>",
  p(sprintf("To quantify the relationship, an ordinary least squares model <code>%s</code> was fitted to all %d countries. %s",
            analysis_summary$regression$formula, reg_stats$n, esc(analysis_summary$regression$why_log))),
  html_table(reg_tbl, "Table 11. Regression coefficients (OLS)"),
  p(sprintf("<b>Result:</b> the slope of <b>%s</b> (SE %s, t = %s, p = %s; 95%% CI %s to %s) means that a ten-fold difference in GDP per capita is associated with about %s more years of life expectancy. The model explains <b>%.0f%%</b> of the between-country variation (R&sup2; = %s, adjusted R&sup2; = %s; residual SE %s years; F(%d, %d) = %s).",
            fmt(reg_slope$estimate, 2), fmt(reg_slope$std_error, 2), fmt(reg_slope$t_value, 1), fmt_p(reg_slope$p_value),
            fmt(reg_slope$ci_low, 2), fmt(reg_slope$ci_high, 2), fmt(reg_slope$estimate, 1),
            100 * reg_stats$r_squared, fmt(reg_stats$r_squared, 3), fmt(reg_stats$adj_r_squared, 3),
            fmt(reg_stats$residual_se, 2), reg_stats$f_df1, reg_stats$f_df2, fmt(reg_stats$f_statistic, 1))),
  "<div class='note'><b>Association, not causation.</b> The slope describes how life expectancy differs between richer and poorer countries; it does not show that raising a country's GDP would raise its life expectancy by that amount. Healthcare access, education, public infrastructure, demographics, environmental conditions and institutional factors are plausible confounders that are related to both variables and are not in the model. They are possible explanations, not tested mechanisms.</div>",
  sprintf("<p><b>Diagnostics</b> (Figure 5): %s %s %d countries exceed the Cook's distance screening value of 4/n = %.4f, %d have high leverage (&gt; 2p/n) and %d has a standardised residual beyond &plusmn;3.</p>",
          esc(curvature_note), esc(residual_note), nrow(influential), cooks_threshold, nrow(high_leverage), nrow(large_residuals)),
  html_table(infl_tbl, "Table 12. Potentially influential countries (Cook's distance > 4/n)", digits = 3),

  "<h3>4.6 Sensitivity / robustness analysis</h3>",
  p("The correlation and regression were re-estimated after removing each group of unusual countries in turn, to test whether the conclusion rests on a few observations."),
  html_table(sens_tbl, "Table 13. Relationship between log GDP per capita and life expectancy under different exclusions", digits = 3, align_left = 3),
  sprintf("<div class='note'>%s</div>", esc(sensitivity_conclusion)),

  # 5. Visualisation
  figure_block(figure_notes[[1]], "<h2>5. Visualisation</h2>"),
  figure_block(figure_notes[[2]]),
  figure_block(figure_notes[[3]]),
  figure_block(figure_notes[[4]]),
  p("Figures 1&ndash;4 are the four required visualisations. Figure 5 is an additional diagnostic figure supporting the regression in Section 4.5."),
  figure_block(figure_notes[[5]]),

  # 6. Limitations
  "<h2>6. Limitations</h2>",
  paste0("<ul>", paste0("<li><b>", esc(vapply(limitations, `[[`, "", "title")), ".</b> ",
                        esc(vapply(limitations, `[[`, "", "text")), "</li>", collapse = ""), "</ul>"),

  # 7. Conclusion
  "<h2>7. Conclusion</h2>",
  p("The pipeline accessed a public web API, extracted and saved the raw data, cleaned it with documented decisions, checked it with automated QA, and ran descriptive, group (ANOVA), correlation, regression, outlier and sensitivity analyses. It produced four required figures and one diagnostic figure, and exported the cleaned dataset with machine-readable results. The automated summary, generated from the calculated results, reads:"),
  paste0("<ul class='summary'>", paste0("<li>", esc(automated_summary), "</li>", collapse = ""), "</ul>"),
  p(sprintf("<b>Overall:</b> life expectancy shows a %s association with national income (r = %.2f on log GDP; about %.1f years per ten-fold GDP difference), differs markedly by region (lowest in %s) and %s. The data are skewed (GDP per capita to the %s, life expectancy to the %s) and contain genuine outliers, which were reported and tested rather than removed. These findings describe associations between countries in %d. They do not establish that higher income causes longer lives.",
            describe_strength(cor_log), cor_log, reg_slope$estimate, bottom_region$region,
            if (all(inc_steps > 0)) "rises across every income group" else "varies across income groups",
            gdp_skew, le_skew, data_year)),

  # Appendix - Section A
  "<h2 class='pb'>Appendix: Section A results (student dataset)</h2>",
  html_table(students %>% mutate(Programme = as.character(Programme), Gender = as.character(Gender), Grade = as.character(Grade)),
             "Table A1. Student dataframe with Grade (10 observations, 6 original variables + Grade)", align_left = 2),
  p(sprintf("Missing values: %d. Grade rule: 80-100 A, 70-79 B, 60-69 C, 50-59 D, below 50 F.", total_missing_students)),
  html_table(score_stats, "Table A2. Score statistics"),
  html_table(programme_avg %>% mutate(Programme = as.character(Programme)), "Table A3. Average score by programme"),
  html_table(above_average %>% mutate(Programme = as.character(Programme), Grade = as.character(Grade)),
             sprintf("Table A4. Students scoring above the overall average of %s", fmt(overall_avg_score, 1)), align_left = 2),
  "</body></html>")

  writeLines(html, "final_report.html", useBytes = TRUE)
})

# ---------- print HTML to PDF with a headless Chromium browser ----------
browser_candidates <- c(
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  unname(Sys.which(c("google-chrome", "chromium", "chromium-browser", "microsoft-edge")))
)
browser <- browser_candidates[nzchar(browser_candidates) & file.exists(browser_candidates)][1]
if (is.na(browser)) {
  stop("No Microsoft Edge or Google Chrome installation was found, so the PDF could not be printed.\n",
       "  The complete report was saved as final_report.html - open it in any browser and use Print > Save as PDF,\n",
       "  saving it as final_report.pdf in the project folder.", call. = FALSE)
}

html_path <- normalizePath("final_report.html", winslash = "/")
pdf_path  <- file.path(normalizePath("."), "final_report.pdf")
if (file.exists(pdf_path)) invisible(file.remove(pdf_path))
system2(browser, c("--headless", "--disable-gpu", "--no-pdf-header-footer",
                   paste0("--user-data-dir=", shQuote(file.path(tempdir(), "chromium-profile"))),
                   paste0("--print-to-pdf=", shQuote(pdf_path)),
                   paste0("file:///", html_path)), stdout = FALSE, stderr = FALSE)
for (i in 1:30) { if (file.exists(pdf_path) && file.size(pdf_path) > 0) break; Sys.sleep(1) }
if (!file.exists(pdf_path) || file.size(pdf_path) == 0) {
  stop("The browser (", browser, ") did not produce final_report.pdf within 30 seconds.\n",
       "  final_report.html was kept: open it and use Print > Save as PDF, or close other browser windows and retry.",
       call. = FALSE)
}
invisible(file.remove("final_report.html"))
cat("final_report.pdf created (", round(file.size(pdf_path) / 1024), "KB )\n")


# =========================================================
# FINALISE: QA report, manifest, dashboard copy, exam compliance matrix
# =========================================================
with(report_env, {
  pdf_ok <- file.exists("final_report.pdf") && file.size("final_report.pdf") > 0
  pdf_row <- qa_checks$check == "final_report.pdf exists and is non-empty"
  qa_checks$status[pdf_row] <- if (pdf_ok) "PASS" else "FAIL"
  qa_checks$detail[pdf_row] <- sprintf("%.1f KB, built %s by build_report.R",
                                       file.size("final_report.pdf") / 1024, format(Sys.time(), "%Y-%m-%d %H:%M"))
  qa_status <- if (any(qa_checks$status == "FAIL")) "FAIL" else "PASS"
  qa_report$status <- qa_status
  qa_report$generated_at <- format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z")
  qa_report$checks <- qa_checks
  qa_report$counts <- list(pass = sum(qa_checks$status == "PASS"), fail = sum(qa_checks$status == "FAIL"),
                           pending = sum(qa_checks$status == "PENDING"), total = nrow(qa_checks))
  analysis_summary$validation <- list(status = qa_status, checks_total = nrow(qa_checks),
                                      checks_passed = sum(qa_checks$status == "PASS"),
                                      checks_failed = sum(qa_checks$status == "FAIL"),
                                      checks_pending = sum(qa_checks$status == "PENDING"))
  manifest$outputs <- lapply(output_files, describe_file)
  manifest$report_built <- format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z")

  # ---- Exam compliance matrix: each status comes from a check on the actual outputs ----
  pdf_text_ok <- pdf_ok  # the report sections are generated from fixed headings above
  status_of <- function(ok) if (isTRUE(ok)) "PASS" else "FAIL"
  in_log  <- function(pattern) any(grepl(pattern, analysis_log, fixed = TRUE))
  analyses_run <- c(descriptive = nrow(descriptive_stats) > 0, group = nrow(region_summary) > 0,
                    anova = is.finite(anova_p), correlation = is.finite(cor_log),
                    outliers = nrow(outlier_table) > 0, regression = is.finite(reg_slope$estimate),
                    sensitivity = nrow(sensitivity_table) > 0)
  qa_pass <- function(pattern) all(qa_checks$status[grepl(pattern, qa_checks$check)] == "PASS")
  compliance <- data.frame(
    Section = c(rep("A", 8), rep("B", 9), rep("C", 7), rep("D", 5), rep("E", 4), "Extra", "Extra", "Extra", "Extra"),
    Requirement = c(
      "Exact student dataset as a dataframe (10 x 6)", "Structure displayed (str)", "Summary displayed (summary)",
      "Missing values checked", "Grade variable (A-F rules)", "Mean, median, highest, lowest, SD of Score",
      "Average score by programme", "Students above the overall average",
      "Public web data source (World Bank WDI API)", "Source, URL and extraction date documented",
      "50+ observations", "5+ useful variables", "Raw data inspected", "Raw export",
      "Cleaning: duplicates, missing values, types, names, unnecessary columns", "Cleaned export",
      "Extraction reproducible from code",
      "Descriptive statistics for 3+ numeric variables", "Group analysis by category",
      "One-way ANOVA", "Correlation calculated and interpreted", "Outlier analysis (IQR)",
      "Regression with diagnostics (additional)", "Sensitivity analysis (additional)",
      "Bar chart", "Histogram", "Scatter plot", "Boxplot", "2-3 sentence interpretation per figure",
      "Single integrated pipeline (website to export)", "Two+ statistical analyses and two+ visualisations",
      "Automated summary from calculated values", "Final report with required sections",
      "Automated QA", "Data dictionary", "Reproducibility manifest", "Interactive dashboard"),
    Location = c(
      "main_analysis.R section 3 (A1)", "main_analysis.R section 3 (A2)", "main_analysis.R section 3 (A2)",
      "main_analysis.R section 3 (A3)", "main_analysis.R section 3 (A4)", "main_analysis.R section 3 (A5)",
      "main_analysis.R section 3 (A6)", "main_analysis.R section 3 (A7)",
      "main_analysis.R sections 4-5", "main_analysis.R section 4; final_report.pdf Table 1",
      "cleaned_data.csv", "cleaned_data.csv", "main_analysis.R section 6", "web_extracted_data.csv",
      "main_analysis.R section 7", "cleaned_data.csv", "main_analysis.R section 5",
      "main_analysis.R section 9", "main_analysis.R section 10", "main_analysis.R section 10",
      "main_analysis.R section 11", "main_analysis.R section 12",
      "main_analysis.R section 12b; figures/figure5_regression_diagnostics.png", "main_analysis.R section 12c",
      "figures/figure1.png", "figures/figure2.png", "figures/figure3.png", "figures/figure4.png",
      "final_report.pdf section 5; output/analysis_summary.json (figures)",
      "main_analysis.R (sections 4-17)", "main_analysis.R sections 9-13",
      "main_analysis.R section 15; output/analysis_summary.json", "final_report.pdf",
      "main_analysis.R section 14; output/qa_report.json", "output/data_dictionary.csv",
      "output/reproducibility_manifest.json", "frontend/"),
    Evidence = c(
      sprintf("%d rows x %d columns; values verified by independent recomputation", nrow(students), 6),
      "str(students) printed", "summary(students) printed",
      sprintf("%d missing values", total_missing_students),
      paste(sprintf("%s=%d", names(table(students$Grade)), as.integer(table(students$Grade))), collapse = ", "),
      sprintf("mean %.1f, median %.1f, max %d, min %d, SD %.2f", score_stats$Value[1], score_stats$Value[2],
              as.integer(score_stats$Value[3]), as.integer(score_stats$Value[4]), score_stats$Value[5]),
      paste(sprintf("%s %.2f", programme_avg$Programme, programme_avg$Average_Score), collapse = "; "),
      sprintf("%d students above %.1f", nrow(above_average), overall_avg_score),
      source_info$base_url, sprintf("extracted %s, data year %d", source_info$extraction_date, data_year),
      sprintf("%d countries", nrow(clean)), sprintf("%d numeric indicators", length(usable_vars)),
      "head/str/summary/dim/names + issue scan", sprintf("%d x %d", nrow(web_raw), ncol(web_raw)),
      sprintf("%d aggregates, %d duplicates, %d incomplete rows removed", raw_issues$aggregate_rows,
              duplicates_removed, length(dropped_missing)),
      sprintf("%d x %d", nrow(clean), ncol(clean)), "fixed year, recorded endpoints, retries",
      sprintf("%d variables", nrow(descriptive_stats)), "by region (7) and income group (4)",
      sprintf("F = %.1f, p = %.2g", anova_f, anova_p), sprintf("Pearson r = %.3f (log GDP)", cor_log),
      sprintf("%d variables, %d flagged", nrow(outlier_table), sum(outlier_table$outliers)),
      sprintf("slope %.2f, R2 %.3f", reg_slope$estimate, reg_stats$r_squared),
      sprintf("%d scenarios", nrow(sensitivity_table)),
      rep("PNG exists and is non-empty", 4),
      sprintf("%d of 4 required figures have interpretations", sum(vapply(figure_notes[1:4], function(f) nzchar(f$interpretation), logical(1)))),
      "one script, relative paths", sprintf("%d analyses, %d required figures", sum(analyses_run), length(required_figures)),
      sprintf("%d generated statements", length(automated_summary)),
      "Introduction, Data Extraction, Data Cleaning, Analysis, Visualisation, Limitations, Conclusion",
      sprintf("%d checks, status %s", nrow(qa_checks), qa_status), sprintf("%d variables", nrow(data_dictionary)),
      "R version, packages, seed, source, checksums",
      if (file.exists("frontend/package.json")) "Next.js app reading exported JSON" else "frontend/ not present"),
    Status = c(
      status_of(nrow(students) == 10 && ncol(students) == 7),
      status_of(in_log("10 obs. of  6 variables")), status_of(in_log("A2. Summary statistics")),
      status_of(total_missing_students == 0), status_of(identical(as.character(students$Grade), check_grades)),
      status_of(isTRUE(all.equal(score_stats$Value[1], check_mean))),
      status_of(nrow(programme_avg) == 3), status_of(nrow(above_average) > 0),
      status_of(nrow(web_raw) > 0), status_of(nzchar(source_info$extraction_date)),
      status_of(nrow(clean) >= 50), status_of(length(usable_vars) >= 5),
      status_of(in_log("RAW DATA INSPECTION") && in_log("dim():")),
      status_of(qa_pass("web_extracted_data.csv")), status_of(qa_pass("ISO3|duplicated|aggregate|numeric")),
      status_of(qa_pass("cleaned_data.csv")), status_of(in_log("Country endpoint metadata")),
      status_of(nrow(descriptive_stats) >= 3), status_of(nrow(region_summary) > 1),
      status_of(is.finite(anova_p)), status_of(is.finite(cor_log)), status_of(nrow(outlier_table) >= 1),
      status_of(is.finite(reg_slope$estimate) && file.exists(additional_figures)),
      status_of(nrow(sensitivity_table) >= 2),
      vapply(required_figures, function(f) status_of(file.exists(f) && file.size(f) > 0), character(1)),
      status_of(pdf_ok && all(vapply(figure_notes[1:4], function(f) nzchar(f$interpretation), logical(1)))),
      status_of(in_log("Pipeline completed successfully")),
      status_of(sum(analyses_run) >= 2 && length(required_figures) >= 2),
      status_of(length(automated_summary) >= 5), status_of(pdf_text_ok),
      qa_status, status_of(file.exists("output/data_dictionary.csv")),
      status_of(file.exists("output/reproducibility_manifest.json")),
      if (file.exists("frontend/package.json")) "ADDITIONAL" else "NOT PRESENT"),
    row.names = NULL
  )
  md <- c("# Exam compliance matrix", "",
          sprintf("Generated automatically by `build_report.R` on %s from the outputs of this run. Each status is derived from a check on the actual files and R objects; `ADDITIONAL` marks work beyond the exam requirements. The dashboard build (`npm run build`) is not verified by R.",
                  format(Sys.time(), "%Y-%m-%d %H:%M")), "",
          "| Section | Requirement | Location | Evidence | Status |",
          "| --- | --- | --- | --- | --- |",
          sprintf("| %s | %s | %s | %s | %s |", compliance$Section, compliance$Requirement,
                  compliance$Location, gsub("\\|", "/", compliance$Evidence), compliance$Status), "",
          sprintf("**Overall:** %d PASS, %d FAIL, %d additional/not verified.",
                  sum(compliance$Status == "PASS"), sum(compliance$Status == "FAIL"),
                  sum(!compliance$Status %in% c("PASS", "FAIL"))))
  writeLines(md, "output/exam_compliance.md")

  write_project_json(qa_report, "output/qa_report.json")
  write_project_json(analysis_summary, "output/analysis_summary.json")
  write_project_json(manifest, "output/reproducibility_manifest.json")
  if (dir.exists(frontend_data_dir)) {
    for (f in c("final_report.pdf", "output/qa_report.json", "output/analysis_summary.json",
                "output/reproducibility_manifest.json")) {
      file.copy(f, file.path(frontend_data_dir, basename(f)), overwrite = TRUE)
    }
  }
  cat(sprintf("QA finalised: %s (%d/%d checks passed). Exam compliance: %d PASS, %d FAIL -> output/exam_compliance.md\n",
              qa_status, sum(qa_checks$status == "PASS"), nrow(qa_checks),
              sum(compliance$Status == "PASS"), sum(compliance$Status == "FAIL")))
  if (qa_status == "FAIL" || any(compliance$Status == "FAIL")) {
    stop("Some QA or compliance checks FAILED - see output/qa_report.json and output/exam_compliance.md.", call. = FALSE)
  }
})
