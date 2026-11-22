import type { Metadata } from "next";

import { PriceActionSwitch } from "./PriceActionSwitch";

export const metadata: Metadata = { title: "Price Action" };

export default function PriceActionPage() {
  return <PriceActionSwitch />;
}
