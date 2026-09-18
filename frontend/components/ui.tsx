import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { MaskText, Reveal } from "@/components/motion/primitives";

type Tone = "light" | "muted" | "dark";

/** A scene of the story. */
export function Section({
  id,
  children,
  tone = "light",
  className = "",
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
  labelledBy?: string;
}) {
  const bg = tone === "dark" ? "bg-zinc-950 text-white" : tone === "muted" ? "bg-zinc-50" : "bg-white";
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${bg} relative scroll-mt-16 px-4 py-24 md:px-16 md:py-32 lg:px-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/** Scene marker: number + label, with the template's square bullet. */
export function Eyebrow({ children, scene, dark = false }: { children: ReactNode; scene?: string; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 text-xs font-medium tracking-[0.18em] ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
      <span className={`size-1.5 ${dark ? "bg-white" : "bg-zinc-900"}`} />
      {scene && <span className={`tabular-nums ${dark ? "text-zinc-300" : "text-zinc-800"}`}>{scene}</span>}
      {scene && <span aria-hidden className={`h-px w-6 ${dark ? "bg-zinc-600" : "bg-zinc-300"}`} />}
      <span>{children}</span>
    </div>
  );
}

/** Chapter heading: eyebrow, masked title, then intro (an L2 sequence). */
export function SectionHeading({
  id,
  scene,
  eyebrow,
  title,
  intro,
  dark = false,
}: {
  /** id placed on the <h2>, for aria-labelledby on the section */
  id?: string;
  scene?: string;
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <Reveal variant="fade">
        <Eyebrow dark={dark} scene={scene}>{eyebrow}</Eyebrow>
      </Reveal>
      <h2 id={id} className={`mt-6 text-3xl leading-[1.08] tracking-tight md:text-5xl ${dark ? "text-white" : "text-zinc-950"}`}>
        <MaskText lines={[title]} delay={0.08} />
      </h2>
      {intro && (
        <Reveal delay={0.22}>
          <p className={`mt-5 text-base leading-7 md:text-lg md:leading-8 ${dark ? "text-zinc-300" : "text-zinc-600"}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Card({ children, className = "", interactive = false }: { children: ReactNode; className?: string; interactive?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 ${
        interactive ? "transition-[transform,border-color] duration-150 ease-out hover:border-zinc-300 motion-safe:hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** A labelled statistic; the caller supplies a value that came from the R outputs. */
export function Stat({ label, value, detail, dark = false }: { label: string; value: ReactNode; detail?: ReactNode; dark?: boolean }) {
  return (
    <div>
      <div className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl ${dark ? "text-white" : "text-zinc-950"}`}>{value}</div>
      {detail && <div className={`mt-1 text-xs leading-5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{detail}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === "PASS"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "FAIL"
        ? "bg-red-50 text-red-800 ring-red-200"
        : "bg-amber-50 text-amber-800 ring-amber-200";
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✕" : "…";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${style}`}>
      <span aria-hidden>{icon}</span>
      {status}
    </span>
  );
}

/**
 * Call-to-action with the Estate template's label roll: on hover the label slides
 * up while an identical copy slides in beneath it; the arrow nudges 4px.
 */
export function RollButton({
  href,
  children,
  variant = "light",
  external = false,
  download = false,
  icon,
  arrow = true,
}: {
  href: string;
  children: string;
  variant?: "light" | "dark" | "outline-dark" | "outline-light";
  external?: boolean;
  download?: boolean;
  icon?: ReactNode;
  arrow?: boolean;
}) {
  const styles = {
    light: "bg-white text-zinc-950 hover:bg-zinc-100",
    dark: "bg-zinc-950 text-white hover:bg-zinc-800",
    "outline-dark": "border border-white/25 text-white hover:bg-white/10",
    "outline-light": "border border-zinc-300 text-zinc-900 hover:bg-zinc-50",
  }[variant];
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...(download ? { download: true } : {})}
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors duration-150 ${styles}`}
    >
      {icon}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-[180ms] ease-out motion-safe:group-hover:-translate-y-full">{children}</span>
        <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-[180ms] ease-out motion-safe:group-hover:translate-y-0">
          {children}
        </span>
      </span>
      {arrow && <ArrowRight aria-hidden className="size-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-1" />}
    </a>
  );
}
