"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/ui";
import type { AnalysisSummary } from "@/lib/project-data";

type Figure = AnalysisSummary["figures"][number];

const src = (f: Figure, version: string) => `/project/${f.file.split("/").pop()}?v=${version}`;

function FigureCard({ figure, version, onOpen, wide = false }: { figure: Figure; version: string; onOpen: () => void; wide?: boolean }) {
  return (
    <figure className={`flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white ${wide ? "lg:flex-row" : ""}`}>
      <button
        onClick={onOpen}
        className={`group relative block bg-white ${wide ? "lg:w-3/5" : ""}`}
        aria-label={`Open Figure ${figure.number} full screen`}
      >
        {figure.file_exists ? (
          <Image src={src(figure, version)} alt={`Figure ${figure.number}: ${figure.title}`} width={1800} height={1200} className="h-auto w-full" />
        ) : (
          <div className="grid aspect-[3/2] place-items-center text-sm text-red-700">Figure file missing: re-run the R analysis</div>
        )}
        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-zinc-700 opacity-0 shadow ring-1 ring-zinc-200 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="size-4" />
        </span>
      </button>
      <figcaption className={`flex flex-1 flex-col border-t border-zinc-100 p-5 ${wide ? "lg:w-2/5 lg:border-l lg:border-t-0" : ""}`}>
        <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-zinc-400">
          FIGURE {figure.number} · {figure.type.toUpperCase()}
          {!figure.required && <span className="rounded-full bg-zinc-100 px-2 py-0.5 tracking-normal text-zinc-600">additional</span>}
        </div>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-zinc-950">{figure.title}</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{figure.purpose}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-700">{figure.interpretation}</p>
      </figcaption>
    </figure>
  );
}

export function Figures({ figures, version }: { figures: Figure[]; version: string }) {
  const [open, setOpen] = useState<Figure | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const required = figures.filter((f) => f.required);
  const additional = figures.filter((f) => !f.required);

  return (
    <section id="figures" className="scroll-mt-20 bg-white px-4 py-20 md:px-16 md:py-24 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-3xl">
          <Eyebrow>REQUIRED VISUALISATIONS</Eyebrow>
          <h2 className="mt-5 text-3xl leading-tight tracking-tight text-zinc-950 md:text-5xl">The four exam figures, exactly as R drew them</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-500 md:text-base md:leading-7">
            These are the PNG files exported by ggplot2 in main_analysis.R, not browser re-drawings. Each interpretation is generated in
            R from the calculated results, and the same text appears in the final report. Select a figure to view it full screen.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {required.map((f, i) => (
            <Reveal key={f.id} delay={(i % 2) * 0.05}>
              <FigureCard figure={f} version={version} onOpen={() => setOpen(f)} />
            </Reveal>
          ))}
        </div>

        {additional.length > 0 && (
          <div className="mt-5 grid gap-5">
            {additional.map((f) => (
              <Reveal key={f.id}>
                <FigureCard figure={f} version={version} onOpen={() => setOpen(f)} wide />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/85 p-3 backdrop-blur-sm md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={`Figure ${open.number}: ${open.title}`}
          >
            <motion.div
              className="relative max-h-full w-full max-w-6xl overflow-auto rounded-2xl bg-white p-3 md:p-5"
              initial={{ scale: 0.97 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-medium tracking-[0.16em] text-zinc-400">FIGURE {open.number}</div>
                  <div className="text-base font-semibold text-zinc-950">{open.title}</div>
                </div>
                <button onClick={close} autoFocus className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100" aria-label="Close">
                  <X className="size-5" />
                </button>
              </div>
              <Image src={src(open, version)} alt={`Figure ${open.number}: ${open.title}`} width={2000} height={1333} className="h-auto w-full" />
              <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">{open.interpretation}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
