import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

/** Page section with the template's horizontal rhythm. */
export function Section({
  id,
  children,
  tone = "light",
  className = "",
}: {
  id?: string;
  children: ReactNode;
  tone?: "light" | "muted" | "dark";
  className?: string;
}) {
  const bg = tone === "dark" ? "bg-zinc-950 text-white" : tone === "muted" ? "bg-zinc-50" : "bg-white";
  return (
    <section id={id} className={`${bg} scroll-mt-20 px-4 py-20 md:px-16 md:py-24 lg:px-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/** Small uppercase label with a square bullet (the template's signature detail). */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium tracking-[0.18em] ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
      <span className={`size-1.5 ${dark ? "bg-white" : "bg-zinc-900"}`} />
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  dark = false,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  dark?: boolean;
}) {
  return (
    <Reveal className="max-w-3xl">
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2 className={`mt-5 text-3xl leading-tight tracking-tight md:text-5xl ${dark ? "text-white" : "text-zinc-950"}`}>{title}</h2>
      {intro && <p className={`mt-4 text-sm leading-6 md:text-base md:leading-7 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{intro}</p>}
    </Reveal>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 ${className}`}>{children}</div>;
}

/** A labelled statistic (value supplied by the caller from the R outputs). */
export function Stat({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums md:text-3xl">{value}</div>
      {detail && <div className="mt-1 text-xs leading-5 text-zinc-500">{detail}</div>}
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
