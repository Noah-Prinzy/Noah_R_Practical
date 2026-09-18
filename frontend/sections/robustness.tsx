import { SensitivityDots } from "@/components/sensitivity-dots";
import { Reveal } from "@/components/motion/primitives";
import { Card, Section, SectionHeading } from "@/components/ui";
import { DataTable } from "@/sections/groups";
import type { AnalysisSummary } from "@/lib/project-data";
import { num, prettyVariable, usd } from "@/lib/format";

/** Scene 08. IQR outliers, the plausibility history check, and the sensitivity analysis. */
export function Robustness({ summary }: { summary: AnalysisSummary }) {
  const o = summary.outliers;
  const sens = summary.sensitivity;
  const year = summary.project.data_year;
  const history = o.life_expectancy_history;
  const historyCountries = [...new Set(history.map((h) => h.country))];
  const valueFmt = (variable: string, v: number) => (variable.includes("gdp") ? usd(v) : num(v, 2));

  return (
    <Section id="robustness" tone="muted" labelledBy="robustness-title">
      <SectionHeading
        id="robustness-title"
        scene="08"
        eyebrow="ROBUSTNESS · OUTLIERS & SENSITIVITY"
        title="Does the conclusion survive unusual countries?"
        intro={`${o.total_flagged} values were flagged by the 1.5 × IQR rule. None were deleted; instead the relationship was re-estimated without them.`}
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Reveal>
          <Card className="h-full">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950">IQR outlier screen</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{o.method}</p>
            <div className="mt-4">
              <DataTable
                caption="IQR outlier bounds and counts by variable"
                head={["Variable", "Lower", "Upper", "Low", "High"]}
                rows={o.variables.map((v) => [prettyVariable(v.variable), valueFmt(v.variable, v.lower_bound), valueFmt(v.variable, v.upper_bound), v.n_low, v.n_high])}
              />
            </div>
            <ul className="mt-5 space-y-2 text-sm leading-6 text-zinc-600">
              {o.variables
                .filter((v) => v.n_outliers > 0)
                .map((v) => (
                  <li key={v.variable}>
                    <span className="font-medium text-zinc-900">{prettyVariable(v.variable)}:</span>{" "}
                    {v.countries
                      .slice(0, 6)
                      .map((c) => c.country)
                      .join(", ")}
                    {v.countries.length > 6 ? ` and ${v.countries.length - 6} more` : ""}.
                  </li>
                ))}
            </ul>
          </Card>
        </Reveal>

        {history.length > 0 && (
          <Reveal delay={0.06}>
            <Card className="h-full">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Plausibility check: {historyCountries.join(", ")}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                The life-expectancy outlier&apos;s World Bank series, fetched from the same API, swings sharply from year to year. That points to a
                crisis-mortality estimate in the source, not an extraction error, so the {year} value is kept and flagged.
              </p>
              <Reveal as="ol" variant="stagger" step={0.03} className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5" aria-label="Life expectancy by year">
                {history.map((h) => (
                  <li
                    key={`${h.country}-${h.year}`}
                    data-stagger
                    className={`rounded-xl px-3 py-2.5 ${h.year === year ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-800"}`}
                  >
                    <div className={`text-[11px] tabular-nums ${h.year === year ? "text-zinc-300" : "text-zinc-500"}`}>{h.year}</div>
                    <div className="text-lg font-semibold tabular-nums">{num(h.life_expectancy)}</div>
                  </li>
                ))}
              </Reveal>
            </Card>
          </Reveal>
        )}
      </div>

      <Reveal className="mt-5">
        <Card>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Sensitivity analysis</h3>
          <p className="mt-1 text-sm text-zinc-600">The same correlation, re-estimated after removing each group of unusual countries.</p>
          <div className="mt-6">
            <SensitivityDots scenarios={sens.scenarios} baseline={summary.correlation.pearson_log} />
          </div>
          <div className="mt-8">
            <DataTable
              caption="Sensitivity scenarios"
              head={["Scenario", "n", "Excluded", "Pearson r", "Spearman ρ", "Slope", "R²"]}
              align={["l", "r", "l", "r", "r", "r", "r"]}
              rows={sens.scenarios.map((s) => [s.scenario, s.n, s.excluded, num(s.pearson_r_log_gdp, 3), num(s.spearman_rho, 3), num(s.slope, 2), num(s.r_squared, 3)])}
            />
          </div>
          <p className="mt-6 border-l-2 border-[#2a78d6] pl-4 text-sm leading-6 text-zinc-700">{sens.conclusion}</p>
        </Card>
      </Reveal>
    </Section>
  );
}
