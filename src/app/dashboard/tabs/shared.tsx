"use client";

// Helpers shared by the dashboard tab components. Extracted from the former
// single-file dashboard client so each tab stays reviewable on its own.

import type { ApiResponse, QualificationStatus, Team } from "@/lib/types";

export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function statusTone(
  status: QualificationStatus,
): "emerald" | "amber" | "rose" | "zinc" {
  if (status === "qualified") {
    return "emerald";
  }

  if (status === "third-place bubble") {
    return "amber";
  }

  if (status === "eliminated") {
    return "rose";
  }

  return "zinc";
}

export async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export function SelectTeam({
  label,
  value,
  teams,
  onChange,
}: {
  label: string;
  value: string;
  teams: Team[];
  onChange: (teamId: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-md border border-white/10 bg-[#0d1a15] px-3 text-sm text-white transition hover:border-emerald-300/40"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RoundBadge({ children }: { children: string }) {
  return (
    <span className="rounded border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">
      {children}
    </span>
  );
}
