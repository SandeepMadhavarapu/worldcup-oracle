import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { Section, Shell } from "@/components/ui";

export default function NotFound() {
  return (
    <Shell>
      <Section className="grid min-h-[70vh] place-items-center text-center">
        <div className="max-w-md">
          <span className="grid mx-auto size-14 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
            <Compass className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
            404
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            This page didn&apos;t make the bracket
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            The page you&apos;re looking for may have been a temporary Demo Mode
            link, or it never existed. Shared brackets are in-memory and clear on
            restart.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              <Home className="size-4" aria-hidden="true" />
              Back to the Oracle
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              Open the dashboard
            </Link>
          </div>
        </div>
      </Section>
    </Shell>
  );
}
