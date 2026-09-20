import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Panel Analityczny Rynku",
  description: "Panel amerykańskiego rynku akcji w czasie rzeczywistym",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
