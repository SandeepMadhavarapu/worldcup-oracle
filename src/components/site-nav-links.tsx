"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Database,
  FlaskConical,
  Gauge,
  Trophy,
} from "lucide-react";

const links: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Oracle", icon: Trophy },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/data-center", label: "Data", icon: Database },
  { href: "/model-lab", label: "Model Lab", icon: FlaskConical },
  { href: "/calibration", label: "Calibration", icon: Gauge },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBrand() {
  return (
    <Link
      href="/"
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-md transition-opacity hover:opacity-90 sm:gap-3"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
        <Activity className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100 sm:tracking-[0.28em]">
          WorldCup
        </span>
        <span className="block text-xs text-zinc-400">Oracle</span>
      </span>
    </Link>
  );
}

export function NavLinks() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.04] p-1 sm:gap-1"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            // Always present so the icon-only mobile layout still has an
            // accessible name (the text label is display:none below `sm`).
            aria-label={link.label}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded px-2.5 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:active:scale-100 sm:px-3 ${
              active
                ? "bg-emerald-300/15 text-white"
                : "text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
