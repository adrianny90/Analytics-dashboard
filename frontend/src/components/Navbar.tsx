"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Panel główny" },
  { href: "/ichimoku", label: "Ichimoku" },
  { href: "/sp500", label: "SP500" },
  { href: "/nasdaq", label: "Nasdaq" },
  { href: "/russell2000", label: "Russell 2000" },
  { href: "/kitchin", label: "Kitchin" },
  { href: "/metodologia", label: "Metodologia" },
];

const BACKEND_DOCS_URL = "https://analytics-dashboard-5p9w.onrender.com/docs#/";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkClass = (active: boolean) =>
    active ? "font-medium text-white" : "text-white/60 transition hover:text-white";

  return (
    <nav className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-wide text-white">
          Panel Rynkowy
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:text-white lg:hidden"
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>

        <div
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-full z-30 flex-col gap-3 border-b border-white/10 bg-slate-950 px-4 py-4 text-sm sm:px-6 lg:static lg:flex lg:flex-row lg:items-center lg:gap-4 lg:border-0 lg:bg-transparent lg:p-0`}
        >
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : !!pathname?.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={linkClass(active)}>
                {link.label}
              </Link>
            );
          })}
          <a
            href={BACKEND_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass(false)}
          >
            Dokumentacja API
          </a>
        </div>
      </div>
    </nav>
  );
}
