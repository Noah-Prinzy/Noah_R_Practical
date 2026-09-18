import { ArrowDown, FileText, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/ui";
import type { ProjectData } from "@/lib/project-data";
import { int } from "@/lib/format";

export function Hero({ data }: { data: ProjectData }) {
  const { summary, qa, reportAvailable } = data;
  const requiredFigures = summary.figures.filter((f) => f.required).length;
  const metrics = [
    { value: summary.dataset.observations, label: "cleaned observations", note: "countries" },
    { value: summary.dataset.variables, label: "cleaned variables", note: `${summary.dataset.numeric_variables} numeric` },
    { value: summary.dataset.indicators, label: "World Bank indicators", note: `data year ${summary.project.data_year}` },
    { value: requiredFigures, label: "required visualisations", note: `+ ${summary.figures.length - requiredFigures} diagnostic` },
  ];

  return (
    <section id="overview" className="relative overflow-hidden bg-zinc-950 px-4 pb-20 pt-32 text-white md:px-16 md:pt-40 lg:px-24">
      {/* faint grid: a quiet nod to plotted data, no gradients */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:64px_64px]"
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <Eyebrow dark>R PRACTICAL EXAM · WORLD BANK DATA</Eyebrow>
          <h1 className="mt-7 max-w-4xl text-5xl leading-[1.02] tracking-tight md:text-7xl">From Raw Data to Statistical Insight</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300">
            An interactive presentation of the R practical exam analysis. Country data are pulled from the World Bank API, then
            cleaned, checked, analysed and visualised in R. Every value on this page is read from the files that analysis exports.
          </p>
          <p className="mt-4 max-w-2xl border-l-2 border-[#3987e5] pl-4 text-sm leading-6 text-zinc-400">
            <span className="text-zinc-200">Research question:</span> {summary.project.question}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#figures" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 hover:bg-zinc-100">
              Explore the analysis <ArrowDown className="size-4" />
            </a>
            {reportAvailable && (
              <a
                href="/project/final_report.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium hover:bg-white/10"
              >
                <FileText className="size-4" /> View Final Report
              </a>
            )}
            <a
              href="#quality"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ring-1 ${
                qa.status === "PASS" ? "text-emerald-300 ring-emerald-400/30" : "text-red-300 ring-red-400/40"
              }`}
            >
              <ShieldCheck className="size-4" /> Data QA {qa.status} · {qa.counts.pass}/{qa.counts.total} checks
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-4xl font-semibold tabular-nums">{int(m.value)}</div>
              <div className="mt-1 text-sm text-zinc-300">{m.label}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{m.note}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
