"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

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
    if (completedRef.current) return;
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
      if (event.key === "Escape") finish();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finish, reducedMotion, shouldShow]);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden text-white"
      role="dialog"
      aria-modal="true"
      aria-label="WorldCup Oracle intro"
    >
      <IntroScene reducedMotion={reducedMotion} onSkip={finish} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 bottom-5 z-40 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-white/22 to-transparent"
      />
    </div>
  );
}
