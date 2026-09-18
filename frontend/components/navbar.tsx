"use client";

import { useEffect, useState } from "react";
import { FileText, Menu, X } from "lucide-react";

const links = [
  ["Overview", "#overview"],
  ["Pipeline", "#pipeline"],
  ["Figures", "#figures"],
  ["Analysis", "#analysis"],
  ["Explorer", "#explorer"],
  ["Quality", "#quality"],
  ["Method", "#methodology"],
] as const;

export function Navbar({ reportAvailable }: { reportAvailable: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <nav
      className={`fixed left-1/2 top-0 z-50 flex -translate-x-1/2 items-center justify-between p-3 transition-all duration-500 ${
        solid
          ? "mt-3 w-[calc(100vw-24px)] max-w-5xl rounded-full bg-white/85 shadow-sm ring-1 ring-zinc-200 backdrop-blur-xl"
          : "w-full px-4 md:px-16 lg:px-24"
      }`}
    >
      <a href="#overview" className="flex items-center gap-2.5 pl-1">
        <span className={`grid size-8 place-items-center rounded-full text-xs font-bold ${solid ? "bg-zinc-950 text-white" : "bg-white text-zinc-950"}`}>
          R
        </span>
        <span className={`text-sm font-semibold tracking-tight ${solid ? "text-zinc-950" : "text-white"}`}>R Practical</span>
      </a>

      <div className="hidden items-center gap-6 text-sm lg:flex">
        {links.map(([label, href]) => (
          <a key={href} href={href} className={solid ? "text-zinc-600 hover:text-zinc-950" : "text-white/80 hover:text-white"}>
            {label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {reportAvailable && (
          <a
            href="/project/final_report.pdf"
            target="_blank"
            rel="noreferrer"
            className={`hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:inline-flex ${
              solid ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-zinc-950 hover:bg-zinc-100"
            }`}
          >
            <FileText className="size-4" /> View Final Report
          </a>
        )}
        <button
          onClick={() => setOpen(!open)}
          className={`rounded-full p-2 lg:hidden ${solid ? "text-zinc-950" : "text-white"}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute right-2 top-14 w-60 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-zinc-200 lg:hidden">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">
              {label}
            </a>
          ))}
          {reportAvailable && (
            <a href="/project/final_report.pdf" target="_blank" rel="noreferrer" className="mt-2 block rounded-lg bg-zinc-950 px-3 py-2.5 text-sm text-white">
              View Final Report
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
