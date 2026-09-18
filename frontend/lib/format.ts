// Display formatting only - values themselves always come from the R outputs.

export const num = (x: number | null | undefined, digits = 1) =>
  x === null || x === undefined || !Number.isFinite(x)
    ? "—"
    : x.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const int = (x: number | null | undefined) => num(x, 0);

export const usd = (x: number | null | undefined, digits = 0) =>
  x === null || x === undefined || !Number.isFinite(x) ? "—" : `$${num(x, digits)}`;

export const pct = (x: number | null | undefined, digits = 1) =>
  x === null || x === undefined || !Number.isFinite(x) ? "—" : `${num(x, digits)}%`;

/** p-values: scientific notation below 0.001, never rounded to a misleading "0". */
export const pValue = (p: number) => {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.001) {
    const [mantissa, exp] = p.toExponential(1).split("e");
    return `${mantissa} × 10${superscript(exp)}`;
  }
  return p.toFixed(3);
};

const SUP: Record<string, string> = { "-": "⁻", "+": "", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const superscript = (s: string) => s.split("").map((c) => SUP[c] ?? c).join("");

export const dateLabel = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : // Fixed time zone: the server (UTC on Vercel) and the visitor's browser must render
      // identical text, otherwise React hydration fails for client components.
      `${d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
};

export const prettyVariable = (v: string) =>
  ({
    gdp_per_capita_usd: "GDP per capita (US$)",
    log10_gdp_per_capita: "log₁₀ GDP per capita",
    life_expectancy_years: "Life expectancy (years)",
    population: "Population",
    population_millions: "Population (millions)",
    urban_pop_pct: "Urban population (%)",
    fertility_rate: "Fertility rate (births per woman)",
    health_exp_per_capita_usd: "Health expenditure per capita (US$)",
    co2_per_capita_t: "CO₂ per capita (t)",
  })[v] ?? v;
