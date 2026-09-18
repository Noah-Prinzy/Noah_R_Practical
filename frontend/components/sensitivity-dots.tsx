"use client";

import { useRef } from "react";
import { animate, inView } from "framer-motion";
import { useIsoLayoutEffect } from "@/components/motion/primitives";
import { duration, ease, isNavigationJump, prefersReducedMotion, staggerDelay, viewport } from "@/lib/motion";

type Scenario = { scenario: string; n: number; pearson_r_log_gdp: number };

/**
 * Pearson r under each sensitivity scenario (single series, baseline dashed).
 * Server HTML draws every dot at its true R value. When motion is allowed, dots
 * start on the baseline and slide to those values; no intermediate value is ever
 * labelled, and each dot ends exactly on the number R produced.
 */
export function SensitivityDots({ scenarios, baseline }: { scenarios: Scenario[]; baseline: number }) {
  const ref = useRef<HTMLElement>(null);
  const values = scenarios.map((s) => s.pearson_r_log_gdp);
  const lo = Math.max(0, Math.floor((Math.min(...values, baseline) - 0.02) * 20) / 20);
  const hi = Math.min(1, Math.ceil((Math.max(...values, baseline) + 0.02) * 20) / 20);
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const ticks = Array.from({ length: Math.round((hi - lo) / 0.05) + 1 }, (_, i) => lo + i * 0.05);

  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) {
      root?.setAttribute("data-anim-ready", "");
      return;
    }
    const tracks = Array.from(root.querySelectorAll<HTMLElement>("[data-track]"));
    const offset = (track: HTMLElement) => ((x(baseline) - x(Number(track.dataset.value))) / 100) * track.clientWidth;
    tracks.forEach((track) => {
      const dot = track.querySelector<HTMLElement>("[data-dot]")!;
      const label = track.querySelector<HTMLElement>("[data-label]")!;
      dot.style.transform = `translate(calc(-50% + ${offset(track)}px), -50%)`;
      label.style.opacity = "0";
    });
    root.setAttribute("data-anim-ready", "");

    let stop = () => {};
    stop = inView(
      root,
      () => {
        stop();
        const instant = isNavigationJump();
        tracks.forEach((track, i) => {
          const dot = track.querySelector<HTMLElement>("[data-dot]")!;
          const label = track.querySelector<HTMLElement>("[data-label]")!;
          const delay = instant ? 0 : 0.15 + staggerDelay(i, 0.08);
          const d = instant ? duration.fast : duration.large;
          animate(dot, { transform: "translate(-50%, -50%)" }, { duration: d, ease: ease.out, delay });
          animate(label, { opacity: 1 }, { duration: duration.fast, delay: delay + d * 0.8 });
        });
      },
      { amount: viewport.chart },
    );
    return () => stop();
  }, []);

  return (
    <figure ref={ref} data-anim="chart" aria-label="Pearson correlation between log GDP per capita and life expectancy under each sensitivity scenario">
      <div className="space-y-3">
        {scenarios.map((s) => (
          <div key={s.scenario} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
            <div className="text-xs leading-5 text-zinc-600">
              {s.scenario} <span className="text-zinc-500">(n = {s.n})</span>
            </div>
            <div data-track data-value={s.pearson_r_log_gdp} className="relative h-8">
              <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />
              <div className="absolute top-0 h-full border-l border-dashed border-zinc-400" style={{ left: `${x(baseline)}%` }} />
              <div
                data-dot
                className="absolute top-1/2 size-3.5 rounded-full bg-[#2a78d6] ring-2 ring-white"
                style={{ left: `${x(s.pearson_r_log_gdp)}%`, transform: "translate(-50%, -50%)" }}
              />
              <span
                data-label
                className="absolute top-1/2 -translate-y-1/2 pl-3 text-xs font-medium tabular-nums text-zinc-800"
                style={{ left: `${x(s.pearson_r_log_gdp)}%` }}
              >
                {s.pearson_r_log_gdp.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
        <div />
        <div aria-hidden className="relative h-5 text-[11px] tabular-nums text-zinc-500">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${x(t)}%` }}>
              {t.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-zinc-500 sm:pl-[calc(15rem+1rem)]">
        Pearson r (log GDP per capita vs life expectancy) · dashed line = baseline, all countries ({baseline.toFixed(3)})
      </figcaption>
    </figure>
  );
}
