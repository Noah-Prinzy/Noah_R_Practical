"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { FileText, Menu, X } from "lucide-react";
import { duration, ease, markNavigationJump, spring } from "@/lib/motion";

/** Chapters of the story and the scene ids each one covers. */
export const CHAPTERS = [
  { label: "Overview", href: "#overview", scenes: ["overview", "answer"] },
  { label: "Data", href: "#pipeline", scenes: ["pipeline", "dataset"] },
  { label: "Figures", href: "#figures", scenes: ["figures"] },
  { label: "Analysis", href: "#relationship", scenes: ["relationship", "groups", "robustness"] },
  { label: "Explorer", href: "#explorer", scenes: ["explorer"] },
  { label: "Quality", href: "#quality", scenes: ["quality"] },
  { label: "Method", href: "#methodology", scenes: ["methodology", "section-a"] },
  { label: "Limits", href: "#limitations", scenes: ["limitations"] },
  { label: "Report", href: "#closing", scenes: ["closing", "reproducibility"] },
] as const;

export function ChapterNav({ reportAvailable }: { reportAvailable: boolean }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("Overview");
  const reduce = useReducedMotion();

  // L1: reading progress (one shared scroll source, spring-smoothed unless reduced motion)
  const { scrollY, scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, spring.scroll);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 40));

  // Active chapter: the scene crossing the middle band of the viewport
  useEffect(() => {
    const sceneToChapter = new Map<string, string>();
    CHAPTERS.forEach((c) => c.scenes.forEach((s) => sceneToChapter.set(s, c.label)));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(sceneToChapter.get(entry.target.id) ?? "Overview");
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sceneToChapter.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Any in-page anchor click counts as a navigation jump: skip entrance delays there
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (link) markNavigationJump();
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  const isSolid = solid || open;

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-[#2a78d6]"
        style={{ scaleX: reduce ? scrollYProgress : smoothed }}
      />
      <nav
        aria-label="Chapters"
        className={`fixed left-1/2 top-0 z-50 flex -translate-x-1/2 items-center justify-between p-2.5 transition-[margin,width,background-color,box-shadow,border-radius] duration-[400ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
          isSolid
            ? "mt-3 w-[calc(100vw-24px)] max-w-6xl rounded-full bg-white/85 shadow-sm ring-1 ring-zinc-200 backdrop-blur-xl"
            : "w-full px-4 md:px-16 lg:px-24"
        }`}
      >
        <a href="#overview" className="flex min-h-11 items-center gap-2.5 pl-1.5 pr-2">
          <span className={`grid size-8 place-items-center rounded-full text-xs font-bold transition-colors ${isSolid ? "bg-zinc-950 text-white" : "bg-white text-zinc-950"}`}>
            R
          </span>
          <span className={`text-sm font-semibold tracking-tight transition-colors ${isSolid ? "text-zinc-950" : "text-white"}`}>R Practical</span>
        </a>

        <ul className="hidden items-center xl:flex">
          {CHAPTERS.map((c) => {
            const current = active === c.label;
            return (
              <li key={c.label}>
                <a
                  href={c.href}
                  aria-current={current ? "location" : undefined}
                  className={`relative block px-3 py-3 text-sm transition-colors duration-150 ${
                    isSolid ? (current ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-950") : current ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {c.label}
                  {current && (
                    <motion.span
                      layoutId="chapter-underline"
                      transition={spring.ui}
                      className={`absolute inset-x-3 bottom-1.5 h-px ${isSolid ? "bg-zinc-950" : "bg-white"}`}
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1.5">
          {reportAvailable && (
            <a
              href="/project/final_report.pdf"
              target="_blank"
              rel="noreferrer"
              className={`hidden min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors sm:inline-flex ${
                isSolid ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-zinc-950 hover:bg-zinc-100"
              }`}
            >
              <FileText className="size-4" aria-hidden /> View Final Report
            </a>
          )}
          <button
            onClick={() => setOpen(!open)}
            className={`grid size-11 place-items-center rounded-full xl:hidden ${isSolid ? "text-zinc-950 hover:bg-zinc-100" : "text-white hover:bg-white/10"}`}
            aria-label={open ? "Close chapter menu" : "Open chapter menu"}
            aria-expanded={open}
            aria-controls="chapter-menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.ul
              id="chapter-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: duration.micro, ease: ease.in } }}
              transition={{ duration: duration.fast, ease: ease.out }}
              className="absolute right-2 top-[calc(100%+8px)] w-64 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-zinc-200 xl:hidden"
            >
              {CHAPTERS.map((c, i) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === c.label ? "location" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${active === c.label ? "bg-zinc-100 text-zinc-950" : "text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    <span className="w-5 text-xs tabular-nums text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
                    {c.label}
                  </a>
                </li>
              ))}
              {reportAvailable && (
                <li>
                  <a href="/project/final_report.pdf" target="_blank" rel="noreferrer" className="mt-1 flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm text-white">
                    <FileText className="size-4" aria-hidden /> View Final Report
                  </a>
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
