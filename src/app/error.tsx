"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Section, Shell } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the console for local debugging; production logging would hook
    // in here once an observability adapter is wired.
    console.error(error);
  }, [error]);

  return (
    <Shell>
      <Section className="grid min-h-[70vh] place-items-center text-center">
        <div className="max-w-md" role="alert">
          <span className="grid mx-auto size-14 place-items-center rounded-xl border border-rose-300/25 bg-rose-300/10 text-rose-200">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            Something went sideways
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            An unexpected error interrupted this view. Your data is safe — this is
            a Demo Mode app and nothing was lost. Try again, and it usually
            recovers on the next render.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </Section>
    </Shell>
  );
}
