import { DATASET_MODE, getProviderMode, getProviderNotice, teams } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { getLeaderboard } from "@/lib/leaderboard/store";
import { runTournamentSimulation } from "@/lib/tournament/simulator";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { TextureBackground } from "@/components/texture-background";

export default async function DashboardPage() {
  const ratings = buildTeamRatings();
  const simulation = runTournamentSimulation({
    iterations: 300,
    seed: "dashboard-baseline",
    ratings,
  });

  return (
    <>
      <TextureBackground variant="mesh" />
      <DashboardClient
        teams={teams}
        ratings={[...ratings.values()]}
        initialSimulation={simulation}
        initialLeaderboard={await getLeaderboard()}
        notice={getProviderNotice()}
        datasetMode={DATASET_MODE}
        providerMode={getProviderMode()}
      />
    </>
  );
}
