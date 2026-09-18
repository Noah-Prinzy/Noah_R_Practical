import { Reveal } from "@/components/reveal";
import { Card, Section, SectionHeading, Stat } from "@/components/ui";
import type { ProjectData } from "@/lib/project-data";
import { int, num, pct, prettyVariable, usd } from "@/lib/format";

export function KeyIndicators({ data }: { data: ProjectData }) {
  const k = data.summary.key_indicators;
  const d = data.summary.dataset;
  const missing = d.missing_by_variable.filter((m) => m.missing > 0);

  return (
    <Section id="indicators" tone="muted">
      <SectionHeading
        eyebrow="KEY INDICATORS"
        title="The cleaned dataset at a glance"
        intro={`Official values calculated in R for all ${k.countries} countries (${data.summary.project.data_year} data). They are read from analysis_summary.json, not recomputed in the browser.`}
      />
      <Reveal className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Stat label="Countries" value={int(k.countries)} detail={`${d.aggregates_removed} aggregates and ${d.countries_dropped_missing.length} incomplete rows removed from ${d.raw_rows}`} />
        </Card>
        <Card>
          <Stat
            label="Mean life expectancy"
            value={`${num(k.life_expectancy_mean)} yrs`}
            detail={`SD ${num(k.life_expectancy_sd)} · range ${num(k.life_expectancy_min.value)} (${k.life_expectancy_min.country}) to ${num(k.life_expectancy_max.value)} (${k.life_expectancy_max.country})`}
          />
        </Card>
        <Card>
          <Stat label="Median life expectancy" value={`${num(k.life_expectancy_median)} yrs`} detail={
              k.life_expectancy_median > k.life_expectancy_mean
                ? "Above the mean: a long lower tail pulls the average down"
                : "Below the mean: a long upper tail pulls the average up"
            }
          />
        </Card>
        <Card>
          <Stat
            label="Mean GDP per capita"
            value={usd(k.gdp_per_capita_mean)}
            detail={`Median ${usd(k.gdp_per_capita_median)}: the mean is ${num(k.gdp_per_capita_mean / k.gdp_per_capita_median)}× the median${
              k.gdp_per_capita_mean > k.gdp_per_capita_median ? ", a right-skewed distribution" : ""
            }`}
          />
        </Card>
        <Card>
          <Stat label="Mean fertility rate" value={num(k.fertility_rate_mean, 2)} detail={`births per woman · median ${num(k.fertility_rate_median, 2)}`} />
        </Card>
        <Card>
          <Stat
            label="Missing cells"
            value={pct(k.pct_missing_cells, 2)}
            detail={`${d.total_missing_cells} of ${int(d.observations * d.variables)} cells, only in ${missing.map((m) => `${prettyVariable(m.variable)} (${m.missing})`).join(" and ")}`}
          />
        </Card>
      </Reveal>
    </Section>
  );
}
