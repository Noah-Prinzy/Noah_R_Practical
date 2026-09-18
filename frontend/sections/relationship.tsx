import { StickySteps, type Step } from "@/components/sticky-steps";
import { Reveal } from "@/components/motion/primitives";
import { Section, SectionHeading } from "@/components/ui";
import type { ProjectData } from "@/lib/project-data";
import { assetUrl } from "@/lib/project-data";
import { num, pValue } from "@/lib/format";

/**
 * Scene 06. Correlation -> log transform -> regression -> diagnostics, told against
 * the pinned Figure 5. Every value and sentence is taken from analysis_summary.json.
 */
export function Relationship({ data }: { data: ProjectData }) {
  const { summary, figureSizes, version } = data;
  const c = summary.correlation;
  const reg = summary.regression;
  const dg = reg.diagnostics;
  const slope = reg.coefficients.find((x) => x.term !== "Intercept")!;
  const raw = c.table.find((t) => t.method === "Pearson" && !t.pair.startsWith("log"));
  const influentialScenario = summary.sensitivity.scenarios.find((s) => s.scenario.toLowerCase().includes("influential"));
  const fig5 = summary.figures.find((f) => !f.required)!;
  const size = figureSizes[fig5.id] ?? { width: 2000, height: 1700 };
  const [curvatureNote, normalityNote] = dg.notes;

  const steps: Step[] = [
    {
      id: "raw",
      kicker: "RAW CORRELATION",
      title: c.pearson_raw < c.pearson_log ? "In raw dollars the association looks weaker" : "The raw-dollar association",
      value: { number: c.pearson_raw, format: { decimals: 2, prefix: "r = " } },
      detail: `On the untransformed US$ scale Pearson r = ${num(c.pearson_raw, 3)}${raw ? ` (${raw.interpretation})` : ""}. ${c.interpretation}`,
      focus: "all",
    },
    {
      id: "log",
      kicker: "LOG TRANSFORMATION",
      title: c.pearson_log > c.pearson_raw ? "On the log scale the association strengthens" : "The association on the log scale",
      value: { number: c.pearson_log, format: { decimals: 2, prefix: "r = " } },
      detail: `${reg.why_log} Pearson r ${c.pearson_log > c.pearson_raw ? "rises" : "changes"} to ${num(c.pearson_log, 3)} (95% CI ${num(c.pearson_log_ci[0], 3)} to ${num(c.pearson_log_ci[1], 3)}); Spearman's rank correlation is ${num(c.spearman, 3)}.`,
      focus: "all",
    },
    {
      id: "slope",
      kicker: "REGRESSION SLOPE",
      title: "Years of life expectancy per ten-fold GDP",
      value: { number: slope.estimate, format: { decimals: 2, prefix: slope.estimate >= 0 ? "+" : "", suffix: " yrs" } },
      detail: `The ${reg.method.toLowerCase()} model ${reg.formula} (n = ${reg.n}) estimates a slope of ${num(slope.estimate, 2)}: each ten-fold difference in GDP per capita is associated with about ${num(slope.estimate, 1)} years of life expectancy.`,
      focus: "all",
    },
    {
      id: "ci",
      kicker: "CONFIDENCE INTERVAL",
      title: "How precisely the slope is estimated",
      value: { text: `${num(slope.ci_low, 2)} – ${num(slope.ci_high, 2)}` },
      detail: `95% confidence interval for the slope. Standard error ${num(slope.std_error, 3)}, t = ${num(slope.t_value, 1)}, p = ${pValue(slope.p_value)}. ${slope.ci_low > 0 || slope.ci_high < 0 ? "The interval does not include zero." : "The interval includes zero, so the direction is uncertain."}`,
      focus: "all",
    },
    {
      id: "r2",
      kicker: "R²",
      title: "How much of the variation income explains",
      value: { number: reg.r_squared * 100, format: { decimals: 0, suffix: "%" } },
      detail: `R² = ${num(reg.r_squared, 3)} (adjusted ${num(reg.adj_r_squared, 3)}): log GDP per capita accounts for about ${num(reg.r_squared * 100, 0)}% of the between-country variation. Residual standard error ${num(reg.residual_se, 2)} years; the remainder reflects everything the model leaves out.`,
      focus: "all",
    },
    {
      id: "linearity",
      kicker: "DIAGNOSTICS · LINEARITY",
      title: "Residuals vs fitted values",
      value: { text: `p = ${pValue(dg.curvature_p)}` },
      detail: `${curvatureNote} (Top-left panel.)`,
      focus: "tl",
    },
    {
      id: "normality",
      kicker: "DIAGNOSTICS · NORMALITY",
      title: "Normal Q-Q of the residuals",
      value: { number: dg.residual_skewness, format: { decimals: 2, prefix: "skew " } },
      detail: `${normalityNote} (Top-right panel.)`,
      focus: "tr",
    },
    {
      id: "influence",
      kicker: "INFLUENTIAL OBSERVATIONS",
      title: "Countries that pull on the line",
      value: { number: dg.influential.length, format: { suffix: " countries" } },
      detail: `${dg.influential.length} countries exceed the Cook's distance screening value of 4/n (${num(dg.cooks_threshold, 4)}), led by ${dg.influential
        .slice(0, 3)
        .map((i) => `${i.country} (D = ${num(i.cooks_d, 2)})`)
        .join(", ")}.${influentialScenario ? ` Refitting without them gives r = ${num(influentialScenario.pearson_r_log_gdp, 3)} and a slope of ${num(influentialScenario.slope, 2)}.` : ""} (Bottom-left panel.)`,
      focus: "bl",
    },
  ];

  return (
    <Section id="relationship" tone="dark" labelledBy="relationship-title">
      <SectionHeading
        id="relationship-title"
        dark
        scene="06"
        eyebrow="RELATIONSHIP · CORRELATION & REGRESSION"
        title="How closely is income tied to life expectancy?"
        intro="From the raw correlation to the regression diagnostics, step by step, alongside the regression diagnostics figure R produced."
      />
      <StickySteps
        steps={steps}
        figure={{
          number: fig5.number,
          title: fig5.title,
          type: fig5.type,
          interpretation: fig5.interpretation,
          src: assetUrl(fig5.file, version),
          width: size.width,
          height: size.height,
        }}
      />
      <Reveal className="mt-14 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950 md:p-6">
        <span className="font-semibold">Association, not causation.</span> {reg.interpretation}
      </Reveal>
    </Section>
  );
}
