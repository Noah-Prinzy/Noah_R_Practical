import { FileText } from "lucide-react";
import { MaskText, Reveal } from "@/components/motion/primitives";
import { Eyebrow, RollButton } from "@/components/ui";

/** Scene 14 (L1). The closing statement, revealed line by line, then the next steps. */
export function Closing({ reportAvailable, countries, figures }: { reportAvailable: boolean; countries: number; figures: number }) {
  return (
    <section
      id="closing"
      aria-labelledby="closing-title"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-zinc-950 px-4 py-28 text-white md:px-16 lg:px-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_70%_60%,black,transparent_70%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl">
        <Reveal variant="fade">
          <Eyebrow dark scene="14">CLOSING</Eyebrow>
        </Reveal>
        <h2 id="closing-title" className="mt-8 text-5xl leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
          {/* Three beats, deliberately slower than the rest of the page (cinematic tier) */}
          <MaskText lines={["From data", "to analysis", "to evidence."]} step={0.28} delay={0.1} amount={0.5} />
        </h2>
        <Reveal delay={0.95} className="mt-10 max-w-xl">
          <p className="text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
            {countries} countries, one R pipeline and {figures} figures, each result checked before it is reported. The full evidence is one click away.
          </p>
        </Reveal>
        <Reveal delay={1.1} className="mt-9 flex flex-wrap gap-3">
          {reportAvailable && (
            <RollButton href="/project/final_report.pdf" external variant="light" icon={<FileText aria-hidden className="size-4" />}>
              View Report
            </RollButton>
          )}
          <RollButton href="#explorer" variant="outline-dark">
            Explore Dataset
          </RollButton>
          <RollButton href="#methodology" variant="outline-dark">
            Review Methodology
          </RollButton>
        </Reveal>
      </div>
    </section>
  );
}
