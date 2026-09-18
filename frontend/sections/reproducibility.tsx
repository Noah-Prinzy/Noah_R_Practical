import { Download, ExternalLink, FileText } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { Card, RollButton, Section, SectionHeading } from "@/components/ui";
import type { AnalysisSummary, Manifest } from "@/lib/project-data";
import { dateLabel, prettyVariable } from "@/lib/format";

export function Reproducibility({ summary, manifest, reportAvailable }: { summary: AnalysisSummary; manifest: Manifest; reportAvailable: boolean }) {
  const facts: [string, string][] = [
    ["Source", manifest.source.name],
    ["Data year", String(manifest.data_year)],
    ["Extraction date", manifest.extraction_date],
    ["Analysis run", dateLabel(manifest.run_started)],
    ...(manifest.report_built ? ([["Report built", dateLabel(manifest.report_built)]] as [string, string][]) : []),
    ["R version", manifest.r_version],
    ["Platform", `${manifest.os} ${manifest.os_release} (${manifest.platform})`],
    ["Random seed", String(manifest.random_seed)],
    ["Raw → cleaned", `${manifest.raw_dimensions.rows} × ${manifest.raw_dimensions.columns} → ${manifest.clean_dimensions.rows} × ${manifest.clean_dimensions.columns}`],
  ];

  return (
    <Section id="reproducibility" labelledBy="reproducibility-title">
      <SectionHeading
        id="reproducibility-title"
        scene="14"
        eyebrow="REPORT · SOURCE · REPRODUCIBILITY"
        title="Read the report, rerun the analysis"
        intro="This dashboard is a presentation layer: it performs no statistical calculation of its own. The details below come from reproducibility_manifest.json, written by the same R run."
      />

      <Reveal className="mt-10">
        <div className="flex flex-col gap-5 rounded-2xl bg-zinc-950 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <div className="text-xs tracking-[0.16em] text-zinc-400">FINAL REPORT</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{summary.project.title}</div>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Introduction, data extraction, cleaning, analysis, visualisation, limitations and conclusion, with all figures and their interpretations.
            </p>
          </div>
          {reportAvailable ? (
            <div className="shrink-0 self-start md:self-auto">
              <RollButton href="/project/final_report.pdf" external variant="light" icon={<FileText aria-hidden className="size-4" />}>
                View Final Report
              </RollButton>
            </div>
          ) : (
            <p className="max-w-xs text-sm text-amber-300">final_report.pdf has not been built yet. Run <code>Rscript build_report.R</code> in the project folder.</p>
          )}
        </div>
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <h3 className="text-base font-semibold text-zinc-950">Run details</h3>
            <dl className="mt-4 divide-y divide-zinc-100">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 text-sm">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="break-words text-zinc-900">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-5 text-zinc-500">{manifest.reproducibility_note}</p>
            <a href="#sources" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-[#1c5cab] hover:underline">
              Data sources and exact API queries ↓
            </a>
          </Card>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="h-full">
            <h3 className="text-base font-semibold text-zinc-950">R packages</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {manifest.packages.map((p) => (
                <li key={p.package} className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs text-zinc-700">
                  {p.package} {p.version}
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-base font-semibold text-zinc-950">Output files (MD5 checksums)</h3>
            <ul className="mt-3 space-y-1.5">
              {manifest.outputs.map((o) => (
                <li key={o.file} className="flex items-center justify-between gap-3 text-xs">
                  <span className={o.exists ? "text-zinc-800" : "text-red-700"}>{o.file}</span>
                  <span className="font-mono text-zinc-500">{o.md5 ? o.md5.slice(0, 10) : "missing"}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {["analysis_summary.json", "qa_report.json", "reproducibility_manifest.json", "data_dictionary.csv"].map((f) => (
                <a key={f} href={`/project/${f}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-zinc-300 px-4 text-xs text-zinc-700 hover:bg-zinc-50">
                  <Download className="size-3.5" /> {f}
                </a>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <DataSources manifest={manifest} />
    </Section>
  );
}

const WDI_DATABASE = "https://databank.worldbank.org/source/world-development-indicators";
const API_DOCS = "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation";

/**
 * Where every number came from. Built from the manifest R wrote, so the links always
 * match the indicators and year that were actually extracted. The API root
 * (api.worldbank.org/v2/) is not browsable, so each link is a real, working query.
 */
function DataSources({ manifest }: { manifest: Manifest }) {
  const indicators = Object.entries(manifest.source.indicators);
  const apiQuery = (code: string) => manifest.source.indicator_endpoint.replace("<CODE>", code);
  const link = "inline-flex min-h-11 items-center gap-1.5 text-[#1c5cab] hover:underline";

  return (
    <Reveal className="mt-5" id="sources">
      <Card>
        <h3 className="text-base font-semibold text-zinc-950">Data sources</h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
          All country data come from the {manifest.source.name}, year {manifest.data_year}, extracted on {manifest.extraction_date}. For each
          indicator: the official World Bank page, and the exact API query main_analysis.R ran (it opens as raw JSON, the same data R received).
        </p>
        <div className="mt-4 -mx-1 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">World Bank indicators used, with source pages and API queries</caption>
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th scope="col" className="px-1 py-2.5 font-medium">Indicator</th>
                <th scope="col" className="px-1 py-2.5 font-medium">World Bank code</th>
                <th scope="col" className="px-1 py-2.5 font-medium">Official page</th>
                <th scope="col" className="px-1 py-2.5 font-medium">API query ({manifest.data_year})</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map(([code, variable]) => (
                <tr key={code} className="border-b border-zinc-100 last:border-0">
                  <td className="px-1 py-1 text-zinc-900">{prettyVariable(variable)}</td>
                  <td className="px-1 py-1 font-mono text-xs text-zinc-700">{code}</td>
                  <td className="px-1 py-1">
                    <a href={`https://data.worldbank.org/indicator/${code}`} target="_blank" rel="noreferrer" className={link}>
                      data.worldbank.org <ExternalLink aria-hidden className="size-3.5" />
                    </a>
                  </td>
                  <td className="px-1 py-1">
                    <a href={apiQuery(code)} target="_blank" rel="noreferrer" className={link}>
                      JSON <ExternalLink aria-hidden className="size-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-1 py-1 text-zinc-900">Country names, regions and income groups</td>
                <td className="px-1 py-1 font-mono text-xs text-zinc-700">country metadata</td>
                <td className="px-1 py-1">
                  <a href="https://data.worldbank.org/country" target="_blank" rel="noreferrer" className={link}>
                    data.worldbank.org <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                </td>
                <td className="px-1 py-1">
                  <a href={manifest.source.country_endpoint} target="_blank" rel="noreferrer" className={link}>
                    JSON <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 text-sm">
          <a href={WDI_DATABASE} target="_blank" rel="noreferrer" className={link}>
            World Development Indicators database <ExternalLink aria-hidden className="size-3.5" />
          </a>
          <a href={API_DOCS} target="_blank" rel="noreferrer" className={link}>
            World Bank API documentation <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </div>
      </Card>
    </Reveal>
  );
}
