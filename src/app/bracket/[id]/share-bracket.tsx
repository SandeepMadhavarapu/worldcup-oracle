"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareBracket() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (insecure context / denied permission).
      window.prompt("Copy this bracket link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      aria-live="polite"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 active:scale-[0.98] motion-reduce:active:scale-100"
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      {copied ? "Link copied!" : "Share my bracket"}
    </button>
  );
}
