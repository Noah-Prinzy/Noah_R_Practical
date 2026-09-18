import type { ReactNode } from "react";
import { Reveal, StatNumber } from "@/components/motion/primitives";
import { Card, Section, SectionHeading, Stat } from "@/components/ui";
import type { AnalysisSummary } from "@/lib/project-data";
import { num, pValue, usd } from "@/lib/format";

export function DataTable({ caption, head, rows, align }: { caption: string; head: string[]; rows: ReactNode[][]; align?: ("l" | "r")[] }) {
  const cls = (i: number) => ((align?.[i] ?? (i === 0 ? "l" : "r")) === "l" ? "text-left" : "whitespace-nowrap text-right tabular-nums");
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[300px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500">
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-1 py-2.5 font-medium ${cls(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {/* Rows stagger in (capped at the motion system's group limit) */}
        <Reveal as="tbody" variant="stagger" step={0.03}>
          {rows.map((r, j) => (
            <tr key={j} data-stagger className="border-b border-zinc-100 last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`px-1 py-2.5 ${cls(i)} ${i === 0 ? "text-zinc-900" : "text-zinc-700"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </Reveal>
      </table>
    </div>
  );
}

/** Scene 07. Do regions and income groups differ? ANOVA, Welch ANOVA, effect size, group tables. */
export function Groups({ summary }: { summary: AnalysisSummary }) {
  const a = summary.anova;
  const g = summary.group_analysis;
  const sds = a.region_sd.map((r) => r.sd);

  return (
    <Section id="groups" labelledBy="groups-title">
      <SectionHeading
        id="groups-title"
        scene="07"
        eyebrow="GROUP DIFFERENCES · ANOVA"
        title="Do regions differ in life expectancy?"
        intro={a.interpretation}
      />

      <Reveal variant="stagger" className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div data-stagger>
          <Card className="h-full">
            <Stat label={`One-way ANOVA F(${a.df_between}, ${a.df_within})`} value={<StatNumber value={a.f_statistic} decimals={1} />} detail={`p = ${pValue(a.p_value)}`} />
          </Card>
        </div>
        <div data-stagger>
          <Card className="h-full">
            <Stat label="Effect size η²" value={<StatNumber value={a.eta_squared} decimals={2} />} detail={`region explains about ${num(a.eta_squared * 100, 0)}% of the variation`} />
          </Card>
        </div>
        <div data-stagger>
          <Card className="h-full">
            <Stat
              label={`Welch's ANOVA F(${a.welch_df[0]}, ${num(a.welch_df[1], 1)})`}
              value={<StatNumber value={a.welch_f} decimals={1} />}
              detail={`p = ${pValue(a.welch_p)} · no equal-variance assumption`}
            />
          </Card>
        </div>
        <div data-stagger>
          <Card className="h-full">
            <Stat label="Regional SD range" value={`${num(Math.min(...sds))}–${num(Math.max(...sds))}`} detail="years of life expectancy" />
          </Card>
        </div>
      </Reveal>
      <Reveal>
        <p className="mt-5 max-w-3xl border-l-2 border-zinc-200 pl-4 text-sm leading-6 text-zinc-600">{a.welch_note}</p>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950">By World Bank region</h3>
            <div className="mt-4">
              <DataTable
                caption="Life expectancy and GDP per capita by World Bank region"
                head={["Region", "n", "Mean life exp.", "Median GDP pc", "Fertility"]}
                rows={g.by_region.map((r) => [r.region, r.countries, num(r.mean_life_expectancy), usd(r.median_gdp_per_capita), num(r.mean_fertility_rate, 2)])}
              />
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <Card className="h-full">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950">By World Bank income group</h3>
            <div className="mt-4">
              <DataTable
                caption="Life expectancy and GDP per capita by World Bank income group"
                head={["Income group", "n", "Mean life exp.", "SD", "Median GDP pc"]}
                rows={g.by_income.map((r) => [r.income_level, r.countries, num(r.mean_life_expectancy), num(r.sd_life_expectancy), usd(r.median_gdp_per_capita)])}
              />
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
