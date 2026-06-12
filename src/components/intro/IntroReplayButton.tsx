"use client";

import { RotateCcw } from "lucide-react";

import { INTRO_REPLAY_EVENT, isIntroEnabled } from "@/lib/intro/config";

export function IntroReplayButton() {
  if (!isIntroEnabled()) {
    return null;
  }

  return (
    <button
      type="button"
      title="Replay intro"
      aria-label="Replay intro"
      onClick={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}
      className="grid size-11 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/10 hover:text-cyan-100 active:scale-95 motion-reduce:active:scale-100"
    >
      <RotateCcw className="size-4" aria-hidden="true" />
    </button>
  );
}
