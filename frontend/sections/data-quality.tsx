"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, ShieldX } from "lucide-react";
import { Reveal, StatNumber } from "@/components/motion/primitives";
import { Section, SectionHeading, StatusBadge } from "@/components/ui";
import type { QaReport } from "@/lib/project-data";
import { dateLabel, int } from "@/lib/format";

/**
 * Scene 10 (L2). QA as a short sequence: count -> categories -> individual checks
 * -> final result. Everything is read from qa_report.json; a FAIL is shown as FAIL.
 */
export function DataQuality({ qa }: { qa: QaReport }) {
  const categories = Object.entries(
    qa.checks.reduce<Record<string, QaReport["checks"]>>((acc, c) => {
      (acc[c.category] ??= []).push(c);
      return acc;
    }, {}),
  );
  // Categories with a non-PASS check start expanded so problems are never hidden
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(categories.filter(([, checks]) => checks.some((c) => c.status !== "PASS")).map(([name]) => name)),
  );
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const pass = qa.status === "PASS";
  const d = qa.dataset;

  return (
    <Section id="quality" tone="muted" labelledBy="quality-title">
      <SectionHeading
        id="quality-title"
        scene="10"
        eyebrow="DATA QUALITY ASSURANCE"
        title="The analysis checks its own data"
        intro="main_analysis.R runs these checks after cleaning and stops the pipeline if any fail. Every result below is read from qa_report.json."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-12">
        {/* 1. The count */}
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium text-zinc-500">Checks passed</p>
          <p className="mt-2 text-7xl font-semibold leading-none tracking-tight text-zinc-950 md:text-8xl">
            <StatNumber value={qa.counts.pass} />
            <span className="text-zinc-500"> / {qa.counts.total}</span>
          </p>
          <p className="mt-3 text-sm text-zinc-600">
            {qa.counts.fail} failed · {qa.counts.pending} pending · checked {dateLabel(qa.generated_at)}
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-zinc-200 pt-6 text-sm">
            {[
              ["Observations", int(d.observations)],
              ["Variables", int(d.variables)],
              ["Missing cells", int(d.missing_cells)],
              ["Duplicate rows", int(d.duplicate_rows)],
              ["Duplicate ISO3", int(d.duplicate_iso3)],
              ["Aggregates left", `${d.aggregate_rows_in_clean} of ${d.aggregate_rows_in_raw}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-zinc-500">{k}</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-zinc-950">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div>
          {/* 2. Categories, 3. individual checks */}
          <Reveal as="ul" variant="stagger" step={0.06} className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white" aria-label="QA check categories">
            {categories.map(([name, checks]) => {
              const passed = checks.filter((c) => c.status === "PASS").length;
              const status = passed === checks.length ? "PASS" : checks.some((c) => c.status === "FAIL") ? "FAIL" : "PENDING";
              const isOpen = open.has(name);
              const panelId = `qa-${name.toLowerCase()}`;
              return (
                <li key={name} data-stagger>
                  <button
                    type="button"
                    onClick={() => toggle(name)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left transition-colors hover:bg-zinc-50"
                  >
                    <span className="text-sm font-semibold text-zinc-900">{name}</span>
                    <span className="flex items-center gap-3 text-xs tabular-nums text-zinc-500">
                      {passed}/{checks.length}
                      <StatusBadge status={status} />
                      <ChevronDown aria-hidden className={`size-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {/* Smooth expand: the Estate template's grid-rows technique */}
                  <div
                    id={panelId}
                    className={`grid transition-[grid-template-rows,opacity] duration-[250ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden" inert={!isOpen}>
                      <ul className="space-y-2 px-5 pb-5">
                        {checks.map((c) => (
                          <li key={c.id} className="grid gap-1 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm md:grid-cols-[4.5rem_1fr_1fr] md:items-center md:gap-3">
                            <StatusBadge status={c.status} />
                            <span className="text-zinc-900">{c.check}</span>
                            <span className="text-xs text-zinc-500 md:text-right">{c.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </Reveal>

          {/* 4. The result */}
          <Reveal variant="scale" delay={0.15} className="mt-5">
            <div className={`flex items-center gap-4 rounded-2xl p-6 ring-1 ${pass ? "bg-emerald-50 ring-emerald-200" : "bg-red-50 ring-red-200"}`}>
              {pass ? <ShieldCheck aria-hidden className="size-8 shrink-0 text-emerald-700" /> : <ShieldX aria-hidden className="size-8 shrink-0 text-red-700" />}
              <div>
                <p className={`text-xs font-semibold tracking-[0.16em] ${pass ? "text-emerald-800" : "text-red-800"}`}>FINAL VALIDATION</p>
                <p className={`text-3xl font-semibold tracking-tight ${pass ? "text-emerald-950" : "text-red-950"}`}>Dataset status: {qa.status}</p>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-5">
            <details className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-900">
                Documented plausibility ranges
                <ChevronDown aria-hidden className="size-4 transition-transform duration-150 group-open:rotate-180" />
              </summary>
              <p className="mt-1 text-xs text-zinc-500">Definitional limits, not statistical cut-offs; statistical outliers are handled by the IQR rule.</p>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {qa.plausibility_rules.map((r) => (
                  <li key={r.variable} className="rounded-xl bg-zinc-50 px-3 py-2.5 text-xs leading-5 text-zinc-600">
                    <span className="font-mono text-zinc-900">{r.variable}</span> ∈ [{r.min}, {r.max ?? "∞"}]: {r.rationale}
                  </li>
                ))}
              </ul>
            </details>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
