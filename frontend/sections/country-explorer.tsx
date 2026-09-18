"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowUp, Download, Search, X } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { Section, SectionHeading } from "@/components/ui";
import type { Country } from "@/lib/project-data";
import { num, usd } from "@/lib/format";
import { duration, ease, spring } from "@/lib/motion";

type SortKey = keyof Pick<
  Country,
  | "country" | "iso3" | "region" | "income_level" | "life_expectancy_years" | "gdp_per_capita_usd" | "fertility_rate"
  | "population_millions" | "urban_pop_pct" | "health_exp_per_capita_usd" | "co2_per_capita_t"
>;

const COLUMNS: { key: SortKey; label: string; numeric?: boolean; render: (c: Country) => string }[] = [
  { key: "country", label: "Country", render: (c) => c.country },
  { key: "iso3", label: "ISO3", render: (c) => c.iso3 },
  { key: "region", label: "Region", render: (c) => c.region },
  { key: "income_level", label: "Income level", render: (c) => c.income_level ?? "—" },
  { key: "life_expectancy_years", label: "Life exp. (yrs)", numeric: true, render: (c) => num(c.life_expectancy_years) },
  { key: "gdp_per_capita_usd", label: "GDP / capita", numeric: true, render: (c) => usd(c.gdp_per_capita_usd) },
  { key: "fertility_rate", label: "Fertility", numeric: true, render: (c) => num(c.fertility_rate, 2) },
  { key: "population_millions", label: "Population (m)", numeric: true, render: (c) => num(c.population_millions, 2) },
  { key: "urban_pop_pct", label: "Urban %", numeric: true, render: (c) => num(c.urban_pop_pct) },
  { key: "health_exp_per_capita_usd", label: "Health exp. / capita", numeric: true, render: (c) => usd(c.health_exp_per_capita_usd) },
  { key: "co2_per_capita_t", label: "CO₂ / capita (t)", numeric: true, render: (c) => num(c.co2_per_capita_t, 2) },
];

const PAGE = 25;

/** Result count that eases between values when filters change (plain number under reduced motion). */
function AnimatedCount({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const spr = useSpring(value, { stiffness: 300, damping: 34 });
  const text = useTransform(spr, (v) => Math.round(v).toString());
  useEffect(() => spr.set(value), [spr, value]);
  if (reduce) return <>{value}</>;
  // The live region announces only the final number, never the in-between frames
  return (
    <>
      <motion.span aria-hidden className="tabular-nums">
        {text}
      </motion.span>
      <span className="sr-only">{value}</span>
    </>
  );
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** Scene 09. The full cleaned dataset: search, filter, sort, and a detail drawer per country. */
export function CountryExplorer({
  countries,
  regions,
  incomeLevels,
  outlierFlags,
  influential,
}: {
  countries: Country[];
  regions: string[];
  incomeLevels: string[];
  /** country name -> variables in which R's IQR rule flagged it */
  outlierFlags: Record<string, string[]>;
  /** countries with Cook's distance above 4/n in R's regression diagnostics */
  influential: string[];
}) {
  const [query, setQuery] = useState("");
  const [income, setIncome] = useState("All");
  const [region, setRegion] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "country", dir: 1 });
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Country | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const desktop = useIsDesktop();
  const returnFocus = useRef<HTMLElement | null>(null); // opener, restored when the drawer closes

  // Changing a filter starts again from the first page of results
  const updateQuery = (v: string) => { setQuery(v); setLimit(PAGE); };
  const updateIncome = (v: string) => { setIncome(v); setLimit(PAGE); };
  const updateRegion = (v: string) => { setRegion(v); setLimit(PAGE); };
  const openCountry = (c: Country) => { setSelected(c); setDrawerOpen(true); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = countries.filter(
      (c) =>
        (income === "All" || c.income_level === income) &&
        (region === "All" || c.region === region) &&
        (!q || c.country.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q)),
    );
    const { key, dir } = sort;
    return [...rows].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av === null || av === undefined) return 1; // missing values always last
      if (bv === null || bv === undefined) return -1;
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * dir;
    });
  }, [countries, query, income, region, sort]);

  const toggleSort = (key: SortKey, numeric?: boolean) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: numeric ? -1 : 1 }));

  const influentialSet = useMemo(() => new Set(influential), [influential]);
  const filtersActive = query || income !== "All" || region !== "All";
  const flagged = (c: Country) => Boolean(outlierFlags[c.country] || influentialSet.has(c.country));

  return (
    <Section id="explorer" labelledBy="explorer-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          id="explorer-title"
          scene="09"
          eyebrow="COUNTRY EXPLORER"
          title="Inspect every cleaned record"
          intro={`All ${countries.length} rows of cleaned_data.csv. Search, filter and sort, then open a country for its full profile. A dash (—) means the World Bank reported no value; missing values are kept, not imputed.`}
        />
        <Reveal variant="fade" className="shrink-0">
          <a href="/project/cleaned_data.csv" download className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-300 px-4 text-sm text-zinc-800 transition-colors hover:bg-zinc-50">
            <Download aria-hidden className="size-4" /> cleaned_data.csv
          </a>
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 *:min-w-0 md:grid-cols-[1.4fr_1fr_1fr]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-[#2a78d6]">
            <Search aria-hidden className="size-4 text-zinc-500" />
            <span className="sr-only">Search countries</span>
            <input value={query} onChange={(e) => updateQuery(e.target.value)} placeholder="Search country or ISO3…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: duration.micro }}
                  onClick={() => updateQuery("")}
                  aria-label="Clear search"
                  className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                >
                  <X aria-hidden className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </label>
          <label className="sr-only" htmlFor="income-filter">Income level</label>
          <select id="income-filter" value={income} onChange={(e) => updateIncome(e.target.value)} className="min-h-11 rounded-xl bg-white px-3 text-sm ring-1 ring-zinc-200 outline-none focus:ring-2 focus:ring-[#2a78d6]">
            <option value="All">All income levels</option>
            {incomeLevels.map((x) => <option key={x}>{x}</option>)}
          </select>
          <label className="sr-only" htmlFor="region-filter">Region</label>
          <select id="region-filter" value={region} onChange={(e) => updateRegion(e.target.value)} className="min-h-11 rounded-xl bg-white px-3 text-sm ring-1 ring-zinc-200 outline-none focus:ring-2 focus:ring-[#2a78d6]">
            <option value="All">All regions</option>
            {regions.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>

        <div className="mt-3 flex min-h-11 items-center justify-between text-sm text-zinc-600">
          <span aria-live="polite">
            <span className="font-semibold text-zinc-950">
              <AnimatedCount value={filtered.length} />
            </span>{" "}
            of {countries.length} countries
          </span>
          {filtersActive && (
            <button onClick={() => { updateQuery(""); updateIncome("All"); updateRegion("All"); }} className="min-h-11 px-2 text-sm underline hover:text-zinc-950">
              Reset filters
            </button>
          )}
        </div>

        <div className="mt-2 overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full min-w-[1080px] text-sm">
            <caption className="sr-only">Cleaned country data; select a country name for details</caption>
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                {COLUMNS.map((col, i) => {
                  const current = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={current ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                      className={`whitespace-nowrap px-3 font-medium ${col.numeric ? "text-right" : "text-left"} ${i === 0 ? "sticky left-0 z-10 bg-zinc-50" : ""}`}
                    >
                      <button
                        onClick={() => toggleSort(col.key, col.numeric)}
                        className={`inline-flex min-h-11 items-center gap-1 transition-colors hover:text-zinc-950 ${current ? "text-zinc-950" : ""}`}
                      >
                        {col.label}
                        <ArrowUp
                          aria-hidden
                          className={`size-3 transition-[transform,opacity] duration-[250ms] ${current ? "opacity-100" : "opacity-0"} ${
                            current && sort.dir === -1 ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.slice(0, limit).map((c) => (
                  <motion.tr
                    key={c.iso3}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ layout: { duration: duration.fast, ease: ease.inOut }, opacity: { duration: duration.fast } }}
                    onClick={() => openCountry(c)}
                    className="group cursor-pointer border-t border-zinc-100 transition-colors hover:bg-[#f4f8fd]"
                  >
                    {COLUMNS.map((col, i) => (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap px-3 py-2.5 ${col.numeric ? "text-right tabular-nums text-zinc-700" : "text-zinc-700"} ${
                          i === 0 ? "sticky left-0 bg-white font-medium text-zinc-950 transition-[box-shadow,background-color] group-hover:bg-[#f4f8fd] group-hover:shadow-[inset_2px_0_0_#2a78d6]" : ""
                        }`}
                      >
                        {i === 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCountry(c);
                            }}
                            className="inline-flex min-h-8 items-center text-left hover:underline"
                          >
                            {col.render(c)}
                            {flagged(c) && (
                              <span className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500" title="Flagged in the outlier or influence analysis">
                                <span className="sr-only"> (flagged)</span>
                              </span>
                            )}
                          </button>
                        ) : (
                          col.render(c)
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-zinc-500">
                    No countries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-amber-500 align-middle" />
            flagged by the IQR outlier rule or as influential in the regression (from R)
          </span>
          {limit < filtered.length && (
            <button onClick={() => setLimit((l) => l + PAGE)} className="min-h-11 rounded-full border border-zinc-300 px-4 text-sm text-zinc-800 transition-colors hover:bg-zinc-50">
              Show {Math.min(PAGE, filtered.length - limit)} more
            </button>
          )}
        </div>
      </Reveal>

      {/* Country detail: right-hand panel on desktop, bottom sheet on mobile (Radix Dialog) */}
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <AnimatePresence>
          {drawerOpen && selected && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  data-lenis-prevent
                  className="fixed inset-0 z-[80] bg-zinc-950/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: duration.fast } }}
                  exit={{ opacity: 0, transition: { duration: duration.fast * 0.7, ease: ease.in } }}
                />
              </Dialog.Overlay>
              <Dialog.Content
                asChild
                forceMount
                onOpenAutoFocus={() => {
                  returnFocus.current = document.activeElement as HTMLElement | null;
                }}
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  returnFocus.current?.focus();
                }}
              >
                <motion.div
                  data-lenis-prevent
                  className={`fixed z-[81] overflow-y-auto overscroll-contain bg-white p-6 shadow-2xl focus:outline-none ${
                    desktop ? "inset-y-0 right-0 w-full max-w-md" : "inset-x-0 bottom-0 max-h-[85svh] rounded-t-3xl"
                  }`}
                  initial={desktop ? { x: 48, opacity: 0 } : { y: "100%" }}
                  animate={desktop ? { x: 0, opacity: 1, transition: spring.ui } : { y: 0, transition: spring.ui }}
                  exit={
                    desktop
                      ? { x: 48, opacity: 0, transition: { duration: duration.fast, ease: ease.in } }
                      : { y: "100%", transition: { duration: duration.fast, ease: ease.in } }
                  }
                >
                  {!desktop && <div aria-hidden className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-zinc-300" />}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.16em] text-zinc-500">{selected.iso3}</p>
                      <Dialog.Title className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{selected.country}</Dialog.Title>
                      <Dialog.Description className="mt-1 text-sm text-zinc-600">
                        {selected.region} · {selected.income_level ?? "income group not classified"}
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100" aria-label="Close country details">
                      <X aria-hidden className="size-5" />
                    </Dialog.Close>
                  </div>

                  <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
                    {[
                      ["Life expectancy", `${num(selected.life_expectancy_years)} years`],
                      ["GDP per capita", usd(selected.gdp_per_capita_usd)],
                      ["Fertility rate", `${num(selected.fertility_rate, 2)} births per woman`],
                      ["Population", `${num(selected.population_millions, 2)} million`],
                      ["Urban population", selected.urban_pop_pct === null ? "—" : `${num(selected.urban_pop_pct)}%`],
                      ["Health expenditure", selected.health_exp_per_capita_usd === null ? "not reported" : `${usd(selected.health_exp_per_capita_usd)} per person`],
                      ["CO₂ emissions", selected.co2_per_capita_t === null ? "not reported" : `${num(selected.co2_per_capita_t, 2)} t per person`],
                      ["log₁₀ GDP per capita", num(selected.log10_gdp_per_capita, 3)],
                    ].map(([k, v], i) => (
                      <motion.div
                        key={k}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: duration.fast, ease: ease.out, delay: 0.08 + Math.min(i * 0.03, 0.2) }}
                      >
                        <dt className="text-xs font-medium text-zinc-500">{k}</dt>
                        <dd className="mt-1 text-sm font-medium text-zinc-900">{v}</dd>
                      </motion.div>
                    ))}
                  </dl>

                  {flagged(selected) && (
                    <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
                      {outlierFlags[selected.country] && <p>IQR outlier in: {outlierFlags[selected.country].join(", ")}.</p>}
                      {influentialSet.has(selected.country) && <p>Influential in the log-GDP regression (Cook&apos;s distance above 4/n).</p>}
                      <p className="mt-1 text-xs text-amber-800">Retained in all analyses; see the robustness chapter for its effect.</p>
                    </div>
                  )}
                  <p className="mt-6 text-xs leading-5 text-zinc-500">Source: World Bank WDI via main_analysis.R (cleaned_data.csv). Values as published; not adjusted.</p>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </Section>
  );
}
