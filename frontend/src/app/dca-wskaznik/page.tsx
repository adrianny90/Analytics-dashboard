import type { Metadata } from "next";

import { DcaWskaznikSwitch } from "./DcaWskaznikSwitch";

export const metadata: Metadata = { title: "Wskaźnik DCA" };

export default function DcaWskaznikPage() {
  return <DcaWskaznikSwitch />;
}
