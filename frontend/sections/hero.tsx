"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FileText, ShieldCheck } from "lucide-react";
import { MaskText, Reveal, StatNumber } from "@/components/motion/primitives";
import { Eyebrow, RollButton } from "@/components/ui";
import { heroTimeline, stagger } from "@/lib/motion";

export type HeroMetric = { value: number; label: string; note: string };

/**
 * Scene 01 (L1). Full-viewport opening. Not pinned: during the first ~60% of the
 * hero's scroll the headline drifts up and dims, the grid moves at half speed and
 * the metric cards fade, so the next scene emerges naturally underneath.
 */
export function Hero({
  question,
  metrics,
  reportAvailable,
  qa,
}: {
  question: string;
  metrics: HeroMetric[];
  reportAvailable: boolean;
  qa: { status: string; pass: number; total: number };
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [parallax, setParallax] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setParallax(!reduce && mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const headlineY = useTransform(scrollYProgress, [0, 0.6], [0, -64]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.35]);
  const gridY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const metricsOpacity = useTransform(scrollYProgress, [0.1, 0.55], [1, 0]);

  const qaPass = qa.status === "PASS";

  return (
    <section
      id="overview"
      ref={ref}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-zinc-950 px-4 pb-16 pt-28 text-white md:px-16 lg:px-24"
    >
      {/* Background: faint measurement grid, parallax at half speed (no endless drift) */}
      <Reveal variant="fade" delay={heroTimeline.background} className="pointer-events-none absolute -inset-y-24 inset-x-0">
        <motion.div
          aria-hidden
          style={parallax ? { y: gridY } : undefined}
          className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]"
        />
      </Reveal>

      <div className="relative mx-auto w-full max-w-6xl">
        <motion.div style={parallax ? { y: headlineY, opacity: headlineOpacity } : undefined}>
          <Reveal variant="fade" delay={heroTimeline.eyebrow}>
            <Eyebrow dark scene="01">R PRACTICAL EXAM · WORLD BANK DATA</Eyebrow>
          </Reveal>

          <h1 id="hero-title" className="mt-8 max-w-5xl text-[2.9rem] leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            <MaskText lines={["From Raw Data", "to Statistical Insight"]} delay={heroTimeline.headline} blur />
          </h1>

          <Reveal delay={heroTimeline.description} className="mt-8 max-w-2xl">
            <p className="text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
              An interactive research story built on the R practical exam. Country data are pulled from the World Bank API, then cleaned,
              checked, analysed and visualised in R. Every number on this page is read from the files that analysis exports.
            </p>
            <p className="mt-5 border-l-2 border-[#3987e5] pl-4 text-sm leading-6 text-zinc-400 md:text-base">
              <span className="text-zinc-100">Research question.</span> {question}
            </p>
          </Reveal>

          <Reveal delay={heroTimeline.cta} className="mt-9 flex flex-wrap items-center gap-3">
            <RollButton href="#answer" variant="light">
              Read the short answer
            </RollButton>
            {reportAvailable && (
              <RollButton href="/project/final_report.pdf" external variant="outline-dark" icon={<FileText aria-hidden className="size-4" />} arrow={false}>
                View Final Report
              </RollButton>
            )}
            <a
              href="#quality"
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-medium ring-1 transition-colors ${
                qaPass ? "text-emerald-300 ring-emerald-400/30 hover:bg-emerald-400/10" : "text-red-300 ring-red-400/40 hover:bg-red-400/10"
              }`}
            >
              <ShieldCheck aria-hidden className="size-4" /> Data QA {qa.status} · {qa.pass}/{qa.total} checks
            </a>
          </Reveal>
        </motion.div>

        <motion.div style={parallax ? { opacity: metricsOpacity } : undefined}>
          <Reveal variant="stagger" delay={heroTimeline.metrics} step={stagger.cards} className="mt-14 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-4">
            {metrics.map((m, i) => (
              <div key={m.label} data-stagger className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
                <div className="text-3xl font-semibold md:text-4xl">
                  <StatNumber value={m.value} delay={heroTimeline.metrics + i * stagger.cards} />
                </div>
                <div className="mt-1 text-sm text-zinc-300">{m.label}</div>
                <div className="mt-0.5 text-xs text-zinc-400">{m.note}</div>
              </div>
            ))}
          </Reveal>
        </motion.div>
      </div>

      {/* Scroll cue: appears last, pulses three times, then rests */}
      {/* Only on screens tall enough for the cue to sit below the metrics on the first screen */}
      <Reveal
        variant="fade"
        delay={heroTimeline.scrollCue}
        margin="0px"
        amount={0.1}
        className="absolute inset-x-0 bottom-6 hidden justify-center md:[@media(min-height:880px)]:flex"
      >
        <a href="#answer" className="flex min-h-11 flex-col items-center gap-2 px-4 text-[11px] tracking-[0.2em] text-zinc-400 hover:text-white">
          SCROLL
          <span aria-hidden className="scroll-cue-line block h-8 w-px bg-white/60" />
        </a>
      </Reveal>
    </section>
  );
}
