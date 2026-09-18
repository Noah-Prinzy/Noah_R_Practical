import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { Card, Section, SectionHeading, Stat } from "@/components/ui";
import type { AnalysisSummary } from "@/lib/project-data";
import { int, num, pValue, prettyVariable, usd } from "@/lib/format";

function CardTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-medium tracking-[0.16em] text-[#1c5cab]">{kicker}</div>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">{title}</h3>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-5 border-l-2 border-zinc-200 pl-3 text-sm leading-6 text-zinc-600">{children}</p>;
}

function Table({ head, rows, align }: { head: string[]; rows: ReactNode[][]; align?: ("l" | "r")[] }) {
  const cls = (i: number) => ((align?.[i] ?? (i === 0 ? "l" : "r")) === "l" ? "text-left" : "whitespace-nowrap text-right tabular-nums");
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[300px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500">
            {head.map((h, i) => (
              <th key={h} className={`px-1 py-2 font-medium ${cls(i)}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, j) => (
            <tr key={j} className="border-b border-zinc-100 last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`px-1 py-2 ${cls(i)} ${i === 0 ? "text-zinc-900" : "text-zinc-700"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Single-series dot chart: Pearson r (log GDP) per sensitivity scenario, baseline marked. */
function SensitivityDots({ scenarios, baseline }: { scenarios: AnalysisSummary["sensitivity"]["scenarios"]; baseline: number }) {
  const values = scenarios.map((s) => s.pearson_r_log_gdp);
  const lo = Math.max(0, Math.floor((Math.min(...values) - 0.02) * 20) / 20);
  const hi = Math.min(1, Math.ceil((Math.max(...values) + 0.02) * 20) / 20);
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const ticks = Array.from({ length: Math.round((hi - lo) / 0.05) + 1 }, (_, i) => lo + i * 0.05);

  return (
    <figure aria-label="Pearson correlation under each sensitivity scenario">
      <div className="space-y-3">
        {scenarios.map((s) => (
          <div key={s.scenario} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
            <div className="text-xs leading-5 text-zinc-600">
              {s.scenario} <span className="text-zinc-400">(n = {s.n})</span>
            </div>
            <div className="relative h-7">
              <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
              <div className="absolute top-0 h-full border-l border-dashed border-zinc-400" style={{ left: `${x(baseline)}%` }} />
              <div
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a78d6] ring-2 ring-white"
                style={{ left: `${x(s.pearson_r_log_gdp)}%` }}
                title={`r = ${s.pearson_r_log_gdp.toFixed(3)}`}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 pl-3 text-xs font-medium tabular-nums text-zinc-800"
                style={{ left: `${x(s.pearson_r_log_gdp)}%` }}
              >
                {s.pearson_r_log_gdp.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
        <div />
        <div className="relative h-5 text-[11px] tabular-nums text-zinc-400">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${x(t)}%` }}>{t.toFixed(2)}</span>
          ))}
        </div>
      </div>
      <figcaption className="mt-1 text-xs text-zinc-500 sm:pl-[calc(15rem+1rem)]">
        Pearson r, log GDP per capita vs life expectancy · dashed line = baseline ({baseline.toFixed(3)})
      </figcaption>
    </figure>
  );
}

export function AdvancedAnalysis({ summary }: { summary: AnalysisSummary }) {
  const { correlation: c, regression: reg, anova: a, outliers: o, sensitivity: sens, group_analysis: g, section_a: sa } = summary;
  const slope = reg.coefficients.find((x) => x.term !== "Intercept")!;
  const intercept = reg.coefficients.find((x) => x.term === "Intercept")!;
  const history = o.life_expectancy_history;

  return (
    <Section id="analysis" tone="muted">
      <SectionHeading
        eyebrow="ADVANCED ANALYSIS"
        title="Evidence behind the headline relationship"
        intro="Correlation, regression, ANOVA, outlier and sensitivity results, all read from analysis_summary.json. The regression and sensitivity analyses go beyond the exam requirements and are marked as additional in the report."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardTitle kicker="C3 · CORRELATION" title="GDP per capita and life expectancy" />
            <div className="grid grid-cols-2 gap-5">
              <Stat label="Pearson r (log GDP)" value={num(c.pearson_log, 3)} detail={`95% CI ${num(c.pearson_log_ci[0], 3)} to ${num(c.pearson_log_ci[1], 3)}`} />
              <Stat label="p-value" value={pValue(c.pearson_log_p)} detail={`n = ${c.n} countries`} />
              <Stat label="Spearman ρ" value={num(c.spearman, 3)} detail="rank-based, no linearity assumed" />
              <Stat label="Pearson r (raw US$)" value={num(c.pearson_raw, 3)} detail="weaker: the raw relationship is curved" />
            </div>
            <Note>
              <span className="font-medium text-zinc-900">{c.strength[0].toUpperCase() + c.strength.slice(1)} association.</span> {c.interpretation}
            </Note>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardTitle kicker="ADDITIONAL · REGRESSION" title="Life expectancy on log₁₀ GDP per capita" />
            <div className="grid grid-cols-2 gap-5">
              <Stat label="Slope (years per 10× GDP)" value={num(slope.estimate, 2)} detail={`95% CI ${num(slope.ci_low, 2)} to ${num(slope.ci_high, 2)}`} />
              <Stat label="R² / adjusted R²" value={`${num(reg.r_squared, 3)} / ${num(reg.adj_r_squared, 3)}`} detail={`residual SE ${num(reg.residual_se, 2)} years`} />
              <Stat label="p-value (slope)" value={pValue(slope.p_value)} detail={`SE ${num(slope.std_error, 3)} · t = ${num(slope.t_value, 1)}`} />
              <Stat label="Intercept" value={num(intercept.estimate, 2)} detail={`${reg.method}, n = ${reg.n}`} />
            </div>
            <Note>{reg.why_log}</Note>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
              <span className="font-semibold">Association, not causation.</span> {reg.interpretation}
            </p>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="h-full">
            <CardTitle kicker="C2 · ANOVA" title="Do regions differ in life expectancy?" />
            <div className="grid grid-cols-2 gap-5">
              <Stat label={`F(${a.df_between}, ${a.df_within})`} value={num(a.f_statistic, 1)} detail="one-way ANOVA by region" />
              <Stat label="p-value" value={pValue(a.p_value)} detail={`η² = ${num(a.eta_squared, 2)}`} />
              <Stat label={`Welch F(${a.welch_df[0]}, ${num(a.welch_df[1], 1)})`} value={num(a.welch_f, 1)} detail={`p = ${pValue(a.welch_p)}`} />
              <Stat label="Regional SD range" value={`${num(Math.min(...a.region_sd.map((r) => r.sd)))}–${num(Math.max(...a.region_sd.map((r) => r.sd)))}`} detail="years of life expectancy" />
            </div>
            <Note>{a.interpretation} {a.welch_note}</Note>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardTitle kicker="C4 · OUTLIERS" title={`${o.total_flagged} potential outliers, all retained`} />
            <Table
              head={["Variable", "Lower bound", "Upper bound", "Low", "High"]}
              rows={o.variables.map((v) => [prettyVariable(v.variable), num(v.lower_bound, 2), num(v.upper_bound, 2), v.n_low, v.n_high])}
            />
            <Note>
              Method: {o.method}.
              {history.length > 0 && (
                <>
                  {" "}The World Bank&apos;s multi-year series for the life-expectancy outlier ({[...new Set(history.map((h) => h.country))].join(", ")}) is
                  volatile: {history.map((h) => `${h.year}: ${num(h.life_expectancy)}`).join(", ")}. That points to a crisis-mortality estimate,
                  not an extraction error, so the value is flagged rather than deleted.
                </>
              )}
            </Note>
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-5">
        <Card>
          <CardTitle kicker="ADDITIONAL · SENSITIVITY / ROBUSTNESS" title="Does the conclusion depend on unusual countries?" />
          <SensitivityDots scenarios={sens.scenarios} baseline={c.pearson_log} />
          <div className="mt-6">
            <Table
              head={["Scenario", "n", "Excluded", "Pearson r", "Spearman ρ", "Slope", "R²"]}
              align={["l", "r", "l", "r", "r", "r", "r"]}
              rows={sens.scenarios.map((s) => [s.scenario, s.n, s.excluded, num(s.pearson_r_log_gdp, 3), num(s.spearman_rho, 3), num(s.slope, 2), num(s.r_squared, 3)])}
            />
          </div>
          <Note>{sens.conclusion}</Note>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {reg.diagnostics.notes.map((n) => (
              <p key={n} className="rounded-xl bg-zinc-50 px-3 py-2.5 text-xs leading-5 text-zinc-600">{n}</p>
            ))}
          </div>
        </Card>
      </Reveal>

      <div className="mt-5 grid gap-5">
        <Reveal>
          <Card className="h-full">
            <CardTitle kicker="C2 · GROUP ANALYSIS" title="By World Bank income group" />
            <Table
              head={["Income group", "Countries", "Mean life exp. (yrs)", "SD", "Median GDP per capita", "Mean fertility"]}
              rows={g.by_income.map((r) => [r.income_level, r.countries, num(r.mean_life_expectancy), num(r.sd_life_expectancy), usd(r.median_gdp_per_capita), num(r.mean_fertility_rate, 2)])}
            />
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardTitle kicker="C2 · GROUP ANALYSIS" title="By World Bank region" />
            <Table
              head={["Region", "Countries", "Mean life exp. (yrs)", "Median life exp.", "Median GDP per capita", "Mean fertility", "Mean urban %"]}
              rows={g.by_region.map((r) => [r.region, r.countries, num(r.mean_life_expectancy), num(r.median_life_expectancy), usd(r.median_gdp_per_capita), num(r.mean_fertility_rate, 2), num(r.mean_urban_pct)])}
            />
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-5">
        <Card>
          <CardTitle kicker="SECTION A · R PROGRAMMING TASK" title="Student dataset (10 students, exact exam data)" />
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-2">
              {sa.score_statistics.map((s) => (
                <Stat key={s.Statistic} label={s.Statistic} value={num(s.Value, s.Statistic === "Standard deviation" ? 2 : 1)} />
              ))}
            </div>
            <div className="space-y-5">
              <Table
                head={["Programme", "Students", "Average score"]}
                rows={sa.programme_averages.map((p) => [p.Programme, p.Students, num(p.Average_Score, 2)])}
              />
              <p className="text-sm leading-6 text-zinc-600">
                <span className="font-medium text-zinc-900">Above the overall average of {num(sa.overall_average)}:</span>{" "}
                {sa.above_average.map((s) => `${s.Student} (${s.Score}, ${s.Grade})`).join(", ")}. {int(sa.students.length)} students in total;
                grades assigned with the 80/70/60/50 cut-offs.
              </p>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
