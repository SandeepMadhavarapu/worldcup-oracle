"use client";

import { useCallback, useEffect, useState } from "react";

import { INTRO_REPLAY_EVENT, isIntroEnabled } from "@/lib/intro/config";
import { markIntroCompleted } from "@/lib/intro/storage";

export function useIntroGate() {
  const enabled = isIntroEnabled();
  // The intro NEVER auto-plays: first-time visitors land directly on content
  // (live scores, model track record). The cinematic is replay-only, triggered
  // from the nav button — a demonstration of craft, not a toll booth.
  const [shouldShow, setShouldShow] = useState(false);

  const complete = useCallback(() => {
    markIntroCompleted();
    setShouldShow(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const replay = () => setShouldShow(true);

    window.addEventListener(INTRO_REPLAY_EVENT, replay);

    return () => {
      window.removeEventListener(INTRO_REPLAY_EVENT, replay);
    };
  }, [enabled]);

  return {
    complete,
    enabled,
    shouldShow: enabled && shouldShow,
  };
}
