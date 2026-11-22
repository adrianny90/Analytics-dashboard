import type { Metadata } from "next";

import { TopForexSwitch } from "./TopForexSwitch";

export const metadata: Metadata = { title: "Top Forex" };

export default function TopForexPage() {
  return <TopForexSwitch />;
}
