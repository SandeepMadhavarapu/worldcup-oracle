import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Database,
  Gauge,
  ShieldAlert,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import { getProviderNotice, historicalResults, teamById, teams } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { runTournamentSimulation } from "@/lib/tournament/simulator";
import { MetricCard, Section, Shell, StatusPill } from "@/components/ui";
import heroImage from "../../public/images/stadium-oracle-hero.webp";

export default function Home() {
  const ratings = buildTeamRatings();
  const simulation = runTournamentSimulation({
    iterations: 250,
    seed: "landing-preview",
    ratings,
  });
  const favorite = simulation.probabilities[0];
  const favoriteTeam = favorite ? teamById.get(favorite.teamId) : undefined;
  const darkHorse = teamById.get(simulation.analytics.darkHorse.teamId);
  const finalA = teamById.get(simulation.mostLikelyFinal.teamAId);
  const finalB = teamById.get(simulation.mostLikelyFinal.teamBId);

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <Image
          src={heroImage}
          alt=""
          fill
          // `priority` was deprecated in Next 16; `preload` is the LCP-eager
          // equivalent. Static import supplies the blur placeholder data URL.
          preload
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#040a19]/95 via-[#040a19]/80 to-[#040a19]/20"
        />
        <div className="relative z-10 mx-auto flex min-h-[86svh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <StatusPill tone="cyan">Offline Dataset Mode</StatusPill>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.03] tracking-normal text-white sm:text-7xl">
              WorldCup Oracle
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-zinc-200">
              Predict the tournament before it happens with explainable match
              probabilities, group advancement logic, and Monte Carlo bracket
              simulations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
              >
                Simulate bracket
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/model-lab"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Model transparency
                <BrainCircuit className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-zinc-400">
              {getProviderNotice()} Not official FIFA data. Not betting advice.
            </p>
          </div>
        </div>
      </section>

      <Section className="border-y border-white/10 bg-[#0b1712]">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Tournament logic"
            value="104"
            detail="Projected match slots across groups, Round of 32, and final weekend."
            tone="emerald"
          />
          <MetricCard
            label="Teams"
            value={String(teams.length)}
            detail="Sample 48-team field organized into Groups A-L."
            tone="cyan"
          />
          <MetricCard
            label="Training sample"
            value={String(historicalResults.length)}
            detail="Local historical rows parsed through a typed importer."
            tone="amber"
          />
          <MetricCard
            label="Mode"
            value="Demo"
            detail="No fake live scores, no official FIFA claims, no betting framing."
            tone="rose"
          />
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <StatusPill tone="emerald">Prediction Intelligence</StatusPill>
            <h2 className="mt-5 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Built like a serious internship portfolio project.
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-400">
              The product separates data loading, prediction math, tournament
              rules, API validation, UI state, and persistence boundaries. The
              app is intentionally honest about uncertainty and dataset mode.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Database,
                title: "Typed data layer",
                body: "Sample importer, team entities, PostgreSQL-ready schema, and clear future API key boundaries.",
              },
              {
                icon: BarChart3,
                title: "Explainable model",
                body: "Elo-style ratings, weighted competitions, attack and defense signals, and scoreline distributions.",
              },
              {
                icon: Trophy,
                title: "Tournament engine",
                body: "Group standings, best third-place ranking, knockout bracket paths, and seeded simulations.",
              },
              {
                icon: ShieldAlert,
                title: "Honest product stance",
                body: "Educational estimates only, with visible sample/offline mode and no gambling language.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/10 bg-white/[0.055] p-5"
                >
                  <Icon className="size-6 text-emerald-200" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section className="bg-[#10120d]">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <StatusPill tone="cyan">Live-Looking, Honestly Offline</StatusPill>
            <h2 className="mt-5 text-3xl font-semibold tracking-normal text-white">
              Recruiters see the full-stack story in one screen.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              The landing page exposes real product signals without pretending
              they are live official predictions: model confidence, dark-horse
              paths, likely finals, and dataset mode.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Trophy,
                label: "Champion Probability",
                value: favoriteTeam
                  ? `${favoriteTeam.code} ${(favorite.champion * 100).toFixed(1)}%`
                  : "TBD",
              },
              {
                icon: Sparkles,
                label: "Most Likely Final",
                value: `${finalA?.code ?? "TBD"} vs ${finalB?.code ?? "TBD"}`,
              },
              {
                icon: Zap,
                label: "Dark Horse Detector",
                value: darkHorse?.name ?? "TBD",
              },
              {
                icon: Gauge,
                label: "Model Confidence",
                value: `${(simulation.analytics.modelConfidence.score * 100).toFixed(
                  1,
                )}%`,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
            <div
              key={item.label}
              className="rounded-lg border border-white/10 bg-white/[0.05] p-5"
            >
              <Icon className="size-5 text-amber-200" aria-hidden="true" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
            </div>
              );
            })}
          </div>
        </div>
      </Section>
    </Shell>
  );
}
