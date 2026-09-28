import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gridboard — SQL dashboard builder",
  description:
    "Build dashboards directly from PostgreSQL. Write a SELECT, pick a visualization, arrange the grid.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <div className="print-root mx-auto max-w-[1160px] px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
