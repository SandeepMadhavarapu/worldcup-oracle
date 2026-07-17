"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Card, Section, Shell } from "@/components/ui";

// Route-scoped boundary: a dashboard failure (bad simulation state, fetch
// mishap) degrades to a recoverable card instead of blanking the whole app.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs carry the detail; the client console gets the digest only.
    console.error("dashboard_error", error.digest ?? error.message);
  }, [error]);

  return (
    <Shell>
      <Section>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <AlertTriangle
            className="mx-auto size-8 text-amber-200"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-xl font-semibold text-white">
            The dashboard hit an unexpected error
          </h1>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Nothing was lost — the simulation is deterministic and can be
            reloaded safely.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
            >
              Back home
            </Link>
          </div>
        </Card>
      </Section>
    </Shell>
  );
}
