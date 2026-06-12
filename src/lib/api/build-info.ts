// Build/version metadata for the health endpoint. Deliberately exposes ONLY
// non-secret identifiers: the package version and a short commit ref pulled from
// the platform's build-time env vars (falling back to "dev"). No API keys, env
// values, or connection strings are read here.

import pkg from "../../../package.json";

export interface BuildInfo {
  version: string;
  build: string;
  commitRef: string | null;
}

function shortSha(value: string | undefined): string | null {
  return value ? value.slice(0, 7) : null;
}

export function getBuildInfo(): BuildInfo {
  const sha =
    shortSha(process.env.VERCEL_GIT_COMMIT_SHA) ??
    shortSha(process.env.GIT_COMMIT_SHA) ??
    shortSha(process.env.SOURCE_COMMIT);

  return {
    version: pkg.version,
    build: sha ?? "dev",
    commitRef:
      process.env.VERCEL_GIT_COMMIT_REF ?? process.env.GIT_BRANCH ?? null,
  };
}
