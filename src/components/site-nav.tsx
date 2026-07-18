import { IntroReplayButton } from "@/components/intro/IntroReplayButton";
import { NavBrand, NavLinks } from "@/components/site-nav-links";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07100d]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <NavBrand />
        <NavLinks />
        <IntroReplayButton />
      </div>
    </header>
  );
}

export function DatasetBanner({
  mode,
  notice,
}: {
  mode: string;
  notice: string;
}) {
  const isLive = mode === "LIVE_PROVIDER_MODE";
  const chip = isLive ? "Live Scores · Demo Predictions" : "Portfolio Demo Mode";

  return (
    <div className="border-b border-amber-300/15 bg-amber-300/[0.07]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-2 text-xs leading-5 text-amber-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span className="font-semibold uppercase tracking-[0.16em] text-amber-200">
          {chip}
        </span>
        <span className="text-amber-50/80">
          {notice} No official affiliation. Not betting advice.
        </span>
      </div>
    </div>
  );
}
