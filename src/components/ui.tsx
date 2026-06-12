import type { ReactNode } from "react";
import { clsx } from "clsx";

export function Shell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    // Background is left transparent so a fixed decorative texture layer can
    // sit behind page content; the dark base comes from the body canvas.
    <main className={clsx("min-h-screen text-zinc-100", className)}>
      {children}
    </main>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={clsx("px-4 py-12 sm:px-6 lg:px-8", className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/20 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "cyan" | "amber" | "rose" | "violet";
}) {
  const tones = {
    emerald: "text-emerald-200 bg-emerald-300/10 border-emerald-300/20",
    cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/20",
    amber: "text-amber-200 bg-amber-300/10 border-amber-300/20",
    rose: "text-rose-200 bg-rose-300/10 border-rose-300/20",
    violet: "text-violet-200 bg-violet-300/10 border-violet-300/20",
  };

  return (
    <Card className="p-5">
      <div
        className={clsx(
          "mb-5 inline-flex rounded border px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
          tones[tone],
        )}
      >
        {label}
      </div>
      <p className="text-3xl font-semibold tracking-normal text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p>
    </Card>
  );
}

export function StatusPill({
  children,
  tone = "emerald",
}: {
  children: ReactNode;
  tone?: "emerald" | "amber" | "rose" | "zinc" | "cyan";
}) {
  const tones = {
    emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    rose: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    zinc: "border-zinc-300/20 bg-zinc-300/10 text-zinc-200",
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded border px-2 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({
  className,
  rounded = "rounded-md",
}: {
  className?: string;
  rounded?: string;
}) {
  // Decorative placeholder while data loads. Hidden from assistive tech — the
  // surrounding surface owns the accessible "loading" status (aria-busy / a
  // visually-hidden message) so screen readers aren't spammed with empty boxes.
  return (
    <div
      aria-hidden="true"
      className={clsx("skeleton", rounded, className)}
    />
  );
}

export function ProbabilityBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-sm bg-white/10">
      <div
        className={clsx(
          "h-full rounded-sm bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-200 transition-all duration-700",
          className,
        )}
        style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }}
      />
    </div>
  );
}
