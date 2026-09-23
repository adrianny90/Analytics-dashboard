import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DEFAULT_LANG, LANG_COOKIE, isLang } from "@/lib/lang";

import { MetodologiaSwitch } from "./MetodologiaSwitch";

const TITLES = { pl: "Metodologia", en: "Methodology", de: "Methodik" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return { title: TITLES[isLang(value) ? value : DEFAULT_LANG] };
}

export default function MetodologiaPage() {
  return <MetodologiaSwitch />;
}
