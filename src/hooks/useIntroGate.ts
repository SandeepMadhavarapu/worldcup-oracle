"use client";

import { useCallback, useEffect, useState } from "react";

import { INTRO_REPLAY_EVENT, isIntroEnabled } from "@/lib/intro/config";
import { hasIntroCompleted, markIntroCompleted } from "@/lib/intro/storage";

export function useIntroGate() {
  const enabled = isIntroEnabled();
  const [shouldShow, setShouldShow] = useState(
    () => enabled && !hasIntroCompleted(),
  );

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
