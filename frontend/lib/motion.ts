/**
 * Central motion system. Every animation on the site takes its timing from here,
 * so no component invents its own durations or curves.
 *
 * Hierarchy
 *   L1 Global  - hero, closing scene, progress bar, navbar pill, Lenis  (cinematic)
 *   L2 Section - headings, figures, counters, rails, sticky steps, QA, sensitivity (base-large)
 *   L3 Micro   - buttons, arrows, hover, filters, sorting, chevrons (micro-fast)
 */

/** Durations in seconds (Motion's unit). */
export const duration = {
  micro: 0.15,
  fast: 0.25,
  base: 0.45,
  large: 0.7,
  cinematic: 1.2,
} as const;

/** Cubic-bezier curves as Motion easing arrays. */
export const ease = {
  /** Entrances: fast start, long soft settle. */
  out: [0.16, 1, 0.3, 1],
  /** Step swaps, pill morphs, anything moving between two states. */
  inOut: [0.65, 0, 0.35, 1],
  /** Exits (used at ~70% of the matching entrance duration). */
  in: [0.4, 0, 1, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** The same curves as CSS strings, for Tailwind/CSS transitions. */
export const cssEase = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const spring = {
  /** Interactive UI: drawers, layout changes, active underline. */
  ui: { type: "spring", stiffness: 380, damping: 38 },
  /** Gentle fallback reveal (the original V2 Reveal). */
  soft: { type: "spring", stiffness: 260, damping: 60 },
  /** Smoothing for scroll-linked values (progress bar, parallax). */
  scroll: { stiffness: 120, damping: 30, restDelta: 0.001 },
} as const;

/** Stagger steps in seconds. Groups are capped so no list ever waits more than `maxTotal`. */
export const stagger = {
  cards: 0.06,
  lines: 0.09,
  words: 0.03,
  rows: 0.03,
  maxTotal: 0.45,
} as const;

/** Per-item delay for index `i`, never exceeding the group cap. */
export const staggerDelay = (i: number, step: number) => Math.min(i * step, stagger.maxTotal);

/** Travel distances in px (desktop / mobile). */
export const distance = { rise: 20, riseMobile: 8, mask: "110%" } as const;

/** Viewport triggers: portion of the element that must be visible, bottom margin. */
export const viewport = {
  amount: 0.25,
  figure: 0.2,
  chart: 0.4,
  margin: "0px 0px -10% 0px",
} as const;

/** Hero entrance timeline (seconds from hydration). */
export const heroTimeline = {
  background: 0,
  eyebrow: 0.1,
  headline: 0.18,
  description: 0.52,
  cta: 0.7,
  metrics: 0.8,
  scrollCue: 1.3,
} as const;

// ---------------------------------------------------------------------------
// Environment helpers (client only)
// ---------------------------------------------------------------------------

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Desktop tier: full motion system (sticky scenes, masks, blur, parallax). */
export const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

// ---------------------------------------------------------------------------
// "Jump" state: when the visitor uses the navigation, content they land on is
// revealed immediately instead of making them wait for entrance delays.
// ---------------------------------------------------------------------------

let jumpUntil = 0;

/** Call when the user navigates via a link; reveals for the next ~1.5s become instant. */
export const markNavigationJump = () => {
  jumpUntil = performance.now() + 1500;
};

export const isNavigationJump = () => typeof performance !== "undefined" && performance.now() < jumpUntil;
