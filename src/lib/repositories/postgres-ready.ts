import type {
  BracketRepository,
  LeaderboardRepository,
  ResolvedMatchRepository,
  SimulationRepository,
} from "@/lib/repositories/contracts";

function notWired(): never {
  throw new Error(
    "Postgres repository is scaffolded but not wired. Set up a server-only database client before enabling production persistence.",
  );
}

export const postgresReadyLeaderboardRepository: LeaderboardRepository = {
  async list() {
    notWired();
  },
  async saveDemoBracket() {
    notWired();
  },
};

export const postgresReadyBracketRepository: BracketRepository = {
  async save() {
    notWired();
  },
};

export const postgresReadySimulationRepository: SimulationRepository = {
  async saveRun() {
    notWired();
  },
  async saveSinglePath() {
    notWired();
  },
};

export const postgresReadyResolvedMatchRepository: ResolvedMatchRepository = {
  async list() {
    notWired();
  },
};
