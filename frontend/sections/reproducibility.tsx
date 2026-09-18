import { Download, ExternalLink, FileText } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { Card, RollButton, Section, SectionHeading } from "@/components/ui";
import type { AnalysisSummary, Manifest } from "@/lib/project-data";
import { dateLabel } from "@/lib/format";

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
            <a href={manifest.source.base_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#1c5cab] hover:underline">
              World Bank API <ExternalLink className="size-3.5" />
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
    </Section>
  );
}
