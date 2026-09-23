"use client";

import { MetodologiaDe } from "./MetodologiaDe";
import { MetodologiaEn } from "./MetodologiaEn";
import { MetodologiaPl } from "./MetodologiaPl";
import { useLang } from "@/lib/i18n";

/** The Methodology page, kept as one full component per language. */
export function MetodologiaSwitch() {
  const { lang } = useLang();
  if (lang === "en") return <MetodologiaEn />;
  if (lang === "de") return <MetodologiaDe />;
  return <MetodologiaPl />;
}
