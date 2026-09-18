import { ArrowRight } from "lucide-react";
import { Reveal, StatNumber } from "@/components/motion/primitives";
import { Section, SectionHeading } from "@/components/ui";
import type { AnalysisSummary } from "@/lib/project-data";
import { num } from "@/lib/format";

/**
 * Scene 02. Answers the research question before the evidence. Every number and
 * every directional word below is derived from analysis_summary.json.
 */
export function ShortAnswer({ summary }: { summary: AnalysisSummary }) {
  const c = summary.correlation;
  const slope = summary.regression.coefficients.find((x) => x.term !== "Intercept")!;
  const income = summary.group_analysis.by_income;
  const low = income[0];
  const high = income[income.length - 1];
  const gap = high.mean_life_expectancy - low.mean_life_expectancy;
  const monotonic = income.every((g, i) => i === 0 || g.mean_life_expectancy > income[i - 1].mean_life_expectancy);
  const positive = c.pearson_log > 0;

  const answers = [
    {
      value: c.pearson_log,
      format: { decimals: 2, prefix: "r = " },
      label: "Strength of association",
      caption: `A ${c.strength} correlation between log GDP per capita and life expectancy across ${c.n} countries (95% CI ${num(c.pearson_log_ci[0], 2)} to ${num(c.pearson_log_ci[1], 2)}).`,
    },
    {
      value: slope.estimate,
      format: { decimals: 1, prefix: slope.estimate >= 0 ? "+" : "", suffix: " yrs" },
      label: "Per ten-fold GDP difference",
      caption: `${slope.estimate >= 0 ? "More" : "Less"} life expectancy for each ten-fold difference in GDP per capita, from the regression of life expectancy on log₁₀ GDP (95% CI ${num(slope.ci_low, 1)} to ${num(slope.ci_high, 1)} years).`,
    },
    {
      value: gap,
      format: { decimals: 1, suffix: " yrs" },
      label: "Gap between income groups",
      caption: `Between the average ${high.income_level.toLowerCase()} country (${num(high.mean_life_expectancy)} years) and the average ${low.income_level.toLowerCase()} country (${num(low.mean_life_expectancy)} years)${monotonic ? "; the mean rises at every step between them" : ""}.`,
    },
  ];

  return (
    <Section id="answer" labelledBy="answer-title">
      <SectionHeading
        id="answer-title"
        scene="02"
        eyebrow="THE SHORT ANSWER"
        title={positive ? "Life expectancy rises with national income." : "Life expectancy falls as national income rises."}
        intro={`Across ${summary.dataset.observations} countries in ${summary.project.data_year}, three numbers summarise the relationship. The chapters that follow show where each one comes from and how far it can be trusted.`}
      />

      <div className="mt-16 border-b border-zinc-200">
        {answers.map((a, i) => (
          <Reveal key={a.label} delay={i * 0.12} className="grid gap-3 border-t border-zinc-200 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-end md:gap-10 md:py-10">
            <p className="order-2 text-6xl font-semibold leading-none tracking-tight text-zinc-950 md:order-1 md:text-7xl lg:text-8xl">
              <StatNumber value={a.value} {...a.format} delay={0.1 + i * 0.12} />
            </p>
            <div className="order-1 md:order-2 md:pb-2">
              <p className="text-xs font-medium tracking-[0.16em] text-[#1c5cab] uppercase">{a.label}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600 md:text-base md:leading-7">{a.caption}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 flex flex-col gap-4 rounded-2xl bg-zinc-50 p-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          <span className="font-semibold text-zinc-900">Association, not causation.</span> These are differences between countries in a single
          year. Healthcare, education, infrastructure and institutions move with income and are not modelled here.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href="#relationship" className="group inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#1c5cab] hover:bg-white">
            See the evidence <ArrowRight aria-hidden className="size-4 transition-transform motion-safe:group-hover:translate-x-1" />
          </a>
          <a href="#limitations" className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-zinc-600 hover:bg-white hover:text-zinc-900">
            Limitations
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
