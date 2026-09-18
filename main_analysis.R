# =========================================================
# R PROGRAMMING AND DATA WEB EXTRACTION PRACTICAL
# =========================================================
# Pipeline: Website -> Extraction -> Cleaning -> Analysis
#           -> Visualisation -> Export -> Automated summary
#
# Run from the project folder:  Rscript main_analysis.R
# (or open in RStudio and "Source"). All paths are relative.
# =========================================================


# =========================================================
# 1. SETUP
# =========================================================

# All paths below are relative to the project folder (the folder containing this
# script). Work out where that is whether the script is run with Rscript,
# source()'d from RStudio, or sys.source()'d by build_report.R, so the project
# runs unchanged on any machine.
find_project_root <- function() {
  file_arg <- sub("^--file=", "", grep("^--file=", commandArgs(FALSE), value = TRUE))
  if (length(file_arg) == 1 && basename(file_arg) == "main_analysis.R")
    return(dirname(normalizePath(file_arg)))
  ofile <- tryCatch(sys.frame(1)$ofile, error = function(e) NULL)
  if (!is.null(ofile)) return(dirname(normalizePath(ofile)))
  getwd()  # sys.source(chdir = TRUE) and interactive use: already in the project folder
}
project_root <- find_project_root()
setwd(project_root)
if (!file.exists("main_analysis.R")) {
  stop("Could not locate the project folder (main_analysis.R not found in ", project_root,
       "). Run the script from the project folder, e.g. `Rscript main_analysis.R`.")
}

options(scipen = 999, width = 120, dplyr.summarise.inform = FALSE)
analysis_seed <- 2026
set.seed(analysis_seed)  # only used for jitter in the boxplot, so figures are reproducible
run_started <- Sys.time()

dir.create("figures", showWarnings = FALSE)
dir.create("output", showWarnings = FALSE)       # machine-readable outputs (JSON, dictionary)
frontend_data_dir <- file.path("frontend", "public", "project")  # where the dashboard reads its data

section <- function(title) {
  cat("\n", strrep("=", 70), "\n", title, "\n", strrep("=", 70), "\n", sep = "")
}


# =========================================================
# 2. PACKAGES
# =========================================================
section("2. PACKAGES")

required_packages <- c("jsonlite", "dplyr", "tidyr", "stringr", "readr",
                       "ggplot2", "scales")

missing_packages <- required_packages[!vapply(required_packages, requireNamespace,
                                              logical(1), quietly = TRUE)]
if (length(missing_packages) > 0) {
  install.packages(missing_packages, repos = "https://cloud.r-project.org")
}

suppressPackageStartupMessages({
  library(jsonlite)   # parse JSON returned by the web API
  library(dplyr)      # data manipulation
  library(tidyr)      # reshaping
  library(stringr)    # string cleaning
  library(readr)      # CSV import/export
  library(ggplot2)    # visualisation
  library(scales)     # axis formatting
})
cat("Packages loaded:", paste(required_packages, collapse = ", "), "\n")


# =========================================================
# 3. SECTION A - STUDENT DATASET (Question 1)
# =========================================================
section("3. SECTION A - R PROGRAMMING AND DATA MANIPULATION")

# ---- A1. Create the dataframe (exact exam data) ----
students <- data.frame(
  Student    = c("Alice", "Brian", "Charles", "Diana", "Edward",
                 "Faith", "George", "Hannah", "Isaac", "Jane"),
  Gender     = c("Female", "Male", "Male", "Female", "Male",
                 "Female", "Male", "Female", "Male", "Female"),
  Age        = c(21L, 23L, 22L, 20L, 24L, 21L, 22L, 23L, 20L, 22L),
  Programme  = c("Computer Science", "Data Science", "Computer Science",
                 "Information Systems", "Data Science", "Computer Science",
                 "Information Systems", "Data Science", "Computer Science",
                 "Information Systems"),
  Score      = c(78, 65, 55, 88, 72, 91, 48, 83, 61, 74),
  Attendance = c(92, 81, 76, 95, 84, 97, 68, 89, 79, 86),
  stringsAsFactors = FALSE
)
students$Gender    <- factor(students$Gender)
students$Programme <- factor(students$Programme)

cat("\nA1. Student dataframe:\n")
print(students)
cat("\nObservations:", nrow(students), " | Variables:", ncol(students), "\n")
stopifnot(nrow(students) == 10, ncol(students) == 6)

# ---- A2. Structure and summary ----
cat("\nA2. Structure:\n")
str(students)
cat("\nA2. Summary statistics:\n")
print(summary(students))

# ---- A3. Missing values ----
cat("\nA3. Missing values per column:\n")
print(colSums(is.na(students)))
total_missing_students <- sum(is.na(students))
cat("Total missing values:", total_missing_students,
    ifelse(total_missing_students == 0, "-> the dataset has NO missing values.\n",
           "-> missing values are present.\n"))

# ---- A4. Grade variable ----
# 80-100 = A, 70-79 = B, 60-69 = C, 50-59 = D, below 50 = F
students <- students %>%
  mutate(Grade = case_when(
    Score >= 80 ~ "A",
    Score >= 70 ~ "B",
    Score >= 60 ~ "C",
    Score >= 50 ~ "D",
    TRUE        ~ "F"
  ),
  Grade = factor(Grade, levels = c("A", "B", "C", "D", "F")))

cat("\nA4. Students with Grade:\n")
print(students[, c("Student", "Score", "Grade")])
cat("\nGrade distribution:\n")
print(table(students$Grade))

# ---- A5. Score statistics ----
score_stats <- data.frame(
  Statistic = c("Mean", "Median", "Highest", "Lowest", "Standard deviation"),
  Value = c(mean(students$Score), median(students$Score), max(students$Score),
            min(students$Score), sd(students$Score))
)
cat("\nA5. Score statistics:\n")
print(score_stats, row.names = FALSE, digits = 4)

# ---- A6. Average score by programme ----
programme_avg <- students %>%
  group_by(Programme) %>%
  summarise(Students = n(), Average_Score = round(mean(Score), 2)) %>%
  arrange(desc(Average_Score))
cat("\nA6. Average score by programme:\n")
print(as.data.frame(programme_avg), row.names = FALSE)

# ---- A7. Students above the overall average ----
overall_avg_score <- mean(students$Score)
above_average <- students %>%
  filter(Score > overall_avg_score) %>%
  select(Student, Programme, Score, Grade) %>%
  arrange(desc(Score))
cat("\nA7. Overall average score:", overall_avg_score, "\n")
cat("Students scoring above the overall average (", nrow(above_average), "):\n", sep = "")
print(above_average, row.names = FALSE)

# ---- Section A independent verification ----
# Recompute with different base-R routes so an entry error cannot slip through.
sorted_scores <- sort(students$Score)
check_mean    <- sum(students$Score) / length(students$Score)
check_median  <- (sorted_scores[5] + sorted_scores[6]) / 2
check_sd      <- sqrt(sum((students$Score - check_mean)^2) / (length(students$Score) - 1))
check_prog    <- tapply(students$Score, students$Programme, mean)
check_grades  <- as.character(cut(students$Score, breaks = c(-Inf, 50, 60, 70, 80, Inf),
                                  labels = c("F", "D", "C", "B", "A"), right = FALSE))

stopifnot(
  sum(students$Score) == 715, sum(students$Attendance) == 847, sum(students$Age) == 218,
  isTRUE(all.equal(score_stats$Value[1], check_mean)),
  isTRUE(all.equal(score_stats$Value[2], check_median)),
  score_stats$Value[3] == sorted_scores[10],
  score_stats$Value[4] == sorted_scores[1],
  isTRUE(all.equal(score_stats$Value[5], check_sd)),
  isTRUE(all.equal(as.numeric(check_prog[as.character(programme_avg$Programme)]),
                   programme_avg$Average_Score, tolerance = 0.01)),
  identical(as.character(students$Grade), check_grades),
  all(above_average$Score > check_mean),
  sum(students$Score > check_mean) == nrow(above_average)
)
cat("\nSection A verification: all independent checks PASSED.\n")


# =========================================================
# 4. WEB SOURCE INFORMATION
# =========================================================
section("4. WEB SOURCE INFORMATION")

# Why 2022: when the source was selected (2026-09-18) the 2021-2023 vintages were
# checked, and 2022 had the best joint coverage of GDP per capita (256 non-missing
# economies vs 251 for 2023) while every other indicator was equally complete.
# A fixed year (not "most recent value") keeps the extraction reproducible.
data_year <- 2022

indicators <- c(
  "NY.GDP.PCAP.CD"       = "gdp_per_capita_usd",        # GDP per capita (current US$)
  "SP.DYN.LE00.IN"       = "life_expectancy_years",     # Life expectancy at birth, total (years)
  "SP.POP.TOTL"          = "population",                # Population, total
  "SP.URB.TOTL.IN.ZS"    = "urban_pop_pct",             # Urban population (% of total)
  "SP.DYN.TFRT.IN"       = "fertility_rate",            # Fertility rate, total (births per woman)
  "SH.XPD.CHEX.PC.CD"    = "health_exp_per_capita_usd", # Current health expenditure per capita (US$)
  "EN.GHG.CO2.PC.CE.AR5" = "co2_per_capita_t"           # CO2 emissions per capita (t CO2e/capita)
)

source_info <- list(
  website         = "World Bank Open Data - World Development Indicators (API v2)",
  base_url        = "https://api.worldbank.org/v2/",
  country_url     = "https://api.worldbank.org/v2/country?format=json&per_page=400",
  indicator_url   = sprintf("https://api.worldbank.org/v2/country/all/indicator/<CODE>?format=json&date=%d&per_page=400", data_year),
  extraction_date = format(Sys.Date(), "%Y-%m-%d"),
  description     = paste("Country-level development indicators for", data_year,
                          "plus each economy's World Bank region and income group."),
  method          = "HTTP GET of public JSON endpoints (base R url()) parsed with jsonlite::fromJSON()",
  error_handling  = "Each request is retried up to 3 times with a growing pause; empty responses and World Bank error messages stop the run with an explanation",
  year_rationale  = "2022 = best joint coverage of all seven indicators among the 2021-2023 vintages when the source was selected",
  expected_obs    = "~296 economies incl. ~78 aggregates; ~217 countries after cleaning",
  expected_vars   = paste(c("country", "iso3", "region", "income_level", unname(indicators)),
                          collapse = ", ")
)
for (nm in names(source_info)) cat(sprintf("%-16s: %s\n", nm, source_info[[nm]]))


# =========================================================
# 5. WEB EXTRACTION
# =========================================================
section("5. WEB EXTRACTION")

# Fetch a World Bank API URL and parse its JSON, with retries.
# (Download via base R, then parse, so it does not depend on the curl package.)
# A valid response is a 2-element array: [paging metadata, records]. The API
# reports problems (e.g. an unknown indicator code) as a 1-element array holding
# a "message" object, so that case is detected and explained rather than
# failing later with an obscure subscript error.
fetch_json <- function(api_url, tries = 3) {
  last_error <- NULL
  for (attempt in seq_len(tries)) {
    result <- tryCatch({
      con <- url(api_url, headers = c("User-Agent" = "R-practical-exam (educational use)"))
      on.exit(close(con), add = TRUE)
      body <- paste(readLines(con, warn = FALSE, encoding = "UTF-8"), collapse = "")
      if (!nzchar(body)) stop("the server returned an empty response")
      fromJSON(body)
    }, error = function(e) e)
    if (!inherits(result, "error")) {
      if (length(result) >= 1 && !is.null(result[[1]]$message)) {
        api_msg <- result[[1]]$message
        stop("World Bank API returned an error for ", api_url, ":\n  ",
             paste(unlist(api_msg), collapse = " "),
             "\n  Check that the indicator code and year are still valid at https://data.worldbank.org/indicator.")
      }
      if (length(result) < 2 || is.null(result[[2]]) || NROW(result[[2]]) == 0) {
        stop("World Bank API returned no records for ", api_url,
             "\n  The indicator/year may have been withdrawn or renamed; open the URL in a browser to inspect it.")
      }
      return(result)
    }
    last_error <- conditionMessage(result)
    message("Attempt ", attempt, "/", tries, " failed: ", last_error)
    if (attempt < tries) Sys.sleep(2 * attempt)
  }
  stop("Could not retrieve ", api_url, " after ", tries, " attempts.\n  Last error: ", last_error,
       "\n  Possible causes: no internet connection, a firewall/proxy blocking api.worldbank.org,",
       " or a temporary World Bank outage.\n  Check the connection and try again.")
}

# Fail early, with a clear message, if an expected column is missing
require_columns <- function(data, cols, what) {
  missing_cols <- setdiff(cols, names(data))
  if (length(missing_cols) > 0) {
    stop(what, " is missing expected column(s): ", paste(missing_cols, collapse = ", "),
         "\n  The World Bank API format may have changed; inspect web_extracted_data.csv.")
  }
  invisible(TRUE)
}

# 5.1 Country metadata (names, region, income group, capital city, ...)
country_json <- fetch_json(source_info$country_url)
cat("Country endpoint metadata: total records =", country_json[[1]]$total, "\n")

country_meta <- country_json[[2]]
require_columns(country_meta, c("id", "iso2Code", "name", "region", "adminregion", "incomeLevel",
                                "lendingType", "capitalCity", "longitude", "latitude"),
                "Country metadata from the API")
country_raw <- data.frame(
  iso3         = country_meta$id,
  iso2         = country_meta$iso2Code,
  country      = country_meta$name,
  region       = country_meta$region$value,
  admin_region = country_meta$adminregion$value,
  income_level = country_meta$incomeLevel$value,
  lending_type = country_meta$lendingType$value,
  capital_city = country_meta$capitalCity,
  longitude    = country_meta$longitude,
  latitude     = country_meta$latitude,
  stringsAsFactors = FALSE
)

# 5.2 Indicator values, one API call per indicator
indicator_long <- lapply(names(indicators), function(code) {
  ind_url <- sub("<CODE>", code, source_info$indicator_url, fixed = TRUE)
  ind_json <- fetch_json(ind_url)
  d <- ind_json[[2]]
  require_columns(d, c("countryiso3code", "date", "value"), paste("Indicator", code))
  cat(sprintf("  %-22s -> %3d records (%d non-missing)\n", code, nrow(d), sum(!is.na(d$value))))
  data.frame(iso3 = d$countryiso3code, indicator_code = code,
             year = d$date, value = d$value, stringsAsFactors = FALSE)
}) %>% bind_rows()

# 5.3 Reshape to one row per economy and join to metadata (raw API codes kept as column names)
indicator_wide <- indicator_long %>%
  filter(iso3 != "") %>%
  select(-year) %>%
  pivot_wider(names_from = indicator_code, values_from = value)

web_raw <- country_raw %>%
  left_join(indicator_wide, by = "iso3") %>%
  mutate(data_year = data_year, extraction_date = source_info$extraction_date)

# Save the raw extracted web data exactly as retrieved (before any cleaning)
write_csv(web_raw, "web_extracted_data.csv", na = "")
cat("\nRaw web data saved to web_extracted_data.csv:",
    nrow(web_raw), "rows x", ncol(web_raw), "columns\n")


# =========================================================
# 6. RAW DATA INSPECTION
# =========================================================
section("6. RAW DATA INSPECTION")

cat("dim():", dim(web_raw), "\n\nnames():\n"); print(names(web_raw))
cat("\nhead():\n"); print(head(web_raw, 6))
cat("\nstr():\n"); str(web_raw)
cat("\nsummary():\n"); print(summary(web_raw))

raw_issues <- list(
  missing_values_per_column = colSums(is.na(web_raw)),
  empty_strings_per_column  = sapply(web_raw, function(x) sum(is.character(x) & x == "", na.rm = TRUE)),
  duplicate_rows            = sum(duplicated(web_raw)),
  duplicate_iso3_codes      = sum(duplicated(web_raw$iso3)),
  values_with_extra_spaces  = sapply(web_raw[sapply(web_raw, is.character)],
                                     function(x) sum(x != str_trim(x), na.rm = TRUE)),
  aggregate_rows            = sum(str_trim(web_raw$region) == "Aggregates", na.rm = TRUE),
  numeric_stored_as_text    = names(web_raw)[sapply(web_raw, function(x)
                                is.character(x) && all(grepl("^-?[0-9.]*$", x[!is.na(x)])) &&
                                any(nzchar(x), na.rm = TRUE))]
)
cat("\nMissing values per column:\n"); print(raw_issues$missing_values_per_column)
cat("\nEmpty strings per column:\n"); print(raw_issues$empty_strings_per_column[raw_issues$empty_strings_per_column > 0])
cat("\nDuplicate rows:", raw_issues$duplicate_rows,
    "| Duplicate ISO3 codes:", raw_issues$duplicate_iso3_codes, "\n")
cat("Text values with leading/trailing spaces:\n")
print(raw_issues$values_with_extra_spaces[raw_issues$values_with_extra_spaces > 0])
cat("Rows that are regional/income AGGREGATES rather than countries:", raw_issues$aggregate_rows, "\n")
cat("Numeric data stored as text:", paste(raw_issues$numeric_stored_as_text, collapse = ", "), "\n")
cat("Region categories:\n"); print(table(web_raw$region, useNA = "ifany"))
cat("Income categories:\n"); print(table(web_raw$income_level, useNA = "ifany"))


# =========================================================
# 7. DATA CLEANING
# =========================================================
section("7. DATA CLEANING")

# Cleaning starts from the saved raw CSV, read with every column as text,
# so the cleaning stage is fully reproducible from web_extracted_data.csv.
raw_from_file <- read_csv("web_extracted_data.csv",
                          col_types = cols(.default = col_character()),
                          na = character())
require_columns(raw_from_file, c("iso3", "country", "region", "income_level", names(indicators)),
                "web_extracted_data.csv")
cleaning_log <- data.frame(step = character(), rows_after = integer(), note = character())
log_step <- function(step, data, note) {
  cleaning_log <<- rbind(cleaning_log, data.frame(step = step, rows_after = nrow(data), note = note))
  data
}
clean <- log_step("0. Raw data read", raw_from_file, "All columns read as character")

# 7.1 Trim whitespace and convert empty strings to NA
clean <- clean %>%
  mutate(across(everything(), ~ str_squish(.x)),
         across(everything(), ~ na_if(.x, "")))
clean <- log_step("1. Trim spaces / empty -> NA", clean,
                  "Removed trailing spaces (e.g. 'Sub-Saharan Africa '); blank cells set to NA")

# 7.2 Remove aggregate rows (World, regions, income groups) - they are not countries
n_before <- nrow(clean)
clean <- clean %>% filter(region != "Aggregates")
clean <- log_step("2. Remove aggregates", clean,
                  sprintf("%d aggregate rows removed (e.g. 'World', 'Euro area')", n_before - nrow(clean)))

# 7.3 Remove duplicates (whole-row and repeated ISO3 codes)
n_before <- nrow(clean)
clean <- clean %>% distinct() %>% distinct(iso3, .keep_all = TRUE)
duplicates_removed <- n_before - nrow(clean)
clean <- log_step("3. Remove duplicates", clean,
                  sprintf("%d duplicate rows removed", n_before - nrow(clean)))

# 7.4 Remove columns that are irrelevant to the analysis
removed_columns <- c("iso2", "admin_region", "lending_type", "capital_city",
                     "longitude", "latitude", "data_year", "extraction_date")
clean <- clean %>% select(-all_of(removed_columns))
clean <- log_step("4. Remove unnecessary columns", clean,
                  paste("Dropped:", paste(removed_columns, collapse = ", ")))

# 7.5 Standardise variable names to snake_case
clean <- clean %>% rename(!!!setNames(names(indicators), unname(indicators)))
names(clean) <- str_to_lower(str_replace_all(names(clean), "[^A-Za-z0-9]+", "_"))
clean <- log_step("5. Standardise names", clean, "API codes renamed to descriptive snake_case names")

# 7.6 Convert data types
numeric_vars <- unname(indicators)
clean <- clean %>%
  mutate(across(all_of(numeric_vars), ~ as.numeric(str_remove_all(.x, "[,$%\\s]"))),
         income_level = na_if(income_level, "Not classified"),
         income_level = factor(income_level,
                               levels = c("Low income", "Lower middle income",
                                          "Upper middle income", "High income")),
         region = factor(region))
clean <- log_step("6. Convert data types", clean,
                  "7 indicators -> numeric; region & income_level -> factor; 'Not classified' income -> NA")

# 7.7 Handle missing values
missing_before <- colSums(is.na(clean))
cat("Missing values before handling:\n"); print(missing_before)
dropped_missing <- clean %>%
  filter(is.na(gdp_per_capita_usd) | is.na(life_expectancy_years)) %>%
  pull(country)
clean <- clean %>% filter(!is.na(gdp_per_capita_usd), !is.na(life_expectancy_years))
clean <- log_step("7. Handle missing values", clean,
                  sprintf("%d countries lacking GDP per capita or life expectancy removed; other NAs retained (no imputation)",
                          length(dropped_missing)))
cat("\nCountries removed for missing core indicators:", paste(dropped_missing, collapse = ", "), "\n")

# 7.8 Derived / transformed variables
clean <- clean %>%
  mutate(population_millions = round(population / 1e6, 3),
         log10_gdp_per_capita = log10(gdp_per_capita_usd)) %>%
  select(country, iso3, region, income_level, gdp_per_capita_usd, log10_gdp_per_capita,
         life_expectancy_years, population, population_millions, urban_pop_pct,
         fertility_rate, health_exp_per_capita_usd, co2_per_capita_t) %>%
  arrange(country)
clean <- log_step("8. Derive variables", clean,
                  "Added population_millions and log10_gdp_per_capita")

cat("\nCleaning log:\n"); print(cleaning_log, row.names = FALSE)

# 7.9 Validate the cleaned dataset
cat("\nstr():\n"); str(clean)
cat("\nsummary():\n"); print(summary(clean))
cat("\nnrow():", nrow(clean), " ncol():", ncol(clean), "\n")
cat("\nRemaining missing values per column:\n"); print(colSums(is.na(clean)))

stopifnot(
  nrow(clean) >= 50,
  ncol(clean) >= 5,
  !any(duplicated(clean$iso3)),
  all(sapply(clean[numeric_vars], is.numeric)),
  is.factor(clean$region), is.factor(clean$income_level),
  !"Aggregates" %in% clean$region
)
cat("Cleaned data validation: PASSED\n")


# =========================================================
# 8. DATA EXPORT
# =========================================================
section("8. DATA EXPORT")
write_csv(clean, "cleaned_data.csv", na = "")
cat("Cleaned data saved to cleaned_data.csv:", nrow(clean), "rows x", ncol(clean), "columns\n")


# =========================================================
# 9. DESCRIPTIVE ANALYSIS (C1)
# =========================================================
section("9. DESCRIPTIVE ANALYSIS (C1)")

descriptive_vars <- c("gdp_per_capita_usd", "life_expectancy_years", "urban_pop_pct",
                      "fertility_rate", "health_exp_per_capita_usd", "co2_per_capita_t")

descriptive_stats <- lapply(descriptive_vars, function(v) {
  x <- clean[[v]]
  data.frame(variable = v, n = sum(!is.na(x)), missing = sum(is.na(x)),
             mean = mean(x, na.rm = TRUE), median = median(x, na.rm = TRUE),
             min = min(x, na.rm = TRUE), max = max(x, na.rm = TRUE),
             sd = sd(x, na.rm = TRUE))
}) %>% bind_rows()
print(descriptive_stats %>% mutate(across(where(is.numeric), ~ round(.x, 2))), row.names = FALSE)

# Which countries sit at the extremes of the two key variables
extremes <- list(
  highest_gdp = clean %>% slice_max(gdp_per_capita_usd, n = 1),
  lowest_gdp  = clean %>% slice_min(gdp_per_capita_usd, n = 1),
  highest_le  = clean %>% slice_max(life_expectancy_years, n = 1),
  lowest_le   = clean %>% slice_min(life_expectancy_years, n = 1)
)
cat(sprintf("\nHighest GDP per capita: %s (US$%s); lowest: %s (US$%s)\n",
            extremes$highest_gdp$country, comma(extremes$highest_gdp$gdp_per_capita_usd),
            extremes$lowest_gdp$country, comma(extremes$lowest_gdp$gdp_per_capita_usd)))
cat(sprintf("Highest life expectancy: %s (%.1f yrs); lowest: %s (%.1f yrs)\n",
            extremes$highest_le$country, extremes$highest_le$life_expectancy_years,
            extremes$lowest_le$country, extremes$lowest_le$life_expectancy_years))


# =========================================================
# 10. GROUP ANALYSIS (C2)
# =========================================================
section("10. GROUP ANALYSIS (C2)")

region_summary <- clean %>%
  group_by(region) %>%
  summarise(countries = n(),
            mean_life_expectancy = mean(life_expectancy_years),
            median_life_expectancy = median(life_expectancy_years),
            median_gdp_per_capita = median(gdp_per_capita_usd),
            mean_fertility_rate = mean(fertility_rate, na.rm = TRUE),
            mean_urban_pct = mean(urban_pop_pct, na.rm = TRUE)) %>%
  arrange(desc(mean_life_expectancy))
cat("Summary by World Bank region:\n")
print(as.data.frame(region_summary %>% mutate(across(where(is.numeric), ~ round(.x, 2)))), row.names = FALSE)

income_summary <- clean %>%
  filter(!is.na(income_level)) %>%
  group_by(income_level) %>%
  summarise(countries = n(),
            mean_life_expectancy = mean(life_expectancy_years),
            sd_life_expectancy = sd(life_expectancy_years),
            median_gdp_per_capita = median(gdp_per_capita_usd),
            mean_fertility_rate = mean(fertility_rate, na.rm = TRUE))
cat("\nSummary by World Bank income group:\n")
print(as.data.frame(income_summary %>% mutate(across(where(is.numeric), ~ round(.x, 2)))), row.names = FALSE)

# Is the difference in life expectancy across regions statistically meaningful?
region_anova <- summary(aov(life_expectancy_years ~ region, data = clean))
cat("\nOne-way ANOVA, life expectancy by region:\n"); print(region_anova)
anova_p <- region_anova[[1]][["Pr(>F)"]][1]

# Classic ANOVA assumes equal variances. Regional SDs differ, so also run Welch's
# ANOVA (no equal-variance assumption) as a robustness check on the conclusion.
region_sd <- clean %>% group_by(region) %>% summarise(sd = sd(life_expectancy_years), n = n()) %>%
  arrange(desc(sd))
welch_anova <- oneway.test(life_expectancy_years ~ region, data = clean, var.equal = FALSE)
welch_note <- sprintf(
  "Regional SDs range from %.1f (%s) to %.1f (%s), so the equal-variance assumption is questionable. Welch's ANOVA, which does not assume equal variances, gives F(%.0f, %.1f) = %.1f, p = %.2g, %s.",
  min(region_sd$sd), region_sd$region[which.min(region_sd$sd)], max(region_sd$sd), region_sd$region[1],
  welch_anova$parameter[1], welch_anova$parameter[2], welch_anova$statistic, welch_anova$p.value,
  if ((welch_anova$p.value < 0.05) == (anova_p < 0.05)) "so the conclusion is unchanged" else "which CHANGES the conclusion")
cat("\n", welch_note, "\n", sep = "")


# =========================================================
# 11. CORRELATION ANALYSIS (C3)
# =========================================================
section("11. CORRELATION ANALYSIS (C3)")

describe_strength <- function(r) {
  a <- abs(r)
  strength <- if (a >= 0.8) "very strong" else if (a >= 0.6) "strong" else
              if (a >= 0.4) "moderate" else if (a >= 0.2) "weak" else "very weak / negligible"
  direction <- if (r > 0) "positive" else "negative"
  paste(strength, direction)
}

cor_raw      <- cor(clean$gdp_per_capita_usd, clean$life_expectancy_years, method = "pearson")
cor_log_test <- cor.test(clean$log10_gdp_per_capita, clean$life_expectancy_years, method = "pearson")
cor_log      <- unname(cor_log_test$estimate)
cor_spearman <- cor(clean$gdp_per_capita_usd, clean$life_expectancy_years, method = "spearman")
r_squared    <- cor_log^2

correlation_table <- data.frame(
  pair = c("GDP per capita vs life expectancy",
           "log10(GDP per capita) vs life expectancy",
           "GDP per capita vs life expectancy"),
  method = c("Pearson", "Pearson", "Spearman (rank)"),
  r = c(cor_raw, cor_log, cor_spearman),
  interpretation = sapply(c(cor_raw, cor_log, cor_spearman), describe_strength)
)
print(correlation_table %>% mutate(r = round(r, 3)), row.names = FALSE)
cat(sprintf("\nPearson r (log GDP) = %.3f, 95%% CI [%.3f, %.3f], p = %.2g, R^2 = %.3f, n = %d\n",
            cor_log, cor_log_test$conf.int[1], cor_log_test$conf.int[2],
            cor_log_test$p.value, r_squared, nrow(clean)))
cat("Interpretation: richer countries tend to have longer life expectancy (", describe_strength(cor_log),
    "). The relationship is curved - gains flatten at higher incomes - so log GDP fits it better.\n",
    "This is an association between countries, not proof that income causes longevity;\n",
    "health spending, education, conflict and other factors are confounders.\n", sep = "")

# Correlation matrix of the main numeric variables for context
cor_matrix <- cor(clean[, c("log10_gdp_per_capita", "life_expectancy_years", "urban_pop_pct",
                            "fertility_rate", "co2_per_capita_t")], use = "pairwise.complete.obs")
cat("\nCorrelation matrix (pairwise complete):\n"); print(round(cor_matrix, 2))


# =========================================================
# 12. OUTLIER ANALYSIS (C4) - IQR method
# =========================================================
section("12. OUTLIER ANALYSIS (C4)")

iqr_outliers <- function(data, var) {
  x  <- data[[var]]
  q1 <- unname(quantile(x, 0.25, na.rm = TRUE))
  q3 <- unname(quantile(x, 0.75, na.rm = TRUE))
  iqr_value <- q3 - q1
  lower <- q1 - 1.5 * iqr_value
  upper <- q3 + 1.5 * iqr_value
  flagged <- data %>%
    filter(!is.na(.data[[var]]), .data[[var]] < lower | .data[[var]] > upper) %>%
    select(country, region, value = all_of(var)) %>%
    arrange(desc(value))
  list(variable = var, q1 = q1, q3 = q3, iqr = iqr_value, lower = lower, upper = upper,
       n_outliers = nrow(flagged), n_low = sum(flagged$value < lower),
       n_high = sum(flagged$value > upper), outliers = flagged)
}

outlier_results <- lapply(c("gdp_per_capita_usd", "life_expectancy_years", "fertility_rate"),
                          function(v) iqr_outliers(clean, v))
names(outlier_results) <- c("gdp_per_capita_usd", "life_expectancy_years", "fertility_rate")

outlier_table <- bind_rows(lapply(outlier_results, function(o) data.frame(
  variable = o$variable, Q1 = o$q1, Q3 = o$q3, IQR = o$iqr,
  lower_bound = o$lower, upper_bound = o$upper,
  outliers = o$n_outliers, low = o$n_low, high = o$n_high)))
print(outlier_table %>% mutate(across(where(is.numeric), ~ round(.x, 2))), row.names = FALSE)

for (o in outlier_results) {
  cat("\nPotential outliers in", o$variable, ":\n")
  if (o$n_outliers == 0) cat("  none\n") else
    print(as.data.frame(o$outliers %>% mutate(value = round(value, 2))), row.names = FALSE)
}
cat("\nOutliers are genuine published country values (e.g. very rich small economies), so they are",
    "\nreported and retained, not deleted.\n")

# Sensitivity check: does the correlation depend on the life-expectancy outlier(s)?
le_outlier_countries <- outlier_results$life_expectancy_years$outliers$country
clean_no_le_outliers <- clean %>% filter(!country %in% le_outlier_countries)
cor_log_no_outliers  <- cor(clean_no_le_outliers$log10_gdp_per_capita,
                            clean_no_le_outliers$life_expectancy_years)
cat(sprintf("\nSensitivity: Pearson r (log GDP vs life expectancy) = %.3f with all %d countries, %.3f without the %d life-expectancy outlier(s) (%s).\n",
            cor_log, nrow(clean), cor_log_no_outliers, length(le_outlier_countries),
            paste(le_outlier_countries, collapse = ", ")))
# Plausibility check: fetch the multi-year series for any life-expectancy outlier from the same API
le_outlier_iso3 <- clean$iso3[clean$country %in% le_outlier_countries]
le_outlier_history <- lapply(le_outlier_iso3, function(iso) {
  h <- fetch_json(sprintf("https://api.worldbank.org/v2/country/%s/indicator/SP.DYN.LE00.IN?format=json&date=%d:%d",
                          iso, data_year - 7, data_year + 1))[[2]]
  data.frame(country = h$country$value, year = as.integer(h$date), life_expectancy = h$value)
}) %>% bind_rows() %>% arrange(country, year)
cat("\nLife-expectancy history of the outlier country(ies), same API:\n")
print(le_outlier_history, row.names = FALSE)
cat("A series that swings this much between adjacent years points to a crisis-mortality estimate in the",
    "\nsource rather than an extraction error; the value is kept but flagged as a data-quality caveat.\n")


# =========================================================
# 12b. REGRESSION ANALYSIS AND DIAGNOSTICS (additional analysis)
# =========================================================
section("12b. REGRESSION ANALYSIS AND DIAGNOSTICS")

# GDP per capita is strongly right-skewed (mean ~3x median, 16 IQR outliers), and
# the scatter plot shows life expectancy rising steeply at low incomes and then
# levelling off. Regressing on log10(GDP per capita) turns that curve into an
# approximately straight line, and the slope has a simple reading: the change in
# life expectancy associated with a ten-fold difference in GDP per capita.
reg_model   <- lm(life_expectancy_years ~ log10_gdp_per_capita, data = clean)
reg_summary <- summary(reg_model)
reg_ci      <- confint(reg_model, level = 0.95)
reg_coefs   <- as.data.frame(reg_summary$coefficients)
reg_table <- data.frame(
  term      = c("Intercept", "log10(GDP per capita)"),
  estimate  = reg_coefs[, "Estimate"],
  std_error = reg_coefs[, "Std. Error"],
  t_value   = reg_coefs[, "t value"],
  p_value   = reg_coefs[, "Pr(>|t|)"],
  ci_low    = reg_ci[, 1],
  ci_high   = reg_ci[, 2],
  row.names = NULL
)
reg_fstat <- reg_summary$fstatistic
reg_stats <- list(
  n = nobs(reg_model),
  r_squared = reg_summary$r.squared,
  adj_r_squared = reg_summary$adj.r.squared,
  residual_se = reg_summary$sigma,
  f_statistic = unname(reg_fstat["value"]),
  f_df1 = unname(reg_fstat["numdf"]), f_df2 = unname(reg_fstat["dendf"]),
  f_p_value = unname(pf(reg_fstat["value"], reg_fstat["numdf"], reg_fstat["dendf"], lower.tail = FALSE))
)
reg_slope <- reg_table[2, ]
cat("Model: life_expectancy_years ~ log10_gdp_per_capita (OLS, n =", reg_stats$n, ")\n")
print(reg_table %>% mutate(across(where(is.numeric), ~ signif(.x, 4)),
                           p_value = format.pval(p_value, digits = 3)), row.names = FALSE)
cat(sprintf("R^2 = %.3f, adjusted R^2 = %.3f, residual SE = %.2f years, F(%d, %d) = %.1f\n",
            reg_stats$r_squared, reg_stats$adj_r_squared, reg_stats$residual_se,
            reg_stats$f_df1, reg_stats$f_df2, reg_stats$f_statistic))
cat(sprintf("Interpretation: a ten-fold difference in GDP per capita is associated with %.1f more years of\nlife expectancy (95%% CI %.1f to %.1f). This is an association between countries, not a causal effect.\n",
            reg_slope$estimate, reg_slope$ci_low, reg_slope$ci_high))

# Diagnostics. Conventional screening thresholds (rules of thumb, not tests):
#   Cook's distance > 4/n        -> potentially influential observation
#   leverage (hat value) > 2p/n  -> unusually extreme log GDP (p = 2 parameters)
#   |standardised residual| > 3  -> country far from the fitted line
n_reg <- reg_stats$n
cooks_threshold    <- 4 / n_reg
leverage_threshold <- 2 * length(coef(reg_model)) / n_reg
reg_diag <- clean %>%
  transmute(country, region, income_level, log10_gdp_per_capita, life_expectancy_years,
            fitted = fitted(reg_model), residual = resid(reg_model),
            std_residual = rstandard(reg_model), leverage = hatvalues(reg_model),
            cooks_d = cooks.distance(reg_model))
influential <- reg_diag %>% filter(cooks_d > cooks_threshold) %>% arrange(desc(cooks_d))
high_leverage   <- reg_diag %>% filter(leverage > leverage_threshold)
large_residuals <- reg_diag %>% filter(abs(std_residual) > 3)
residual_normality <- shapiro.test(resid(reg_model))
cat(sprintf("\nCook's distance > 4/n (%.4f): %d countries\n", cooks_threshold, nrow(influential)))
print(as.data.frame(influential %>% select(country, life_expectancy_years, std_residual, leverage, cooks_d) %>%
                      mutate(across(where(is.numeric), ~ round(.x, 3)))), row.names = FALSE)
cat(sprintf("High leverage (> %.4f): %d | |standardised residual| > 3: %d (%s)\n",
            leverage_threshold, nrow(high_leverage), nrow(large_residuals),
            paste(large_residuals$country, collapse = ", ")))
cat(sprintf("Shapiro-Wilk test of residual normality: W = %.3f, p = %.2g\n",
            residual_normality$statistic, residual_normality$p.value))
res <- resid(reg_model)
residual_skewness <- mean((res - mean(res))^3) / sd(res)^3
residual_note <- if (residual_normality$p.value < 0.05) {
  sprintf("Residuals depart from normality (Shapiro-Wilk p = %.2g; skewness %.2f, %s), so p-values and confidence intervals should be read as approximate. With n = %d the coefficient estimates themselves remain informative.",
          residual_normality$p.value, residual_skewness,
          if (residual_skewness < 0) "a longer tail of countries far BELOW the fitted line" else "a longer tail of countries far ABOVE the fitted line",
          n_reg)
} else {
  sprintf("No significant departure from residual normality was detected (Shapiro-Wilk p = %.2g).",
          residual_normality$p.value)
}
cat(residual_note, "\n")

# Linearity check: does adding a squared log-GDP term improve the fit?
quad_model  <- lm(life_expectancy_years ~ log10_gdp_per_capita + I(log10_gdp_per_capita^2), data = clean)
curvature_p <- anova(reg_model, quad_model)[["Pr(>F)"]][2]
curvature_note <- if (curvature_p < 0.05) {
  sprintf("Adding a squared log-GDP term improves the fit (F-test p = %.2g), so some curvature remains even on the log scale; the straight line is a useful summary rather than an exact form.", curvature_p)
} else {
  sprintf("Adding a squared log-GDP term does not significantly improve the fit (F-test p = %.2g), supporting the log-linear form.", curvature_p)
}
cat(curvature_note, "\n")


# =========================================================
# 12c. SENSITIVITY / ROBUSTNESS ANALYSIS
# =========================================================
section("12c. SENSITIVITY / ROBUSTNESS ANALYSIS")

# Re-estimate the GDP-life expectancy relationship after removing different
# groups of unusual countries. If the direction and strength survive every
# scenario, the headline conclusion does not rest on a handful of observations.
gdp_outlier_countries <- outlier_results$gdp_per_capita_usd$outliers$country
fit_scenario <- function(label, data, excluded) {
  m <- lm(life_expectancy_years ~ log10_gdp_per_capita, data = data)
  r <- cor(data$log10_gdp_per_capita, data$life_expectancy_years)
  data.frame(scenario = label, n = nrow(data), excluded = excluded,
             pearson_r_log_gdp = r,
             spearman_rho = cor(data$gdp_per_capita_usd, data$life_expectancy_years, method = "spearman"),
             slope = unname(coef(m)[2]), r_squared = summary(m)$r.squared,
             strength = describe_strength(r))
}
sensitivity_table <- bind_rows(
  fit_scenario("All countries (baseline)", clean, "none"),
  fit_scenario("Excluding life-expectancy IQR outliers", clean_no_le_outliers,
               paste(le_outlier_countries, collapse = ", ")),
  fit_scenario("Excluding GDP-per-capita IQR outliers",
               clean %>% filter(!country %in% gdp_outlier_countries),
               sprintf("%d high-income economies", length(gdp_outlier_countries))),
  fit_scenario("Excluding influential points (Cook's D > 4/n)",
               clean %>% filter(!country %in% influential$country),
               sprintf("%d countries", nrow(influential)))
)
print(sensitivity_table %>% select(-excluded) %>% mutate(across(where(is.numeric), ~ round(.x, 3))),
      row.names = FALSE)

r_range      <- range(sensitivity_table$pearson_r_log_gdp)
same_sign    <- length(unique(sign(sensitivity_table$pearson_r_log_gdp))) == 1
strengths    <- unique(sensitivity_table$strength)
max_r_change <- max(abs(sensitivity_table$pearson_r_log_gdp - cor_log))
sensitivity_conclusion <- sprintf(
  "Across the %d scenarios Pearson r (log GDP) ranges from %.3f to %.3f (largest change from the baseline %.3f: %.3f) and the slope from %.1f to %.1f years per ten-fold GDP. %s",
  nrow(sensitivity_table), r_range[1], r_range[2], cor_log, max_r_change,
  min(sensitivity_table$slope), max(sensitivity_table$slope),
  if (same_sign && length(strengths) == 1) {
    sprintf("The direction and strength ('%s') are unchanged, so the conclusion is not driven by outliers.", strengths)
  } else if (same_sign) {
    sprintf("The direction is unchanged but the strength label varies (%s), so the size of the association depends partly on unusual countries.",
            paste(strengths, collapse = " / "))
  } else {
    "The direction changes between scenarios, so the relationship is NOT robust to outliers."
  })
cat("\n", sensitivity_conclusion, "\n", sep = "")


# =========================================================
# 13. VISUALISATIONS (D1-D4)
# =========================================================
section("13. VISUALISATIONS")

col_main  <- "#2a78d6"
col_ink   <- "#0b0b0b"
col_ink2  <- "#52514e"
col_muted <- "#898781"
income_colours <- c("Low income" = "#86b6ef", "Lower middle income" = "#3987e5",
                    "Upper middle income" = "#1c5cab", "High income" = "#0d366b")

theme_exam <- theme_minimal(base_size = 13) +
  theme(plot.title = element_text(face = "bold", colour = col_ink, size = 15),
        plot.subtitle = element_text(colour = col_ink2, size = 11),
        plot.caption = element_text(colour = col_muted, size = 9, hjust = 0),
        axis.title = element_text(colour = col_ink2),
        axis.text = element_text(colour = col_ink2),
        panel.grid.minor = element_blank(),
        panel.grid.major = element_line(colour = "#e6e5e1", linewidth = 0.4),
        plot.background = element_rect(fill = "white", colour = NA),
        legend.position = "top", legend.title = element_text(colour = col_ink2),
        plot.title.position = "plot", plot.caption.position = "plot")
source_caption <- sprintf("Source: World Bank World Development Indicators API, %d data (extracted %s)",
                          data_year, source_info$extraction_date)

# ---- D1. Bar chart: mean life expectancy by income group ----
fig1_data <- income_summary %>%
  mutate(label = sprintf("%.1f yrs\n(n = %d)", mean_life_expectancy, countries))
figure1 <- ggplot(fig1_data, aes(x = income_level, y = mean_life_expectancy)) +
  geom_col(fill = col_main, width = 0.62) +
  geom_text(aes(label = label), vjust = -0.3, colour = col_ink, size = 3.8, lineheight = 0.9) +
  scale_y_continuous(limits = c(0, 90), breaks = seq(0, 90, 15), expand = c(0, 0)) +
  labs(title = "Average life expectancy rises with each World Bank income group",
       subtitle = sprintf("Mean life expectancy at birth by income group, %d", data_year),
       x = "World Bank income group", y = "Mean life expectancy at birth (years)",
       caption = source_caption) +
  theme_exam + theme(panel.grid.major.x = element_blank())
ggsave("figures/figure1.png", figure1, width = 9, height = 6, dpi = 200, bg = "white")

# ---- D2. Histogram: distribution of life expectancy ----
le_mean <- mean(clean$life_expectancy_years); le_median <- median(clean$life_expectancy_years)
share_70_80 <- mean(clean$life_expectancy_years >= 70 & clean$life_expectancy_years < 80)
figure2 <- ggplot(clean, aes(x = life_expectancy_years)) +
  geom_histogram(binwidth = 2.5, boundary = 50, fill = col_main, colour = "white", linewidth = 0.5) +
  geom_vline(xintercept = le_mean, colour = col_ink, linetype = "dashed", linewidth = 0.6) +
  geom_vline(xintercept = le_median, colour = col_ink2, linetype = "dotted", linewidth = 0.8) +
  annotate("text", x = le_mean, y = Inf, label = sprintf("Mean %.1f", le_mean),
           hjust = 1.08, vjust = 1.5, colour = col_ink, size = 3.6) +
  annotate("text", x = le_median, y = Inf, label = sprintf("Median %.1f", le_median),
           hjust = -0.08, vjust = 1.5, colour = col_ink2, size = 3.6) +
  annotate("text", x = extremes$lowest_le$life_expectancy_years - 1.2, y = 1, vjust = -0.6, hjust = 0,
           label = sprintf("%s\n%.1f yrs (outlier)", extremes$lowest_le$country,
                           extremes$lowest_le$life_expectancy_years),
           colour = col_ink2, size = 3.3, lineheight = 0.9) +
  scale_x_continuous(breaks = seq(10, 90, 10)) +
  scale_y_continuous(expand = expansion(mult = c(0, 0.12))) +
  labs(title = sprintf("Left-skewed: %.0f%% of countries have a life expectancy of 70-80 years",
                       100 * share_70_80),
       subtitle = sprintf("Distribution of life expectancy at birth across %d countries, %d (2.5-year bins)",
                          nrow(clean), data_year),
       x = "Life expectancy at birth (years)", y = "Number of countries",
       caption = source_caption) +
  theme_exam
ggsave("figures/figure2.png", figure2, width = 9, height = 6, dpi = 200, bg = "white")

# ---- D3. Scatter plot: GDP per capita vs life expectancy (correlation variables) ----
fig3_data <- clean %>% filter(!is.na(income_level))
figure3 <- ggplot(clean, aes(x = gdp_per_capita_usd, y = life_expectancy_years)) +
  geom_smooth(method = "lm", formula = y ~ x, colour = col_ink2, fill = "#d9d8d4",
              linewidth = 0.8) +
  geom_point(data = fig3_data, aes(fill = income_level), shape = 21, size = 2.8,
             colour = "white", stroke = 0.5) +
  scale_x_log10(labels = label_dollar(accuracy = 1),
                breaks = c(300, 1000, 3000, 10000, 30000, 100000)) +
  scale_fill_manual(values = income_colours, name = "Income group") +
  annotate("label", x = 250, y = max(clean$life_expectancy_years), hjust = 0, vjust = 1,
           label = sprintf("Pearson r = %.2f (log GDP)\nn = %d countries", cor_log, nrow(clean)),
           size = 3.8, colour = col_ink, fill = "white") +
  labs(title = "Richer countries tend to have longer life expectancy",
       subtitle = sprintf("GDP per capita (log scale) vs life expectancy at birth, %d; line = linear fit on log GDP", data_year),
       x = "GDP per capita, current US$ (log scale)", y = "Life expectancy at birth (years)",
       caption = source_caption) +
  annotate("text", x = extremes$lowest_le$gdp_per_capita_usd * 1.12,
           y = extremes$lowest_le$life_expectancy_years, hjust = 0, colour = col_ink2, size = 3.3,
           label = sprintf("%s (%.1f yrs)", extremes$lowest_le$country,
                           extremes$lowest_le$life_expectancy_years)) +
  guides(fill = guide_legend(override.aes = list(size = 4))) +
  theme_exam
ggsave("figures/figure3.png", figure3, width = 9, height = 6, dpi = 200, bg = "white")

# ---- D4. Boxplot: life expectancy by region ----
fig4_data <- clean %>%
  mutate(region = reorder(str_wrap(as.character(region), 18), life_expectancy_years, median))
figure4 <- ggplot(fig4_data, aes(x = region, y = life_expectancy_years)) +
  geom_boxplot(fill = "#b7d3f6", colour = "#184f95", width = 0.6,
               outlier.shape = NA, linewidth = 0.5) +
  geom_jitter(width = 0.15, height = 0, size = 1.4, alpha = 0.55, colour = "#184f95") +
  annotate("text", x = 1.12, y = extremes$lowest_le$life_expectancy_years, hjust = 0,
           colour = col_ink2, size = 3.3,
           label = sprintf("%s (%.1f yrs)", extremes$lowest_le$country,
                           extremes$lowest_le$life_expectancy_years)) +
  scale_y_continuous(breaks = seq(10, 90, 10)) +
  labs(title = "Sub-Saharan Africa has the lowest life expectancy of any region",
       subtitle = sprintf("Life expectancy at birth by World Bank region, %d (points = countries; boxes = median and IQR)", data_year),
       x = "World Bank region (ordered by median)", y = "Life expectancy at birth (years)",
       caption = source_caption) +
  theme_exam + theme(panel.grid.major.x = element_blank(), axis.text.x = element_text(size = 9.5))
ggsave("figures/figure4.png", figure4, width = 10, height = 6, dpi = 200, bg = "white")

cat("Saved: figures/figure1.png (bar), figure2.png (histogram), figure3.png (scatter), figure4.png (boxplot)\n")

# ---- Additional figure (not one of the four required): regression diagnostics ----
# Standard lm() diagnostic panels, drawn with base graphics: residuals vs fitted,
# normal Q-Q, Cook's distance and residuals vs leverage. The 3 most extreme
# countries in each panel are labelled by name.
png("figures/figure5_regression_diagnostics.png", width = 2000, height = 1700, res = 200)
par(mfrow = c(2, 2), mar = c(4.2, 4.2, 3, 1), oma = c(0, 0, 2.5, 0), cex = 0.85)
diag_captions <- list("Residuals vs fitted", "Normal Q-Q", "Scale-location",
                      "Cook's distance (dashed line = 4/n)", "Residuals vs leverage")
for (panel in c(1, 2, 4, 5)) {
  plot(reg_model, which = panel, labels.id = clean$country, id.n = 3, sub.caption = "",
       col = adjustcolor(col_main, 0.7), pch = 16, cex.id = 0.75, caption = diag_captions)
  if (panel == 4) abline(h = cooks_threshold, lty = 2, col = "grey40")
}
mtext(sprintf("Figure 5 (additional). Diagnostics for life_expectancy ~ log10(GDP per capita), n = %d", n_reg),
      outer = TRUE, font = 2, cex = 1)
invisible(dev.off())
cat("Saved: figures/figure5_regression_diagnostics.png (additional regression diagnostics)\n")

required_figures   <- sprintf("figures/figure%d.png", 1:4)
additional_figures <- "figures/figure5_regression_diagnostics.png"


# =========================================================
# 13b. FIGURE INTERPRETATIONS (shared by the PDF report and the dashboard)
# =========================================================
# Every number and every qualitative claim below is derived from the data, so the
# text stays correct if the analysis is re-run on revised World Bank data.
section("13b. FIGURE INTERPRETATIONS")

low_inc  <- income_summary %>% filter(income_level == "Low income")
high_inc <- income_summary %>% filter(income_level == "High income")
inc_steps <- diff(income_summary$mean_life_expectancy)
region_box <- clean %>% group_by(region) %>%
  summarise(q1 = quantile(life_expectancy_years, 0.25), q3 = quantile(life_expectancy_years, 0.75),
            iqr = IQR(life_expectancy_years), med = median(life_expectancy_years), n = n()) %>%
  arrange(desc(iqr))
lowest_region      <- region_box %>% slice_min(med, n = 1)
next_lowest_region <- region_box %>% filter(region != lowest_region$region) %>% slice_min(med, n = 1)
box_below_all      <- lowest_region$q3 < min(region_box$q1[region_box$region != lowest_region$region])
smallest_region    <- region_box %>% slice_min(n, n = 1, with_ties = FALSE)
resid_sd_income <- reg_diag %>% filter(!is.na(income_level)) %>% group_by(income_level) %>%
  summarise(resid_sd = sd(residual))
most_scatter_group <- resid_sd_income %>% slice_max(resid_sd, n = 1)
hi_below <- reg_diag %>% filter(income_level == "High income") %>% slice_min(residual, n = 1)
skew_word <- if (le_mean < le_median) "left-skewed" else "right-skewed"
n_below_60 <- sum(clean$life_expectancy_years < 60)

figure_notes <- list(
  list(id = "figure1", number = 1, file = "figures/figure1.png", required = TRUE, type = "Bar chart",
       title = "Mean life expectancy by World Bank income group",
       purpose = "Compares the average of a numeric variable across the ordered categories of a grouping variable.",
       interpretation = sprintf(
         "Mean life expectancy %s with income group, from %.1f years in low-income countries to %.1f years in high-income countries, a gap of %.0f years. Each step up the income ladder adds between %.1f and %.1f years on average. The low-income group is the smallest (n = %d) and most variable (SD %.1f years), so its mean is the least precise.",
         if (all(inc_steps > 0)) "rises at every step" else "does not rise consistently",
         low_inc$mean_life_expectancy, high_inc$mean_life_expectancy,
         high_inc$mean_life_expectancy - low_inc$mean_life_expectancy,
         min(inc_steps), max(inc_steps), low_inc$countries, low_inc$sd_life_expectancy)),
  list(id = "figure2", number = 2, file = "figures/figure2.png", required = TRUE, type = "Histogram",
       title = "Distribution of life expectancy at birth",
       purpose = "Shows the shape, centre and spread of the main outcome variable.",
       interpretation = sprintf(
         "The distribution is %s: %.0f%% of countries fall between 70 and 80 years, and the mean (%.1f) sits %s the median (%.1f). Only %d countries are below 60 years; the isolated bar at %.1f years is %s, the outlier discussed in the outlier analysis.",
         skew_word, 100 * share_70_80, le_mean, if (le_mean < le_median) "below" else "above", le_median,
         n_below_60, extremes$lowest_le$life_expectancy_years, extremes$lowest_le$country)),
  list(id = "figure3", number = 3, file = "figures/figure3.png", required = TRUE, type = "Scatter plot",
       title = "GDP per capita (log scale) vs life expectancy",
       purpose = "Shows the relationship between the two numeric variables used in the correlation and regression analyses.",
       interpretation = sprintf(
         "Points rise from lower left to upper right, a %s association (r = %.2f on log GDP), and the income-group colours follow the same gradient. Scatter around the line is widest in the %s group (residual SD %.1f years), so income alone predicts life expectancy least well there. Some countries sit well below the line for their income, e.g. %s, a high-income economy at %.1f years.",
         describe_strength(cor_log), cor_log, str_to_lower(as.character(most_scatter_group$income_level)),
         most_scatter_group$resid_sd, hi_below$country, hi_below$life_expectancy_years)),
  list(id = "figure4", number = 4, file = "figures/figure4.png", required = TRUE, type = "Boxplot",
       title = "Life expectancy by World Bank region",
       purpose = "Compares the full distribution (median, quartiles, spread, extremes) of a numeric variable across categories.",
       interpretation = sprintf(
         "%s's median life expectancy (%.1f years) is about %.0f years below the next-lowest region (%s, %.1f years)%s. %s shows the widest interquartile range (%.1f years). %s has only %d countries, so its box should be read with care.",
         lowest_region$region, lowest_region$med, next_lowest_region$med - lowest_region$med,
         next_lowest_region$region, next_lowest_region$med,
         if (box_below_all) ", and its whole box sits below every other region's box" else "",
         region_box$region[1], region_box$iqr[1], smallest_region$region, smallest_region$n)),
  list(id = "figure5", number = 5, file = additional_figures, required = FALSE, type = "Regression diagnostics",
       title = "Model assumptions and influential countries (additional)",
       purpose = "Checks the assumptions of the log-GDP regression model: linearity, residual normality and influential observations.",
       interpretation = sprintf(
         "%s %s %d countries exceed the Cook's distance screening line (4/n), led by %s; removing them %s (see the sensitivity analysis).",
         curvature_note, residual_note, nrow(influential), paste(head(influential$country, 3), collapse = ", "),
         sprintf("changes r from %.3f to %.3f", cor_log,
                 sensitivity_table$pearson_r_log_gdp[sensitivity_table$scenario == "Excluding influential points (Cook's D > 4/n)"])))
)
for (fn in figure_notes) cat(sprintf("\nFigure %d (%s): %s\n", fn$number, fn$type, fn$interpretation))


# =========================================================
# 14. DATA QUALITY ASSURANCE
# =========================================================
# Every check is recorded (PASS / FAIL / PENDING) and exported to
# output/qa_report.json. Any FAIL stops the script with a list of what failed,
# AFTER the QA report is written, so the failure itself is documented.
section("14. DATA QUALITY ASSURANCE")

qa_checks <- data.frame(id = character(), category = character(), check = character(),
                        status = character(), detail = character())
qa_add <- function(category, check, passed, detail, pending = FALSE) {
  status <- if (pending) "PENDING" else if (isTRUE(passed)) "PASS" else "FAIL"
  qa_checks <<- rbind(qa_checks, data.frame(
    id = sprintf("QA%02d", nrow(qa_checks) + 1), category = category, check = check,
    status = status, detail = detail))
}

# Documented plausibility ranges: physical/definitional limits, NOT statistical
# cut-offs (statistical outliers are handled separately by the IQR analysis).
plausibility_rules <- data.frame(
  variable = c("life_expectancy_years", "fertility_rate", "population", "gdp_per_capita_usd",
               "urban_pop_pct", "health_exp_per_capita_usd", "co2_per_capita_t"),
  min = c(0, 0, 1, 0, 0, 0, 0),
  max = c(100, 15, Inf, Inf, 100, Inf, Inf),
  rationale = c("Years of life at birth must be positive and below the ~85-year human maximum observed nationally (100 as a hard ceiling)",
                "Births per woman cannot be negative; no country has recorded a national rate above ~8",
                "A country must have at least one inhabitant",
                "Output per person cannot be negative",
                "A percentage of the population must lie in 0-100",
                "Spending cannot be negative",
                "Emissions per person cannot be negative")
)

analysis_vars <- c("gdp_per_capita_usd", "life_expectancy_years", "population", "urban_pop_pct",
                   "fertility_rate", "health_exp_per_capita_usd", "co2_per_capita_t")
required_cols <- c("country", "iso3", "region", "income_level", "gdp_per_capita_usd",
                   "log10_gdp_per_capita", "life_expectancy_years", "population", "population_millions",
                   "urban_pop_pct", "fertility_rate", "health_exp_per_capita_usd", "co2_per_capita_t")

# -- Dataset size and structure
qa_add("Size", "At least 50 observations", nrow(clean) >= 50, sprintf("%d countries", nrow(clean)))
# "Analytical" = present, numeric and observed for at least 50 countries
usable_vars <- analysis_vars[vapply(analysis_vars, function(v)
  v %in% names(clean) && is.numeric(clean[[v]]) && sum(!is.na(clean[[v]])) >= 50, logical(1))]
qa_add("Size", "At least 5 analytical variables", length(usable_vars) >= 5,
       sprintf("%d numeric indicators observed for 50+ countries (%d columns in total)",
               length(usable_vars), ncol(clean)))
qa_add("Structure", "All required columns present", all(required_cols %in% names(clean)),
       if (all(required_cols %in% names(clean))) sprintf("%d/%d present", length(required_cols), length(required_cols))
       else paste("missing:", paste(setdiff(required_cols, names(clean)), collapse = ", ")))

# -- Uniqueness and duplicates
qa_add("Uniqueness", "ISO3 codes unique", !any(duplicated(clean$iso3)),
       sprintf("%d duplicated ISO3 codes", sum(duplicated(clean$iso3))))
qa_add("Uniqueness", "Country names unique", !any(duplicated(clean$country)),
       sprintf("%d duplicated country names", sum(duplicated(clean$country))))
qa_add("Uniqueness", "No duplicated rows", !any(duplicated(clean)),
       sprintf("%d duplicated rows", sum(duplicated(clean))))

# -- Aggregates must not be treated as countries
aggregate_iso3 <- raw_from_file$iso3[str_squish(raw_from_file$region) == "Aggregates"]
qa_add("Aggregates", "No aggregate regions in cleaned data",
       !"Aggregates" %in% clean$region && !any(clean$iso3 %in% aggregate_iso3),
       sprintf("%d aggregate rows removed; 0 expected in cleaned data, found %d",
               length(aggregate_iso3), sum(clean$iso3 %in% aggregate_iso3)))

# -- Data types
non_numeric <- analysis_vars[!vapply(clean[analysis_vars], is.numeric, logical(1))]
qa_add("Types", "Indicator variables are numeric", length(non_numeric) == 0,
       if (length(non_numeric) == 0) sprintf("%d/%d numeric", length(analysis_vars), length(analysis_vars))
       else paste("not numeric:", paste(non_numeric, collapse = ", ")))
qa_add("Types", "Region and income level are factors",
       is.factor(clean$region) && is.factor(clean$income_level),
       sprintf("region: %s; income_level: %s", class(clean$region)[1], class(clean$income_level)[1]))

# -- Missingness (core variables must be complete; others may have documented gaps)
missing_summary <- data.frame(variable = names(clean), missing = as.integer(colSums(is.na(clean)))) %>%
  mutate(pct_missing = 100 * missing / nrow(clean))
total_missing_cells <- sum(missing_summary$missing)
pct_missing_cells   <- 100 * total_missing_cells / (nrow(clean) * ncol(clean))
core_vars <- c("country", "iso3", "region", "income_level", "gdp_per_capita_usd", "life_expectancy_years")
qa_add("Missingness", "Core analysis variables complete", sum(is.na(clean[core_vars])) == 0,
       sprintf("%d missing values across %s", sum(is.na(clean[core_vars])), paste(core_vars, collapse = ", ")))
worst_missing <- missing_summary %>% slice_max(pct_missing, n = 1, with_ties = FALSE)
qa_add("Missingness", "No variable more than 20% missing", max(missing_summary$pct_missing) <= 20,
       sprintf("%d missing cells in total (%.2f%%); highest: %s %.1f%%", total_missing_cells,
               pct_missing_cells, worst_missing$variable, worst_missing$pct_missing))

# -- Plausibility ranges
for (i in seq_len(nrow(plausibility_rules))) {
  rule <- plausibility_rules[i, ]
  x <- clean[[rule$variable]]
  bad <- sum(!is.na(x) & (x < rule$min | x > rule$max))
  qa_add("Plausibility", sprintf("%s within [%s, %s]", rule$variable, format(rule$min),
                                 ifelse(is.infinite(rule$max), "Inf", format(rule$max))),
         bad == 0, sprintf("%d out-of-range values; observed range %s to %s", bad,
                           format(signif(min(x, na.rm = TRUE), 4), big.mark = ","),
                           format(signif(max(x, na.rm = TRUE), 4), big.mark = ",")))
}

# -- Cross-check against the saved CSV (the export must match the object analysed)
reloaded_clean <- read_csv("cleaned_data.csv", show_col_types = FALSE)
qa_add("Export", "cleaned_data.csv matches the analysed data",
       nrow(reloaded_clean) == nrow(clean) && ncol(reloaded_clean) == ncol(clean) &&
         isTRUE(all.equal(reloaded_clean$life_expectancy_years, clean$life_expectancy_years)),
       sprintf("%d x %d on disk vs %d x %d in memory", nrow(reloaded_clean), ncol(reloaded_clean),
               nrow(clean), ncol(clean)))
reloaded_raw <- read_csv("web_extracted_data.csv", show_col_types = FALSE)
qa_add("Export", "web_extracted_data.csv is the raw extraction",
       nrow(reloaded_raw) == nrow(web_raw) && "Aggregates" %in% str_squish(reloaded_raw$region),
       sprintf("%d rows (incl. aggregates) - distinct from the %d-row cleaned file",
               nrow(reloaded_raw), nrow(clean)))

# -- Statistical results are finite (a silent NA here would propagate into the report)
key_results <- c(cor_log = cor_log, cor_spearman = cor_spearman, slope = reg_slope$estimate,
                 r_squared = reg_stats$r_squared, anova_p = anova_p)
qa_add("Statistics", "Key statistical results are finite numbers", all(is.finite(key_results)),
       paste(sprintf("%s=%s", names(key_results), formatC(key_results, digits = 3, format = "g")), collapse = "; "))

# -- Output files exist and are non-empty
file_ok <- function(f) file.exists(f) && file.size(f) > 0
for (f in c("web_extracted_data.csv", "cleaned_data.csv", required_figures, additional_figures)) {
  qa_add("Outputs", sprintf("%s exists and is non-empty", f), file_ok(f),
         if (file.exists(f)) sprintf("%.1f KB", file.size(f) / 1024) else "file not found")
}
# The PDF is produced by build_report.R (which runs this script first), so here it
# can only be PENDING; build_report.R updates this check once the PDF is written.
qa_add("Outputs", "final_report.pdf exists and is non-empty", NA,
       if (file.exists("final_report.pdf")) "present from an earlier build; regenerated by build_report.R"
       else "not yet built - run build_report.R", pending = TRUE)

qa_status <- if (any(qa_checks$status == "FAIL")) "FAIL" else "PASS"
print(qa_checks %>% select(-id), row.names = FALSE, right = FALSE)
cat(sprintf("\nQA status: %s (%d pass, %d fail, %d pending)\n", qa_status,
            sum(qa_checks$status == "PASS"), sum(qa_checks$status == "FAIL"),
            sum(qa_checks$status == "PENDING")))


# =========================================================
# 15. AUTOMATED SUMMARY (Section E)
# =========================================================
section("15. AUTOMATED SUMMARY")

top_region    <- region_summary %>% slice_max(mean_life_expectancy, n = 1)
bottom_region <- region_summary %>% slice_min(mean_life_expectancy, n = 1)
gdp_out  <- outlier_results$gdp_per_capita_usd
le_out   <- outlier_results$life_expectancy_years
anova_f  <- region_anova[[1]][["F value"]][1]
anova_df <- region_anova[[1]][["Df"]]
anova_eta_sq <- region_anova[[1]][["Sum Sq"]][1] / sum(region_anova[[1]][["Sum Sq"]])
vars_with_missing <- missing_summary %>% filter(missing > 0)

automated_summary <- c(
  sprintf("Data: %d economies were extracted from the World Bank API on %s; after removing %d aggregates and %d countries missing core values, %d countries and %d variables remain.",
          nrow(web_raw), source_info$extraction_date, raw_issues$aggregate_rows,
          length(dropped_missing), nrow(clean), ncol(clean)),
  sprintf("Missingness: %d of %d cells (%.2f%%) are missing in the cleaned data, all in %s; core variables are complete.",
          total_missing_cells, nrow(clean) * ncol(clean), pct_missing_cells,
          paste(sprintf("%s (%d)", vars_with_missing$variable, vars_with_missing$missing), collapse = " and ")),
  sprintf("Life expectancy (%d): mean %.1f years, median %.1f, ranging from %.1f (%s) to %.1f (%s), SD %.1f.",
          data_year, le_mean, le_median, extremes$lowest_le$life_expectancy_years, extremes$lowest_le$country,
          extremes$highest_le$life_expectancy_years, extremes$highest_le$country, sd(clean$life_expectancy_years)),
  sprintf("GDP per capita: mean US$%s but median only US$%s - a strongly right-skewed distribution (min US$%s in %s, max US$%s in %s).",
          comma(mean(clean$gdp_per_capita_usd), 1), comma(median(clean$gdp_per_capita_usd), 1),
          comma(extremes$lowest_gdp$gdp_per_capita_usd, 1), extremes$lowest_gdp$country,
          comma(extremes$highest_gdp$gdp_per_capita_usd, 1), extremes$highest_gdp$country),
  sprintf("Groups: mean life expectancy is highest in %s (%.1f yrs) and lowest in %s (%.1f yrs); high-income countries average %.1f yrs vs %.1f yrs for low-income countries (gap %.1f yrs). ANOVA across regions: F(%d, %d) = %.1f, p = %.2g, eta-squared = %.2f.",
          top_region$region, top_region$mean_life_expectancy, bottom_region$region,
          bottom_region$mean_life_expectancy, high_inc$mean_life_expectancy, low_inc$mean_life_expectancy,
          high_inc$mean_life_expectancy - low_inc$mean_life_expectancy,
          anova_df[1], anova_df[2], anova_f, anova_p, anova_eta_sq),
  sprintf("Correlation: log GDP per capita and life expectancy show a %s correlation (Pearson r = %.2f, 95%% CI %.2f to %.2f, p = %.2g; Spearman rho = %.2f). This is an association, not proof of causation.",
          describe_strength(cor_log), cor_log, cor_log_test$conf.int[1], cor_log_test$conf.int[2],
          cor_log_test$p.value, cor_spearman),
  sprintf("Regression: each ten-fold increase in GDP per capita is associated with %.1f more years of life expectancy (95%% CI %.1f to %.1f, p = %.2g); R^2 = %.2f, adjusted R^2 = %.2f.",
          reg_slope$estimate, reg_slope$ci_low, reg_slope$ci_high, reg_slope$p_value,
          reg_stats$r_squared, reg_stats$adj_r_squared),
  sprintf("Outliers (1.5 x IQR rule): %d high GDP-per-capita outlier(s) above US$%s, %d low life-expectancy outlier(s) below %.1f years (%s) and %d high fertility outlier(s); all were retained.",
          gdp_out$n_high, comma(gdp_out$upper, 1), le_out$n_low, le_out$lower,
          paste(le_outlier_countries, collapse = ", "), outlier_results$fertility_rate$n_high),
  sprintf("Sensitivity: %s", sensitivity_conclusion),
  sprintf("Outputs: %d required figures and %d additional figure generated; automated data QA %s (%d of %d completed checks passed; the final-report check runs once the PDF is built).",
          length(required_figures), length(additional_figures), qa_status,
          sum(qa_checks$status == "PASS"), sum(qa_checks$status != "PENDING"))
)
cat(paste0("- ", automated_summary), sep = "\n")

dropped_income_levels <- raw_from_file %>% mutate(country = str_squish(country)) %>%
  filter(country %in% dropped_missing) %>% pull(income_level) %>% str_squish()
dropped_income <- table(factor(dropped_income_levels,
                               levels = c("Low income", "Lower middle income", "Upper middle income", "High income")))
dropped_income <- dropped_income[dropped_income > 0]
limitations <- list(
  list(title = "Cross-sectional design",
       text = sprintf("The analysis uses one year (%d) of country-level data, so it shows how countries differ at a point in time; it cannot establish temporal ordering or causal effects.", data_year)),
  list(title = "Country-level (ecological) inference",
       text = "Relationships between country averages do not necessarily hold for individuals within countries, and small territories count equally with populous countries."),
  list(title = "Missing data",
       text = sprintf("%d countries were removed because GDP per capita or life expectancy was missing (%s). Their income groups are: %s, so the missing cases are not a random sample and the cleaned data may under-represent some settings (%.0f%% of the dropped countries are low income vs %.0f%% of the analysed countries). %d health-expenditure and %d CO2 values are also missing and were excluded pairwise.",
                      length(dropped_missing), paste(dropped_missing, collapse = "; "),
                      paste(sprintf("%s %d", names(dropped_income), as.integer(dropped_income)), collapse = ", "),
                      100 * mean(dropped_income_levels == "Low income", na.rm = TRUE),
                      100 * mean(clean$income_level == "Low income", na.rm = TRUE),
                      sum(is.na(clean$health_exp_per_capita_usd)), sum(is.na(clean$co2_per_capita_t)))),
  list(title = "Confounding",
       text = "GDP per capita and life expectancy are both linked to healthcare access, education, public infrastructure, demographics, environmental conditions and institutional quality. These are possible explanations for the association, not mechanisms tested here."),
  list(title = "Outliers and influential observations",
       text = sprintf("Extreme observations - notably %s at %.1f years - can shift correlations and regression estimates. The sensitivity analysis shows how much: %s",
                      extremes$lowest_le$country, extremes$lowest_le$life_expectancy_years, sensitivity_conclusion)),
  list(title = "Source revisions",
       text = sprintf("World Bank WDI values are revised as new estimates arrive. Re-running the extraction later may give slightly different numbers than the %s extraction reported here; the code, source, year and extraction date are recorded so the method is reproducible.",
                      source_info$extraction_date))
)


# =========================================================
# 16. MACHINE-READABLE EXPORTS (data dictionary, JSON, dashboard data)
# =========================================================
section("16. MACHINE-READABLE EXPORTS")

# ---- Data dictionary ----
data_dictionary <- data.frame(
  variable = names(clean),
  description = c(
    country = "Country or economy name as published by the World Bank",
    iso3 = "ISO 3166-1 alpha-3 country code (unique key)",
    region = "World Bank geographic region",
    income_level = "World Bank income group (ordered Low -> High)",
    gdp_per_capita_usd = "GDP per capita",
    log10_gdp_per_capita = "Base-10 logarithm of GDP per capita (used for correlation, regression and plotting)",
    life_expectancy_years = "Life expectancy at birth, total",
    population = "Total population",
    population_millions = "Total population in millions (population / 1,000,000)",
    urban_pop_pct = "Urban population as a share of total population",
    fertility_rate = "Total fertility rate",
    health_exp_per_capita_usd = "Current health expenditure per capita",
    co2_per_capita_t = "CO2 emissions per capita, excluding land use (LULUCF)")[names(clean)],
  source = c(
    country = "WDI country API: name", iso3 = "WDI country API: id",
    region = "WDI country API: region.value", income_level = "WDI country API: incomeLevel.value",
    gdp_per_capita_usd = "WDI indicator NY.GDP.PCAP.CD", log10_gdp_per_capita = "Derived in R",
    life_expectancy_years = "WDI indicator SP.DYN.LE00.IN", population = "WDI indicator SP.POP.TOTL",
    population_millions = "Derived in R", urban_pop_pct = "WDI indicator SP.URB.TOTL.IN.ZS",
    fertility_rate = "WDI indicator SP.DYN.TFRT.IN", health_exp_per_capita_usd = "WDI indicator SH.XPD.CHEX.PC.CD",
    co2_per_capita_t = "WDI indicator EN.GHG.CO2.PC.CE.AR5")[names(clean)],
  type = vapply(clean, function(x) class(x)[1], character(1)),
  unit = c(
    country = "text", iso3 = "code", region = "category", income_level = "ordered category",
    gdp_per_capita_usd = "current US$", log10_gdp_per_capita = "log10(current US$)",
    life_expectancy_years = "years", population = "people", population_millions = "millions of people",
    urban_pop_pct = "percent (0-100)", fertility_rate = "births per woman",
    health_exp_per_capita_usd = "current US$", co2_per_capita_t = "tonnes CO2e per person")[names(clean)],
  missing = as.integer(colSums(is.na(clean))),
  row.names = NULL
)
stopifnot("Data dictionary has an undocumented variable" = !anyNA(data_dictionary$description))
write_csv(data_dictionary, "output/data_dictionary.csv")
cat("Saved output/data_dictionary.csv (", nrow(data_dictionary), "variables )\n")

# ---- analysis_summary.json: every value comes from an R object computed above ----
round_df <- function(df, digits = 6) df %>% mutate(across(where(is.numeric), ~ signif(.x, digits)))
outlier_json <- lapply(outlier_results, function(o) list(
  variable = o$variable, q1 = o$q1, q3 = o$q3, iqr = o$iqr, lower_bound = o$lower, upper_bound = o$upper,
  n_outliers = o$n_outliers, n_low = o$n_low, n_high = o$n_high,
  countries = round_df(as.data.frame(o$outliers))))
names(outlier_json) <- NULL

analysis_summary <- list(
  schema_version = "1.0",
  generated_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
  project = list(
    title = "R Programming and Data Web Extraction Practical",
    question = "How does life expectancy vary between countries, and how strongly is it associated with national income?",
    source = source_info$website, source_url = source_info$base_url,
    data_year = data_year, extraction_date = source_info$extraction_date),
  dataset = list(
    raw_rows = nrow(web_raw), raw_columns = ncol(web_raw),
    aggregates_removed = raw_issues$aggregate_rows,
    duplicates_removed = duplicates_removed,
    countries_dropped_missing = I(dropped_missing),
    observations = nrow(clean), variables = ncol(clean),
    numeric_variables = sum(vapply(clean, is.numeric, logical(1))),
    indicators = length(indicators),
    indicator_codes = as.list(indicators),
    total_missing_cells = total_missing_cells, pct_missing_cells = pct_missing_cells,
    missing_by_variable = round_df(missing_summary),
    cleaning_log = cleaning_log),
  key_indicators = list(
    countries = nrow(clean),
    life_expectancy_mean = le_mean, life_expectancy_median = le_median,
    life_expectancy_sd = sd(clean$life_expectancy_years),
    life_expectancy_min = list(country = extremes$lowest_le$country, value = extremes$lowest_le$life_expectancy_years),
    life_expectancy_max = list(country = extremes$highest_le$country, value = extremes$highest_le$life_expectancy_years),
    gdp_per_capita_mean = mean(clean$gdp_per_capita_usd), gdp_per_capita_median = median(clean$gdp_per_capita_usd),
    fertility_rate_mean = mean(clean$fertility_rate), fertility_rate_median = median(clean$fertility_rate),
    pct_missing_cells = pct_missing_cells),
  descriptive_statistics = round_df(descriptive_stats),
  group_analysis = list(by_region = round_df(region_summary %>% mutate(region = as.character(region))),
                        by_income = round_df(income_summary %>% mutate(income_level = as.character(income_level)))),
  anova = list(
    test = "One-way ANOVA: life_expectancy_years ~ region",
    f_statistic = anova_f, df_between = anova_df[1], df_within = anova_df[2], p_value = anova_p,
    eta_squared = anova_eta_sq,
    welch_f = unname(welch_anova$statistic), welch_df = unname(welch_anova$parameter),
    welch_p = welch_anova$p.value, welch_note = welch_note,
    region_sd = round_df(region_sd %>% mutate(region = as.character(region))),
    interpretation = sprintf("Mean life expectancy differs significantly between regions (p = %.2g); region accounts for %.0f%% of the variation in life expectancy (eta-squared).",
                             anova_p, 100 * anova_eta_sq)),
  correlation = list(
    variables = c("log10_gdp_per_capita", "life_expectancy_years"),
    pearson_raw = cor_raw, pearson_log = cor_log,
    pearson_log_ci = unname(cor_log_test$conf.int), pearson_log_p = cor_log_test$p.value,
    spearman = cor_spearman, n = nrow(clean), strength = describe_strength(cor_log),
    table = correlation_table,
    interpretation = "Richer countries tend to have longer life expectancy. The relationship is curved in dollars and close to linear on the log scale. It is an association, not evidence of causation."),
  regression = list(
    formula = "life_expectancy_years ~ log10_gdp_per_capita",
    method = "Ordinary least squares (lm)",
    why_log = "GDP per capita is strongly right-skewed; log10 makes the relationship approximately linear and the slope reads as years per ten-fold difference in GDP per capita.",
    n = reg_stats$n, coefficients = round_df(reg_table),
    r_squared = reg_stats$r_squared, adj_r_squared = reg_stats$adj_r_squared,
    residual_se = reg_stats$residual_se, f_statistic = reg_stats$f_statistic, f_p_value = reg_stats$f_p_value,
    interpretation = sprintf("A ten-fold difference in GDP per capita is associated with %.1f more years of life expectancy (95%% CI %.1f to %.1f). Association only: confounders such as healthcare access, education, infrastructure, demographics, environment and institutions are not modelled.",
                             reg_slope$estimate, reg_slope$ci_low, reg_slope$ci_high),
    diagnostics = list(
      cooks_threshold = cooks_threshold, leverage_threshold = leverage_threshold,
      influential = round_df(as.data.frame(influential %>% select(country, life_expectancy_years, std_residual, leverage, cooks_d))),
      n_high_leverage = nrow(high_leverage),
      large_residuals = I(large_residuals$country),
      shapiro_w = unname(residual_normality$statistic), shapiro_p = residual_normality$p.value,
      residual_skewness = residual_skewness, curvature_p = curvature_p,
      notes = c(curvature_note, residual_note))),
  outliers = list(method = "1.5 x IQR rule (Q1 - 1.5 IQR, Q3 + 1.5 IQR); outliers reported and retained",
                  variables = outlier_json,
                  total_flagged = sum(vapply(outlier_results, function(o) o$n_outliers, numeric(1))),
                  life_expectancy_history = le_outlier_history),
  sensitivity = list(scenarios = round_df(sensitivity_table), conclusion = sensitivity_conclusion),
  figures = lapply(figure_notes, function(fn) { fn$file_exists <- file_ok(fn$file); fn }),
  section_a = list(
    students = students %>% mutate(across(where(is.factor), as.character)),
    score_statistics = score_stats,
    programme_averages = programme_avg %>% mutate(Programme = as.character(Programme)),
    overall_average = overall_avg_score,
    above_average = above_average %>% mutate(across(where(is.factor), as.character))),
  limitations = limitations,
  automated_summary = automated_summary,
  validation = list(status = qa_status, checks_total = nrow(qa_checks),
                    checks_passed = sum(qa_checks$status == "PASS"),
                    checks_failed = sum(qa_checks$status == "FAIL"),
                    checks_pending = sum(qa_checks$status == "PENDING"))
)

qa_report <- list(
  schema_version = "1.0",
  generated_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
  status = qa_status,
  counts = list(pass = sum(qa_checks$status == "PASS"), fail = sum(qa_checks$status == "FAIL"),
                pending = sum(qa_checks$status == "PENDING"), total = nrow(qa_checks)),
  dataset = list(observations = nrow(clean), variables = ncol(clean),
                 missing_cells = total_missing_cells, duplicate_rows = sum(duplicated(clean)),
                 duplicate_iso3 = sum(duplicated(clean$iso3)),
                 aggregate_rows_in_raw = length(aggregate_iso3),
                 aggregate_rows_in_clean = sum(clean$iso3 %in% aggregate_iso3)),
  plausibility_rules = plausibility_rules %>% mutate(max = ifelse(is.infinite(max), NA, max)),
  checks = qa_checks
)

# ---- Reproducibility manifest ----
used_packages <- c(required_packages, "stats", "graphics", "grDevices", "tools")
package_versions <- lapply(used_packages, function(p) list(package = p, version = as.character(packageVersion(p))))
output_files <- c("web_extracted_data.csv", "cleaned_data.csv", required_figures, additional_figures,
                  "output/data_dictionary.csv", "final_report.pdf")
describe_file <- function(f) list(file = f, exists = file.exists(f),
                                  bytes = if (file.exists(f)) unname(file.size(f)) else NULL,
                                  md5 = if (file.exists(f)) unname(tools::md5sum(f)) else NULL)
manifest <- list(
  schema_version = "1.0",
  run_started = format(run_started, "%Y-%m-%dT%H:%M:%S%z"),
  run_finished = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
  extraction_date = source_info$extraction_date,
  data_year = data_year,
  r_version = R.version.string,
  platform = R.version$platform,
  os = unname(Sys.info()[["sysname"]]),
  os_release = unname(Sys.info()[["release"]]),
  random_seed = analysis_seed,
  packages = package_versions,
  source = list(name = source_info$website, base_url = source_info$base_url,
                country_endpoint = source_info$country_url, indicator_endpoint = source_info$indicator_url,
                indicators = as.list(indicators), year_rationale = source_info$year_rationale,
                error_handling = source_info$error_handling),
  raw_dimensions = list(rows = nrow(web_raw), columns = ncol(web_raw)),
  clean_dimensions = list(rows = nrow(clean), columns = ncol(clean)),
  figures_generated = list(required = length(required_figures), additional = length(additional_figures)),
  outputs = lapply(output_files, describe_file),
  reproducibility_note = paste(
    "The code is fully reproducible: running `Rscript build_report.R` (or main_analysis.R for the analysis only)",
    "re-extracts, cleans, analyses and re-exports everything using relative paths and a fixed seed.",
    "The data are fetched live from the World Bank API, which revises WDI values over time, so a later run",
    "may return slightly different numbers; the extraction date, data year, indicator codes and file checksums",
    "recorded here identify exactly which vintage produced these outputs.")
)

write_project_json <- function(x, path) {
  write_json(x, path, auto_unbox = TRUE, pretty = TRUE, digits = NA, na = "null", null = "null")
}
write_project_json(analysis_summary, "output/analysis_summary.json")
write_project_json(qa_report, "output/qa_report.json")
write_project_json(manifest, "output/reproducibility_manifest.json")
cat("Saved output/analysis_summary.json, output/qa_report.json, output/reproducibility_manifest.json\n")

# ---- Dashboard data (frontend/public/project) ----
# The Next.js dashboard reads ONLY these generated files, so it can never show
# numbers that differ from this analysis. Skipped (with a note) if frontend/ is absent.
if (dir.exists("frontend")) {
  dir.create(frontend_data_dir, recursive = TRUE, showWarnings = FALSE)
  for (f in c("output/analysis_summary.json", "output/qa_report.json",
              "output/reproducibility_manifest.json", "output/data_dictionary.csv",
              "cleaned_data.csv", required_figures, additional_figures)) {
    ok <- file.copy(f, file.path(frontend_data_dir, basename(f)), overwrite = TRUE)
    if (!ok) stop("Could not copy ", f, " to ", frontend_data_dir, " - check the folder is writable.")
  }
  write_project_json(clean %>% mutate(across(where(is.factor), as.character)),
                     file.path(frontend_data_dir, "cleaned_data.json"))
  if (file.exists("final_report.pdf")) {
    file.copy("final_report.pdf", file.path(frontend_data_dir, "final_report.pdf"), overwrite = TRUE)
  }
  cat("Dashboard data refreshed in", frontend_data_dir, "\n")
} else {
  cat("frontend/ folder not found - dashboard data not exported (the R analysis is unaffected).\n")
}


# =========================================================
# 17. FINAL VALIDATION
# =========================================================
section("17. FINAL VALIDATION")

required_files <- c("main_analysis.R", "web_extracted_data.csv", "cleaned_data.csv", required_figures,
                    additional_figures, "output/data_dictionary.csv", "output/analysis_summary.json",
                    "output/qa_report.json", "output/reproducibility_manifest.json")
file_check <- data.frame(file = required_files, exists = file.exists(required_files),
                         size_kb = round(ifelse(file.exists(required_files),
                                                file.size(required_files) / 1024, NA), 1))
print(file_check, row.names = FALSE)
cat("final_report.pdf present:", file.exists("final_report.pdf"),
    "(built by build_report.R, which runs this script first)\n")

if (!all(file_check$exists)) {
  stop("Output file(s) missing: ", paste(file_check$file[!file_check$exists], collapse = ", "),
       "\n  Check that the project folder is writable and that no earlier step failed.")
}
if (qa_status == "FAIL") {
  failed <- qa_checks %>% filter(status == "FAIL")
  stop("Data QA failed (", nrow(failed), " check(s)); see output/qa_report.json:\n",
       paste(sprintf("  - %s: %s (%s)", failed$id, failed$check, failed$detail), collapse = "\n"))
}
cat("\nPipeline completed successfully:", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "\n")
