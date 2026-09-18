import { BarChart3, Braces, Database, FileJson, FileText, Globe, Sigma, Sparkles } from "lucide-react";
import { ScrollRail } from "@/components/scroll-rail";
import { Section, SectionHeading } from "@/components/ui";
import type { ProjectData } from "@/lib/project-data";

/** Scene 03. What happens to the data, stage by stage; facts come from the latest R run. */
export function Pipeline({ data }: { data: ProjectData }) {
  const { summary, qa } = data;
  const d = summary.dataset;
  const required = summary.figures.filter((f) => f.required).length;
  const icon = "size-4";

  return (
    <Section id="pipeline" tone="muted" labelledBy="pipeline-title">
      <SectionHeading
        id="pipeline-title"
        scene="03"
        eyebrow="DATA PIPELINE"
        title="One reproducible path from website to insight"
        intro="main_analysis.R runs every stage in order and stops with an explanation if a check fails. The figures on each stage come from the latest run."
      />
      <ScrollRail
        label="Data pipeline stages"
        items={[
          {
            title: "Website",
            icon: <Globe aria-hidden className={icon} />,
            fact: `${d.indicators} indicators · ${summary.project.data_year}`,
            text: "The World Bank's public World Development Indicators API: official data with no login or key required.",
          },
          {
            title: "Extraction",
            icon: <Braces aria-hidden className={icon} />,
            fact: `${d.indicators + 1} requests`,
            text: "One request for country metadata and one per indicator. Each request is retried on failure and checked for error messages and empty responses.",
          },
          {
            title: "Raw data",
            icon: <Database aria-hidden className={icon} />,
            fact: `${d.raw_rows} × ${d.raw_columns}`,
            text: "Saved unchanged as web_extracted_data.csv, including the regional and income-group aggregate rows.",
          },
          {
            title: "Cleaning & QA",
            icon: <Sparkles aria-hidden className={icon} />,
            fact: `${d.observations} × ${d.variables} · QA ${qa.status}`,
            text: `${d.aggregates_removed} aggregates and ${d.countries_dropped_missing.length} incomplete countries removed, text trimmed, types and names fixed, then ${qa.counts.total} automated checks.`,
          },
          {
            title: "Analysis",
            icon: <Sigma aria-hidden className={icon} />,
            fact: `n = ${summary.regression.n}`,
            text: "Descriptive statistics, group comparison with ANOVA, correlation, regression, outlier detection and sensitivity analysis.",
          },
          {
            title: "Visualisation",
            icon: <BarChart3 aria-hidden className={icon} />,
            fact: `${required} required + ${summary.figures.length - required}`,
            text: "Figures drawn with ggplot2 and exported as PNG, each with an interpretation generated from the results.",
          },
          {
            title: "Export",
            icon: <FileJson aria-hidden className={icon} />,
            fact: "CSV · JSON · PNG",
            text: "cleaned_data.csv, a data dictionary, the full results, QA report and reproducibility manifest are written for reuse.",
          },
          {
            title: "Report & this page",
            icon: <FileText aria-hidden className={icon} />,
            fact: data.reportAvailable ? "PDF ready" : "PDF not built",
            text: "build_report.R turns the same run into the final PDF. This site reads only those exported files.",
          },
        ]}
      />
    </Section>
  );
}
