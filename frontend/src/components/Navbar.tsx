"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/lib/i18n";

const LINKS: { href: string; label: [string, string, string] }[] = [
  { href: "/", label: ["Panel główny", "Dashboard", "Übersicht"] },
  { href: "/ichimoku", label: ["Ichimoku", "Ichimoku", "Ichimoku"] },
  { href: "/sp500", label: ["SP500", "S&P 500", "S&P 500"] },
  { href: "/nasdaq", label: ["Nasdaq", "Nasdaq", "Nasdaq"] },
  { href: "/russell2000", label: ["Russell 2000", "Russell 2000", "Russell 2000"] },
  { href: "/nyse", label: ["NYSE", "NYSE", "NYSE"] },
  { href: "/kitchin", label: ["Kitchin", "Kitchin", "Kitchin"] },
  { href: "/metodologia", label: ["Metodologia", "Methodology", "Methodik"] },
];

const BACKEND_DOCS_URL = "https://analytics-dashboard-5p9w.onrender.com/docs#/";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLang();
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
        <div className="flex min-w-0 items-center gap-3">
          <LanguageSwitcher />
          <Link href="/" className="shrink-0 text-sm font-semibold tracking-wide text-white">
            {t("Panel Rynkowy", "Market Panel", "Marktpanel")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:text-white lg:hidden"
          aria-expanded={open}
          aria-label={t("Menu", "Menu", "Menü")}
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
                {t(...link.label)}
              </Link>
            );
          })}
          <a
            href={BACKEND_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass(false)}
          >
            {t("Dokumentacja API", "API documentation", "API-Dokumentation")}
          </a>
        </div>
      </div>
    </nav>
  );
}
