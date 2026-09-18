import { Reveal, StatNumber } from "@/components/motion/primitives";
import { Section, SectionHeading } from "@/components/ui";
import type { ProjectData } from "@/lib/project-data";
import { int, num, prettyVariable, usd } from "@/lib/format";

/** Scene 04. Official summary values from analysis_summary.json, counted in. */
export function KeyIndicators({ data }: { data: ProjectData }) {
  const k = data.summary.key_indicators;
  const d = data.summary.dataset;
  const missing = d.missing_by_variable.filter((m) => m.missing > 0);

  const cards = [
    {
      label: "Countries analysed",
      value: <StatNumber value={k.countries} />,
      detail: `${d.aggregates_removed} aggregates and ${d.countries_dropped_missing.length} incomplete rows removed from ${d.raw_rows}`,
    },
    {
      label: "Mean life expectancy",
      value: <StatNumber value={k.life_expectancy_mean} decimals={1} suffix=" yrs" />,
      detail: `SD ${num(k.life_expectancy_sd)} · range ${num(k.life_expectancy_min.value)} (${k.life_expectancy_min.country}) to ${num(k.life_expectancy_max.value)} (${k.life_expectancy_max.country})`,
    },
    {
      label: "Median life expectancy",
      value: <StatNumber value={k.life_expectancy_median} decimals={1} suffix=" yrs" />,
      detail:
        k.life_expectancy_median > k.life_expectancy_mean
          ? "Above the mean: a long lower tail pulls the average down"
          : "Below the mean: a long upper tail pulls the average up",
    },
    {
      label: "Mean GDP per capita",
      value: <StatNumber value={k.gdp_per_capita_mean} prefix="$" />,
      detail: `Median ${usd(k.gdp_per_capita_median)}: the mean is ${num(k.gdp_per_capita_mean / k.gdp_per_capita_median)}× the median${
        k.gdp_per_capita_mean > k.gdp_per_capita_median ? ", a right-skewed distribution" : ""
      }`,
    },
    {
      label: "Mean fertility rate",
      value: <StatNumber value={k.fertility_rate_mean} decimals={2} />,
      detail: `births per woman · median ${num(k.fertility_rate_median, 2)}`,
    },
    {
      label: "Missing cells",
      value: <StatNumber value={k.pct_missing_cells} decimals={2} suffix="%" />,
      detail: `${d.total_missing_cells} of ${int(d.observations * d.variables)} cells, only in ${missing.map((m) => `${prettyVariable(m.variable)} (${m.missing})`).join(" and ")}`,
    },
  ];

  return (
    <Section id="dataset" labelledBy="dataset-title">
      <SectionHeading
        id="dataset-title"
        scene="04"
        eyebrow="DATASET AT A GLANCE"
        title="The cleaned dataset in six numbers"
        intro={`Official values calculated in R for all ${k.countries} countries (${data.summary.project.data_year} data), read from analysis_summary.json rather than recomputed in the browser.`}
      />
      <Reveal variant="stagger" className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            data-stagger
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition-[transform,border-color] duration-150 ease-out hover:border-zinc-300 motion-safe:hover:-translate-y-0.5 md:p-6"
          >
            <div className="text-xs font-medium text-zinc-500">{c.label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">{c.value}</div>
            <div className="mt-2 text-xs leading-5 text-zinc-500">{c.detail}</div>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
