"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { FigureDialog, type ViewerFigure } from "@/components/figure-dialog";
import { Reveal, StatNumber, type NumberFormat } from "@/components/motion/primitives";
import { duration, ease } from "@/lib/motion";

/** Which quarter of the 2x2 diagnostics figure a step talks about ("all" = whole figure). */
export type Focus = "all" | "tl" | "tr" | "bl" | "br";

export type Step = {
  id: string;
  kicker: string;
  title: string;
  /** Either an R value to count to, or pre-formatted text (e.g. a confidence interval). */
  value: { number: number; format: NumberFormat } | { text: string };
  detail: string;
  focus: Focus;
};

// Scale from a fixed top-left origin, then translate so the chosen panel fills the
// frame. Animating x/y (not transform-origin) keeps panel-to-panel moves smooth.
// With scale s the image spans s x its width; shifting by -(s - 1) x 100% shows the far side.
const ZOOM = 1.9;
const FAR = `${-(ZOOM - 1) * 100}%`;
const FOCUS: Record<Focus, { scale: number; x: string; y: string }> = {
  all: { scale: 1, x: "0%", y: "0%" },
  tl: { scale: ZOOM, x: "0%", y: "0%" },
  tr: { scale: ZOOM, x: FAR, y: "0%" },
  bl: { scale: ZOOM, x: "0%", y: FAR },
  br: { scale: ZOOM, x: FAR, y: FAR },
};

function StepValue({ value, className }: { value: Step["value"]; className: string }) {
  return <span className={className}>{"number" in value ? <StatNumber value={value.number} {...value.format} /> : value.text}</span>;
}

/**
 * Sticky storytelling (L2, desktop >=1024px only): Figure 5 stays pinned while the
 * analytical steps scroll past; the active step brightens, the readout cross-fades
 * and the image zooms to the diagnostic panel being discussed. The PNG itself is
 * never altered - only framed. Tablet, mobile and reduced motion get a plain stack.
 */
export function StickySteps({ steps, figure }: { steps: Step[]; figure: ViewerFigure }) {
  const reduce = useReducedMotion();
  const [sticky, setSticky] = useState(false);
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setSticky(!reduce && mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduce]);

  // Active step = the one crossing the middle of the viewport
  useEffect(() => {
    if (!sticky) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sticky]);

  const current = steps[active];
  const focus = FOCUS[sticky ? current.focus : "all"];

  const figureCard = (
    <div className="overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-white/10">
      <div className="relative overflow-hidden rounded-xl">
        <motion.div
          animate={{ scale: focus.scale, x: focus.x, y: focus.y }}
          style={{ transformOrigin: "0% 0%" }}
          transition={{ duration: duration.large, ease: ease.inOut }}
        >
          <Image
            src={figure.src}
            alt={`Figure ${figure.number}: ${figure.title}`}
            width={figure.width}
            height={figure.height}
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="h-auto w-full"
          />
        </motion.div>
      </div>
    </div>
  );

  const openButton = (
    <button
      type="button"
      onClick={() => setViewerOpen(true)}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm text-zinc-200 transition-colors hover:bg-white/10"
    >
      <Maximize2 aria-hidden className="size-4" /> Figure 5 full screen
    </button>
  );

  const dialog = <FigureDialog figure={figure} open={viewerOpen} onOpenChange={setViewerOpen} />;

  if (!sticky) {
    // Stacked: figure, then every step in reading order
    return (
      <div className="mt-14">
        <Reveal>{figureCard}</Reveal>
        <div className="mt-4">{openButton}</div>
        <ol className="mt-10 space-y-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-medium tracking-[0.16em] text-[#86b6ef]">
                {String(i + 1).padStart(2, "0")} · {s.kicker}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
              <StepValue value={s.value} className="mt-3 block text-3xl font-semibold tracking-tight text-white" />
              <p className="mt-3 text-sm leading-6 text-zinc-300">{s.detail}</p>
            </Reveal>
          ))}
        </ol>
        {dialog}
      </div>
    );
  }

  return (
    <div className="mt-14 grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-12">
      <ol aria-label="Analytical steps">
        {steps.map((s, i) => (
          <li
            key={s.id}
            data-index={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            aria-current={i === active ? "step" : undefined}
            className={`flex min-h-[52vh] flex-col justify-center border-l-2 py-10 pl-6 transition-[opacity,border-color] duration-[450ms] ${
              i === active ? "border-[#3987e5] opacity-100" : "border-white/10 opacity-40"
            }`}
          >
            <p className="text-xs font-medium tracking-[0.16em] text-[#86b6ef]">
              {String(i + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")} · {s.kicker}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{s.title}</h3>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-zinc-300">{s.detail}</p>
          </li>
        ))}
      </ol>

      <div className="relative">
        <div className="sticky top-24 space-y-4">
          {figureCard}
          <div className="flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: duration.fast, ease: ease.out } }}
                exit={{ opacity: 0, y: -4, transition: { duration: duration.micro, ease: ease.in } }}
              >
                <p className="text-xs text-zinc-400">{current.kicker}</p>
                <StepValue value={current.value} className="mt-1 block text-4xl font-semibold tracking-tight text-white" />
              </motion.div>
            </AnimatePresence>
            {openButton}
          </div>
          <p className="text-xs text-zinc-400">
            Figure 5 (regression diagnostics), exported by R. The frame zooms to the panel each step discusses; the image is unchanged.
          </p>
        </div>
      </div>
      {dialog}
    </div>
  );
}
