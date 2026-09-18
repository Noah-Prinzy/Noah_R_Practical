import { BarChart3, Braces, Database, FileText, Globe, LayoutDashboard, Sigma, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/ui";
import type { ProjectData } from "@/lib/project-data";

export function Pipeline({ data }: { data: ProjectData }) {
  const { summary, qa } = data;
  const d = summary.dataset;
  const required = summary.figures.filter((f) => f.required).length;
  const stages = [
    { icon: Globe, title: "World Bank", text: "Public World Development Indicators API; no login required.", fact: `${d.indicators} indicators · ${summary.project.data_year}` },
    { icon: Braces, title: "API extraction", text: "JSON requests with retries and error detection, parsed with jsonlite.", fact: `${d.indicators + 1} requests` },
    { icon: Database, title: "Raw data", text: "Saved unchanged as web_extracted_data.csv, including aggregate rows.", fact: `${d.raw_rows} × ${d.raw_columns}` },
    { icon: Sparkles, title: "Cleaning", text: "Aggregates and incomplete rows removed, text trimmed, types and names fixed.", fact: `${d.observations} × ${d.variables}` },
    { icon: Sigma, title: "Statistical analysis", text: "Descriptives, groups and ANOVA, correlation, regression, outliers, sensitivity.", fact: `QA ${qa.status}` },
    { icon: BarChart3, title: "Visualisation", text: "ggplot2 figures exported as PNG, each with a data-driven interpretation.", fact: `${required} required + ${summary.figures.length - required}` },
    { icon: FileText, title: "Report", text: "build_report.R turns the same run into the final PDF report.", fact: data.reportAvailable ? "PDF ready" : "not built yet" },
    { icon: LayoutDashboard, title: "Interactive dashboard", text: "This page reads the exported JSON, CSV and PNG files.", fact: "presentation layer" },
  ];

  return (
    <Section id="pipeline">
      <SectionHeading
        eyebrow="DATA PIPELINE"
        title="One reproducible path from website to insight"
        intro="main_analysis.R runs every step in order and stops with an explanation if a check fails. The facts on each card come from the latest run."
      />
      <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.03}>
            <li className="relative h-full rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-700">
                  <s.icon className="size-4" />
                </span>
                <span className="text-xs tabular-nums text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-950">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">{s.text}</p>
              <div className="mt-4 inline-block rounded-full bg-[#eef4fc] px-2.5 py-1 text-xs font-medium text-[#1c5cab]">{s.fact}</div>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
