"use client";

/**
 * Motion primitives: Reveal, MaskText, StatNumber.
 *
 * Progressive enhancement contract (fixes the V2 "invisible until JS" problem):
 *  1. The server HTML renders every element fully visible (no inline opacity:0).
 *  2. An inline <head> script adds `.js` to <html>; globals.css then hides
 *     `[data-anim]` elements (motion-OK users only) until they are hydrated,
 *     with a CSS fallback that reveals them after 2.5s if scripts never run.
 *  3. On hydration each primitive sets its own start state, marks itself
 *     `data-anim-ready`, and animates in when it enters the viewport.
 *  Reduced-motion users skip steps 2-3 entirely: content is simply shown.
 *
 * Patterns adapted from MIT-licensed sources:
 *  - Magic UI "Number Ticker" / "Blur Fade" / "Text Animate" (MIT, magicui.design)
 *  - Motion Primitives "InView" / "TextEffect" / "AnimatedNumber" (MIT, motion-primitives.com)
 * Rewritten here for server-rendered visibility, reduced motion and screen readers.
 */
import { useEffect, useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { animate, inView } from "framer-motion";
import { distance, duration, ease, isDesktop, isNavigationJump, prefersReducedMotion, stagger, staggerDelay, viewport } from "@/lib/motion";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type RevealVariant = "rise" | "fade" | "clip" | "stagger" | "scale";

/** Runs `onEnter` once when `el` scrolls into view; returns a cleanup. */
function onceInView(el: Element, onEnter: () => void, amount: number, margin: string = viewport.margin) {
  // An element taller than the viewport may never reach `amount`; trigger on first pixel instead
  const reachable = el.getBoundingClientRect().height * amount < window.innerHeight * 0.6;
  let stop = () => {};
  stop = inView(
    el,
    () => {
      onEnter();
      stop();
    },
    // `margin` is typed as a CSS-like string; Motion validates it at runtime
    { amount: reachable ? amount : "some", margin: margin as `${number}px` },
  );
  return () => stop();
}

const riseFrom = () => `translateY(${isDesktop() ? distance.rise : distance.riseMobile}px)`;

/** Hook shared by every primitive: prepares the start state and plays on first view. */
function useEntrance(
  ref: React.RefObject<HTMLElement | null>,
  prepare: (el: HTMLElement) => void,
  play: (el: HTMLElement, instant: boolean) => void,
  amount: number = viewport.amount,
  margin?: string,
) {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.setAttribute("data-anim-ready", "");
      return;
    }
    prepare(el);
    el.setAttribute("data-anim-ready", "");
    return onceInView(el, () => play(el, isNavigationJump()), amount, margin);
    // Entrances run once per mount; props are static for the life of the element.
  }, []);
}

// ---------------------------------------------------------------------------
// Reveal
// ---------------------------------------------------------------------------

export function Reveal({
  children,
  as = "div",
  variant = "rise",
  delay = 0,
  step = stagger.cards,
  amount,
  className = "",
  id,
  margin,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** Seconds before the entrance starts (ignored after a navigation jump). */
  delay?: number;
  /** Stagger step for `variant="stagger"` (children marked `data-stagger`). */
  step?: number;
  amount?: number;
  /** Viewport margin for the trigger (defaults to excluding the bottom 10%). */
  margin?: string;
  className?: string;
  id?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className" | "id">) {
  const ref = useRef<HTMLElement>(null);

  useEntrance(
    ref,
    (el) => {
      if (variant === "stagger") {
        el.querySelectorAll<HTMLElement>("[data-stagger]").forEach((item) => {
          item.style.opacity = "0";
          item.style.transform = riseFrom();
        });
      } else if (variant === "clip" && isDesktop()) {
        // Clip the child, never the observed element: a fully clipped target
        // never reports as intersecting (and its lazy images never load).
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) inner.style.clipPath = "inset(0% 0% 100% 0%)";
      } else {
        el.style.opacity = "0";
        if (variant === "scale") el.style.transform = "scale(0.96)";
        else if (variant !== "fade") el.style.transform = riseFrom();
      }
    },
    (el, instant) => {
      const d = instant ? 0 : delay;
      if (variant === "stagger") {
        const items = Array.from(el.querySelectorAll<HTMLElement>("[data-stagger]"));
        animate(
          items,
          { opacity: 1, transform: "translateY(0px)" },
          { duration: instant ? duration.fast : duration.base, ease: ease.out, delay: (i: number) => (instant ? 0 : d + staggerDelay(i, step)) },
        ).then(() => items.forEach((item) => (item.style.transform = "")));
      } else if (variant === "clip" && isDesktop()) {
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner)
          animate(inner, { clipPath: "inset(0% 0% 0% 0%)" }, { duration: instant ? duration.fast : duration.large, ease: ease.out, delay: d }).then(
            () => (inner.style.clipPath = ""),
          );
      } else {
        animate(
          el,
          variant === "fade"
            ? { opacity: 1 }
            : { opacity: 1, transform: variant === "scale" ? "scale(1)" : "translateY(0px)" },
          { duration: instant ? duration.fast : duration.base, ease: ease.out, delay: d },
        ).then(() => (el.style.transform = ""));
      }
    },
    amount ?? (variant === "clip" ? viewport.figure : viewport.amount),
    margin,
  );

  const Tag = as;
  return (
    <Tag {...rest} ref={ref} id={id} className={`min-w-0 ${className}`} data-anim={variant}>
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// MaskText: lines rise from behind a clipping mask (optional blur on desktop)
// ---------------------------------------------------------------------------

export function MaskText({
  lines,
  as = "span",
  className = "",
  lineClassName = "",
  delay = 0,
  blur = false,
  step = stagger.lines,
  amount = viewport.amount,
}: {
  lines: string[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
  delay?: number;
  /** Blur-to-sharp, applied on desktop only. */
  blur?: boolean;
  step?: number;
  amount?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const targets = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-anim-line]"));

  useEntrance(
    ref,
    (el) => {
      const useBlur = blur && isDesktop();
      targets(el).forEach((line) => {
        line.style.transform = `translateY(${distance.mask})`;
        if (useBlur) line.style.filter = "blur(8px)";
      });
    },
    (el, instant) => {
      const lines = targets(el);
      const blurred = lines.some((line) => line.style.filter !== "");
      animate(
        lines,
        blurred ? { transform: "translateY(0%)", filter: "blur(0px)" } : { transform: "translateY(0%)" },
        { duration: instant ? duration.fast : duration.large, ease: ease.out, delay: (i: number) => (instant ? 0 : delay + staggerDelay(i, step)) },
      ).then(() =>
        lines.forEach((line) => {
          line.style.transform = "";
          line.style.filter = "";
        }),
      );
    },
    amount,
  );

  const Tag = as;
  return (
    <Tag className={className}>
      {/* Screen readers get the sentence once, not line fragments. */}
      <span className="sr-only">{lines.join(" ")}</span>
      <span ref={ref} aria-hidden="true" data-anim="mask" className="block">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
            <span data-anim-line className={`block ${lineClassName}`}>
              {line}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// StatNumber: counts up to an R-generated value
// ---------------------------------------------------------------------------

export type NumberFormat = { decimals?: number; prefix?: string; suffix?: string; grouping?: boolean };

export const formatStat = (value: number, { decimals = 0, prefix = "", suffix = "", grouping = true }: NumberFormat = {}) =>
  `${value < 0 ? "−" : ""}${prefix}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  })}${suffix}`;

export function StatNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  grouping = true,
  delay = 0,
  from = 0,
  className = "",
}: NumberFormat & { value: number; delay?: number; from?: number; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const fmt: NumberFormat = { decimals, prefix, suffix, grouping };
  const final = formatStat(value, fmt);

  useEntrance(
    ref,
    (el) => {
      el.style.opacity = "0";
      el.textContent = formatStat(from, fmt);
    },
    (el, instant) => {
      if (instant) {
        el.textContent = final;
        animate(el, { opacity: 1 }, { duration: duration.fast });
        return;
      }
      animate(el, { opacity: 1 }, { duration: duration.fast, delay });
      animate(from, value, {
        duration: 0.9,
        delay,
        ease: ease.out,
        onUpdate: (v) => (el.textContent = formatStat(v, fmt)),
      }).then(() => (el.textContent = final));
    },
  );

  return (
    <span className={`tabular-nums ${className}`}>
      {/* The final value is rendered on the server and is what assistive tech reads. */}
      <span ref={ref} aria-hidden="true" data-anim="count">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
