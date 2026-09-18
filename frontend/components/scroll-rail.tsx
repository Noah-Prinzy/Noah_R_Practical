"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Reveal } from "@/components/motion/primitives";
import { spring } from "@/lib/motion";

export type RailItem = { title: string; text: ReactNode; fact?: ReactNode; icon?: ReactNode; aside?: ReactNode };

/**
 * Vertical timeline whose line fills as the reader scrolls; each stage activates
 * when the fill reaches it (L2). Used by the data pipeline and the methodology.
 * Mobile (<768px) and reduced motion: a plain stack with every stage shown active.
 * Visual idea inspired by timeline patterns seen on Aceternity UI; no code copied.
 */
export function ScrollRail({ items, label }: { items: RailItem[]; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const reduce = useReducedMotion();
  const [animated, setAnimated] = useState(false);
  const [active, setActive] = useState(items.length - 1); // server/no-JS: all stages active

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setAnimated(!reduce && mq.matches);
      if (reduce || !mq.matches) setActive(items.length - 1);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduce, items.length]);

  // Progress of the list through a reading line 65% down the viewport
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 65%"] });
  const fill = useSpring(scrollYProgress, spring.scroll);

  const updateActive = (p: number) => {
    const list = ref.current;
    if (!list || !animated) return;
    const reached = p * list.offsetHeight;
    let idx = -1;
    itemRefs.current.forEach((el, i) => {
      if (el && el.offsetTop + 20 <= reached + 1) idx = i;
    });
    setActive(idx);
  };
  useMotionValueEvent(scrollYProgress, "change", updateActive);
  useEffect(() => updateActive(scrollYProgress.get()), [animated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ol ref={ref} aria-label={label} className="relative mt-14 space-y-4 md:space-y-0">
      {/* The rail: grey track + blue fill (desktop/tablet only) */}
      <div aria-hidden className="absolute bottom-8 left-5 top-5 hidden w-px bg-zinc-200 md:block">
        <motion.div className="absolute inset-0 origin-top bg-[#2a78d6]" style={{ scaleY: animated ? fill : 1 }} />
      </div>

      {items.map((item, i) => {
        const isActive = i <= active;
        return (
          <li
            key={item.title}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="relative md:grid md:grid-cols-[2.5rem_minmax(0,1fr)] md:gap-6 md:pb-12 last:md:pb-0"
          >
            <span
              aria-hidden
              className={`relative z-10 hidden size-10 place-items-center rounded-full border transition-colors duration-[250ms] md:grid ${
                isActive ? "border-[#2a78d6] bg-[#2a78d6] text-white" : "border-zinc-200 bg-white text-zinc-500"
              }`}
            >
              {item.icon ?? <span className="text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>}
            </span>
            <Reveal className="rounded-2xl border border-zinc-200 bg-white p-5 md:border-0 md:bg-transparent md:p-0 md:pt-1.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xs tabular-nums text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
                <h3 className={`text-lg font-semibold tracking-tight transition-colors duration-[250ms] md:text-xl ${isActive ? "text-zinc-950" : "text-zinc-500"}`}>
                  {item.title}
                </h3>
                {item.fact && (
                  <span className="rounded-full bg-[#eef4fc] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#1c5cab]">{item.fact}</span>
                )}
              </div>
              <div className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 md:text-[15px] md:leading-7">{item.text}</div>
              {item.aside && <div className="mt-4">{item.aside}</div>}
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
