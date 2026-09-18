"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Download, Search, X } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/ui";
import type { Country } from "@/lib/project-data";
import { num, usd } from "@/lib/format";

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

  // Changing a filter starts again from the first page of results
  const updateQuery = (v: string) => { setQuery(v); setLimit(PAGE); };
  const updateIncome = (v: string) => { setIncome(v); setLimit(PAGE); };
  const updateRegion = (v: string) => { setRegion(v); setLimit(PAGE); };
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

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

  return (
    <section id="explorer" className="scroll-mt-20 bg-white px-4 py-20 md:px-16 md:py-24 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Eyebrow>INTERACTIVE COUNTRY EXPLORER</Eyebrow>
            <h2 className="mt-5 text-3xl leading-tight tracking-tight text-zinc-950 md:text-5xl">Inspect every cleaned record</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-500 md:text-base md:leading-7">
              All {countries.length} rows of cleaned_data.csv. Search, filter and sort, then select a country for its full profile. A dash (—)
              means the World Bank reported no value; missing values are kept as missing, not imputed.
            </p>
          </div>
          <a href="/project/cleaned_data.csv" download className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-zinc-300 px-4 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50 md:self-auto">
            <Download className="size-4" /> cleaned_data.csv
          </a>
        </Reveal>

        <div className="mt-8 grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 *:min-w-0 md:grid-cols-[1.4fr_1fr_1fr]">
          <label className="flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-[#2a78d6]">
            <Search className="size-4 text-zinc-400" />
            <span className="sr-only">Search countries</span>
            <input value={query} onChange={(e) => updateQuery(e.target.value)} placeholder="Search country or ISO3…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
            {query && (
              <button onClick={() => updateQuery("")} aria-label="Clear search" className="text-zinc-400 hover:text-zinc-700">
                <X className="size-4" />
              </button>
            )}
          </label>
          <label className="sr-only" htmlFor="income-filter">Income level</label>
          <select id="income-filter" value={income} onChange={(e) => updateIncome(e.target.value)} className="rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-zinc-200 outline-none focus:ring-2 focus:ring-[#2a78d6]">
            <option value="All">All income levels</option>
            {incomeLevels.map((x) => <option key={x}>{x}</option>)}
          </select>
          <label className="sr-only" htmlFor="region-filter">Region</label>
          <select id="region-filter" value={region} onChange={(e) => updateRegion(e.target.value)} className="rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-zinc-200 outline-none focus:ring-2 focus:ring-[#2a78d6]">
            <option value="All">All regions</option>
            {regions.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span aria-live="polite">
            {filtered.length} of {countries.length} countries
          </span>
          {filtersActive && (
            <button onClick={() => { updateQuery(""); updateIncome("All"); updateRegion("All"); }} className="underline hover:text-zinc-800">
              Reset filters
            </button>
          )}
        </div>

        <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                {COLUMNS.map((col, i) => (
                  <th key={col.key} scope="col" aria-sort={sort.key === col.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                    className={`whitespace-nowrap px-3 py-2.5 font-medium ${col.numeric ? "text-right" : "text-left"} ${i === 0 ? "sticky left-0 z-10 bg-zinc-50" : ""}`}>
                    <button onClick={() => toggleSort(col.key, col.numeric)} className={`inline-flex items-center gap-1 hover:text-zinc-900 ${sort.key === col.key ? "text-zinc-900" : ""}`}>
                      {col.label}
                      {sort.key === col.key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((c) => (
                <tr key={c.iso3} onClick={() => setSelected(c)} className="cursor-pointer border-t border-zinc-100 hover:bg-[#f4f8fd]">
                  {COLUMNS.map((col, i) => (
                    <td key={col.key} className={`whitespace-nowrap px-3 py-2.5 ${col.numeric ? "text-right tabular-nums text-zinc-700" : "text-zinc-700"} ${i === 0 ? "sticky left-0 bg-white font-medium text-zinc-950" : ""}`}>
                      {i === 0 ? (
                        <button onClick={(e) => { e.stopPropagation(); setSelected(c); }} className="text-left hover:underline">
                          {col.render(c)}
                          {(outlierFlags[c.country] || influentialSet.has(c.country)) && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500 align-middle" title="Flagged in the outlier or influence analysis" />}
                        </button>
                      ) : (
                        col.render(c)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-zinc-500">No countries match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span><span className="mr-1 inline-block size-1.5 rounded-full bg-amber-500 align-middle" />flagged by the IQR outlier rule or as influential in the regression (from R)</span>
          {limit < filtered.length && (
            <button onClick={() => setLimit((l) => l + PAGE)} className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50">
              Show {Math.min(PAGE, filtered.length - limit)} more
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-[60] flex justify-end bg-zinc-950/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`${selected.country} details`}
              className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
              initial={{ x: 40 }}
              animate={{ x: 0 }}
              exit={{ x: 40 }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-medium tracking-[0.16em] text-zinc-400">{selected.iso3}</div>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{selected.country}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{selected.region} · {selected.income_level ?? "income group not classified"}</p>
                </div>
                <button onClick={() => setSelected(null)} autoFocus className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close details">
                  <X className="size-5" />
                </button>
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
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium text-zinc-500">{k}</dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900">{v}</dd>
                  </div>
                ))}
              </dl>

              {(outlierFlags[selected.country] || influentialSet.has(selected.country)) && (
                <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
                  {outlierFlags[selected.country] && <p>IQR outlier in: {outlierFlags[selected.country].join(", ")}.</p>}
                  {influentialSet.has(selected.country) && <p>Influential in the log-GDP regression (Cook&apos;s distance above 4/n).</p>}
                  <p className="mt-1 text-xs text-amber-800">Retained in all analyses; see the sensitivity analysis for its effect.</p>
                </div>
              )}
              <p className="mt-6 text-xs leading-5 text-zinc-400">
                Source: World Bank WDI via main_analysis.R (cleaned_data.csv). Values as published; not adjusted.
              </p>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
