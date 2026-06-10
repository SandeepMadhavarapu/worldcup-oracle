import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import { DatasetBanner, SiteNav } from "@/components/site-nav";
import { getProviderMode, getProviderNotice } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://worldcup-oracle.example.com"),
  title: "WorldCup Oracle | Prediction Intelligence",
  description:
    "A full-stack educational World Cup 2026 prediction simulator with explainable analytics.",
  applicationName: "WorldCup Oracle",
  appleWebApp: {
    capable: true,
    title: "WorldCup Oracle",
  },
  openGraph: {
    title: "WorldCup Oracle",
    description:
      "World Cup 2026 prediction intelligence with Elo ratings, Poisson scorelines, and Monte Carlo simulations.",
    type: "website",
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "WorldCup Oracle — Monte Carlo predictions that explain themselves.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldCup Oracle",
    description:
      "Educational World Cup 2026 prediction intelligence, not official FIFA data and not betting advice.",
    images: ["/og-card.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#07100d] text-zinc-100">
        <SiteNav />
        <DatasetBanner mode={getProviderMode()} notice={getProviderNotice()} />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
