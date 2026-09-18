import { Reveal } from "@/components/reveal";
import { Card, Section, SectionHeading } from "@/components/ui";
import type { AnalysisSummary, Manifest } from "@/lib/project-data";
import { prettyVariable } from "@/lib/format";

const methods = (nDescriptive: number): [string, string][] => [
  ["Descriptive statistics", `Mean, median, minimum, maximum and standard deviation for ${nDescriptive} numeric indicators (missing values excluded pairwise).`],
  ["Group summaries", "Life expectancy, GDP, fertility and urbanisation summarised by World Bank region and income group."],
  ["One-way ANOVA", "Tests whether mean life expectancy differs between regions; η² gives the share of variation explained. Welch's ANOVA repeats the test without assuming equal variances."],
  ["Pearson correlation", "Linear association between log₁₀ GDP per capita and life expectancy, with a 95% confidence interval; also reported on the raw dollar scale."],
  ["Spearman correlation", "Rank-based association that needs neither linearity nor normality, used as a robustness check."],
  ["Linear regression", "OLS of life expectancy on log₁₀ GDP per capita. The slope is years per ten-fold GDP difference; diagnostics check curvature, residual normality, leverage and Cook's distance."],
  ["IQR outlier detection", "Values beyond Q1 − 1.5·IQR or Q3 + 1.5·IQR are flagged. Quartiles resist skew, unlike mean ± SD rules. Flagged values are kept."],
  ["Sensitivity analysis", "Correlation and regression are re-estimated without life-expectancy outliers, GDP outliers and influential points."],
];

export function Methodology({ summary, manifest }: { summary: AnalysisSummary; manifest: Manifest }) {
  const d = summary.dataset;
  return (
    <Section id="methodology">
      <SectionHeading
        eyebrow="METHODOLOGY"
        title="How the results were produced"
        intro="A concise account of the data source, extraction, cleaning, statistical methods and figure choices. The final report gives the full detail."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        <Reveal>
          <Card className="h-full">
            <h3 className="text-base font-semibold text-zinc-950">Data source</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {summary.project.source}: official, public and free to use without an account. Indicators for {summary.project.data_year}:{" "}
              {Object.values(d.indicator_codes).map(prettyVariable).join(", ")}.
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">Why {summary.project.data_year}: {manifest.source.year_rationale}.</p>
          </Card>
        </Reveal>
        <Reveal delay={0.04}>
          <Card className="h-full">
            <h3 className="text-base font-semibold text-zinc-950">Extraction</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {d.indicators + 1} HTTP requests to the World Bank v2 API (one for country metadata, one per indicator), parsed with jsonlite
              and reshaped into one row per economy: {d.raw_rows} rows × {d.raw_columns} columns, saved unchanged as web_extracted_data.csv.
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{manifest.source.error_handling}.</p>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="h-full">
            <h3 className="text-base font-semibold text-zinc-950">Cleaning</h3>
            <ol className="mt-2 space-y-1.5 text-sm leading-6 text-zinc-600">
              {d.cleaning_log.slice(1).map((s) => (
                <li key={s.step}>
                  <span className="tabular-nums text-zinc-400">{s.rows_after}</span> · {s.note}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Removed for missing core values: {d.countries_dropped_missing.join("; ")}. No values were imputed.
            </p>
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-5">
        <Card>
          <h3 className="text-base font-semibold text-zinc-950">Statistical methods</h3>
          <dl className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
            {methods(summary.descriptive_statistics.length).map(([name, text]) => (
              <div key={name}>
                <dt className="text-sm font-medium text-zinc-900">{name}</dt>
                <dd className="mt-0.5 text-sm leading-6 text-zinc-600">{text}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Reveal>

      <Reveal className="mt-5">
        <Card>
          <h3 className="text-base font-semibold text-zinc-950">Why each figure</h3>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {summary.figures.map((f) => (
              <li key={f.id} className="rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
                <span className="font-medium text-zinc-900">Figure {f.number}, {f.type.toLowerCase()}{f.required ? "" : " (additional)"}:</span> {f.purpose}
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </Section>
  );
}
