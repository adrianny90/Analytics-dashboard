"use client";

import { IchimokuMethodologyDe } from "@/components/IchimokuMethodologyDe";
import { IchimokuMethodologyEn } from "@/components/IchimokuMethodologyEn";
import { IchimokuMethodologyPl } from "@/components/IchimokuMethodologyPl";
import { useLang } from "@/lib/i18n";

/** The long Ichimoku write-up, kept as one full component per language. */
export function IchimokuMethodology() {
  const { lang } = useLang();
  if (lang === "en") return <IchimokuMethodologyEn />;
  if (lang === "de") return <IchimokuMethodologyDe />;
  return <IchimokuMethodologyPl />;
}
