import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Market Analytics Dashboard",
  description: "Real-time US stock market dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
