// Maps a live-provider team (football-data.org name + tri-letter code) onto one
// of our internal team ids, so a real FINISHED match can be graded by the same
// prediction engine the rest of the app uses. Pure and unit-tested: no I/O.
//
// Strategy, in order: exact code match (association tri-codes are stable), then
// a normalized-name match, then a small alias table for provider names that do
// not normalize onto ours (e.g. "Korea Republic", "IR Iran", "Türkiye"). Any
// team we cannot confidently resolve returns null so the caller can skip it
// rather than grade the wrong forecast.

import { teams } from "@/lib/data/teams";

/**
 * Lowercase and reduce to bare [a-z0-9]. NFD decomposition splits accented
 * letters into a base letter plus a combining mark, and the final filter drops
 * the marks (and spaces/punctuation), so "Türkiye" -> "turkiye".
 */
export function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "");
}

// Provider names whose normalized form does not match our team `name`. Keys are
// already normalized; values are internal team ids.
const NAME_ALIASES: Record<string, string> = {
  korearepublic: "south-korea",
  republicofkorea: "south-korea",
  iriran: "iran",
  turkiye: "turkey",
  unitedstatesofamerica: "usa",
  uae: "united-arab-emirates",
};

const byCode = new Map<string, string>();
const byName = new Map<string, string>();

for (const team of teams) {
  byCode.set(team.code.toUpperCase(), team.id);
  byName.set(normalizeTeamName(team.name), team.id);
}

/**
 * Resolve a provider team to an internal team id, or null when it cannot be
 * matched confidently. Code takes precedence over name; aliases are the last
 * resort.
 */
export function resolveTeamId(
  input: { name?: string | null; code?: string | null },
): string | null {
  const code = input.code?.trim().toUpperCase();
  if (code && byCode.has(code)) {
    return byCode.get(code) ?? null;
  }

  const name = input.name ? normalizeTeamName(input.name) : "";
  if (name) {
    const direct = byName.get(name);
    if (direct) {
      return direct;
    }

    const aliased = NAME_ALIASES[name];
    if (aliased) {
      return aliased;
    }
  }

  return null;
}
