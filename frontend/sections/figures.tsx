"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { FigureDialog, type ViewerFigure } from "@/components/figure-dialog";
import { MaskText, Reveal } from "@/components/motion/primitives";
import { Section, SectionHeading } from "@/components/ui";

export type FigureChapter = ViewerFigure & { id: string; purpose: string; exists: boolean };

/**
 * Scene 05 (L2). The four required R figures as visual chapters:
 * figure unmasks (desktop) or fades (mobile) -> caption -> interpretation.
 * The PNGs are displayed exactly as exported by R; only their presentation moves.
 */
export function Figures({ figures }: { figures: FigureChapter[] }) {
  const [viewer, setViewer] = useState<{ figure: ViewerFigure | null; open: boolean }>({ figure: null, open: false });
  const openFigure = (figure: ViewerFigure) => setViewer({ figure, open: true });

  return (
    <Section id="figures" tone="muted" labelledBy="figures-title">
      <SectionHeading
        id="figures-title"
        scene="05"
        eyebrow="REQUIRED VISUALISATIONS"
        title="The four exam figures, exactly as R drew them"
        intro="These are the PNG files exported by ggplot2 in main_analysis.R, not browser re-drawings. Each interpretation is generated in R from the results, and the same text appears in the final report."
      />

      <div className="mt-16 space-y-20 md:space-y-28">
        {figures.map((f, i) => (
          <article key={f.id} aria-labelledby={`${f.id}-title`} className="grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-12">
            <Reveal variant="clip" className={`lg:col-span-7 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
              {f.exists ? (
                <button
                  type="button"
                  onClick={() => openFigure(f)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 text-left transition-[border-color,box-shadow] duration-150 hover:border-zinc-300 hover:shadow-sm md:p-3"
                  aria-label={`Open Figure ${f.number}, ${f.title}, full screen`}
                >
                  <Image
                    src={f.src}
                    alt={`Figure ${f.number}: ${f.title}`}
                    width={f.width}
                    height={f.height}
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    className="h-auto w-full transition-transform duration-[250ms] ease-out motion-safe:group-hover:scale-[1.01]"
                  />
                  <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/95 text-zinc-700 opacity-0 shadow ring-1 ring-zinc-200 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Maximize2 aria-hidden className="size-4" />
                  </span>
                </button>
              ) : (
                <div className="grid aspect-[3/2] place-items-center rounded-2xl border border-red-200 bg-white text-sm text-red-700">
                  {f.src.split("/").pop()?.split("?")[0]} is missing - re-run the R analysis
                </div>
              )}
            </Reveal>

            <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
              <Reveal variant="fade" delay={0.12}>
                <p className="flex items-center gap-3 text-xs font-medium tracking-[0.16em] text-zinc-500">
                  <span aria-hidden className="text-3xl font-semibold tracking-tight text-zinc-300 tabular-nums">{String(f.number).padStart(2, "0")}</span>
                  FIGURE {f.number} · {f.type.toUpperCase()}
                </p>
              </Reveal>
              <h3 id={`${f.id}-title`} className="mt-3 text-2xl leading-tight tracking-tight text-zinc-950 md:text-3xl">
                <MaskText lines={[f.title]} delay={0.16} />
              </h3>
              <Reveal delay={0.26}>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{f.purpose}</p>
              </Reveal>
              <Reveal delay={0.36}>
                <p className="mt-5 border-l-2 border-[#2a78d6] pl-4 text-[15px] leading-7 text-zinc-700">{f.interpretation}</p>
                {f.exists && (
                  <button
                    type="button"
                    onClick={() => openFigure(f)}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-300 px-4 text-sm text-zinc-800 transition-colors hover:bg-white"
                  >
                    <Maximize2 aria-hidden className="size-4" /> View full screen
                  </button>
                )}
              </Reveal>
            </div>
          </article>
        ))}
      </div>

      <FigureDialog figure={viewer.figure} open={viewer.open} onOpenChange={(open) => setViewer((v) => ({ ...v, open }))} />
    </Section>
  );
}
