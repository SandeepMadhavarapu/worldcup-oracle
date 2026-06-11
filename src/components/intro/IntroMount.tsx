"use client";

import dynamic from "next/dynamic";

const IntroOverlay = dynamic(
  () => import("@/components/intro/IntroOverlay").then((mod) => mod.IntroOverlay),
  { ssr: false },
);

export function IntroMount() {
  return <IntroOverlay />;
}
