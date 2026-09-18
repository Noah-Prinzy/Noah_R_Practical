/**
 * Data contract between the R analysis and the dashboard.
 *
 * Every number shown on the site comes from files that main_analysis.R /
 * build_report.R write into public/project/. These types mirror that JSON
 * exactly (schema_version "1.0"); see README.md for the field-by-field schema.
 * Nothing here recalculates official statistics.
 */
import { readFile, stat } from "fs/promises";
import path from "path";

export const PROJECT_DIR = path.join(process.cwd(), "public", "project");

export type Country = {
  country: string;
  iso3: string;
  region: string;
  income_level: string | null;
  gdp_per_capita_usd: number;
  log10_gdp_per_capita: number;
  life_expectancy_years: number;
  population: number;
  population_millions: number;
  urban_pop_pct: number | null;
  fertility_rate: number | null;
  health_exp_per_capita_usd: number | null;
  co2_per_capita_t: number | null;
};

type Row<T extends string> = Record<T, number>;

export type AnalysisSummary = {
  schema_version: string;
  generated_at: string;
  project: {
    title: string;
    question: string;
    source: string;
    source_url: string;
    data_year: number;
    extraction_date: string;
  };
  dataset: {
    raw_rows: number;
    raw_columns: number;
    aggregates_removed: number;
    duplicates_removed: number;
    countries_dropped_missing: string[];
    observations: number;
    variables: number;
    numeric_variables: number;
    indicators: number;
    indicator_codes: Record<string, string>;
    total_missing_cells: number;
    pct_missing_cells: number;
    missing_by_variable: { variable: string; missing: number; pct_missing: number }[];
    cleaning_log: { step: string; rows_after: number; note: string }[];
  };
  key_indicators: {
    countries: number;
    life_expectancy_mean: number;
    life_expectancy_median: number;
    life_expectancy_sd: number;
    life_expectancy_min: { country: string; value: number };
    life_expectancy_max: { country: string; value: number };
    gdp_per_capita_mean: number;
    gdp_per_capita_median: number;
    fertility_rate_mean: number;
    fertility_rate_median: number;
    pct_missing_cells: number;
  };
  descriptive_statistics: ({ variable: string } & Row<"n" | "missing" | "mean" | "median" | "min" | "max" | "sd">)[];
  group_analysis: {
    by_region: ({ region: string } & Row<
      "countries" | "mean_life_expectancy" | "median_life_expectancy" | "median_gdp_per_capita" | "mean_fertility_rate" | "mean_urban_pct"
    >)[];
    by_income: ({ income_level: string } & Row<
      "countries" | "mean_life_expectancy" | "sd_life_expectancy" | "median_gdp_per_capita" | "mean_fertility_rate"
    >)[];
  };
  anova: {
    test: string;
    f_statistic: number;
    df_between: number;
    df_within: number;
    p_value: number;
    eta_squared: number;
    welch_f: number;
    welch_df: number[];
    welch_p: number;
    welch_note: string;
    region_sd: { region: string; sd: number; n: number }[];
    interpretation: string;
  };
  correlation: {
    variables: string[];
    pearson_raw: number;
    pearson_log: number;
    pearson_log_ci: number[];
    pearson_log_p: number;
    spearman: number;
    n: number;
    strength: string;
    table: { pair: string; method: string; r: number; interpretation: string }[];
    interpretation: string;
  };
  regression: {
    formula: string;
    method: string;
    why_log: string;
    n: number;
    coefficients: ({ term: string } & Row<"estimate" | "std_error" | "t_value" | "p_value" | "ci_low" | "ci_high">)[];
    r_squared: number;
    adj_r_squared: number;
    residual_se: number;
    f_statistic: number;
    f_p_value: number;
    interpretation: string;
    diagnostics: {
      cooks_threshold: number;
      leverage_threshold: number;
      influential: ({ country: string } & Row<"life_expectancy_years" | "std_residual" | "leverage" | "cooks_d">)[];
      n_high_leverage: number;
      large_residuals: string[];
      shapiro_w: number;
      shapiro_p: number;
      residual_skewness: number;
      curvature_p: number;
      notes: string[];
    };
  };
  outliers: {
    method: string;
    variables: ({
      variable: string;
      countries: { country: string; region: string; value: number }[];
    } & Row<"q1" | "q3" | "iqr" | "lower_bound" | "upper_bound" | "n_outliers" | "n_low" | "n_high">)[];
    total_flagged: number;
    life_expectancy_history: { country: string; year: number; life_expectancy: number }[];
  };
  sensitivity: {
    scenarios: {
      scenario: string;
      n: number;
      excluded: string;
      pearson_r_log_gdp: number;
      spearman_rho: number;
      slope: number;
      r_squared: number;
      strength: string;
    }[];
    conclusion: string;
  };
  figures: {
    id: string;
    number: number;
    file: string;
    required: boolean;
    type: string;
    title: string;
    purpose: string;
    interpretation: string;
    file_exists: boolean;
  }[];
  section_a: {
    students: { Student: string; Gender: string; Age: number; Programme: string; Score: number; Attendance: number; Grade: string }[];
    score_statistics: { Statistic: string; Value: number }[];
    programme_averages: { Programme: string; Students: number; Average_Score: number }[];
    overall_average: number;
    above_average: { Student: string; Programme: string; Score: number; Grade: string }[];
  };
  limitations: { title: string; text: string }[];
  automated_summary: string[];
  validation: { status: string; checks_total: number; checks_passed: number; checks_failed: number; checks_pending: number };
};

export type QaReport = {
  schema_version: string;
  generated_at: string;
  status: "PASS" | "FAIL";
  counts: { pass: number; fail: number; pending: number; total: number };
  dataset: {
    observations: number;
    variables: number;
    missing_cells: number;
    duplicate_rows: number;
    duplicate_iso3: number;
    aggregate_rows_in_raw: number;
    aggregate_rows_in_clean: number;
  };
  plausibility_rules: { variable: string; min: number; max: number | null; rationale: string }[];
  checks: { id: string; category: string; check: string; status: "PASS" | "FAIL" | "PENDING"; detail: string }[];
};

export type Manifest = {
  schema_version: string;
  run_started: string;
  run_finished: string;
  report_built?: string;
  extraction_date: string;
  data_year: number;
  r_version: string;
  platform: string;
  os: string;
  os_release: string;
  random_seed: number;
  packages: { package: string; version: string }[];
  source: {
    name: string;
    base_url: string;
    country_endpoint: string;
    indicator_endpoint: string;
    indicators: Record<string, string>;
    year_rationale: string;
    error_handling: string;
  };
  raw_dimensions: { rows: number; columns: number };
  clean_dimensions: { rows: number; columns: number };
  figures_generated: { required: number; additional: number };
  outputs: { file: string; exists: boolean; bytes?: number; md5?: string }[];
  reproducibility_note: string;
};

export type ProjectData = {
  summary: AnalysisSummary;
  qa: QaReport;
  manifest: Manifest;
  countries: Country[];
  reportAvailable: boolean;
  /** Changes whenever R regenerates the outputs; appended to asset URLs to avoid stale cached figures. */
  version: string;
};

export type LoadResult = { ok: true; data: ProjectData } | { ok: false; problems: string[] };

const REQUIRED = [
  "analysis_summary.json",
  "qa_report.json",
  "reproducibility_manifest.json",
  "cleaned_data.json",
] as const;

async function readJson<T>(file: string, problems: string[]): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(PROJECT_DIR, file), "utf8")) as T;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    problems.push(
      code === "ENOENT"
        ? `public/project/${file} is missing - run \`Rscript build_report.R\` (or main_analysis.R) in the project folder to generate it.`
        : `public/project/${file} could not be read (${(err as Error).message}) - re-run the R analysis to regenerate it.`,
    );
    return null;
  }
}

/** Reads the R-generated files. Never throws: problems are returned so the page can explain them. */
export async function loadProjectData(): Promise<LoadResult> {
  const problems: string[] = [];
  const [summary, qa, manifest, countries] = await Promise.all([
    readJson<AnalysisSummary>(REQUIRED[0], problems),
    readJson<QaReport>(REQUIRED[1], problems),
    readJson<Manifest>(REQUIRED[2], problems),
    readJson<Country[]>(REQUIRED[3], problems),
  ]);
  if (!summary || !qa || !manifest || !countries) return { ok: false, problems };

  if (summary.schema_version !== "1.0") {
    return { ok: false, problems: [`analysis_summary.json has schema_version ${summary.schema_version}; this dashboard expects 1.0.`] };
  }
  if (countries.length !== summary.dataset.observations) {
    return {
      ok: false,
      problems: [
        `cleaned_data.json has ${countries.length} rows but analysis_summary.json reports ${summary.dataset.observations} - the files come from different runs. Re-run the R analysis.`,
      ],
    };
  }

  const reportAvailable = await stat(path.join(PROJECT_DIR, "final_report.pdf"))
    .then((s) => s.size > 0)
    .catch(() => false);

  return {
    ok: true,
    data: { summary, qa, manifest, countries, reportAvailable, version: encodeURIComponent(summary.generated_at) },
  };
}

/** Public URL of an R output file (figures are exported under their base name). */
export function assetUrl(file: string, version: string) {
  return `/project/${file.split("/").pop()}?v=${version}`;
}
