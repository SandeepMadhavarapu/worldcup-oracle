import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Medal, Trophy } from "lucide-react";

import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { ShareBracket } from "./share-bracket";
import { buildBracketShareModel } from "@/lib/bracket/share-model";
import type { VerdictTone } from "@/lib/bracket/verdict";
import { getBracketById } from "@/lib/leaderboard/store";
import { getProviderNotice } from "@/lib/data";

const toneToPill: Record<VerdictTone, "emerald" | "cyan" | "amber" | "rose"> = {
  chalk: "emerald",
  balanced: "cyan",
  bold: "amber",
  longshot: "rose",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bracket = await getBracketById(id);

  if (!bracket) {
    return {
      title: "Bracket not found | WorldCup Oracle",
      description: "This shared bracket is no longer available.",
    };
  }

  const model = buildBracketShareModel(bracket);
  const title = `${model.name}'s WorldCup Oracle bracket`;
  const description = `Champion: ${model.championName}${
    model.finalistName ? `, finalist: ${model.finalistName}` : ""
  }. ${model.verdict.tag} — the model gives ${model.championCode} ${
    model.championOdds
  } to win it all.`;

  // og:image / twitter:image are supplied by the colocated opengraph-image and
  // twitter-image routes; here we only override the per-bracket text.
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bracket = await getBracketById(id);

  if (!bracket) {
    notFound();
  }

  const model = buildBracketShareModel(bracket);

  return (
    <Shell>
      <Section className="bg-[#0b1712]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <StatusPill tone={toneToPill[model.verdict.tone]}>
              {model.verdict.tag}
            </StatusPill>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              {model.name}&apos;s bracket
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">
              A shareable snapshot of this prediction: the champion and finalist
              picks, the model&apos;s own champion probability for that pick, and
              a quick verdict on how bold the call is.
            </p>
            <div className="mt-7">
              <ShareBracket />
            </div>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Trophy className="size-5 text-amber-200" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Champion probability
              </p>
            </div>
            <p className="mt-3 text-4xl font-semibold text-white">
              {(model.championProbability * 100).toFixed(1)}%
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Model odds for {model.championName} to win the tournament.
            </p>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Champion pick
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span
                className="h-12 w-3 rounded"
                style={{ backgroundColor: model.championAccent }}
                aria-hidden="true"
              />
              <span className="text-3xl font-semibold text-white">
                {model.championName}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-zinc-400">
              The model gives {model.championCode} {model.championOdds} to win it
              all — {model.verdict.tag.toLowerCase()}.
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Finalist pick
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Medal className="size-9 text-cyan-200" aria-hidden="true" />
              <span className="text-3xl font-semibold text-white">
                {model.finalistName ?? "Open pick"}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-zinc-400">
              Model-aligned demo score: {model.score}. Saved entries and shared
              links are in-memory in Demo Mode, reset on cold starts, and are not
              durable until the database adapter is wired.
            </p>
          </Card>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-7 text-zinc-400">
          {getProviderNotice()} Not official FIFA data. Not betting advice.
        </p>
      </Section>
    </Shell>
  );
}
