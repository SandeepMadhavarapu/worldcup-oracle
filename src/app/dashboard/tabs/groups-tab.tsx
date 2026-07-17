"use client";

import { ShieldCheck } from "lucide-react";

import { Card, StatusPill } from "@/components/ui";
import type { TournamentSimulationSummary } from "@/lib/types";
import { RoundBadge, statusTone } from "./shared";

export function GroupsTab({
  simulation,
  getTeamName,
}: {
  simulation: TournamentSimulationSummary;
  getTeamName: (teamId: string) => string;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(simulation.single.groupTables).map(
          ([group, table]) => (
            <Card key={group} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h2 className="text-lg font-semibold text-white">
                  Group {group}
                </h2>
                <RoundBadge>Projected</RoundBadge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-2 py-3">Pts</th>
                      <th className="px-2 py-3">GD</th>
                      <th className="px-2 py-3">GF</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row) => (
                      <tr
                        key={row.teamId}
                        className="border-t border-white/5 text-zinc-200"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {getTeamName(row.teamId)}
                        </td>
                        <td className="px-2 py-3">{row.points}</td>
                        <td className="px-2 py-3">
                          {row.goalDifference > 0 ? "+" : ""}
                          {row.goalDifference}
                        </td>
                        <td className="px-2 py-3">{row.goalsFor}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={statusTone(row.status)}>
                            {row.status}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ),
        )}
      </div>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-amber-200" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">
            Best Third-Place Teams
          </h2>
        </div>
        <div className="mt-5 space-y-3">
          {simulation.single.bestThirdPlace.map((row, index) => (
            <div
              key={row.teamId}
              className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-3"
            >
              <div>
                <p className="font-semibold text-white">
                  {index + 1}. {getTeamName(row.teamId)}
                </p>
                <p className="text-xs text-zinc-400">
                  Group {row.group} | {row.points} pts | GD{" "}
                  {row.goalDifference > 0 ? "+" : ""}
                  {row.goalDifference}
                </p>
              </div>
              <StatusPill tone="amber">Bubble</StatusPill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
