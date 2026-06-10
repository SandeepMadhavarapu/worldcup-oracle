import Link from "next/link";
import { Activity, BarChart3, FlaskConical, Gauge, Trophy } from "lucide-react";

export function SiteNav() {
  const links = [
    { href: "/", label: "Oracle", icon: Trophy },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/model-lab", label: "Model Lab", icon: FlaskConical },
    { href: "/calibration", label: "Calibration", icon: Gauge },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07100d]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.28em] text-emerald-100">
              WorldCup
            </span>
            <span className="block text-xs text-zinc-400">Oracle</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] p-1">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
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
  return (
    <div className="border-b border-amber-300/15 bg-amber-300/[0.07]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-2 text-xs leading-5 text-amber-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span className="font-semibold uppercase tracking-[0.16em] text-amber-200">
          Portfolio Demo Mode
        </span>
        <span className="text-amber-50/80">
          {mode}: {notice} No FIFA affiliation. Not betting advice.
        </span>
      </div>
    </div>
  );
}
