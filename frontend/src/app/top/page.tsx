import type { Metadata } from "next";

import { TopSwitch } from "./TopSwitch";

export const metadata: Metadata = { title: "Top" };

export default function TopPage() {
  return <TopSwitch />;
}
