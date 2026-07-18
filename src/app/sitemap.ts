import type { MetadataRoute } from "next";

import { teams } from "@/lib/data";
import { getPublicSiteUrl } from "@/lib/site-url";

// Evaluated at build time, so entries carry the deploy date instead of a
// hardcoded constant that goes stale.
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl();

  return [
    "",
    "/dashboard",
    "/data-center",
    "/model-lab",
    "/calibration",
    "/methodology",
    ...teams.map((team) => `/teams/${team.id}`),
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path.startsWith("/teams") ? "monthly" : "weekly",
    priority: path === "" ? 1 : path === "/dashboard" ? 0.9 : 0.7,
  }));
}
