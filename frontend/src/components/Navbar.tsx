"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Panel główny" },
  { href: "/ichimoku", label: "Ichimoku" },
  { href: "/sp500", label: "SP500" },
  { href: "/nasdaq", label: "Nasdaq" },
  { href: "/russell2000", label: "Russell 2000" },
  { href: "/kitchin", label: "Kitchin" },
];

const BACKEND_DOCS_URL = "https://analytics-dashboard-5p9w.onrender.com/docs#/";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white">
          Panel Rynkowy
        </Link>
        <div className="flex gap-4 text-sm">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "font-medium text-white" : "text-white/60 transition hover:text-white"}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href={BACKEND_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 transition hover:text-white"
          >
            Dokumentacja API
          </a>
        </div>
      </div>
    </nav>
  );
}
