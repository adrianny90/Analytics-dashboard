import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Navbar } from "@/components/Navbar";
import { LangProvider } from "@/lib/i18n";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "@/lib/lang";

import "./globals.css";

const META: Record<Lang, { title: string; description: string }> = {
  pl: {
    title: "Panel Analityczny Rynku",
    description: "Panel amerykańskiego rynku akcji w czasie rzeczywistym",
  },
  en: {
    title: "Market Analytics Dashboard",
    description: "A real-time dashboard for the US stock market",
  },
  de: {
    title: "Marktanalyse-Dashboard",
    description: "Ein Echtzeit-Dashboard für den US-Aktienmarkt",
  },
};

// The language lives in a cookie so the server renders the right one straight
// away - no flash of Polish and no reload when switching.
async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function generateMetadata(): Promise<Metadata> {
  return META[await getLang()];
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <LangProvider initial={lang}>
          <Navbar />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
