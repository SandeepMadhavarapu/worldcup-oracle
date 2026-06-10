import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import { DatasetBanner, SiteNav } from "@/components/site-nav";
import { getProviderMode, getProviderNotice } from "@/lib/data";
import { getPublicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getPublicSiteUrl();
const ogImageUrl = new URL("/og-card.png", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    type: "website",
    images: [
      {
        url: ogImageUrl,
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
    images: [ogImageUrl],
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
