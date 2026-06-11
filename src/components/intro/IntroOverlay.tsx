"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SkipForward } from "lucide-react";

import { IntroScene } from "@/components/intro/IntroScene";
import { useIntroGate } from "@/hooks/useIntroGate";
import {
  INTRO_DURATION_MS,
  INTRO_REDUCED_MOTION_DURATION_MS,
} from "@/lib/intro/config";

export function IntroOverlay() {
  const { complete, shouldShow } = useIntroGate();
  const reducedMotion = Boolean(useReducedMotion());
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    complete();
  }, [complete]);

  useEffect(() => {
    if (!shouldShow) {
      completedRef.current = false;
      return;
    }

    completedRef.current = false;

    const timeout = window.setTimeout(
      finish,
      reducedMotion ? INTRO_REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        finish();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finish, reducedMotion, shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="WorldCup Oracle intro"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: "easeInOut" }}
    >
      <IntroScene reducedMotion={reducedMotion} />
      <button
        type="button"
        autoFocus
        onClick={finish}
        onPointerDown={finish}
        className="absolute right-4 top-4 z-40 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/14 bg-black/30 px-3 text-sm font-semibold text-zinc-100 shadow-2xl shadow-black/40 backdrop-blur transition hover:border-cyan-100/40 hover:bg-white/10 sm:right-6 sm:top-6"
      >
        <SkipForward className="size-4" aria-hidden="true" />
        Skip Intro
      </button>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 bottom-5 z-40 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
    </motion.div>
  );
}
