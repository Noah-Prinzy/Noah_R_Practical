import { ScrollRail } from "@/components/scroll-rail";
import { Section, SectionHeading } from "@/components/ui";
import type { AnalysisSummary, Manifest } from "@/lib/project-data";
import { prettyVariable } from "@/lib/format";

const methods = (nDescriptive: number): [string, string][] => [
  ["Descriptive statistics", `Mean, median, minimum, maximum and SD for ${nDescriptive} numeric indicators (missing values excluded pairwise).`],
  ["Group summaries + ANOVA", "Life expectancy by region and income group; one-way ANOVA with η², repeated as Welch's ANOVA without the equal-variance assumption."],
  ["Pearson & Spearman", "Linear association on raw and log₁₀ GDP with a 95% CI, plus a rank-based check that needs neither linearity nor normality."],
  ["Linear regression", "OLS of life expectancy on log₁₀ GDP; diagnostics for curvature, residual normality, leverage and Cook's distance."],
  ["IQR outliers", "Values beyond Q1 − 1.5·IQR or Q3 + 1.5·IQR are flagged and kept. Quartiles resist skew, unlike mean ± SD rules."],
  ["Sensitivity analysis", "Correlation and regression re-estimated without life-expectancy outliers, GDP outliers and influential points."],
];

/** Scene 11. How and why each result was produced, as a scroll-drawn timeline. */
export function Methodology({ summary, manifest }: { summary: AnalysisSummary; manifest: Manifest }) {
  const d = summary.dataset;
  return (
    <Section id="methodology" labelledBy="methodology-title">
      <SectionHeading
        id="methodology-title"
        scene="11"
        eyebrow="METHODOLOGY"
        title="How the results were produced"
        intro="The reasoning behind each stage. The final report gives the full detail, including every table."
      />
      <ScrollRail
        label="Methodology timeline"
        items={[
          {
            title: "Source",
            text: `${summary.project.source}: official, public and free to use without an account. Indicators for ${summary.project.data_year}: ${Object.values(d.indicator_codes)
              .map(prettyVariable)
              .join(", ")}.`,
            fact: `Why ${summary.project.data_year}?`,
            aside: <p className="text-xs leading-5 text-zinc-500">{manifest.source.year_rationale}.</p>,
          },
          {
            title: "Extraction",
            text: `${d.indicators + 1} HTTP requests to the World Bank v2 API, parsed with jsonlite and reshaped to one row per economy (${d.raw_rows} × ${d.raw_columns}), saved unchanged as web_extracted_data.csv.`,
            aside: <p className="text-xs leading-5 text-zinc-500">{manifest.source.error_handling}.</p>,
          },
          {
            title: "Cleaning",
            text: `Removed for missing core values, not imputed: ${d.countries_dropped_missing.join("; ")}.`,
            fact: `${d.raw_rows} → ${d.observations} rows`,
            aside: (
              <ol className="space-y-1 text-xs leading-5 text-zinc-500">
                {d.cleaning_log.slice(1).map((s) => (
                  <li key={s.step}>
                    <span className="tabular-nums text-zinc-700">{s.rows_after}</span> · {s.note}
                  </li>
                ))}
              </ol>
            ),
          },
          {
            title: "Analysis",
            text: "Each method answers a specific part of the research question and is checked before its result is reported.",
            aside: (
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {methods(summary.descriptive_statistics.length).map(([name, text]) => (
                  <div key={name}>
                    <dt className="text-sm font-medium text-zinc-900">{name}</dt>
                    <dd className="mt-0.5 text-xs leading-5 text-zinc-600">{text}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
          {
            title: "Visualisation",
            text: "Each figure was chosen for the job it does:",
            aside: (
              <ul className="space-y-1.5 text-xs leading-5 text-zinc-600">
                {summary.figures.map((f) => (
                  <li key={f.id}>
                    <span className="font-medium text-zinc-900">
                      Figure {f.number}, {f.type.toLowerCase()}
                      {f.required ? "" : " (additional)"}:
                    </span>{" "}
                    {f.purpose}
                  </li>
                ))}
              </ul>
            ),
          },
          {
            title: "Report",
            text: "build_report.R runs the whole analysis again and writes final_report.pdf from that single run, so the report and these pages can never disagree.",
          },
          {
            title: "Dashboard",
            text: "This site is a presentation layer. It is built from the exported JSON, CSV, PNG and PDF files and performs no statistical calculation of its own.",
          },
        ]}
      />
    </Section>
  );
}
