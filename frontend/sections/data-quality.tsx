import { Reveal } from "@/components/reveal";
import { Card, Section, SectionHeading, Stat, StatusBadge } from "@/components/ui";
import type { QaReport } from "@/lib/project-data";
import { dateLabel, int } from "@/lib/format";

export function DataQuality({ qa }: { qa: QaReport }) {
  const byCategory = qa.checks.reduce<Record<string, QaReport["checks"]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});
  const numericCheck = qa.checks.find((c) => c.check === "Indicator variables are numeric");
  const outputs = qa.checks.filter((c) => c.category === "Outputs");
  const coreCheck = qa.checks.find((c) => c.check === "Core analysis variables complete");
  const pass = qa.status === "PASS";

  return (
    <Section id="quality" tone="muted">
      <SectionHeading
        eyebrow="DATA QUALITY ASSURANCE"
        title="The analysis checks its own data"
        intro="main_analysis.R runs these checks after cleaning and stops the pipeline if any fail. The results below are read from qa_report.json; nothing here is assumed."
      />

      <Reveal className="mt-10">
        <div className={`flex flex-col gap-4 rounded-2xl p-6 ring-1 md:flex-row md:items-center md:justify-between ${pass ? "bg-emerald-50 ring-emerald-200" : "bg-red-50 ring-red-200"}`}>
          <div>
            <div className={`text-xs font-semibold tracking-[0.16em] ${pass ? "text-emerald-700" : "text-red-700"}`}>DATASET STATUS</div>
            <div className={`mt-1 text-4xl font-semibold tracking-tight ${pass ? "text-emerald-900" : "text-red-900"}`}>{qa.status}</div>
          </div>
          <div className={`text-sm ${pass ? "text-emerald-900" : "text-red-900"}`}>
            {qa.counts.pass} passed · {qa.counts.fail} failed · {qa.counts.pending} pending of {qa.counts.total} checks
            <div className="mt-0.5 text-xs opacity-70">Checked {dateLabel(qa.generated_at)}</div>
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><Stat label="Observations" value={int(qa.dataset.observations)} /></Card>
        <Card><Stat label="Variables" value={int(qa.dataset.variables)} /></Card>
        <Card><Stat label="Missing cells" value={int(qa.dataset.missing_cells)} detail={coreCheck?.status === "PASS" ? "core variables complete" : coreCheck?.detail} /></Card>
        <Card><Stat label="Duplicate rows" value={int(qa.dataset.duplicate_rows)} /></Card>
        <Card><Stat label="Duplicate ISO3 codes" value={int(qa.dataset.duplicate_iso3)} /></Card>
        <Card><Stat label="Aggregate rows" value={`${qa.dataset.aggregate_rows_in_clean} / ${qa.dataset.aggregate_rows_in_raw}`} detail="in cleaned / in raw data" /></Card>
        <Card><Stat label="Numeric validation" value={numericCheck?.status ?? "—"} detail={numericCheck?.detail} /></Card>
        <Card>
          <Stat
            label="Output files"
            value={`${outputs.filter((o) => o.status === "PASS").length} / ${outputs.length}`}
            detail="CSVs, figures and report present and non-empty"
          />
        </Card>
      </Reveal>

      <Reveal className="mt-5">
        <Card className="p-0 md:p-0">
          <div className="divide-y divide-zinc-100">
            {Object.entries(byCategory).map(([category, checks]) => (
              <details key={category} className="group px-5 py-4 md:px-6" open={checks.some((c) => c.status !== "PASS")}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-zinc-900">{category}</span>
                  <span className="flex items-center gap-3 text-xs text-zinc-500">
                    {checks.filter((c) => c.status === "PASS").length}/{checks.length}
                    <StatusBadge status={checks.every((c) => c.status === "PASS") ? "PASS" : checks.some((c) => c.status === "FAIL") ? "FAIL" : "PENDING"} />
                    <span className="transition group-open:rotate-180" aria-hidden>⌄</span>
                  </span>
                </summary>
                <ul className="mt-3 space-y-2">
                  {checks.map((c) => (
                    <li key={c.id} className="grid gap-1 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm md:grid-cols-[4.5rem_1fr_1fr] md:items-center md:gap-3">
                      <StatusBadge status={c.status} />
                      <span className="text-zinc-900">{c.check}</span>
                      <span className="text-xs text-zinc-500 md:text-right">{c.detail}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal className="mt-5">
        <Card>
          <div className="text-sm font-semibold text-zinc-900">Documented plausibility ranges</div>
          <p className="mt-1 text-xs text-zinc-500">Definitional limits, not statistical cut-offs; statistical outliers are handled separately with the IQR rule.</p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {qa.plausibility_rules.map((r) => (
              <li key={r.variable} className="rounded-xl bg-zinc-50 px-3 py-2.5 text-xs leading-5 text-zinc-600">
                <span className="font-mono text-zinc-900">{r.variable}</span> ∈ [{r.min}, {r.max ?? "∞"}]: {r.rationale}
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </Section>
  );
}
