import { CheckCircle2 } from "lucide-react";
import { Reveal, StatNumber } from "@/components/motion/primitives";
import { Card, Section, SectionHeading } from "@/components/ui";
import { DataTable } from "@/sections/groups";
import type { AnalysisSummary } from "@/lib/project-data";
import { num } from "@/lib/format";

/** Scene 12. Exam Section A: the student dataframe task, compact and exam-focused. */
export function SectionA({ summary }: { summary: AnalysisSummary }) {
  const sa = summary.section_a;
  const aboveNames = new Set(sa.above_average.map((s) => s.Student));

  return (
    <Section id="section-a" tone="muted" labelledBy="section-a-title">
      <SectionHeading
        id="section-a-title"
        scene="12"
        eyebrow="EXAM SECTION A · R PROGRAMMING"
        title="The student dataframe task"
        intro={`The exact exam dataset: ${sa.students.length} students and 6 variables, with a Grade added (80+ A, 70–79 B, 60–69 C, 50–59 D, below 50 F).`}
      />

      <Reveal variant="stagger" className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {sa.score_statistics.map((s) => (
          <div key={s.Statistic} data-stagger className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{s.Statistic} score</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
              <StatNumber value={s.Value} decimals={s.Statistic === "Standard deviation" ? 2 : Number.isInteger(s.Value) ? 0 : 1} />
            </p>
          </div>
        ))}
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Reveal>
          <Card className="h-full">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Dataframe with Grade</h3>
            <div className="mt-3">
              <DataTable
                caption="Student dataframe with the Grade variable"
                head={["Student", "Gender", "Age", "Programme", "Score", "Attend.", "Grade"]}
                align={["l", "l", "r", "l", "r", "r", "l"]}
                rows={sa.students.map((s) => [
                  <span key="n" className={aboveNames.has(s.Student) ? "font-semibold" : ""}>{s.Student}</span>,
                  s.Gender,
                  s.Age,
                  s.Programme,
                  s.Score,
                  s.Attendance,
                  s.Grade,
                ])}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-500">Bold: scored above the overall average of {num(sa.overall_average)}.</p>
          </Card>
        </Reveal>
        <div className="space-y-5">
          <Reveal delay={0.06}>
            <Card>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Average score by programme</h3>
              <div className="mt-3">
                <DataTable
                  caption="Average score by programme"
                  head={["Programme", "Students", "Average"]}
                  rows={sa.programme_averages.map((p) => [p.Programme, p.Students, num(p.Average_Score, 2)])}
                />
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <Card>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
                {sa.above_average.length} students above the average of {num(sa.overall_average)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{sa.above_average.map((s) => `${s.Student} (${s.Score}, ${s.Grade})`).join(" · ")}</p>
            </Card>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="flex gap-2.5 rounded-2xl bg-white p-4 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-200">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700" />
              <span>
                <span className="font-medium text-zinc-900">Verified.</span> main_analysis.R recomputes the mean, median, SD, grades and programme
                averages a second way and halts if any result disagrees, so these values only exist if every check passed.
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
